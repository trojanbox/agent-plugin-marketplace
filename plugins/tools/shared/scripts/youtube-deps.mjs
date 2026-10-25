/** Verified upstream dependency bootstrap. Nothing is installed into the system PATH. */
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import { createHash, randomUUID } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { YoutubeError, safeDiagnostic } from './youtube-core.mjs';
import { runProcess, safeDirectory, regularFile, hashFile, lstatOrNull, writePrivateJson, readPrivateJson, acquireLock } from './youtube-io.mjs';

export const RELEASES = JSON.parse(await fs.readFile(new URL('./youtube-releases.json', import.meta.url), 'utf8'));
const EXTRACTOR = fileURLToPath(new URL('./youtube-extract-tar.py', import.meta.url));
const MAX_ARCHIVE = 350 * 1024 * 1024;
const MAX_BINARY = 512 * 1024 * 1024;
const REDIRECT_HOSTS = new Set(['github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com']);

export function dependencyRoot(home = os.homedir(), pathLib = path) {
  return pathLib.join(home, '.agent-plugin-marketplace', 'youtube');
}
export function platformKey(platform = process.platform, arch = process.arch) {
  if (platform === 'linux' && !process.report?.getReport()?.header?.glibcVersionRuntime) return `linux-musl-${arch}`;
  return `${platform}-${arch}`;
}
export function assetFor(tool, key = platformKey()) {
  const group = RELEASES.tools[tool];
  const asset = group?.assets[key];
  if (!asset) throw new YoutubeError('unsupported_platform', `${tool} 暂无该平台可验证的官方资产：${key}；不会安装来源不明的替代包`);
  if (!/^[a-f0-9]{64}$/u.test(asset.sha256) || !Number.isSafeInteger(asset.size) || asset.size > MAX_ARCHIVE) {
    throw new YoutubeError('dependency_integrity', '依赖资产清单无效');
  }
  return { ...asset, version: group.version, tool, key };
}
export function validateDownloadUrl(text) {
  let u;
  try { u = new URL(text); } catch { throw new YoutubeError('dependency_integrity', '无效依赖下载地址'); }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') || !REDIRECT_HOSTS.has(u.hostname)) {
    throw new YoutubeError('dependency_integrity', '拒绝非 GitHub 官方发布资产的依赖下载/跳转');
  }
  return u;
}
async function response(url, count = 0) {
  const checked = validateDownloadUrl(url);
  if (count > 5) throw new YoutubeError('dependency_integrity', '依赖下载跳转过多');
  return await new Promise((resolve, reject) => {
    const req = https.get(checked, { headers: { 'User-Agent': 'agent-plugin-marketplace-tools/2', Accept: 'application/octet-stream' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const next = res.headers.location; res.resume();
        if (!next) reject(new YoutubeError('dependency_install_failed', '发布资产跳转没有地址'));
        else response(new URL(next, checked).href, count + 1).then(resolve, reject);
      } else if (res.statusCode !== 200) {
        res.resume(); reject(new YoutubeError('dependency_install_failed', '依赖发布资产 HTTP ' + res.statusCode));
      } else resolve(res);
    });
    req.setTimeout(30_000, () => req.destroy(new Error('dependency download timeout')));
    req.on('error', reject);
  });
}

/** Stream into a private exclusive file. Pin both size and SHA-256 before extraction. */
export async function downloadVerified(asset, destination) {
  validateDownloadUrl(asset.url);
  const res = await response(asset.url);
  const out = await fs.open(destination, 'wx', 0o600);
  const hash = createHash('sha256'); let size = 0;
  const deadline = setTimeout(() => res.destroy(new Error('dependency download deadline exceeded')), 300_000);
  try {
    for await (const chunk of res) {
      size += chunk.length;
      if (size > asset.size || size > MAX_ARCHIVE) throw new YoutubeError('dependency_integrity', '依赖下载包超过固定发布资产大小');
      hash.update(chunk);
      let written = 0;
      while (written < chunk.length) {
        const result = await out.write(chunk, written, chunk.length - written);
        if (!result.bytesWritten) throw new YoutubeError('dependency_install_failed', '无法继续写入依赖下载文件');
        written += result.bytesWritten;
      }
    }
    if (size !== asset.size || hash.digest('hex') !== asset.sha256) throw new YoutubeError('dependency_integrity', '依赖发布包 SHA-256/大小校验失败，拒绝安装或执行');
  } catch (error) {
    res.destroy(); throw error;
  } finally { clearTimeout(deadline); await out.close(); }
}

