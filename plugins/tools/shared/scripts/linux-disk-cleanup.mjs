#!/usr/bin/env node
/**
 * Conservative Linux user disk diagnostics + cache cleanup.
 * No shell/sudo, no arbitrary filesystem delete; exact preview fingerprint required.
 */
import * as fs from 'node:fs/promises';
import { constants as flags } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import readline from 'node:readline/promises';

const execFileAsync = promisify(execFile);

const SCOPES = {
  'user-cache': ['.cache'],
  'npm-cache': ['.npm', '_cacache'],
  'npm-logs': ['.npm', '_logs'],
};
const DEFAULT_DAYS = 30;
const MAX_AGE = 3650;
const MAX_SCAN_ENTRIES = 50_000;
const MAX_REPORT_ENTRIES = 20_000;
const MAX_SAMPLE = 15;
const PROJECT_MARKERS = ['.git', '.hg', '.svn', 'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod'];
const PROTECTED_SUBTREES = new Set(['.git', '.hg', '.svn', 'node_modules', 'src', 'projects', 'workspaces', 'repos']);
const PROTECTED_FILE = /(?:^|\/)(?:\.env(?:\.[^/]*)?|[^/]+\.(?:sqlite|sqlite3|db|pem|key))$/iu;
const DAY_MS = 86_400_000;

export const HELP = [
  'Linux 用户磁盘分析和缓存清理；只操作当前普通用户，不使用 sudo/root、不清理项目/数据库/系统目录。',
  '  doctor                                          只读诊断当前用户、目录及可用范围',
  '  report                                          只读显示文件系统容量和用户家目录空间分布（有扫描上限）',
  '  scan [--scope user-cache|npm-cache|npm-logs] [--older-than DAYS]',
  '                                                  只读生成候选列表、预计大小和指纹；默认30天',
  '  clean [--scope ...] [--older-than DAYS] --plan SHA256',
  '                                                  重新扫描、验证指纹后在本地TTY再次要求用户手输计划挑战；不可自动确认',
  '  npm-cache 使用 npm cache verify（会原生回收无用缓存），不支持 --older-than，不按年龄删除 _cacache。',
  '支持目标：~/.cache、~/.npm/_cacache、~/.npm/_logs；绝不删除目录、符号链接、硬链接或指定其他路径。',
  '默认所有操作只读；clean 必须是本地交互式终端，原 --confirm yes 已废弃且拒绝。',
  '提示：交互式 TTY 只能阻止无TTY自动执行；同UID恶意Agent可模拟终端输入，无法提供密码学人身证明。',
  '预计释放大小为文件逻辑字节数，实际磁盘回收受稀疏文件、硬链接、打开文件等影响。',
].join('\n');

export class DiskCleanupError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = 'DiskCleanupError';
    this.status = status;
    this.details = details;
  }
}
const fail = (status, message, details = {}) => { throw new DiskCleanupError(status, message, details); };
function check(test, message) { if (!test) fail('invalid_input', message); }

export function parseArgs(args) {
  if (!args.length || (args.length === 1 && ['help', '--help', '-h'].includes(args[0]))) {
    return { mode: 'help' };
  }
  const [mode, ...rest] = args;
  check(['doctor', 'report', 'scan', 'clean'].includes(mode), '未知命令，使用 --help 查看支持的操作');
  if (['doctor', 'report'].includes(mode)) {
    check(rest.length === 0, mode + ' 不接受额外参数');
    return { mode };
  }
  const request = { mode, scope: 'user-cache', olderDays: DEFAULT_DAYS };
  const allowed = mode === 'scan' ? ['--scope', '--older-than'] :
    ['--scope', '--older-than', '--plan'];
  const used = new Set();
  check(rest.length % 2 === 0, '参数必须是 --flag VALUE 配对');
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i], val = rest[i + 1];
    check(allowed.includes(flag) && !used.has(flag) && typeof val === 'string',
      '未知、重复或缺少的参数：' + flag);
    used.add(flag);
    if (flag === '--scope') {
      check(Object.hasOwn(SCOPES, val), '--scope 只能选择 user-cache/npm-cache/npm-logs');
      request.scope = val;
    }
    if (flag === '--older-than') {
      check(/^[1-9][0-9]{0,3}$/u.test(val) && Number(val) <= MAX_AGE,
        '--older-than 必须为 1..3650 的整数天');
      request.olderDays = Number(val);
    }
    if (flag === '--plan') {
      check(/^[a-f0-9]{64}$/u.test(val), '--plan 必须为本次 scan 返回的 64 位 SHA-256 指纹');
      request.plan = val;
    }
  }
  if (request.scope === 'npm-cache') {
    check(!used.has('--older-than'), 'npm _cacache 只能用 npm cache verify；不支持按文件年龄清理');
  }
  if (mode === 'clean') check(request.plan, 'clean 必须提供 scan 得到的 SHA256；确认将在用户本地终端进行');
  return request;
}

