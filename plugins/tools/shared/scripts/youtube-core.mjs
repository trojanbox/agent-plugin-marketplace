/** Pure input, selection and error contracts for the YouTube tools Skill. */
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

export class YoutubeError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = 'YoutubeError';
    this.status = status;
    this.details = details;
  }
}

export function normalizeUrl(input) {
  let u;
  if (typeof input !== 'string' || input.length > 8192) throw new YoutubeError('invalid_input', '需要一个 YouTube 视频链接');
  try { u = new URL(input); } catch { throw new YoutubeError('invalid_input', '视频 URL 无效'); }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) {
    throw new YoutubeError('unsupported_url', '只允许不含账号信息的 HTTPS YouTube 视频 URL');
  }
  const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
  let id;
  if (u.hostname === 'youtu.be' && /^\/[A-Za-z0-9_-]{11}\/?$/u.test(u.pathname)) {
    id = u.pathname.split('/')[1];
  } else if (hosts.includes(u.hostname)) {
    if (u.pathname === '/watch' && u.searchParams.getAll('v').length === 1) id = u.searchParams.get('v');
    else if (/^\/(shorts|embed|live)\/[A-Za-z0-9_-]{11}\/?$/u.test(u.pathname)) id = u.pathname.split('/')[2];
  }
  if (!/^[A-Za-z0-9_-]{11}$/u.test(id || '')) {
    throw new YoutubeError('unsupported_url', '只支持单个 YouTube 视频；不支持播放列表、频道或其他网站');
  }
  // A watch link containing a playlist/tracking parameter still denotes this ONE video.
  return { id, url: `https://www.youtube.com/watch?v=${id}` };
}

const LANG_ALIASES = new Map([
  ['中文', 'zh'], ['chinese', 'zh'], ['简体中文', 'zh-Hans'], ['繁体中文', 'zh-Hant'],
  ['英文', 'en'], ['英语', 'en'], ['english', 'en'], ['日文', 'ja'], ['日语', 'ja'], ['japanese', 'ja'],
]);
export function normalizeLanguage(value = 'zh') {
  const text = String(value).trim();
  const language = LANG_ALIASES.get(text.toLowerCase()) || text;
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/u.test(language)) {
    throw new YoutubeError('invalid_input', '字幕语言需为 zh、en、ja、zh-Hans 等单个语言标签，不允许通配符或语言列表');
  }
  const bits = language.split('-');
  return bits.map((bit, index) => index === 0 ? bit.toLowerCase() : bit.length === 4
    ? bit[0].toUpperCase() + bit.slice(1).toLowerCase() : bit.length === 2 ? bit.toUpperCase() : bit.toLowerCase()).join('-');
}