/** Parse central directory; inflate ONLY exact pinned regular binary members. No ZIP extraction of paths. */
export async function extractZip(archive, destination, members) {
  const handle = await fs.open(archive, 'r');
  try {
    const size = (await handle.stat()).size;
    const tail = Buffer.alloc(Math.min(size, 65557));
    await handle.read(tail, 0, tail.length, size - tail.length);
    let eocd = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === 0x06054b50 && i + 22 + tail.readUInt16LE(i + 20) === tail.length) { eocd = i; break; }
    }
    if (eocd < 0 || tail.readUInt16LE(eocd + 4) || tail.readUInt16LE(eocd + 6)) throw new YoutubeError('dependency_integrity', '不支持的 ZIP 结构');
    const count = tail.readUInt16LE(eocd + 10), length = tail.readUInt32LE(eocd + 12), offset = tail.readUInt32LE(eocd + 16);
    if (count > 10000 || length > 4 * 1024 * 1024 || offset + length > size) throw new YoutubeError('dependency_integrity', 'ZIP 目录越界');
    const central = Buffer.alloc(length); await handle.read(central, 0, length, offset);
    const wanted = new Map(Object.entries(members).map(([name, member]) => [member, name]));
    const found = new Set(); let pos = 0;
    for (let index = 0; index < count; index++) {
      if (pos + 46 > length || central.readUInt32LE(pos) !== 0x02014b50) throw new YoutubeError('dependency_integrity', 'ZIP 中央目录无效');
      const flags = central.readUInt16LE(pos + 8), method = central.readUInt16LE(pos + 10);
      const compressed = central.readUInt32LE(pos + 20), uncompressed = central.readUInt32LE(pos + 24);
      const nl = central.readUInt16LE(pos + 28), xl = central.readUInt16LE(pos + 30), cl = central.readUInt16LE(pos + 32);
      const attrs = central.readUInt32LE(pos + 38), local = central.readUInt32LE(pos + 42);
      if (pos + 46 + nl + xl + cl > length) throw new YoutubeError('dependency_integrity', 'ZIP 成员名越界');
      const member = central.subarray(pos + 46, pos + 46 + nl).toString('utf8');
      pos += 46 + nl + xl + cl;
      if (!wanted.has(member)) continue;
      const name = wanted.get(member), unixType = (attrs >>> 16) & 0o170000;
      if (found.has(name) || path.basename(name) !== name || flags & 1 || ![0, 8].includes(method)
        || ![0, 0o100000].includes(unixType) || !uncompressed || uncompressed > MAX_BINARY || compressed > MAX_ARCHIVE) {
        throw new YoutubeError('dependency_integrity', 'ZIP 包含重复、加密、链接或异常可执行文件');
      }
      const header = Buffer.alloc(30); await handle.read(header, 0, 30, local);
      if (header.readUInt32LE(0) !== 0x04034b50 || header.readUInt16LE(8) !== method) throw new YoutubeError('dependency_integrity', 'ZIP 本地头无效');
      const nameLength = header.readUInt16LE(26), extraLength = header.readUInt16LE(28);
      const localName = Buffer.alloc(nameLength); await handle.read(localName, 0, nameLength, local + 30);
      if (localName.toString('utf8') !== member) throw new YoutubeError('dependency_integrity', 'ZIP 成员名不一致');
      const dataStart = local + 30 + nameLength + extraLength;
      if (dataStart + compressed > offset) throw new YoutubeError('dependency_integrity', 'ZIP 成员数据越界');
      const input = Buffer.alloc(compressed); const read = await handle.read(input, 0, compressed, dataStart);
      if (read.bytesRead !== compressed) throw new YoutubeError('dependency_integrity', 'ZIP 数据不完整');
      const binary = method === 0 ? input : inflateRawSync(input, { maxOutputLength: MAX_BINARY });
      if (binary.length !== uncompressed) throw new YoutubeError('dependency_integrity', 'ZIP 解压大小错误');
      await fs.writeFile(path.join(destination, name), binary, { mode: 0o700, flag: 'wx' });
      found.add(name);
    }
    if (found.size !== wanted.size) throw new YoutubeError('dependency_integrity', '发布包缺少固定的二进制成员');
  } finally { await handle.close(); }
}

function installPath(asset, home) {
  return path.join(dependencyRoot(home), 'bin', `${asset.tool}-${asset.version}-${asset.key}-${asset.sha256.slice(0, 12)}`);
}
async function managedFiles(asset, home) {
  const directory = installPath(asset, home);
  if (!await lstatOrNull(directory)) return null;
  // Every component must be non-symlink; do not silently execute corrupt cached files.
  await safeDirectory(directory, { privateLeaf: true });
  const receipt = await readPrivateJson(path.join(directory, 'receipt.json'));
  if (receipt.archiveSha256 !== asset.sha256 || receipt.version !== asset.version) throw new YoutubeError('dependency_integrity', '依赖安装回执不匹配发布清单');
  const paths = {};
  for (const name of Object.keys(asset.members)) {
    const binary = path.join(directory, name);
    await regularFile(binary, { privateFile: true });
    if (!receipt.files?.[name] || await hashFile(binary) !== receipt.files[name]) throw new YoutubeError('dependency_integrity', '已安装依赖校验失败：' + name);
    paths[name] = binary;
  }
  return paths;
}

