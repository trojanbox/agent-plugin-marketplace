#!/usr/bin/env node
/** OneDrive files via Microsoft Graph v1.0, with delegated user authorization only. */
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { YoutubeError, publicError } from './youtube-core.mjs';
import { lstatOrNull, regularFile, safeDirectory, writePrivateJson, readPrivateJson,
  acquireLock, outputDirectory, publishFile, hashFile } from './youtube-io.mjs';
import { GRAPH_ROOT, SCOPES, assertGraphUrl, assertTransferUrl, cloudSegments, cloudPath,
  itemEndpoint, childrenEndpoint, contentEndpoint, uploadSessionEndpoint, searchEndpoint,
  localDownloadName, parseOneDriveArgs } from './onedrive-core.mjs';

export const HELP = `OneDrive Cloud Files — Microsoft Graph v1.0, 仅当前授权用户的 OneDrive
  configure CLIENT_ID [--tenant common|consumers|organizations|TENANT_UUID]
  auth start              获取微软设备码（需要用户在浏览器授权）
  auth complete           登录网页完成后确认授权；未授权时返回 auth_pending
  auth status             查看登录状态，不输出 Token
  auth logout             清除本机 Token 与待确认登录会话
  list [REMOTE_FOLDER] [--limit 200]          列出文件夹及分页
  info REMOTE_PATH                         查询文件/文件夹信息
  search KEYWORD [--limit 200]              搜索当前 OneDrive
  download REMOTE_FILE [--dir ABS] [--overwrite yes|no]
  upload LOCAL_FILE REMOTE_FOLDER [--name FILENAME] [--overwrite yes|no]
  mkdir REMOTE_FOLDER                       创建一个新文件夹
  trash REMOTE_PATH --confirm yes           移入 OneDrive 回收站
所有云端路径均相对 OneDrive 根目录；空字符串或 / 表示根目录。
下载到执行用户 ~/Downloads/OneDrive，默认不覆盖；上传分片不自动覆盖。
不含 Microsoft Client Secret、不访问共享站点/非当前账号、不开启匿名共享。`;

const CONFIG = 'config.json', TOKENS = 'tokens.json', PENDING = 'pending.json';
const CHUNK_SIZE = 327680 * 10; // multiple of 320 KiB as required by Graph.
const MAX_UPLOAD = 250 * 1000 * 1000 * 1000;