export function parseRequest(args, home = os.homedir(), pathLib = path) {
  if (!args.length || (args.length === 1 && ['--help', '-h'].includes(args[0]))) return { mode: 'help' };
  const [mode, ...rest] = args;
  if (['doctor', 'repair'].includes(mode)) {
    if (rest.length) throw new YoutubeError('invalid_input', `${mode} 不接受额外参数`);
    return { mode };
  }
  if (!['video', 'audio', 'subtitles'].includes(mode)) throw new YoutubeError('invalid_input', '操作仅支持 video、audio、subtitles、doctor、repair');
  const source = normalizeUrl(rest.shift());
  const allowed = new Set(['--dir', '--format', '--overwrite', '--timeout']);
  if (mode === 'video') allowed.add('--max-height');
  if (mode === 'subtitles') allowed.add('--lang');
  const flags = {};
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i], value = rest[i + 1];
    if (!allowed.has(key) || value === undefined || value.startsWith('--') || key in flags) {
      throw new YoutubeError('invalid_input', '不支持、重复或缺少值的参数：' + key);
    }
    flags[key] = value;
  }
  const defaults = { video: 'mp4', audio: 'mp3', subtitles: 'srt' };
  const formats = { video: ['mp4', 'mkv'], audio: ['mp3', 'm4a'], subtitles: ['srt', 'vtt'] };
  const format = flags['--format'] || defaults[mode];
  if (!formats[mode].includes(format)) throw new YoutubeError('invalid_input', `${mode} 格式只支持 ${formats[mode].join('/')}`);
  if (flags['--overwrite'] !== undefined && !['yes', 'no'].includes(flags['--overwrite'])) {
    throw new YoutubeError('invalid_input', '--overwrite 必须为 yes 或 no');
  }
  const heightText = flags['--max-height'] || '1080';
  if (!/^\d{2,5}$/u.test(heightText) || Number(heightText) < 144 || Number(heightText) > 16384) {
    throw new YoutubeError('invalid_input', '--max-height 必须是 144～16384 之间的分辨率上限整数');
  }
  const timeoutText = flags['--timeout'] || '7200';
  if (!/^\d{1,5}$/u.test(timeoutText) || Number(timeoutText) < 10 || Number(timeoutText) > 86400) {
    throw new YoutubeError('invalid_input', '--timeout 必须为 10～86400 秒');
  }
  if (!pathLib.isAbsolute(home)) throw new YoutubeError('directory_error', '无法取得当前执行用户的绝对家目录');
  const directory = flags['--dir'] || pathLib.join(home, 'Downloads', 'YouTube');
  if (!pathLib.isAbsolute(directory) || /[\x00-\x1f]/u.test(directory)) throw new YoutubeError('invalid_input', '输出目录必须为无控制字符的绝对路径');
  return {
    mode, ...source, format, directory: pathLib.normalize(directory), overwrite: flags['--overwrite'] === 'yes',
    maxHeight: mode === 'video' ? Number(heightText) : null,
    language: mode === 'subtitles' ? normalizeLanguage(flags['--lang'] || 'zh') : null,
    timeoutMs: Number(timeoutText) * 1000,
  };
}

export function requestIdentity(request) {
  return { schema: 1, id: request.id, mode: request.mode, format: request.format,
    maxHeight: request.maxHeight, language: request.language };
}
export function requestKey(request) {
  return createHash('sha256').update(JSON.stringify(requestIdentity(request))).digest('hex').slice(0, 20);
}
export function outputName(request) {
  const suffix = request.mode === 'video' ? `.h${request.maxHeight}` : request.mode === 'subtitles' ? `.${request.language}` : '';
  return `${request.id}.${request.mode}${suffix}.${request.format}`;
}
export function mediaSelector(request) {
  if (request.mode === 'video') return `bv*[height<=${request.maxHeight}]+ba/b[height<=${request.maxHeight}]`;
  return 'bestaudio/best';
}

/** Validate actual metadata; do not expand the single-public-video scope. */
export function validateMetadata(info, id) {
  if (!info || typeof info !== 'object' || info.id !== id || info.entries || info._type === 'playlist') {
    throw new YoutubeError('verification_failed', '下载器返回的内容不匹配请求的单个视频');
  }
  if (info.extractor_key && !/^youtube$/iu.test(info.extractor_key)) throw new YoutubeError('unsupported_url', '下载器返回了非 YouTube 视频');
  if (['private', 'premium_only', 'subscriber_only', 'needs_auth'].includes(info.availability) || Number(info.age_limit) >= 18) {
    throw new YoutubeError('access_restricted', '视频需要登录/付费/年龄验证，首版不接入账号或 Cookie');
  }
  if (info.is_live || ['is_live', 'is_upcoming', 'post_live'].includes(info.live_status)) {
    throw new YoutubeError('video_unavailable', '仅支持已完成的视频，无法录制正在直播或尚未就绪的内容');
  }
}

function langFamily(code) {
  const c = code.toLowerCase().replace(/-orig$/u, '');
  if (['zh-cn', 'zh-sg', 'zh-hans'].includes(c)) return 'zh-hans';
  if (['zh-tw', 'zh-hk', 'zh-mo', 'zh-hant'].includes(c)) return 'zh-hant';
  return c;
}
function languageRank(requested, candidate) {
  const r = requested.toLowerCase(), c = candidate.toLowerCase().replace(/-orig$/u, '');
  if (r === c) return 0;
  if (langFamily(r) === langFamily(c)) return 1;
  if (!r.includes('-') && c.startsWith(r + '-')) {
    if (r === 'zh') return langFamily(c) === 'zh-hans' ? 2 : langFamily(c) === 'zh-hant' ? 3 : 4;
    return 2;
  }
  return Infinity;
}

