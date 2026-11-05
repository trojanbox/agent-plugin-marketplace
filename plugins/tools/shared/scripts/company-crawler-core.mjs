import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

export class CrawlerError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CrawlerError';
    this.code = code;
    this.details = details;
  }
}

export const sha256 = text => createHash('sha256').update(text).digest('hex');

export function normalizeSite(input) {
  if (typeof input !== 'string' || !input.trim() || input.length > 8192) {
    throw new CrawlerError('invalid_input', '请输入有效的企业站点域名');
  }
  const raw = input.trim().includes('://') ? input.trim() : 'https://' + input.trim();
  let u;
  try { u = new URL(raw); } catch { throw new CrawlerError('invalid_input', '站点域名 URL 无效'); }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password ||
      u.port || isIP(u.hostname) || u.hostname === 'localhost' || u.hostname.endsWith('.local') ||
      !u.hostname.includes('.') || u.hostname.includes('..')) {
    throw new CrawlerError('invalid_input', '仅支持公开 HTTP(S) 域名；不支持 IP、端口、内部域名或 URL 凭据');
  }
  const base = u.hostname.toLowerCase().replace(/^www\./, '');
  if (!base || !base.includes('.')) throw new CrawlerError('invalid_input', '无效的主域名');
  return { input: input.trim(), base_host: base, home_url: u.protocol + '//' + u.hostname + '/' };
}

export function allowedHost(host, site) {
  const h = String(host).toLowerCase();
  return h === site.base_host || h === 'www.' + site.base_host;
}

export function canonicalUrl(raw, site) {
  try {
    if (typeof raw !== 'string' || raw.length > 8192 || !raw.trim()) return null;
    const u = new URL(raw.trim(), site.home_url);
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password ||
        u.port || !allowedHost(u.hostname, site)) return null;
    u.hash = '';
    // Preserve query parameters, including pagination and important content variants.
    u.hostname = u.hostname.toLowerCase();
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '');
    return u.toString();
  } catch { return null; }
}

export function validateExternalUrl(raw, site) {
  const url = canonicalUrl(raw, site);
  if (!url) throw new CrawlerError('url_out_of_scope', 'URL 不在主站或 www 的允许范围内');
  return url;
}