export async function installDependency(tool, options = {}) {
  const { home = os.homedir(), key = platformKey(), env = process.env, download = downloadVerified } = options;
  if (env.YOUTUBE_AUTO_INSTALL === '0') throw new YoutubeError('dependency_missing', '宿主 YOUTUBE_AUTO_INSTALL=0 禁止自动安装，保持宿主设置');
  const asset = assetFor(tool, key);
  const base = await safeDirectory(dependencyRoot(home), { privateLeaf: true });
  const bins = await safeDirectory(path.join(base, 'bin'), { privateLeaf: true });
  const releaseLock = await acquireLock(path.join(base, tool + '.install.lock'));
  let temp;
  try {
    if (!options.force) {
      try { const existing = await managedFiles(asset, home); if (existing) return existing; } catch (e) { if (e.status !== 'dependency_integrity') throw e; }
    }
    temp = await safeDirectory(path.join(bins, '.install-' + randomUUID()), { privateLeaf: true });
    const archive = path.join(temp, 'download.asset');
    await download(asset, archive);
    // Verify again even when the download implementation was dependency-injected in a test.
    if ((await regularFile(archive)).size !== asset.size || await hashFile(archive) !== asset.sha256) {
      throw new YoutubeError('dependency_integrity', '安装前固定 SHA-256/大小验证失败');
    }
    const output = await safeDirectory(path.join(temp, 'payload'), { privateLeaf: true });
    if (asset.archive === 'raw') {
      await fs.copyFile(archive, path.join(output, Object.keys(asset.members)[0]), fs.constants.COPYFILE_EXCL);
    } else if (asset.archive === 'zip') await extractZip(archive, output, asset.members);
    else {
      let python;
      for (const candidate of ['python3', 'python']) {
        const test = await runProcess(candidate, ['-I', '-c', 'import sys,lzma,tarfile; assert sys.version_info >= (3,8)'], { timeoutMs: 10000 }).catch(() => null);
        if (test?.code === 0) { python = candidate; break; }
      }
      if (!python) throw new YoutubeError('dependency_missing', '安全解压 FFmpeg TAR/XZ 需要宿主 Python 3（标准库 lzma/tarfile）；当前不可用');
      const result = await runProcess(python, ['-I', EXTRACTOR, archive, output, JSON.stringify(asset.members)], { timeoutMs: 300_000 });
      if (result.code !== 0) throw new YoutubeError('dependency_integrity', '固定 FFmpeg 包无法安全解压：' + safeDiagnostic(result.stderr));
    }
    const hashes = {};
    for (const name of Object.keys(asset.members)) {
      const file = path.join(output, name);
      await fs.chmod(file, 0o700);
      await regularFile(file, { privateFile: true });
      hashes[name] = await hashFile(file);
    }
    await writePrivateJson(path.join(output, 'receipt.json'), { version: asset.version, archiveSha256: asset.sha256, files: hashes });
    const target = installPath(asset, home);
    if (await lstatOrNull(target)) {
      await safeDirectory(target, { privateLeaf: true });
      await fs.rename(target, target + '.replaced-' + randomUUID());
    }
    await fs.rename(output, target);
    return await managedFiles(asset, home);
  } catch (e) {
    if (e instanceof YoutubeError) throw e;
    throw new YoutubeError('dependency_install_failed', '依赖安装失败：' + safeDiagnostic(e.code || e.message));
  } finally { if (temp) await fs.rm(temp, { recursive: true, force: true }); await releaseLock(); }
}

async function probe(binary, kind, runner) {
  if (!binary) return null;
  try {
    const r = await runner(binary, [kind === 'ffmpeg' || kind === 'ffprobe' ? '-version' : '--version'], { timeoutMs: 15000, maxOutput: 256 * 1024 });
    if (r.code !== 0) return null;
    const line = r.stdout.split(/\r?\n/u)[0];
    if (kind === 'ytdlp' && /^\d{4}\.\d{2}\.\d{2}$/u.test(line) && line >= RELEASES.tools.ytdlp.version) return line;
    if (kind === 'deno' && /^deno 2\./u.test(line) && Number(line.split('.')[1]) >= 3) return line;
    if (['ffmpeg', 'ffprobe'].includes(kind) && new RegExp('^' + kind + ' version (?:[4-9]\\.|[1-9][0-9]\\.|N-)').test(line)) return line;
  } catch { /* Absence/version mismatch triggers only the bounded authorized installer. */ }
  return null;
}