/** yt-dlp lists auto-translations beside native ASR captions. Reject tlang tracks. */
export function usableSubtitle(track) {
  if (!track || track.ext !== 'vtt' || typeof track.url !== 'string') return false;
  try {
    const u = new URL(track.url);
    return u.protocol === 'https:' && !u.username && !u.password && !u.searchParams.has('tlang');
  } catch { return false; }
}
export function selectSubtitle(info, requested = 'zh') {
  const language = normalizeLanguage(requested);
  for (const [source, tracks] of [['manual', info.subtitles], ['automatic', info.automatic_captions]]) {
    const choices = Object.entries(tracks || {})
      .filter(([code, values]) => /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,4}$/u.test(code)
        && Number.isFinite(languageRank(language, code)) && Array.isArray(values) && values.some(usableSubtitle))
      .sort((a, b) => languageRank(language, a[0]) - languageRank(language, b[0]) || a[0].localeCompare(b[0]));
    if (choices.length) {
      return { source, code: choices[0][0], language: choices[0][0].replace(/-orig$/iu, ''), requestedLanguage: language };
    }
  }
  throw new YoutubeError('subtitle_unavailable', `该视频没有可用的 ${language} 人工或原生自动字幕；不会翻译或换成其他语言`, { requested_language: language });
}

export function selectedFormats(info, request) {
  const formats = info.requested_formats || (info.requested_downloads?.length === 1
    ? info.requested_downloads[0].requested_formats : null) || [info];
  if (!Array.isArray(formats) || !formats.length || formats.length > 3) throw new YoutubeError('verification_failed', '没有有效的已选音视频流');
  const result = formats.map(f => {
    if (!/^[A-Za-z0-9_.-]{1,100}$/u.test(f.format_id || '') || f.has_drm) throw new YoutubeError('video_unavailable', '视频流标识无效或包含受保护内容');
    return { id: f.format_id, ext: f.ext || null, height: f.height || null, vcodec: f.vcodec || 'none', acodec: f.acodec || 'none' };
  });
  if (request.mode === 'video') {
    if (!result.some(f => f.vcodec !== 'none' && f.height > 0 && f.height <= request.maxHeight)
      || result.some(f => f.vcodec !== 'none' && (!f.height || f.height > request.maxHeight))) {
      throw new YoutubeError('verification_failed', '已选视频流的实际分辨率未知或超过上限');
    }
  }
  if (!result.some(f => f.acodec !== 'none')) throw new YoutubeError('video_unavailable', '所选媒体没有音轨');
  return result;
}

export function classifyBackendFailure(text, fallback = 'download_failed') {
  const s = String(text);
  if (/sign in|log.?in|cookies|private video|members.only|age.restrict|confirm your age|not a bot|premium|payment|required.*account/iu.test(s)) return 'access_restricted';
  if (/not available in your country|geo.restrict|region|country/iu.test(s)) return 'access_restricted';
  if (/video unavailable|video has been removed|video is unavailable|copyright|does not exist|requested format is not available/iu.test(s)) return 'video_unavailable';
  if (/HTTP Error (?:403|429)/u.test(s)) return 'access_restricted';
  if (/timed out|timeout|connection|network|resolve|HTTP Error 5\d\d/iu.test(s)) return 'network_error';
  return fallback;
}
export function safeDiagnostic(value) {
  return String(value).replace(/\x1b\[[0-9;]*[A-Za-z]/gu, '').replace(/https?:\/\/[^\s"'<>]+/gu, '[URL]')
    .replace(/(authorization|cookie|password|token)\s*[:=]\s*[^\s]+/giu, '$1=[REDACTED]').slice(-2000);
}
export function publicError(error) {
  if (error instanceof YoutubeError) return { ok: false, status: error.status, message: error.message, ...error.details };
  return { ok: false, status: 'internal_error', message: '工具执行失败：' + safeDiagnostic(error?.code || error?.message || '未知错误') };
}