export function deduplicateEntries(values, site, source) {
  const seen = new Set();
  const accepted = [], rejected = [];
  for (const item of Array.isArray(values) ? values : []) {
    const value = typeof item === 'string' ? { url: item } : item;
    const raw = value && typeof value === 'object' ? value.url : null;
    const url = canonicalUrl(raw, site);
    if (!url) {
      rejected.push({ url: typeof raw === 'string' ? raw : null, reason: 'url_out_of_scope' });
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    accepted.push({
      url, source,
      title: typeof value.title === 'string' ? value.title.slice(0, 512) : '',
      description: typeof value.description === 'string' ? value.description.slice(0, 1500) : '',
      language: typeof value.language === 'string' ? value.language.slice(0, 20) : null,
    });
  }
  return { accepted, rejected };
}

export function groupCandidates(entries, homeUrl) {
  const buckets = new Map();
  const singles = [];
  for (const e of entries) {
    if (e.url === homeUrl) continue;
    const u = new URL(e.url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2 || u.searchParams.size > 0) { singles.push(e); continue; }
    const parent = u.hostname + '/' + parts.slice(0, -1).join('/');
    if (!buckets.has(parent)) buckets.set(parent, []);
    buckets.get(parent).push(e);
  }
  const groups = [];
  for (const [parent, items] of buckets) {
    // Eight or more siblings suggests a repeated template, but is never proof.
    if (items.length < 8) { singles.push(...items); continue; }
    const sample = [...items].sort((a, b) => a.url.localeCompare(b.url)).slice(0, 8);
    groups.push({
      id: 'g-' + sha256(parent).slice(0, 16),
      path_pattern: parent + '/{candidate}',
      count: items.length,
      sample_urls: sample.map(e => ({ url: e.url, title: e.title, description: e.description })),
      member_urls: items.map(e => e.url),
      homogeneous: 'unverified',
    });
  }
  return { groups, singles: singles.sort((a, b) => a.url.localeCompare(b.url)) };
}

export function languageHint(content) {
  if (typeof content !== 'string' || !content.trim()) return 'undetermined';
  const excerpt = content.slice(0, 12000);
  const han = (excerpt.match(/[\u4e00-\u9fff]/gu) || []).length;
  const kana = (excerpt.match(/[\u3040-\u30ff]/gu) || []).length;
  const hangul = (excerpt.match(/[\uac00-\ud7af]/gu) || []).length;
  const latin = (excerpt.match(/[a-zA-Z]/gu) || []).length;
  if (kana > 12) return 'ja';
  if (hangul > 12) return 'ko';
  if (han > 30 && han > latin / 8) return 'zh';
  if (latin > 150) return 'en';
  return 'undetermined';
}

export function validateSelection(selection, manifest, discovered, grouping) {
  if (!selection || typeof selection !== 'object' || !Array.isArray(selection.selected_urls)) {
    throw new CrawlerError('invalid_selection', 'Agent 选择结果必须包含 selected_urls 数组');
  }
  const valid = new Set(discovered.accepted.map(x => x.url));
  const home = manifest.site.home_url;
  const groups = new Map(grouping.groups.map(g => [g.id, g]));
  const homogeneous = new Map();
  for (const item of selection.homogeneous_groups || []) {
    const group = groups.get(item?.group_id);
    if (!group || !group.member_urls.includes(item.representative_url)) {
      throw new CrawlerError('invalid_selection', '同质组或代表 URL 不属于已发现候选');
    }
    if (homogeneous.has(group.id)) throw new CrawlerError('invalid_selection', '重复确认同一分组');
    homogeneous.set(group.id, item.representative_url);
  }
  const urls = [home], seen = new Set([home]);
  for (const raw of selection.selected_urls) {
    const url = canonicalUrl(raw, manifest.site);
    if (!url || (!valid.has(url) && url !== home))
      throw new CrawlerError('invalid_selection', '选中 URL 不属于本次已发现站内候选');
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  if (urls.length > 20) throw new CrawlerError('invalid_selection', '首页加其它页面最多共 20 个 URL');
  for (const group of grouping.groups) {
    const preferred = homogeneous.get(group.id);
    if (!preferred) continue;
    const selectedMembers = urls.filter(u => group.member_urls.includes(u));
    if (selectedMembers.length > 1 || (selectedMembers.length === 1 && selectedMembers[0] !== preferred)) {
      throw new CrawlerError('invalid_selection', '已确认同质的分组只能选一个指定代表');
    }
  }
  const primary = typeof selection.primary_language === 'string'
    ? selection.primary_language.trim().toLowerCase().slice(0, 24) : '';
  if (!primary) throw new CrawlerError('invalid_selection', 'Agent 必须确认或明确给出 primary_language（不确定时填 undetermined）');
  const known = new Map(discovered.accepted.map(e => [e.url, e.language?.toLowerCase().split('-')[0]]));
  if (primary !== 'undetermined') {
    for (const url of urls.slice(1)) {
      const lang = known.get(url);
      if (lang && lang !== primary.split('-')[0] &&
          !(selection.language_exceptions || []).includes(url)) {
        throw new CrawlerError('language_mismatch', '已知非主语言 URL 不能直接选入；若元数据错误，请在 language_exceptions 中说明并校验');
      }
    }
  }
  const reasons = selection.reasons && typeof selection.reasons === 'object'
    ? selection.reasons : {};
  return {
    selected_urls: urls,
    primary_language: primary,
    homogeneous_groups: [...homogeneous.entries()].map(([group_id, representative_url]) => ({ group_id, representative_url })),
    reasons: Object.fromEntries(urls.map(url => [url, typeof reasons[url] === 'string' ? reasons[url].slice(0, 1000) : ''])),
    selected_at: new Date().toISOString(),
  };
}

export function aggregateStatus(selected, verifiedPages, discoveryIncomplete, blocked = false) {
  const urls = Array.isArray(selected) ? selected : [];
  const successes = urls.filter(url => verifiedPages[url] === 'success').length;
  const failed = urls.filter(url => verifiedPages[url] === 'failed').length;
  const pending = urls.length - successes - failed;
  const status = blocked || successes === 0 ? 'failed' :
    (failed || pending || discoveryIncomplete ? 'partial_success' : 'success');
  return { status, selected_count: urls.length, success_count: successes, failed_count: failed, pending_count: pending,
    discovery_incomplete: Boolean(discoveryIncomplete) };
}

export function retryAllowed(error) {
  const status = Number(error?.http_status || 0);
  if ([408, 429, 500, 502, 503, 504].includes(status)) return true;
  return ['network_error', 'request_timeout'].includes(error?.code);
}

export function safeError(error) {
  if (error instanceof CrawlerError) {
    return { code: error.code, http_status: error.details?.http_status || null,
      message: error.code === 'provider_error' ? '抓取服务返回错误' : error.message.slice(0, 500) };
  }
  return { code: 'unexpected_error', http_status: null, message: '请求处理失败；详细信息仅供本地调试' };
}