function uid(ctx) { return ctx.uid ?? process.getuid?.(); }
function homeDir(ctx) { return ctx.home ?? os.homedir(); }
function platformGate(ctx) {
  if ((ctx.platform ?? process.platform) !== 'linux') fail('unsupported_platform', '仅支持 Linux');
  if (!Number.isInteger(uid(ctx)) || uid(ctx) <= 0) fail('unsupported_user', '拒绝 root 和无法确认的 UID');
}
function checkedHome(ctx) {
  const home = homeDir(ctx);
  check(typeof home === 'string' && path.isAbsolute(home) && home !== '/' &&
    !home.split(path.sep).includes('..') && path.resolve(home) === home,
  '用户家目录必须为不含 .. 的绝对路径且不可为根目录');
  return home;
}
async function lstatOrNull(file) {
  try { return await fs.lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function safeDirectory(st, ctx, dev = undefined) {
  return st?.isDirectory() && !st.isSymbolicLink() && st.uid === uid(ctx) &&
    (st.mode & 0o022) === 0 && (dev === undefined || st.dev === dev);
}
async function scopeRoot(ctx, scope) {
  const home = checkedHome(ctx);
  const homeStat = await lstatOrNull(home);
  if (!safeDirectory(homeStat, ctx)) fail('unsafe_directory', '用户家目录必须为本人拥有且不可被其他用户写入的真实目录');
  const dev = homeStat.dev;
  let cursor = home;
  for (const piece of SCOPES[scope]) {
    cursor = path.join(cursor, piece);
    const st = await lstatOrNull(cursor);
    if (!st) return { missing: true, root: path.join(home, ...SCOPES[scope]), dev };
    if (!safeDirectory(st, ctx, dev)) {
      fail('unsafe_directory', '缓存目录存在符号链接、跨文件系统、错误的属主或其他用户可写',
        { relative: path.relative(home, cursor) });
    }
  }
  return { missing: false, root: cursor, dev };
}
function snapshotFile(st) {
  return {
    dev: st.dev, ino: st.ino, size: st.size, mtimeMs: st.mtimeMs,
    ctimeMs: st.ctimeMs, nlink: st.nlink,
  };
}
function sameFile(a, b) {
  const keys = ['dev', 'ino', 'size', 'mtimeMs', 'ctimeMs', 'nlink'];
  return keys.every(key => a[key] === b[key]);
}
function hash(obj) { return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex'); }
function eligible(st, ctx, dev, deadline) {
  return st.isFile() && !st.isSymbolicLink() && st.uid === uid(ctx) &&
    st.nlink === 1 && st.dev === dev && st.mtimeMs <= deadline;
}

/**
 * Traverse without following symlinks, without crossing mounts and without deleting directories.
 * Complete traversal is required for an actionable plan; over the limit is a hard failure.
 */
async function snapshot(ctx, request) {
  const base = await scopeRoot(ctx, request.scope);
  if (base.missing) return { missing: true, scope: request.scope, root: base.root, candidates: [], scanned: 0, skipped: 0 };
  const cutoff = (ctx.now ?? Date.now()) - request.olderDays * DAY_MS;
  const nativeNpm = request.scope === 'npm-cache';
  const stack = [base.root];
  const candidates = [];
  let scanned = 0, skipped = 0;
  while (stack.length) {
    const current = stack.pop();
    const currentStat = await lstatOrNull(current);
    if (!safeDirectory(currentStat, ctx, base.dev)) {
      fail('unsafe_directory', '扫描期间目标目录发生变化，拒绝继续生成清理计划');
    }
    // Repositories sometimes live inside ~/.cache. Never descend into a tree with a
    // recognizable project marker; this cannot classify every possible user-created file.
    if (current !== base.root) {
      let protectedTree = false;
      for (const marker of PROJECT_MARKERS) {
        if (await lstatOrNull(path.join(current, marker))) { protectedTree = true; break; }
      }
      if (protectedTree) {
        if (nativeNpm) fail('unsafe_directory', 'npm 缓存中发现项目结构，不允许原生维护该目录');
        skipped++; continue;
      }
    }
    // Stream directory entries: do not materialize a million-file directory in memory.
    for await (const entry of await fs.opendir(current)) {
      scanned++;
      if (scanned > (ctx.scanLimit ?? MAX_SCAN_ENTRIES)) {
        fail('scan_limit', '候选目录文件过多，无法生成完整、安全的清理快照',
          { limit: ctx.scanLimit ?? MAX_SCAN_ENTRIES });
      }
      const file = path.join(current, entry.name);
      const st = await lstatOrNull(file);
      if (!st) { skipped++; continue; }
      if (nativeNpm) {
        // npm cache verify can mutate any part of _cacache. Inspect the full tree
        // rather than treating individual cache index/chunk files as cleanup targets.
        if (st.isDirectory() && safeDirectory(st, ctx, base.dev) && !PROTECTED_SUBTREES.has(entry.name)) {
          stack.push(file);
        } else if (st.isFile() && st.uid === uid(ctx) && st.dev === base.dev &&
          st.nlink === 1 && (st.mode & 0o022) === 0 &&
          !PROJECT_MARKERS.includes(entry.name) && !PROTECTED_FILE.test(path.relative(base.root, file))) {
          candidates.push({ relative_path: path.relative(base.root, file), file,
            size_bytes: st.size, metadata: snapshotFile(st) });
        } else {
          fail('unsafe_directory', 'npm _cacache 中包含不安全或不属于 npm 缓存的内容，拒绝交给 npm 维护',
            { relative: path.relative(base.root, file) });
        }
      } else if (st.isDirectory() && safeDirectory(st, ctx, base.dev) && !PROTECTED_SUBTREES.has(entry.name)) {
        stack.push(file);
      } else if (eligible(st, ctx, base.dev, cutoff) && !PROJECT_MARKERS.includes(entry.name) &&
          !PROTECTED_FILE.test(path.relative(base.root, file))) {
        candidates.push({ relative_path: path.relative(base.root, file), file,
          size_bytes: st.size, metadata: snapshotFile(st) });
      } else {
        skipped++;
      }
    }
  }
  candidates.sort((a, b) => a.relative_path.localeCompare(b.relative_path, 'en'));
  return { missing: false, scope: request.scope, root: base.root, candidates, scanned, skipped, dev: base.dev };
}
function fingerprint(ctx, request, snap) {
  return hash({
    version: 2, home: checkedHome(ctx), uid: uid(ctx), root: snap.root,
    scope: request.scope, olderDays: request.olderDays, dev: snap.dev,
    candidates: snap.candidates.map(c => [c.relative_path, c.metadata]),
    skipped: snap.skipped, scanned: snap.scanned,
  });
}
function preview(ctx, request, snap) {
  if (snap.missing) {
    return { ok: true, status: 'missing_target', scope: request.scope,
      target_path: snap.root, eligible_count: 0, estimated_bytes: 0,
      message: '目标缓存目录不存在；未创建目录，也没有执行清理' };
  }
  if (request.scope === 'npm-cache') {
    return {
      ok: true, status: 'plan', scope: request.scope, target_path: snap.root,
      strategy: 'npm_cache_verify', native_command: 'npm cache verify',
      older_than_days: null, eligible_count: null, estimated_bytes: null,
      inspected_count: snap.candidates.length,
      inspected_bytes: snap.candidates.reduce((sum, c) => sum + c.size_bytes, 0),
      scanned_entries: snap.scanned, skipped_unsafe: snap.skipped,
      plan: fingerprint(ctx, request, snap),
      note: '只读预览：npm 将验证缓存索引与内容并回收不需要的数据，不支持按年龄选择文件；可能释放多少空间无法预先计算。需本地终端人工确认。',
    };
  }
  const ranked = [...snap.candidates].sort((a, b) =>
    b.size_bytes - a.size_bytes || a.relative_path.localeCompare(b.relative_path, 'en'));
  return {
    ok: true, status: 'plan', scope: request.scope, target_path: snap.root,
    older_than_days: request.olderDays, eligible_count: snap.candidates.length,
    estimated_bytes: snap.candidates.reduce((sum, c) => sum + c.size_bytes, 0),
    scanned_entries: snap.scanned, skipped_unsafe: snap.skipped,
    sample: ranked.slice(0, MAX_SAMPLE).map(c => ({
      relative_path: c.relative_path, size_bytes: c.size_bytes })),
    plan: fingerprint(ctx, request, snap),
    note: '该计划只是只读预览；清理必须使用同一 scope、older-than 和 plan，且在目标主机本地 TTY 手输挑战语句。预计字节数不是实际释放空间承诺。',
  };
}

async function validateParentPath(ctx, base, file) {
  const root = await scopeRoot(ctx, base.scope);
  if (root.missing || root.root !== base.root || root.dev !== base.dev) {
    fail('stale_plan', '缓存目录已改变，停止清理');
  }
  const relative = path.relative(base.root, path.dirname(file));
  let parent = base.root;
  if (relative && relative !== '.') {
    for (const name of relative.split(path.sep)) {
      if (name === '..' || name === '.' || !name) fail('stale_plan', '候选路径越界');
      parent = path.join(parent, name);
      const st = await lstatOrNull(parent);
      if (!safeDirectory(st, ctx, base.dev)) fail('stale_plan', '缓存子目录在预览后变化');
    }
  }
}
async function checkCandidate(ctx, base, candidate, deadline) {
  await validateParentPath(ctx, base, candidate.file);
  const st = await lstatOrNull(candidate.file);
  if (!st || !eligible(st, ctx, base.dev, deadline) ||
      !sameFile(snapshotFile(st), candidate.metadata)) {
    fail('stale_plan', '候选文件在预览后变化，拒绝清理', { relative: candidate.relative_path });
  }
  // O_NOFOLLOW + fstat closes a common symlink swap window. Paths are checked again
  // immediately before unlink; Node does not expose unlinkat(dirfd) so it is not atomic.
  let handle;
  try {
    handle = await fs.open(candidate.file, flags.O_RDONLY | flags.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!eligible(opened, ctx, base.dev, deadline) ||
        !sameFile(snapshotFile(opened), candidate.metadata)) {
      fail('stale_plan', '候选文件在打开时变化，拒绝清理');
    }
  } catch (error) {
    if (error instanceof DiskCleanupError) throw error;
    fail('stale_plan', '无法重新安全打开候选文件，停止清理', { relative: candidate.relative_path });
  } finally {
    if (handle) await handle.close();
  }
}
/**
 * This blocks unattended agent tool calls. It is not a cryptographic human
 * identity proof: a process controlling the same user's pseudo-terminal can
 * simulate a person. Strong identity-bound approvals need a trusted host UI.
 *
 * ctx.approve exists only for isolated unit tests; normal CLI entry never sets it.
 */
async function localApproval(ctx, request, summary) {
  const challenge = 'DELETE ' + request.scope + ' ' + request.plan.slice(0, 12);
  let response;
  if (ctx.approve) {
    response = await ctx.approve({ challenge, summary, scope: request.scope, plan: request.plan });
  } else {
    if (!process.stdin.isTTY || !process.stderr.isTTY) {
      fail('approval_required', '没有本地交互式终端，拒绝自动删除。请让用户亲自在目标主机终端操作；Chat/Agent 的 yes 参数无效');
    }
    try {
      const tty = await fs.open('/dev/tty', flags.O_RDWR);
      await tty.close();
    } catch {
      fail('approval_required', '无法打开控制终端 /dev/tty，拒绝任何无人值守清理');
    }
    const details = request.scope === 'npm-cache'
      ? 'npm cache verify 可能回收无用缓存，但无法预估真实释放空间。'
      : '候选 ' + summary.eligible_count + ' 个普通文件，预计逻辑大小 ' + summary.estimated_bytes + ' 字节。';
    process.stderr.write('\n[需要人工确认] 根目录：' + summary.target_path +
      '\n范围：' + request.scope + '；' + details +
      '\n此操作可能不可逆；请自行核对上次扫描的完整计划，禁止 Agent 代输入。\n');
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr, terminal: true });
    try {
      response = await rl.question('仅本地用户手动输入以下原样短语才执行：' + challenge + '\n> ',
        { signal: AbortSignal.timeout(120_000) });
    } catch {
      fail('approval_denied', '用户取消、超时或关闭交互式终端，未执行清理');
    } finally {
      rl.close();
    }
  }
  if (response !== challenge) fail('approval_denied', '人工确认短语与当前清理计划不匹配，未执行');
}
async function npmNativeVerify(ctx, request, snap) {
  // npm's _cacache is an opaque content-addressed store. Never unlink chunks
  // by age; allow npm to verify and garbage-collect its own cache metadata.
  const cacheHome = path.dirname(snap.root);
  const argv = ['cache', 'verify', '--cache', cacheHome, '--offline', '--ignore-scripts'];
  try {
    const result = await (ctx.npmRunner ?? execFileAsync)('npm', argv, {
      cwd: checkedHome(ctx), timeout: 120_000, maxBuffer: 256 * 1024, encoding: 'utf8',
    });
    if ((result.code ?? 0) !== 0) throw new Error('npm cache verify exited ' + result.code);
    return {
      ok: true, status: 'maintenance_completed', scope: request.scope,
      strategy: 'npm_cache_verify', command: 'npm cache verify', cache_root: cacheHome,
      deleted_count: null, estimated_bytes: null, native_output: String(result.stdout || '').slice(0, 4000),
      note: 'npm 已执行自己的校验与垃圾收集。不能预先确定删掉哪些缓存块或实际释放空间；请重新查看磁盘报告。',
    };
  } catch (error) {
    fail('maintenance_failed', 'npm cache verify 执行失败，未由本工具直接删除任何 _cacache 内容',
      { reason: String(error.stderr || error.message || '').slice(0, 400) });
  }
}
async function clean(ctx, request) {
  const snap = await snapshot(ctx, request);
  if (snap.missing || fingerprint(ctx, request, snap) !== request.plan) {
    fail('stale_plan', '当前缓存清单与预览指纹不一致，请重新 scan 并确认');
  }
  if (!snap.candidates.length) fail('no_candidates', '当前没有需要处理的缓存文件');
  if (request.scope !== 'npm-cache') {
    const deadline = (ctx.now ?? Date.now()) - request.olderDays * DAY_MS;
    // Validate every candidate before asking a person to approve actual deletion.
    for (const candidate of snap.candidates) await checkCandidate(ctx, snap, candidate, deadline);
  }
  await localApproval(ctx, request, preview(ctx, request, snap));
  // A user may take time to type. Never mutate the old snapshot if it changed.
  const confirmed = await snapshot(ctx, request);
  if (confirmed.missing || fingerprint(ctx, request, confirmed) !== request.plan) {
    fail('stale_plan', '等待人工确认期间文件发生变化，请重新预览与确认');
  }
  if (request.scope === 'npm-cache') return npmNativeVerify(ctx, request, confirmed);
  const deadline = (ctx.now ?? Date.now()) - request.olderDays * DAY_MS;
  for (const candidate of confirmed.candidates) await checkCandidate(ctx, confirmed, candidate, deadline);
  let deleted = 0, bytes = 0;
  for (const candidate of confirmed.candidates) {
    try {
      await checkCandidate(ctx, confirmed, candidate, deadline);
      await fs.unlink(candidate.file);
      deleted++;
      bytes += candidate.size_bytes;
    } catch (error) {
      fail('partial_change', '部分缓存文件可能已经删除，后续删除已停止',
        { deleted_count: deleted, estimated_bytes: bytes,
          remaining_count: confirmed.candidates.length - deleted,
          failed_candidate: candidate.relative_path, reason: error.message });
    }
  }
  return { ok: true, status: 'cleaned', scope: request.scope,
    older_than_days: request.olderDays, deleted_count: deleted, estimated_bytes: bytes,
    note: '本地交互式确认完成，仅删除旧缓存普通文件；未删除目录。逻辑字节不是实际释放空间，请再运行 report。' };
}

async function report(ctx) {
  const home = checkedHome(ctx);
  const st = await lstatOrNull(home);
  if (!safeDirectory(st, ctx)) fail('unsafe_directory', '当前用户家目录不安全，不能扫描');
  const stats = await fs.statfs(home);
  const total = Number(stats.blocks) * Number(stats.bsize);
  const free = Number(stats.bavail) * Number(stats.bsize);
  const entries = [];
  const items = [];
  let totalSeen = 0, skipped = 0, truncated = false;
  // Bound top-level listing too; even a home directory can have millions of entries.
  for await (const entry of await fs.opendir(home)) {
    if (items.length >= 256) { truncated = true; break; }
    items.push(entry.name);
  }
  items.sort();
  const maxEntries = ctx.reportLimit ?? MAX_REPORT_ENTRIES;
  // Count approximate logical bytes, without following links or crossing filesystems.
  for (const name of items) {
    if (totalSeen >= maxEntries) { truncated = true; break; }
    const first = path.join(home, name);
    const stack = [first];
    let count = 0, bytes = 0;
    while (stack.length) {
      if (totalSeen >= maxEntries) { truncated = true; break; }
      const file = stack.pop();
      totalSeen++;
      let s;
      try { s = await lstatOrNull(file); }
      catch { skipped++; continue; }
      if (!s || s.isSymbolicLink() || s.dev !== st.dev) { skipped++; continue; }
      if (s.isDirectory()) {
        try {
          for await (const child of await fs.opendir(file)) {
            if (totalSeen + stack.length >= maxEntries) { truncated = true; break; }
            stack.push(path.join(file, child.name));
          }
        } catch { skipped++; }
      } else if (s.isFile()) {
        bytes += s.size;
        count++;
      } else skipped++;
    }
    entries.push({ name, size_bytes: bytes, files: count });
    if (truncated) break;
  }
  entries.sort((a, b) => b.size_bytes - a.size_bytes || a.name.localeCompare(b.name, 'en'));
  return { ok: true, status: 'report', home,
    filesystem: { total_bytes: total, free_bytes: free, used_bytes: total - free },
    scanned_entries: totalSeen, skipped_entries: skipped, truncated,
    entries: entries.slice(0, 25),
    note: truncated ? '家目录文件过多，仅给出已扫描部分的大小下限；不可将本报告作为完整目录大小'
      : '逻辑文件大小与文件系统块占用不同；报告仅只读检查，不代表可以直接删除这些目录。',
  };
}
export async function run(request, ctx = {}) {
  if (request.mode === 'help') return { ok: true, status: 'help', help: HELP };
  platformGate(ctx);
  checkedHome(ctx);
  if (request.mode === 'doctor') {
    const home = checkedHome(ctx);
    const st = await lstatOrNull(home);
    return { ok: true, status: 'diagnostic', scope: 'current_user', uid: uid(ctx),
      home, secure_home: safeDirectory(st, ctx),
      supported_targets: Object.keys(SCOPES),
      warning: '当前仅支持当前用户缓存与 npm 日志，诊断不删除文件；不使用 sudo。' };
  }
  if (request.mode === 'report') return report(ctx);
  if (request.mode === 'scan' || request.mode === 'clean') {
    check(Object.hasOwn(SCOPES, request.scope), '只接受固定的缓存 scope');
    check(Number.isInteger(request.olderDays) && request.olderDays >= 1 && request.olderDays <= MAX_AGE,
      '清理文件年龄必须为 1..3650 天');
    if (request.mode === 'scan') return preview(ctx, request, await snapshot(ctx, request));
    check(request.confirm === undefined && /^[a-f0-9]{64}$/u.test(request.plan || ''),
      'clean 只允许已扫描的 SHA256 计划，拒绝 --confirm 等机器确认参数');
    check(request.scope !== 'npm-cache' || request.olderDays === DEFAULT_DAYS,
      'npm cache verify 不支持按文件年龄清理');
    return clean(ctx, request);
  }
  fail('invalid_input', '不支持的命令');
}
export function publicError(error) {
  if (error instanceof DiskCleanupError) return { ok: false, status: error.status, message: error.message, ...error.details };
  return { ok: false, status: 'local_error', message: String(error?.message || error).slice(0, 300) };
}
export async function main(argv = process.argv.slice(2)) {
  try {
    const result = await run(parseArgs(argv));
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stdout.write(JSON.stringify(publicError(error), null, 2) + '\n');
    process.exitCode = 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
