/** Pure parsing and URL trust contracts for OneDrive via Microsoft Graph v1.0. */
import os from 'node:os';
import path from 'node:path';
import { YoutubeError, safeTitle } from './youtube-core.mjs';

export const GRAPH_ORIGIN = 'https://graph.microsoft.com';
export const GRAPH_ROOT = GRAPH_ORIGIN + '/v1.0';
export const SCOPES = 'Files.ReadWrite offline_access';

export function validClientId(clientId) {
  return typeof clientId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(clientId);
}
export function validTenant(tenant) {
  return ['common', 'consumers', 'organizations'].includes(tenant) || validClientId(tenant);
}
export function cloudSegments(value, { allowRoot = true } = {}) {
  if (value === undefined || value === null || value === '' || value === '/') {
    if (allowRoot) return [];
    throw new YoutubeError('invalid_input', '必须指定非根目录的 OneDrive 路径');
  }
  if (typeof value !== 'string' || value.length > 4096 || value.startsWith('/') || value.endsWith('/')
    || value.includes('\\')) throw new YoutubeError('invalid_input', 'OneDrive 路径必须是相对于网盘根目录的路径');
  const parts = value.split('/');
  if (parts.length > 100) throw new YoutubeError('invalid_input', 'OneDrive 路径层级过多');
  for (const part of parts) {
    if (!part || ['.', '..'].includes(part) || part.length > 255
      || /[\\:*?"<>|\x00-\x1f]/u.test(part) || /[. ]$/u.test(part)) {
      throw new YoutubeError('invalid_input', 'OneDrive 路径包含非法字符或路径穿越');
    }
  }
  return parts;
}
export function cloudPath(value, options) { return cloudSegments(value, options).join('/'); }
export function encodeCloudPath(value) { return cloudSegments(value).map(encodeURIComponent).join('/'); }
export function itemEndpoint(value, close = false) {
  const segments = encodeCloudPath(value);
  return segments ? '/me/drive/root:/' + segments + (close ? ':' : '') : '/me/drive/root';
}
export function childrenEndpoint(value) {
  return itemEndpoint(value, Boolean(cloudSegments(value).length)) + '/children';
}
export function contentEndpoint(value) {
  cloudSegments(value, { allowRoot: false });
  return itemEndpoint(value, true) + '/content';
}
export function uploadSessionEndpoint(value) {
  cloudSegments(value, { allowRoot: false });
  return itemEndpoint(value, true) + '/createUploadSession';
}
/** Keep short document extensions intact when the remote title is very long. */
export function localDownloadName(remoteName, fallback) {
  const input = typeof remoteName === 'string' ? remoteName : '';
  const suffix = path.extname(input);
  const extension = /^[.][A-Za-z0-9]{1,15}$/u.test(suffix) ? suffix : '';
  const stem = safeTitle(extension ? input.slice(0, -extension.length) : input, fallback);
  let limited = '';
  for (const character of stem) {
    if (Buffer.byteLength(limited + character, 'utf8') > 180 - Buffer.byteLength(extension)) break;
    limited += character;
  }
  return (limited.replace(/[.\s]+$/gu, '') || fallback) + extension;
}
export function searchEndpoint(query) {
  if (typeof query !== 'string' || !query.trim() || query.length > 200 || /[\x00-\x1f]/u.test(query)) {
    throw new YoutubeError('invalid_input', '搜索词应为 1～200 字符的普通文本');
  }
  const escaped = encodeURIComponent(query.trim().replace(/'/gu, "''")).replace(/'/gu, '%27');
  return `/me/drive/root/search(q=%27${escaped}%27)`;
}
export function assertGraphUrl(value) {
  let u;
  try { u = new URL(value, GRAPH_ROOT); } catch { throw new YoutubeError('file_security', 'Graph URL 格式无效'); }
  if (u.origin !== GRAPH_ORIGIN || u.protocol !== 'https:' || u.username || u.password
    || !(u.pathname === '/v1.0/me/drive' || u.pathname.startsWith('/v1.0/me/drive/'))) {
    throw new YoutubeError('file_security', 'Graph 响应包含非 Microsoft Graph v1.0 的请求地址');
  }
  return u.href;
}
export function assertTransferUrl(value) {
  let u;
  try { u = new URL(value); } catch { throw new YoutubeError('file_security', 'OneDrive 临时下载/上传地址无效'); }
  const host = u.hostname.toLowerCase();
  const safe = ['1drv.com', 'sharepoint.com', 'sharepoint-df.com', 'onedrive.com']
    .some(domain => host.endsWith('.' + domain));
  if (u.protocol !== 'https:' || u.username || u.password || u.port || !safe) {
    throw new YoutubeError('file_security', 'OneDrive 返回了不受信任的临时传输地址');
  }
  return u.href;
}
export function parseOneDriveArgs(argv) {
  if (!argv.length || (argv.length === 1 && ['--help', '-h'].includes(argv[0]))) return { command: 'help' };
  const [cmd, ...rest] = argv;
  const positionalCounts = { configure: 1, status: 0, list: 0, search: 1,
    info: 1, download: 1, upload: 2, mkdir: 1, trash: 1 };
  if (cmd === 'auth') {
    if (rest.length !== 1 || !['start', 'complete', 'status', 'logout'].includes(rest[0]))
      throw new YoutubeError('invalid_input', '授权命令为 auth start|complete|status|logout');
    return { command: 'auth', action: rest[0] };
  }
  if (!Object.hasOwn(positionalCounts, cmd)) throw new YoutubeError('invalid_input', '不支持的 OneDrive 命令');
  const count = positionalCounts[cmd];
  const parameters = [];
  let idx = 0;
  while (idx < rest.length && !rest[idx].startsWith('--')) { parameters.push(rest[idx++]); }
  if (cmd === 'list' && parameters.length > 1) throw new YoutubeError('invalid_input', 'list 只接受一个可选文件夹路径');
  if (cmd !== 'list' && parameters.length !== count) throw new YoutubeError('invalid_input', cmd + ' 的位置参数数量不正确');
  const allowed = { configure: ['--tenant'], list: ['--limit'], search: ['--limit'],
    info: [], download: ['--dir', '--overwrite'], upload: ['--name', '--overwrite'],
    mkdir: [], trash: ['--confirm'], status: [] }[cmd];
  const flags = Object.create(null);
  while (idx < rest.length) {
    const key = rest[idx++], value = rest[idx++];
    if (!allowed.includes(key) || !value || value.startsWith('--') || Object.hasOwn(flags, key)) {
      throw new YoutubeError('invalid_input', '无效的、重复或缺失的参数：' + key);
    }
    flags[key] = value;
  }
  if (cmd === 'configure') {
    if (!validClientId(parameters[0])) throw new YoutubeError('invalid_input', '需要真实 Microsoft Entra 应用 Client ID（UUID）');
    const tenant = flags['--tenant'] || 'common';
    if (!validTenant(tenant)) throw new YoutubeError('invalid_input', '--tenant 只支持 common/consumers/organizations 或租户 UUID');
    return { command: cmd, clientId: parameters[0], tenant };
  }
  if (flags['--overwrite'] && !['yes', 'no'].includes(flags['--overwrite']))
    throw new YoutubeError('invalid_input', '--overwrite 只能是 yes 或 no');
  if (flags['--confirm'] && flags['--confirm'] !== 'yes')
    throw new YoutubeError('invalid_input', '删除操作要求显式 --confirm yes');
  let limit = 200;
  if (flags['--limit']) {
    if (!/^[0-9]{1,4}$/u.test(flags['--limit']) || +flags['--limit'] < 1 || +flags['--limit'] > 1000)
      throw new YoutubeError('invalid_input', '--limit 应为 1～1000');
    limit = +flags['--limit'];
  }
  switch (cmd) {
    case 'list': return { command: cmd, remotePath: cloudPath(parameters[0]), limit };
    case 'search': searchEndpoint(parameters[0]); return { command: cmd, query: parameters[0], limit };
    case 'info': return { command: cmd, remotePath: cloudPath(parameters[0]) };
    case 'download': {
      const remotePath = cloudPath(parameters[0], { allowRoot: false });
      const dir = flags['--dir'] || path.join(os.homedir(), 'Downloads', 'OneDrive');
      if (!path.isAbsolute(dir) || /[\x00-\x1f]/u.test(dir)) throw new YoutubeError('invalid_input', '--dir 必须为绝对路径');
      return { command: cmd, remotePath, directory: dir, overwrite: flags['--overwrite'] === 'yes' };
    }
    case 'upload': {
      const localFile = parameters[0];
      if (!localFile || localFile.includes('\0')) throw new YoutubeError('invalid_input', '无效的本地文件路径');
      const destination = cloudPath(parameters[1]);
      const name = flags['--name'] || path.basename(localFile);
      cloudSegments(name, { allowRoot: false });
      if (name.includes('/')) throw new YoutubeError('invalid_input', '--name 只能是文件名');
      return { command: cmd, localFile, destination, name, overwrite: flags['--overwrite'] === 'yes' };
    }
    case 'mkdir': return { command: cmd, remotePath: cloudPath(parameters[0], { allowRoot: false }) };
    case 'trash': {
      if (flags['--confirm'] !== 'yes') throw new YoutubeError('invalid_input', '移入回收站前必须显式 --confirm yes');
      return { command: cmd, remotePath: cloudPath(parameters[0], { allowRoot: false }) };
    }
    default: return { command: cmd };
  }
}
