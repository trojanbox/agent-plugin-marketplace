/**
 * Install a verified, official Himalaya v2.2.1 binary into the current user's
 * private Email Plugin directory. No package managers, shell scripts or sudo.
 * Digests are taken from GitHub release v2.2.1's immutable asset metadata.
 * Only invoked for missing/incompatible unmanaged dependencies.
 */
import * as fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';
import { createHash, randomUUID } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const RELEASE = 'v2.2.1';
const RELEASE_BASE = 'https://github.com/pimalaya/himalaya/releases/download/' + RELEASE + '/';
const LIMIT_DOWNLOAD = 25 * 1024 * 1024;
const LIMIT_UNPACK = 96 * 1024 * 1024;

// Verified against the official pimalaya/himalaya GitHub release asset digests.
const ASSETS = Object.freeze({
  'linux-x64': ['himalaya.x86_64-linux.tgz', '5c5ba2724c162f82d0a0c71b6c03224ed44f8bef7b14ace5da0635d3af2665a0'],
  'linux-arm64': ['himalaya.aarch64-linux.tgz', '1dc21c3dd6d948929e22e5cae49b9d0b3b30ff88fafd4493fd4460c6252e9d90'],
  'linux-ia32': ['himalaya.i686-linux.tgz', 'ef9fdf4e41b66a10de5093a235ea8b91110ab15e51f107326efcbafbe3848510'],
  'linux-arm': ['himalaya.armv7l-linux.tgz', 'fa3fc7da638dba3fb0844e9b445c0d0b2d08fe8448e535c7fef0ef11be1e73d6'],
  'darwin-x64': ['himalaya.x86_64-darwin.tgz', '24e226bc6bccfeadc89608953ffc0fcb46623d1d4cd4689734cbace243cc8d2e'],
  'darwin-arm64': ['himalaya.aarch64-darwin.tgz', 'a5d97a1f7bbca45e58bddde3f9f17325f614c9cd6d5f17fabf38ddcb030869ab'],
  'win32-x64': ['himalaya.x86_64-windows.tgz', 'abea8ecbca5fbd566860941bbab91e40f1dde57e737091a451208b8c61b99523'],
});

export class InstallError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InstallError';
  }
}

export function assetFor(platform = process.platform, arch = process.arch) {
  const key = platform + '-' + arch;
  const asset = ASSETS[key];
  if (!asset) throw new InstallError('Himalaya v2.2.1 不支持当前系统/CPU 架构：' + key);
  return { name: asset[0], sha256: asset[1], url: RELEASE_BASE + asset[0] };
}

function assertOfficialUrl(text) {
  let url;
  try { url = new URL(text); }
  catch { throw new InstallError('Himalaya 下载地址无效'); }
  const host = url.hostname.toLowerCase();
  const allowed = host === 'github.com' || host === 'release-assets.githubusercontent.com'
    || host === 'objects.githubusercontent.com';
  if (url.protocol !== 'https:' || !allowed || url.username || url.password) {
    throw new InstallError('拒绝不属于 GitHub 官方发布资产的下载跳转');
  }
  return url;
}

