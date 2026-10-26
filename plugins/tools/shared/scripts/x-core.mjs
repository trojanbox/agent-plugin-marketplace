/** Input and media-selection contracts for public X/Twitter post downloads. */
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { YoutubeError, safeTitle } from './youtube-core.mjs';

const HOSTS = new Set(['x.com', 'www.x.com', 'm.x.com', 'mobile.x.com',
  'twitter.com', 'www.twitter.com', 'm.twitter.com', 'mobile.twitter.com']);

export function normalizeXUrl(input) {
  if (typeof input !== 'string' || input.length > 8192) throw new YoutubeError('invalid_input', '需要一条 X/Twitter 帖子链接');
  let u;
  try { u = new URL(input); } catch { throw new YoutubeError('invalid_input', '无效的 X 帖子链接'); }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') || !HOSTS.has(u.hostname)) {
    throw new YoutubeError('unsupported_url', '仅接受不包含登录信息的 HTTPS x.com/twitter.com 帖子链接');
  }
  const match = /^\/([A-Za-z0-9_]{1,15})\/status\/([1-9][0-9]{5,19})(?:\/video\/([1-4]))?\/?$/u.exec(u.pathname);
  if (!match) throw new YoutubeError('unsupported_url', '仅支持单条 X 帖子及其 /video/1～4 链接，不支持用户主页、搜索、Spaces 或批量链接');
  const [, author, postId, number] = match;
  return { author, postId, mediaIndex: number ? Number(number) : null,
    url: `https://x.com/${author}/status/${postId}${number ? '/video/' + number : ''}` };
}

export function parseXRequest(args, home = os.homedir(), pathLib = path) {
  if (!args.length || (args.length === 1 && ['--help', '-h'].includes(args[0]))) return { mode: 'help' };
  const [mode, ...rest] = args;
  if (['doctor', 'repair'].includes(mode)) {
    if (rest.length) throw new YoutubeError('invalid_input', `${mode} 不接受额外参数`);
    return { mode };
  }
  if (!['video', 'audio'].includes(mode)) throw new YoutubeError('invalid_input', '操作仅支持 video、audio、doctor、repair');
  const source = normalizeXUrl(rest.shift());
  const flags = Object.create(null);
  const allowed = new Set(['--dir', '--format', '--overwrite', '--timeout']);
  if (mode === 'video') allowed.add('--max-height');
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i], value = rest[i + 1];
    if (!allowed.has(key) || typeof value !== 'string' || value.startsWith('--') || Object.hasOwn(flags, key)) {
      throw new YoutubeError('invalid_input', '不支持、重复或缺少值的参数：' + key);
    }
    flags[key] = value;
  }
  const format = flags['--format'] || (mode === 'video' ? 'mp4' : 'mp3');
  if (!(mode === 'video' ? ['mp4', 'mkv'] : ['mp3', 'm4a']).includes(format)) {
    throw new YoutubeError('invalid_input', mode + ' 的格式仅支持 ' + (mode === 'video' ? 'mp4/mkv' : 'mp3/m4a'));
  }
  if (flags['--overwrite'] !== undefined && !['yes', 'no'].includes(flags['--overwrite'])) {
    throw new YoutubeError('invalid_input', '--overwrite 只能为 yes 或 no');
  }
  const heightText = flags['--max-height'] || '1080';
  if (!/^[0-9]{2,5}$/u.test(heightText) || +heightText < 144 || +heightText > 16384) {
    throw new YoutubeError('invalid_input', '--max-height 需要 144～16384 的整数');
  }
  const timeoutText = flags['--timeout'] || '7200';
  if (!/^[0-9]{1,5}$/u.test(timeoutText) || +timeoutText < 10 || +timeoutText > 86400) {
    throw new YoutubeError('invalid_input', '--timeout 需要 10～86400 秒');
  }
  if (!pathLib.isAbsolute(home)) throw new YoutubeError('directory_error', '当前用户家目录必须是绝对路径');
  const directory = flags['--dir'] || pathLib.join(home, 'Downloads', 'X');
  if (!pathLib.isAbsolute(directory) || /[\x00-\x1f]/u.test(directory)) {
    throw new YoutubeError('invalid_input', '下载目录必须是无控制字符的绝对路径');
  }
  return { ...source, mode, format, directory: pathLib.normalize(directory),
    overwrite: flags['--overwrite'] === 'yes', maxHeight: mode === 'video' ? +heightText : null,
    timeoutMs: +timeoutText * 1000 };
}