/** doctor is read-only; repair and download may bootstrap only managed dependencies. */
export async function ensureDependencies(options = {}) {
  const { home = os.homedir(), env = process.env, checkOnly = false, force = false, runner = runProcess, key = platformKey() } = options;
  const exe = process.platform === 'win32' ? '.exe' : '';
  const resolve = async (kind, override, filename) => {
    if (override) {
      if (!path.isAbsolute(override)) throw new YoutubeError('dependency_version', `显式 ${kind} 路径必须是绝对路径`);
      const version = await probe(override, kind, runner);
      if (!version) throw new YoutubeError('dependency_version', `显式 ${kind} 路径不可执行或版本不适用`);
      return { path: override, version, source: 'explicit' };
    }
    const localVersion = !force && await probe(filename, kind, runner);
    if (localVersion) return { path: filename, version: localVersion, source: 'host' };
    const asset = assetFor(kind, key);
    let files;
    try { files = !force && await managedFiles(asset, home); }
    catch (e) { if (checkOnly || e.status !== 'dependency_integrity') throw e; }
    if (!files) {
      if (checkOnly) throw new YoutubeError('dependency_missing', `${kind} 依赖尚未准备好，Agent 应执行 repair`);
      files = await installDependency(kind, { home, env, key, force });
    }
    const binary = files[filename];
    const version = await probe(binary, kind, runner);
    if (!version) throw new YoutubeError('dependency_version', `已验证的 ${kind} 发布资产无法在此环境运行`);
    return { path: binary, version, source: 'managed' };
  };
  const ytdlp = await resolve('ytdlp', env.YOUTUBE_YTDLP_BIN, 'yt-dlp' + exe);
  let ffmpeg, ffprobe;
  const overrideFF = env.YOUTUBE_FFMPEG_BIN;
  const overrideProbe = env.YOUTUBE_FFPROBE_BIN || (overrideFF && path.join(path.dirname(overrideFF), 'ffprobe' + exe));
  if (overrideFF || overrideProbe) {
    if (!overrideFF || !overrideProbe || !path.isAbsolute(overrideFF) || !path.isAbsolute(overrideProbe)
      || path.dirname(overrideFF) !== path.dirname(overrideProbe)) throw new YoutubeError('dependency_version', '显式 ffmpeg/ffprobe 必须位于同一绝对目录');
    const a = await probe(overrideFF, 'ffmpeg', runner), b = await probe(overrideProbe, 'ffprobe', runner);
    if (!a || !b) throw new YoutubeError('dependency_version', '显式 FFmpeg/ffprobe 不可运行或版本过旧');
    ffmpeg = { path: overrideFF, version: a, source: 'explicit' }; ffprobe = { path: overrideProbe, version: b, source: 'explicit' };
  } else {
    const a = !force && await probe('ffmpeg', 'ffmpeg', runner), b = !force && await probe('ffprobe', 'ffprobe', runner);
    if (a && b) { ffmpeg = { path: 'ffmpeg', version: a, source: 'host' }; ffprobe = { path: 'ffprobe', version: b, source: 'host' }; }
    else {
      const asset = assetFor('ffmpeg', key);
      let files;
      try { files = !force && await managedFiles(asset, home); } catch (e) { if (checkOnly || e.status !== 'dependency_integrity') throw e; }
      if (!files) {
        if (checkOnly) throw new YoutubeError('dependency_missing', 'FFmpeg/ffprobe 尚未就绪，Agent 应执行 repair');
        files = await installDependency('ffmpeg', { home, env, key, force });
      }
      const av = await probe(files['ffmpeg' + exe], 'ffmpeg', runner), bv = await probe(files['ffprobe' + exe], 'ffprobe', runner);
      if (!av || !bv) throw new YoutubeError('dependency_version', '官方 FFmpeg 发布资产不能在当前系统运行');
      ffmpeg = { path: files['ffmpeg' + exe], version: av, source: 'managed' }; ffprobe = { path: files['ffprobe' + exe], version: bv, source: 'managed' };
    }
  }
  let js;
  if (env.YOUTUBE_DENO_BIN) js = { ...(await resolve('deno', env.YOUTUBE_DENO_BIN, 'deno' + exe)), type: 'deno' };
  else {
    const deno = await probe('deno' + exe, 'deno', runner);
    if (deno) js = { path: 'deno' + exe, version: deno, source: 'host', type: 'deno' };
    else if (Number(process.versions.node.split('.')[0]) >= 22) js = { path: process.execPath, version: process.version, source: 'host', type: 'node' };
    else js = { ...(await resolve('deno', null, 'deno' + exe)), type: 'deno' };
  }
  return { ytdlp, ffmpeg, ffprobe, js, ejs: ytdlp.source === 'managed' ? 'bundled_in_verified_yt_dlp' : 'host_package_requires_ejs', platform: key };
}