export async function downloadOfficialAsset(url, redirectCount = 0) {
  if (redirectCount > 6) throw new InstallError('Himalaya 下载跳转次数过多');
  const verified = assertOfficialUrl(url);
  return await new Promise((resolve, reject) => {
    const req = https.get(verified, { headers: { 'User-Agent': 'agent-plugin-marketplace-email/1' } }, res => {
      const status = res.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        const next = res.headers.location;
        res.resume();
        if (!next) { reject(new InstallError('GitHub 下载跳转缺少地址')); return; }
        const dest = new URL(next, verified).toString();
        resolve(downloadOfficialAsset(dest, redirectCount + 1));
        return;
      }
      if (status !== 200) {
        res.resume();
        reject(new InstallError('GitHub 下载失败：HTTP ' + status));
        return;
      }
      let length = 0;
      const chunks = [];
      res.on('data', chunk => {
        length += chunk.length;
        if (length > LIMIT_DOWNLOAD) {
          res.destroy(new InstallError('Himalaya 下载包超过安全大小上限'));
        } else chunks.push(chunk);
      });
      res.on('error', reject);
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.setTimeout(30_000, () => req.destroy(new InstallError('下载 Himalaya 超时')));
    req.on('error', reject);
  });
}

export function verifyReleaseDigest(archive, sha256) {
  if (!Buffer.isBuffer(archive) || !/^[a-f0-9]{64}$/u.test(sha256)) {
    throw new InstallError('Himalaya 发布包校验参数错误');
  }
  const found = createHash('sha256').update(archive).digest('hex');
  if (found !== sha256) throw new InstallError('Himalaya 下载文件 SHA-256 不匹配，拒绝安装');
}

function tarOctal(data) {
  const value = data.toString('ascii').replace(/\0.*$/us, '').trim();
  if (!/^[0-7]+$/u.test(value)) throw new InstallError('Himalaya 安装包包含非法 TAR 条目');
  const size = parseInt(value, 8);
  if (!Number.isSafeInteger(size) || size < 0) throw new InstallError('TAR 文件大小无效');
  return size;
}

export function extractBinaryFromTgz(archive, platform = process.platform) {
  let raw;
  try {
    raw = gunzipSync(archive, { maxOutputLength: LIMIT_UNPACK });
  } catch {
    throw new InstallError('Himalaya 下载包无法解压');
  }
  const wanted = platform === 'win32' ? 'himalaya.exe' : 'himalaya';
  for (let pos = 0; pos + 512 <= raw.length;) {
    const header = raw.subarray(pos, pos + 512);
    if (header.every(byte => byte === 0)) break;
    const filename = header.subarray(0, 100).toString('utf8').split('\0', 1)[0];
    const size = tarOctal(header.subarray(124, 136));
    const kind = header[156]; // '0' or NUL => ordinary file
    const start = pos + 512, end = start + size;
    if (end > raw.length) throw new InstallError('Himalaya 安装包 TAR 文件不完整');
    if ((filename === wanted || filename === './' + wanted) && (kind === 0 || kind === 48)) {
      if (size === 0 || size > LIMIT_UNPACK) throw new InstallError('Himalaya 二进制内容无效');
      return Buffer.from(raw.subarray(start, end));
    }
    pos = start + Math.ceil(size / 512) * 512;
  }
  throw new InstallError('发布包中找不到指定系统的 Himalaya 二进制');
}

async function ensureOwnedPrivateDir(dirname, isWindows) {
  await fs.mkdir(dirname, { recursive: false, mode: 0o700 }).catch(e => { if (e.code !== 'EEXIST') throw e; });
  const st = await fs.lstat(dirname);
  if (!st.isDirectory() || st.isSymbolicLink()) throw new InstallError('依赖安装目录必须为普通目录');
  if (!isWindows) {
    if (typeof process.getuid === 'function' && st.uid !== process.getuid()) throw new InstallError('依赖安装目录不属于当前用户');
    await fs.chmod(dirname, 0o700);
  }
}

/**
 * Caller must have verified the parent config directory is private.
 * Does not overwrite a user PATH executable or any file other than its own
 * ~/.agent-plugin-marketplace/email/bin/himalaya[.exe].
 */
export async function installPinnedHimalaya(privateConfigDir, opts = {}) {
  const platform = opts.platform ?? process.platform, arch = opts.arch ?? process.arch;
  const asset = assetFor(platform, arch);
  const isWindows = platform === 'win32';
  const binDir = path.join(privateConfigDir, 'bin');
  await ensureOwnedPrivateDir(binDir, isWindows);
  // Windows ACL must be private BEFORE downloading or writing the executable.
  if (isWindows && opts.secureWindowsAcl) opts.secureWindowsAcl(binDir, true);
  const dest = path.join(binDir, isWindows ? 'himalaya.exe' : 'himalaya');
  let existing = null;
  try { existing = await fs.lstat(dest); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existing && (!existing.isFile() || existing.isSymbolicLink())) {
    throw new InstallError('依赖安装位置存在非普通文件或符号链接，拒绝覆盖');
  }

  const archive = await (opts.download || downloadOfficialAsset)(asset.url);
  verifyReleaseDigest(archive, asset.sha256);
  const binary = extractBinaryFromTgz(archive, platform);
  const pending = path.join(binDir, '.himalaya-' + randomUUID() + '.tmp');
  try {
    await fs.writeFile(pending, binary, { mode: 0o700, flag: 'wx' });
    if (isWindows) {
      if (opts.secureWindowsAcl) opts.secureWindowsAcl(pending, false);
    } else await fs.chmod(pending, 0o700);
    await fs.rename(pending, dest);
    if (isWindows && opts.secureWindowsAcl) opts.secureWindowsAcl(dest, false);
  } catch (error) {
    // Windows rename may refuse overwriting a file in use; never unlink a
    // possibly user-controlled binary to force replacement.
    throw new InstallError('无法写入私有 Himalaya 安装目录：' + (error.code || '未知文件错误'));
  } finally {
    await fs.rm(pending, { force: true });
  }
  return dest;
}
