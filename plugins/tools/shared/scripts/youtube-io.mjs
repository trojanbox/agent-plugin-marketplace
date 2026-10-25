/** Bounded subprocesses and user-owned filesystem operations; no shell commands. */
import * as fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { YoutubeError, safeDiagnostic } from './youtube-core.mjs';

export async function runProcess(command, args, options = {}) {
  const { cwd, signal, env = process.env, timeoutMs = 120_000, maxOutput = 16 * 1024 * 1024 } = options;
  if (signal?.aborted) throw new YoutubeError('interrupted', '操作已中断，保留可恢复材料');
  return await new Promise((resolve, reject) => {
    let child;
    try { child = spawn(command, args, { cwd, env, shell: false, windowsHide: true,
      detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { reject(new YoutubeError('dependency_missing', '无法运行工具：' + (e.code || 'spawn_error'))); return; }
    let stdout = '', stderr = '', bytes = 0, reason = null, finished = false;
    const stop = status => {
      if (reason || finished) return;
      reason = status;
      if (child.pid) {
        try {
          if (process.platform === 'win32') {
            const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
            killer.on('error', () => child.kill());
          } else process.kill(-child.pid, 'SIGKILL');
        } catch { child.kill('SIGKILL'); }
      }
    };
    const timer = setTimeout(() => stop('timeout'), timeoutMs);
    const abort = () => stop('interrupted');
    signal?.addEventListener('abort', abort, { once: true });
    const cleanup = () => { finished = true; clearTimeout(timer); signal?.removeEventListener('abort', abort); };
    // StringDecoder inside setEncoding preserves Unicode split across OS pipe chunks.
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', text => { bytes += Buffer.byteLength(text); if (bytes > maxOutput) stop('output_limit'); else stdout += text; });
    child.stderr.on('data', text => { stderr = (stderr + text).slice(-65536); });
    child.on('error', e => { cleanup(); reject(new YoutubeError('dependency_missing', '无法运行工具：' + (e.code || 'spawn_error'))); });
    child.on('close', (code, termSignal) => {
      cleanup();
      if (reason) reject(new YoutubeError(reason, reason === 'timeout' ? '执行超时，未完成文件保留供验证和恢复' : reason === 'interrupted' ? '操作中断，未完成文件保留供恢复' : '工具输出超过安全限制'));
      else resolve({ code, signal: termSignal, stdout, stderr });
    });
  });
}

export async function lstatOrNull(file) {
  try { return await fs.lstat(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
export function isWithin(parent, target) {
  const rel = path.relative(path.resolve(parent), path.resolve(target));
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}
export function assertOwned(stat, kind = 'file') {
  if (process.platform !== 'win32' && typeof process.getuid === 'function' && stat.uid !== process.getuid()) {
    throw new YoutubeError('file_security', `${kind} 不属于当前用户，拒绝修改/执行`);
  }
}
export async function regularFile(file, { privateFile = false, allowEmpty = false } = {}) {
  const s = await fs.lstat(file);
  if (!s.isFile() || s.isSymbolicLink() || s.nlink > 1 || (!allowEmpty && s.size === 0)) {
    throw new YoutubeError('file_security', '文件必须是非空普通文件且不能是链接：' + path.basename(file));
  }
  assertOwned(s);
  if (privateFile && process.platform !== 'win32' && (s.mode & 0o077)) throw new YoutubeError('file_security', '私有文件权限过宽');
  return s;
}

let sidPromise;
async function windowsPrivateAcl(file, directory) {
  if (process.platform !== 'win32') return;
  sidPromise ||= runProcess('whoami.exe', ['/user', '/fo', 'csv', '/nh']).then(r => {
    const sid = r.stdout.match(/S-1-5-21-(?:\d+-){2,}\d+/u)?.[0];
    if (r.code !== 0 || !sid) throw new YoutubeError('file_security', '无法取得当前 Windows 用户 SID');
    return sid;
  });
  const sid = await sidPromise, inherit = directory ? '(OI)(CI)' : '';
  for (const args of [[file, '/inheritance:r'], [file, '/grant:r', `*${sid}:${inherit}F`, `*S-1-5-18:${inherit}F`]]) {
    const r = await runProcess('icacls.exe', args);
    if (r.code !== 0) throw new YoutubeError('file_security', '无法收紧当前用户工具目录的 Windows ACL');
  }
}

/** Reject symlinks in every existing component. Newly created directories are private. */
export async function safeDirectory(directory, { privateLeaf = false } = {}) {
  if (!path.isAbsolute(directory)) throw new YoutubeError('directory_error', '目录必须为绝对路径');
  const full = path.normalize(directory), root = path.parse(full).root;
  const parts = full.slice(root.length).split(path.sep).filter(Boolean);
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    let s = await lstatOrNull(current), created = false;
    if (!s) {
      try { await fs.mkdir(current, { mode: 0o700 }); created = true; } catch (e) { if (e.code !== 'EEXIST') throw new YoutubeError('directory_error', '无法创建下载/工具目录：' + e.code); }
      s = await fs.lstat(current);
    }
    if (!s.isDirectory() || s.isSymbolicLink()) throw new YoutubeError('file_security', '目录路径包含符号链接或非目录条目');
    if (created) await windowsPrivateAcl(current, true);
    if (i === parts.length - 1 && privateLeaf) {
      assertOwned(s, 'directory');
      if (process.platform !== 'win32' && (s.mode & 0o077)) throw new YoutubeError('file_security', '私有工具/恢复目录权限过宽，拒绝使用');
    }
  }
  return full;
}

export async function outputDirectory(directory, home = os.homedir()) {
  const email = path.join(home, '.agent-plugin-marketplace', 'email');
  if (isWithin(email, directory)) throw new YoutubeError('file_security', '不能将下载文件存入原邮件配置目录');
  const full = await safeDirectory(directory);
  const real = await fs.realpath(full), emailReal = await fs.realpath(email).catch(() => email);
  if (isWithin(emailReal, real)) throw new YoutubeError('file_security', '输出目录不能指向邮件配置');
  try { await fs.access(full, fs.constants.W_OK); } catch { throw new YoutubeError('directory_error', '目标目录不可写'); }
  return full;
}

export async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
export async function writePrivateJson(file, data) {
  const previous = await lstatOrNull(file);
  if (previous) await regularFile(file, { privateFile: true });
  const temp = path.join(path.dirname(file), '.json-' + randomUUID());
  try {
    await fs.writeFile(temp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    await windowsPrivateAcl(temp, false);
    await fs.rename(temp, file);
  } finally { await fs.rm(temp, { force: true }); }
}
export async function readPrivateJson(file) {
  const s = await regularFile(file, { privateFile: true });
  if (s.size > 1024 * 1024) throw new YoutubeError('resume_invalid', '状态文件超过允许大小');
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { throw new YoutubeError('resume_invalid', '状态文件不是合法 JSON'); }
}

/** A per-target local process lock; crashes may be recovered only on this same host. */
export async function acquireLock(file) {
  const token = randomUUID();
  const value = { pid: process.pid, host: os.hostname(), token };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handle = await fs.open(file, 'wx', 0o600);
      try { await handle.writeFile(JSON.stringify(value)); } finally { await handle.close(); }
      await windowsPrivateAcl(file, false);
      return async () => {
        const current = await readPrivateJson(file).catch(() => null);
        if (current?.token === token) await fs.unlink(file);
      };
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const old = await readPrivateJson(file);
      if (attempt || old.host !== os.hostname() || !Number.isInteger(old.pid) || old.pid <= 0) {
        throw new YoutubeError('locked', '该下载/安装任务已被另一个进程锁定');
      }
      let running = true;
      try { process.kill(old.pid, 0); } catch (err) { if (err.code === 'ESRCH') running = false; }
      if (running) throw new YoutubeError('locked', '该下载/安装任务仍在运行，禁止同时写入');
      const again = await readPrivateJson(file);
      if (again.token !== old.token) throw new YoutubeError('locked', '锁文件已由其他进程更新');
      await fs.unlink(file);
    }
  }
  throw new YoutubeError('locked', '无法取得文件锁');
}

export async function inventory(directory, exclude = new Set()) {
  // Every literal filename must be represented, including names such as __proto__.
  const files = Object.create(null);
  const entries = await fs.readdir(directory);
  if (entries.length > 4096) throw new YoutubeError('resume_invalid', '恢复目录文件数量异常');
  for (const name of entries.sort()) {
    if (exclude.has(name)) continue;
    const file = path.join(directory, name), stat = await regularFile(file, { allowEmpty: true });
    files[name] = { size: stat.size, sha256: await hashFile(file) };
  }
  return files;
}

export async function publishFile(source, destination, overwrite) {
  await regularFile(source);
  const old = await lstatOrNull(destination);
  if (old) {
    if (!overwrite) throw new YoutubeError('file_exists', '成品文件已存在；未授权覆盖，原文件保持不变', { existing_file: destination });
    await regularFile(destination, { allowEmpty: true });
  }
  try {
    if (overwrite) await fs.rename(source, destination);
    else {
      // Both paths are on the output filesystem; link is atomic no-clobber publication.
      await fs.link(source, destination);
      await fs.unlink(source);
    }
  } catch (e) {
    if (e.code === 'EEXIST') throw new YoutubeError('file_exists', '另一进程已写入目标文件，拒绝覆盖', { existing_file: destination });
    throw new YoutubeError('directory_error', '无法安全提交最终成品：' + safeDiagnostic(e.code));
  }
}