export function xIdentity(request) {
  return { schema: 1, platform: 'x', postId: request.postId, mediaIndex: request.mediaIndex,
    mode: request.mode, format: request.format, maxHeight: request.maxHeight };
}
export function xKey(request) {
  return createHash('sha256').update(JSON.stringify(xIdentity(request))).digest('hex').slice(0, 20);
}
export function xOutputName(request, title) {
  const tail = request.mode === 'video' ? `.h${request.maxHeight}` : '';
  const numbered = request.mediaIndex && request.mediaIndex > 1 ? `.video${request.mediaIndex}` : '';
  return safeTitle(title, 'X-' + request.postId) + numbered + tail + '.' + request.format;
}
export function xMediaSelector(request) {
  if (request.mode === 'video') {
    return `bv*[height<=${request.maxHeight}]+ba/b[height<=${request.maxHeight}]/bv[height<=${request.maxHeight}]`;
  }
  return 'bestaudio/best';
}

/** X exposes a media id distinct from its tweet id; display_id is the originating tweet. */
export function validateXMetadata(info, request) {
  if (!info || typeof info !== 'object' || info.entries || info._type === 'playlist') {
    throw new YoutubeError('multiple_media_unsupported', '帖子可能含多个媒体，请使用帖子链接中的 /video/1～4 选择一个视频');
  }
  if (!/^Twitter$/iu.test(info.extractor_key || '') || !/^[0-9]{6,20}$/u.test(String(info.id || ''))
    || (String(info.display_id || info.id) !== request.postId)) {
    throw new YoutubeError('verification_failed', 'X 返回的媒体 ID、帖子 ID 或来源无法验证');
  }
  if (['private', 'premium_only', 'subscriber_only', 'needs_auth'].includes(info.availability)
    || Number(info.age_limit) >= 18) {
    throw new YoutubeError('access_restricted', '该帖子需要登录、付费或年龄验证，本工具不会访问受限资源');
  }
  if (info.is_live || ['is_live', 'is_upcoming', 'post_live'].includes(info.live_status)) {
    throw new YoutubeError('video_unavailable', '不录制直播或尚未结束的视频');
  }
}

export function xPlan(info, request) {
  validateXMetadata(info, request);
  const selected = info.requested_formats || (info.requested_downloads?.length === 1
    ? info.requested_downloads[0].requested_formats : null) || [info];
  if (!Array.isArray(selected) || !selected.length || selected.length > 3) {
    throw new YoutubeError('verification_failed', '无法确定唯一媒体的下载格式');
  }
  const formats = selected.map(f => {
    if (!/^[A-Za-z0-9_.-]{1,100}$/u.test(f.format_id || '') || f.has_drm) {
      throw new YoutubeError('video_unavailable', '媒体格式无效或受 DRM 保护');
    }
    return { id: f.format_id, ext: f.ext || null, height: f.height || null,
      vcodec: f.vcodec || null, acodec: f.acodec || null };
  });
  if (request.mode === 'video' && !formats.some(f => f.vcodec !== 'none' && Number(f.height) > 0
    && Number(f.height) <= request.maxHeight)) {
    throw new YoutubeError('video_unavailable', '没有符合画质上限的视频');
  }
  if (request.mode === 'video' && formats.some(f => f.vcodec !== 'none' && f.height > request.maxHeight)) {
    throw new YoutubeError('verification_failed', '媒体实际分辨率超过请求上限');
  }
  if (request.mode === 'audio' && formats.every(f => f.acodec === 'none')) {
    throw new YoutubeError('video_unavailable', '这个 X 视频没有音轨，无法提取音频');
  }
  const duration = Number(info.duration);
  return { mediaId: String(info.id), duration: Number.isFinite(duration) ? duration : null, formats };
}