export function configLocation(home = os.homedir()) {
  if (!path.isAbsolute(home)) throw new YoutubeError('directory_error', '需要绝对家目录');
  const directory = path.join(home, '.agent-plugin-marketplace', 'onedrive');
  return { directory, config: path.join(directory, CONFIG), tokens: path.join(directory, TOKENS),
    pending: path.join(directory, PENDING), tokenLock: path.join(directory, 'token.lock') };
}
async function privateHome(ctx) {
  const paths = configLocation(ctx.home || os.homedir());
  await safeDirectory(paths.directory, { privateLeaf: true });
  return paths;
}
async function readOptional(file) {
  return await lstatOrNull(file) ? await readPrivateJson(file) : null;
}
async function dropPrivate(file) {
  if (await lstatOrNull(file)) { await regularFile(file, { privateFile: true, allowEmpty: true }); await fs.unlink(file); }
}
async function loadConfig(paths) {
  const c = await readOptional(paths.config);
  if (!c || typeof c.client_id !== 'string' || typeof c.tenant !== 'string') {
    throw new YoutubeError('config_required', '先通过 configure CLIENT_ID 配置你自己的 Microsoft Entra 应用 Client ID');
  }
  return c;
}
function now(ctx) { return (ctx.now || Date.now)(); }
function serviceFetch(ctx) { return ctx.fetch || fetch; }
async function fetchSafe(ctx, url, options = {}, timeoutMs = 45000) {
  try {
    return await serviceFetch(ctx)(url, { ...options, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
  } catch { throw new YoutubeError('network_error', '微软服务连接失败；本地数据及授权不会被当作已完成操作'); }
}
async function smallJson(response, { allowEmpty = false } = {}) {
  if (allowEmpty && response.status === 204) return {};
  const contentLength = Number(response.headers?.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > 2 * 1024 * 1024) throw new YoutubeError('verification_failed', '微软响应内容超过安全上限');
  let text;
  try { text = await response.text(); } catch { throw new YoutubeError('network_error', '微软响应读取失败'); }
  if (Buffer.byteLength(text, 'utf8') > 2 * 1024 * 1024) throw new YoutubeError('verification_failed', '微软响应内容超过安全上限');
  try { return JSON.parse(text); }
  catch { throw new YoutubeError('verification_failed', '微软响应不是有效 JSON'); }
}
function mapGraphStatus(status) {
  return status === 404 ? 'not_found' : [409, 412].includes(status) ? 'file_exists'
    : [401, 403, 429].includes(status) ? 'access_restricted'
      : status >= 500 ? 'service_unavailable' : 'graph_error';
}
async function graphJson(ctx, token, endpoint, options = {}) {
  const url = assertGraphUrl(endpoint.startsWith('https://') ? endpoint : GRAPH_ROOT + endpoint);
  const headers = { Authorization: 'Bearer ' + token, ...options.headers };
  const response = await fetchSafe(ctx, url, { method: options.method || 'GET', headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  if (!response.ok) {
    const error = await smallJson(response).catch(() => ({}));
    const code = /^[A-Za-z0-9_.-]{1,80}$/u.test(error?.error?.code || '') ? error.error.code : 'unknown';
    throw new YoutubeError(mapGraphStatus(response.status),
      `Microsoft Graph 请求失败：HTTP ${response.status}，错误码 ${code}`);
  }
  return options.method === 'DELETE' ? {} : await smallJson(response, { allowEmpty: true });
}
function oauthUrl(config, step) {
  return `https://login.microsoftonline.com/${config.tenant}/oauth2/v2.0/${step}`;
}
async function oauthPost(ctx, config, step, parameters) {
  const data = new URLSearchParams(parameters);
  const response = await fetchSafe(ctx, oauthUrl(config, step), {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data.toString()
  });
  const body = await smallJson(response);
  return { status: response.status, body };
}
function publicItem(item) {
  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') {
    throw new YoutubeError('verification_failed', 'Microsoft Graph 返回的文件信息缺少 ID 或名称');
  }
  return { id: item.id, name: item.name, size: item.size ?? null,
    type: item.folder ? 'folder' : item.file ? 'file' : 'other',
    modified: item.lastModifiedDateTime || null };
}
function tokenRecord(response, oldToken, clock) {
  if (response.token_type?.toLowerCase() !== 'bearer' || typeof response.access_token !== 'string'
    || (!response.refresh_token && !oldToken?.refresh_token) || !Number.isFinite(Number(response.expires_in))) {
    throw new YoutubeError('auth_failed', '微软令牌响应缺少必要字段；没有存储不完整的凭据');
  }
  return { schema: 1, access_token: response.access_token,
    refresh_token: response.refresh_token || oldToken.refresh_token,
    expires_at: clock + Number(response.expires_in) * 1000 };
}
async function accessToken(ctx, paths) {
  const config = await loadConfig(paths);
  const token = await readOptional(paths.tokens);
  if (!token || typeof token.refresh_token !== 'string') {
    throw new YoutubeError('auth_required', 'OneDrive 尚未登录：请先 auth start，再完成浏览器授权与 auth complete');
  }
  if (typeof token.access_token === 'string' && token.expires_at > now(ctx) + 60000) return token.access_token;
  const release = await acquireLock(paths.tokenLock);
  try {
    const latest = await readOptional(paths.tokens);
    if (latest?.access_token && latest.expires_at > now(ctx) + 60000) return latest.access_token;
    const response = await oauthPost(ctx, config, 'token', {
      client_id: config.client_id, scope: SCOPES,
      grant_type: 'refresh_token', refresh_token: latest?.refresh_token || token.refresh_token
    });
    if (response.status !== 200) throw new YoutubeError('auth_required', '微软拒绝刷新会话，请重新登录；保留旧凭据供检查');
    const next = tokenRecord(response.body, latest, now(ctx));
    await writePrivateJson(paths.tokens, next);
    return next.access_token;
  } finally { await release(); }
}
async function auth(ctx, paths, action) {
  if (action === 'status') {
    const config = await readOptional(paths.config), token = await readOptional(paths.tokens);
    const pending = await readOptional(paths.pending);
    return { ok: true, status: 'auth_status', configured: Boolean(config?.client_id),
      authenticated: Boolean(token?.refresh_token), token_valid: Boolean(token?.expires_at > now(ctx) + 60000),
      pending: Boolean(pending?.expires_at > now(ctx)), tenant: config?.tenant || null };
  }
  if (action === 'logout') {
    await dropPrivate(paths.tokens); await dropPrivate(paths.pending);
    return { ok: true, status: 'logged_out', note: '只清除本地 OneDrive 令牌；微软账号中的授权如需撤销须在账号设置中处理' };
  }
  const config = await loadConfig(paths);
  if (action === 'start') {
    const previous = await readOptional(paths.pending);
    if (previous && previous.expires_at > now(ctx)) {
      throw new YoutubeError('auth_pending', '已有尚未过期的设备授权会话；请先完成授权或等其过期');
    }
    const { status, body } = await oauthPost(ctx, config, 'devicecode',
      { client_id: config.client_id, scope: SCOPES });
    if (status !== 200 || typeof body.device_code !== 'string' || typeof body.user_code !== 'string') {
      throw new YoutubeError('auth_failed', '微软设备授权请求未被接受，请检查应用注册、公开客户端和账号类型');
    }
    const u = new URL(body.verification_uri);
    if (u.protocol !== 'https:' || !['microsoft.com', 'www.microsoft.com', 'login.microsoftonline.com'].includes(u.hostname)) {
      throw new YoutubeError('file_security', '微软设备登录地址不符合允许域名');
    }
    const interval = Math.max(5, Math.min(60, Number(body.interval) || 5)) * 1000;
    const expiresAt = now(ctx) + Math.min(Number(body.expires_in) || 900, 1800) * 1000;
    await writePrivateJson(paths.pending, { schema: 1, device_code: body.device_code,
      client_id: config.client_id, tenant: config.tenant, user_code: body.user_code,
      verification_uri: u.href, expires_at: expiresAt, interval_ms: interval, next_poll_at: now(ctx) + interval });
    return { ok: true, status: 'authorization_started', verification_uri: u.href,
      user_code: body.user_code, expires_at: new Date(expiresAt).toISOString(),
      next: '在微软页面输入显示的代码并完成登录后执行 auth complete' };
  }
  const pending = await readOptional(paths.pending);
  if (!pending || pending.expires_at < now(ctx) || pending.client_id !== config.client_id || pending.tenant !== config.tenant) {
    throw new YoutubeError('auth_required', '授权会话不存在或已过期；重新执行 auth start');
  }
  if (now(ctx) < pending.next_poll_at) {
    throw new YoutubeError('auth_pending', '授权请求尚在轮询间隔内；请稍后执行 auth complete', {
      retry_after_seconds: Math.ceil((pending.next_poll_at - now(ctx)) / 1000) });
  }
  const { status, body } = await oauthPost(ctx, config, 'token', {
    client_id: config.client_id, grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    device_code: pending.device_code
  });
  if (status !== 200) {
    if (['authorization_pending', 'slow_down'].includes(body.error)) {
      const interval = pending.interval_ms + (body.error === 'slow_down' ? 5000 : 0);
      await writePrivateJson(paths.pending, { ...pending, interval_ms: interval, next_poll_at: now(ctx) + interval });
      throw new YoutubeError('auth_pending', '浏览器授权尚未完成', { retry_after_seconds: Math.ceil(interval / 1000) });
    }
    if (['expired_token', 'authorization_declined', 'bad_verification_code'].includes(body.error)) await dropPrivate(paths.pending);
    throw new YoutubeError('auth_failed', '微软授权未完成或已被拒绝；未保存任何新凭据');
  }
  const next = tokenRecord(body, null, now(ctx));
  await writePrivateJson(paths.tokens, next);
  await dropPrivate(paths.pending);
  return { ok: true, status: 'authenticated', note: '授权成功，Token 已保存在当前用户的私有配置文件中' };
}
async function paged(ctx, token, first, limit) {
  const items = [];
  let next = first, pages = 0;
  while (next && items.length < limit && pages++ < 30) {
    const data = await graphJson(ctx, token, next);
    if (!Array.isArray(data.value)) throw new YoutubeError('verification_failed', 'Graph 分页结果不是文件列表');
    for (const entry of data.value) {
      if (items.length < limit) items.push(publicItem(entry));
    }
    next = typeof data['@odata.nextLink'] === 'string' ? assertGraphUrl(data['@odata.nextLink']) : null;
    if (!data.value.length && next) throw new YoutubeError('verification_failed', 'Graph 返回了无法推进的空分页');
  }
  return { entries: items, truncated: Boolean(next) || pages >= 30 };
}
async function lookup(ctx, token, remotePath) {
  return await graphJson(ctx, token, itemEndpoint(remotePath));
}
async function download(ctx, token, req) {
  const info = await lookup(ctx, token, req.remotePath);
  if (!info.file || !Number.isSafeInteger(info.size) || info.size < 0) {
    throw new YoutubeError('invalid_input', '所选项不是可下载的普通 OneDrive 文件');
  }
  const directory = await outputDirectory(req.directory, ctx.home || os.homedir());
  const filename = localDownloadName(info.name, cloudSegments(req.remotePath).at(-1));
  const destination = path.join(directory, filename);
  if (await lstatOrNull(destination)) {
    if (!req.overwrite) throw new YoutubeError('file_exists', '本地同名文件已存在，默认不覆盖', { existing_file: destination });
    await regularFile(destination, { allowEmpty: true });
  }
  const temp = path.join(directory, '.onedrive-' + randomUUID() + '.part');
  const handle = await fs.open(temp, 'wx', 0o600);
  let done = false;
  try {
    const url = assertGraphUrl(GRAPH_ROOT + contentEndpoint(req.remotePath));
    let response = await fetchSafe(ctx, url, { headers: { Authorization: 'Bearer ' + token } }, 120000);
    for (let redirections = 0; [301, 302, 303, 307, 308].includes(response.status); redirections++) {
      if (redirections >= 3) throw new YoutubeError('file_security', 'OneDrive 下载跳转过多');
      const location = assertTransferUrl(response.headers.get('location'));
      response = await fetchSafe(ctx, location, {}, 120000); // Never forward the Graph bearer token.
    }
    if (!response.ok || !response.body) throw new YoutubeError(mapGraphStatus(response.status), 'OneDrive 下载请求被拒绝：HTTP ' + response.status);
    const sha256 = createHash('sha256'), sha1 = createHash('sha1');
    let total = 0;
    for await (const chunk of response.body) {
      const data = Buffer.from(chunk);
      total += data.length;
      if (total > info.size) throw new YoutubeError('verification_failed', 'OneDrive 文件内容超过 Graph 声明的大小');
      sha256.update(data); sha1.update(data);
      let offset = 0;
      while (offset < data.length) {
        const r = await handle.write(data, offset, data.length - offset);
        if (!r.bytesWritten) throw new YoutubeError('directory_error', '无法写入本地下载文件');
        offset += r.bytesWritten;
      }
    }
    if (total !== info.size) throw new YoutubeError('verification_failed', 'OneDrive 下载文件大小与元数据不一致');
    const sha256Text = sha256.digest('hex'), sha1Text = sha1.digest('hex');
    if (info.file.hashes?.sha256Hash && sha256Text !== info.file.hashes.sha256Hash.toLowerCase()) {
      throw new YoutubeError('verification_failed', 'OneDrive SHA-256 不匹配');
    }
    if (info.file.hashes?.sha1Hash && sha1Text !== info.file.hashes.sha1Hash.toLowerCase()) {
      throw new YoutubeError('verification_failed', 'OneDrive SHA-1 不匹配');
    }
    await handle.sync(); await handle.close();
    await publishFile(temp, destination, req.overwrite);
    done = true;
    return { ok: true, status: 'downloaded', path: destination, remote_path: req.remotePath,
      size: total, sha256: sha256Text };
  } finally {
    if (!done) { await handle.close().catch(() => {}); await fs.rm(temp, { force: true }); }
  }
}
async function upload(ctx, token, req) {
  const source = path.resolve(req.localFile);
  const stat = await regularFile(source, { allowEmpty: true });
  if (!Number.isSafeInteger(stat.size) || stat.size < 1 || stat.size > MAX_UPLOAD) {
    throw new YoutubeError('invalid_input', '首版支持 1 字节至 250 GB 的普通文件；空文件请先添加内容');
  }
  const parent = await lookup(ctx, token, req.destination);
  if (!parent.folder) throw new YoutubeError('invalid_input', '目标 OneDrive 路径必须是已有文件夹');
  const fullPath = [req.destination, req.name].filter(Boolean).join('/');
  const session = await graphJson(ctx, token, uploadSessionEndpoint(fullPath), { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { item: { name: req.name, '@microsoft.graph.conflictBehavior': req.overwrite ? 'replace' : 'fail' } } });
  const uploadUrl = assertTransferUrl(session.uploadUrl);
  const handle = await fs.open(source, 'r');
  let last;
  try {
    for (let start = 0; start < stat.size;) {
      const length = Math.min(CHUNK_SIZE, stat.size - start);
      const block = Buffer.alloc(length);
      const read = await handle.read(block, 0, length, start);
      if (read.bytesRead !== length) throw new YoutubeError('verification_failed', '本地源文件在上传时被修改，操作已停止');
      const end = start + length - 1;
      const reply = await fetchSafe(ctx, uploadUrl, { method: 'PUT', headers: {
        'Content-Length': String(length), 'Content-Range': `bytes ${start}-${end}/${stat.size}`
      }, body: block }, 120000);
      if (![200, 201, 202].includes(reply.status)) {
        throw new YoutubeError(mapGraphStatus(reply.status),
          'OneDrive 分片上传未完成：HTTP ' + reply.status + '；不会把不确定结果当作成功');
      }
      last = await smallJson(reply);
      if (reply.status === 202) {
        const expected = last.nextExpectedRanges?.[0]?.match(/^([0-9]+)-/u);
        if (!expected || Number(expected[1]) !== end + 1) {
          throw new YoutubeError('upload_uncertain', 'OneDrive 上传会话进度与本地片段不匹配；停止自动重复提交');
        }
      } else if (end + 1 !== stat.size) {
        throw new YoutubeError('upload_uncertain', 'OneDrive 提前结束上传会话，未证实完整传输');
      }
      start = end + 1;
    }
  } finally { await handle.close(); }
  if (!last?.file || last.size !== stat.size || last.name !== req.name || typeof last.id !== 'string') {
    throw new YoutubeError('upload_uncertain', 'Graph 未返回完整的文件提交确认，禁止宣称上传成功');
  }
  const after = await regularFile(source, { allowEmpty: true });
  if (after.size !== stat.size || after.mtimeMs !== stat.mtimeMs) {
    throw new YoutubeError('upload_uncertain', '本地源文件上传期间发生变化，不能确认其完整一致性');
  }
  return { ok: true, status: 'uploaded', remote_path: fullPath, item: publicItem(last),
    sha256: await hashFile(source), size: stat.size };
}
export async function executeOneDrive(req, ctx = {}) {
  if (req.command === 'help') return { ok: true, status: 'help', help: HELP };
  const paths = await privateHome(ctx);
  if (req.command === 'configure') {
    const existing = await readOptional(paths.config);
    if (existing && (existing.client_id !== req.clientId || existing.tenant !== req.tenant)
      && (await readOptional(paths.tokens) || await readOptional(paths.pending))) {
      throw new YoutubeError('config_locked', '已存在 OneDrive 授权状态。请先 auth logout 再更改 Client ID 或租户');
    }
    await writePrivateJson(paths.config, { schema: 1, client_id: req.clientId, tenant: req.tenant });
    return { ok: true, status: 'configured', tenant: req.tenant,
      next: '执行 auth start，并在微软网页中授权。无需提供客户端密钥' };
  }
  if (req.command === 'status' || req.command === 'auth') {
    return await auth(ctx, paths, req.command === 'status' ? 'status' : req.action);
  }
  const token = await accessToken(ctx, paths);
  switch (req.command) {
    case 'list': {
      const parent = await lookup(ctx, token, req.remotePath);
      if (!parent.folder) throw new YoutubeError('invalid_input', '目标不是 OneDrive 文件夹');
      return { ok: true, status: 'listed', remote_path: req.remotePath,
        ...await paged(ctx, token, childrenEndpoint(req.remotePath), req.limit) };
    }
    case 'search': return { ok: true, status: 'searched', query: req.query,
      ...await paged(ctx, token, searchEndpoint(req.query), req.limit) };
    case 'info': return { ok: true, status: 'item_info', remote_path: req.remotePath,
      item: publicItem(await lookup(ctx, token, req.remotePath)) };
    case 'download': return await download(ctx, token, req);
    case 'upload': return await upload(ctx, token, req);
    case 'mkdir': {
      const parts = cloudSegments(req.remotePath, { allowRoot: false });
      const name = parts.pop(), parentPath = parts.join('/');
      const parent = await lookup(ctx, token, parentPath);
      if (!parent.folder) throw new YoutubeError('invalid_input', '父级路径不是 OneDrive 文件夹');
      const result = await graphJson(ctx, token, childrenEndpoint(parentPath), { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { name, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' } });
      return { ok: true, status: 'folder_created', remote_path: req.remotePath, item: publicItem(result) };
    }
    case 'trash': {
      const target = await lookup(ctx, token, req.remotePath);
      if (typeof target.id !== 'string' || target.id.length > 300) {
        throw new YoutubeError('verification_failed', '不能确认 OneDrive 目标文件 ID');
      }
      await graphJson(ctx, token, '/me/drive/items/' + encodeURIComponent(target.id), { method: 'DELETE' });
      return { ok: true, status: 'trashed', remote_path: req.remotePath, item: publicItem(target),
        note: '已移入 OneDrive 回收站' };
    }
    default: throw new YoutubeError('invalid_input', '不支持的 OneDrive 操作');
  }
}
export async function main(args = process.argv.slice(2)) {
  try { process.stdout.write(JSON.stringify(await executeOneDrive(parseOneDriveArgs(args)), null, 2) + '\n'); }
  catch (error) {
    process.stdout.write(JSON.stringify(publicError(error), null, 2) + '\n');
    process.exitCode = 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
