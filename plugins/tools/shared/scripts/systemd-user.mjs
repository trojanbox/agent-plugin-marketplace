#!/usr/bin/env node
/** User-level systemd service management; never invokes sudo or systemctl without --user. */
import * as fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const MARKER = '# Managed by agent-plugin-marketplace:tools/linux-systemd-user';
const PROPERTIES = 'LoadState,ActiveState,SubState,UnitFileState,MainPID,FragmentPath,Result';
const ACTIONS = new Set(['start', 'stop', 'restart', 'enable', 'disable']);
const RESTARTS = new Set(['no', 'on-failure', 'always']);
export const HELP = [
  'Linux systemd --user：仅管理当前普通用户的 service，绝不执行 sudo / systemctl system',
  '  doctor                                      检查用户管理器与 linger（只读）',
  '  list                                        列出 systemd 用户级 service unit files',
  '  status NAME                                 查看单个用户 service 的状态',
  '  logs NAME [--lines 100]                     查看当前用户 service 的日志（上限 500 行）',
  '  create NAME --exec ABS [--arg VALUE ...] [--cwd ABS] [--env-file ABS]',
  '              [--description TEXT] [--restart no|on-failure|always]',
  '  update NAME --exec ABS [...相同选项...] --confirm yes  仅更新本工具创建的 service',
  '  start|stop|restart NAME                     控制用户 service',
  '  enable|disable NAME [--now]                 启用/禁用登录后自动启动；--now 同时启停',
  '  remove NAME --confirm yes                   仅移除本工具创建且已停止、禁用的 service',
  '  linger status                               查询是否支持无需登录的开机自启',
  '  linger enable --confirm yes                 尝试为当前用户启用 linger（不使用 sudo）',
  '说明：enable 只设置 default.target；无登录开机自启必须有 linger=yes，授权策略可能需要管理员。',
].join('\n');

export class SystemdUserError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = 'SystemdUserError';
    this.status = status;
    this.details = details;
  }
}
function fail(status, message, details) { throw new SystemdUserError(status, message, details); }
function ensure(condition, message) { if (!condition) fail('invalid_input', message); }
function cleanLine(value, label) {
  ensure(typeof value === 'string' && value.length <= 4096 && !/[\x00-\x1f\x7f]/u.test(value),
    label + ' 含控制字符或长度不合法');
  return value;
}
export function unitName(input) {
  ensure(typeof input === 'string' && /^[a-z][a-z0-9_-]{0,63}(?:\.service)?$/iu.test(input),
    'NAME 只接受字母开头的字母、数字、下划线、连字符（可带 .service）；禁止路径、模板或通配符');
  return input.endsWith('.service') ? input : input + '.service';
}
export function parseArgs(argv) {
  if (argv.length === 0 || (argv.length === 1 && ['help', '--help', '-h'].includes(argv[0]))) {
    return { mode: 'help' };
  }
  const [mode, name, ...rest] = argv;
  if (['doctor', 'list'].includes(mode)) {
    ensure(argv.length === 1, mode + ' 不接受附加参数');
    return { mode };
  }
  if (mode === 'linger') {
    ensure(['status', 'enable'].includes(name), 'linger 仅支持 status / enable');
    if (name === 'status') ensure(rest.length === 0, 'linger status 不接受参数');
    if (name === 'enable') ensure(rest.length === 2 && rest[0] === '--confirm' && rest[1] === 'yes',
      'linger enable 必须明确指定 --confirm yes');
    return { mode: 'linger', action: name };
  }
  ensure(['status', 'logs', 'create', 'update', 'remove', ...ACTIONS].includes(mode),
    '未知命令；使用 --help 查看支持的操作');
  const unit = unitName(name);
  if (mode === 'status') {
    ensure(rest.length === 0, 'status 不接受附加参数');
    return { mode, unit };
  }
  if (mode === 'logs') {
    let lines = 100;
    if (rest.length !== 0) {
      ensure(rest.length === 2 && rest[0] === '--lines' && /^[0-9]{1,3}$/u.test(rest[1]),
        'logs 仅支持 --lines 1..500');
      lines = Number(rest[1]);
      ensure(lines >= 1 && lines <= 500, '--lines 范围必须是 1..500');
    }
    return { mode, unit, lines };
  }
  if (mode === 'remove') {
    ensure(rest.length === 2 && rest[0] === '--confirm' && rest[1] === 'yes',
      'remove 必须明确指定 --confirm yes');
    return { mode, unit };
  }
  if (ACTIONS.has(mode)) {
    const now = rest.length === 1 && rest[0] === '--now';
    ensure(rest.length === 0 || (now && ['enable', 'disable'].includes(mode)),
      '该命令无附加参数，只有 enable/disable 支持 --now');
    return { mode, unit, now };
  }
  const values = { mode, unit, args: [], restart: 'on-failure' };
  const allowed = new Set(['--exec', '--arg', '--cwd', '--env-file', '--description', '--restart', '--confirm']);
  const seen = new Set();
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i], value = rest[i + 1];
    ensure(allowed.has(flag) && value !== undefined, '未知或缺少值的 create/update 参数');
    if (flag !== '--arg') {
      ensure(!seen.has(flag), '重复参数：' + flag);
      seen.add(flag);
    }
    if (flag === '--arg') {
      ensure(value !== ';', '独立分号在 systemd ExecStart 中具有命令分隔语义，拒绝此参数');
      values.args.push(cleanLine(value, '--arg'));
      ensure(values.args.length <= 64, '最多允许 64 个 --arg');
    } else if (flag === '--exec') values.bin = cleanLine(value, '--exec');
    else if (flag === '--cwd') values.cwd = cleanLine(value, '--cwd');
    else if (flag === '--env-file') values.envFile = cleanLine(value, '--env-file');
    else if (flag === '--description') values.description = cleanLine(value, '--description');
    else if (flag === '--restart') values.restart = value;
    else if (flag === '--confirm') values.confirm = value;
  }
  ensure(values.bin && path.isAbsolute(values.bin), '--exec 必须是绝对路径');
  ensure(!values.cwd || path.isAbsolute(values.cwd), '--cwd 必须是绝对路径');
  ensure(!values.envFile || path.isAbsolute(values.envFile), '--env-file 必须是绝对路径');
  for (const location of [values.bin, values.cwd, values.envFile].filter(Boolean)) {
    ensure(!location.split(path.sep).includes('..'), '路径不能包含 .. 组件');
  }
  ensure(RESTARTS.has(values.restart), '--restart 仅支持 no/on-failure/always');
  ensure(!values.description || values.description.length <= 200, '--description 长度不能超过 200');
  if (mode === 'update') ensure(values.confirm === 'yes', 'update 必须明确指定 --confirm yes');
  else ensure(values.confirm === undefined, 'create 不支持 --confirm');
  return values;
}
function escapeToken(value) {
  cleanLine(value, 'systemd 参数');
  // ExecStart expands $ENV and %specifiers: double both to preserve literal argv.
  return '"' + value.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"')
    .replace(/%/gu, '%%').replace(/\$/gu, () => '$$') + '"';
}
function escapePath(value) {
  // WorkingDirectory/EnvironmentFile do specifier expansion (%), but do not expand $ENV.
  return '"' + cleanLine(value, 'systemd 路径').replace(/\\/gu, '\\\\')
    .replace(/"/gu, '\\"').replace(/%/gu, '%%') + '"';
}
function escapeValue(value) {
  return cleanLine(value, 'systemd 字段').replace(/\\/gu, '\\\\').replace(/%/gu, '%%');
}
export function serviceContents(request) {
  ensure(['create', 'update'].includes(request.mode), '只允许生成 create/update 单元文件');
  const name = request.unit.slice(0, -'.service'.length);
  const lines = [
    MARKER,
    '[Unit]',
    'Description=' + escapeValue(request.description || name),
    '',
    '[Service]',
    'Type=simple',
    'ExecStart=' + [request.bin, ...request.args].map(escapeToken).join(' '),
  ];
  if (request.cwd) lines.push('WorkingDirectory=' + escapePath(request.cwd));
  if (request.envFile) lines.push('EnvironmentFile=' + escapePath(request.envFile));
  lines.push('Restart=' + request.restart, 'RestartSec=5s', '',
    '[Install]', 'WantedBy=default.target', '');
  return lines.join('\n');
}

function currentUid(ctx) { return ctx.uid ?? process.getuid?.(); }
function currentHome(ctx) { return ctx.home ?? os.userInfo().homedir; }
function checkPlatform(ctx) {
  if ((ctx.platform ?? process.platform) !== 'linux') fail('unsupported_platform', '仅支持 Linux systemd');
  if (!Number.isInteger(currentUid(ctx)) || currentUid(ctx) === 0) {
    fail('unsupported_user', '请以目标普通用户身份运行，拒绝 root / 无法识别的用户');
  }
}
function unitPath(ctx, unit) {
  const home = currentHome(ctx);
  ensure(path.isAbsolute(home), '用户家目录必须是绝对路径');
  return path.join(home, '.config', 'systemd', 'user', unit);
}
async function lstatOrNull(file) {
  try { return await fs.lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function unitDirectory(ctx, create = false) {
  const home = currentHome(ctx);
  ensure(path.isAbsolute(home), '用户家目录必须是绝对路径');
  let dir = home;
  for (const segment of ['.config', 'systemd', 'user']) {
    dir = path.join(dir, segment);
    let st = await lstatOrNull(dir);
    if (!st) {
      if (!create) fail('not_found', 'systemd 用户服务目录不存在', { directory: dir });
      try { await fs.mkdir(dir, { mode: 0o700 }); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
      st = await fs.lstat(dir);
    }
    if (!st.isDirectory() || st.isSymbolicLink() || st.uid !== currentUid(ctx) || (st.mode & 0o022) !== 0) {
      fail('file_security', 'systemd 用户服务目录存在符号链接、非目录、非本人目录或他人可写权限', { directory: dir });
    }
  }
  return dir;
}
async function existingManaged(ctx, unit) {
  await unitDirectory(ctx);
  const file = unitPath(ctx, unit);
  const st = await lstatOrNull(file);
  if (!st) fail('not_found', '本工具创建的 service 文件不存在', { unit });
  if (!st.isFile() || st.isSymbolicLink() || st.uid !== currentUid(ctx)) {
    fail('file_security', '拒绝操作符号链接、非普通文件或其他用户拥有的 service');
  }
  const content = await fs.readFile(file, 'utf8');
  if (!content.startsWith(MARKER + '\n')) {
    fail('not_managed', '只允许修改或删除本工具标记创建的 service');
  }
  return { file, content };
}
async function validateService(request, ctx) {
  const bin = await fs.stat(request.bin).catch(() => null);
  if (!bin?.isFile()) fail('invalid_input', '--exec 必须指向现有的普通可执行文件');
  try { await fs.access(request.bin, fsConstants.X_OK); }
  catch { fail('invalid_input', '--exec 文件对当前用户不可执行'); }
  if (request.cwd) {
    const st = await fs.stat(request.cwd).catch(() => null);
    if (!st?.isDirectory()) fail('invalid_input', '--cwd 必须指向现有目录');
    try { await fs.access(request.cwd, fsConstants.X_OK); }
    catch { fail('invalid_input', '--cwd 无法进入'); }
  }
  if (request.envFile) {
    const st = await lstatOrNull(request.envFile);
    if (!st?.isFile() || st.isSymbolicLink() || st.uid !== currentUid(ctx) || (st.mode & 0o077) !== 0) {
      fail('file_security', '--env-file 必须是当前用户拥有且权限不超过 0600 的普通文件（拒绝链接）');
    }
  }
}
function errorHint(error) {
  const details = (String(error?.stderr || error?.message || '')).slice(0, 400).trim();
  if (error?.code === 'ENOENT') return new SystemdUserError('dependency_missing', '缺少系统命令 systemctl / loginctl / journalctl');
  if (/Failed to connect to bus|System has not been booted with systemd|Failed to get D-Bus connection/iu.test(details)) {
    return new SystemdUserError('user_manager_unavailable', 'systemd 用户管理器不可访问，请检查登录会话、DBus 与 linger', { error: details });
  }
  return new SystemdUserError('command_failed', 'systemd 命令执行失败', { error: details });
}
async function command(ctx, program, args, soft = false) {
  try {
    const result = await (ctx.runner ?? execFileAsync)(program, args,
      { timeout: 15000, maxBuffer: 768 * 1024, encoding: 'utf8' });
    const ok = (result.code ?? 0) === 0;
    if (!ok && !soft) throw errorHint({ stderr: result.stderr, message: 'exit ' + result.code });
    return { ok, stdout: String(result.stdout || ''), stderr: String(result.stderr || '') };
  } catch (error) {
    if (soft) return { ok: false, stderr: String(error?.stderr || error?.message || '') };
    if (error instanceof SystemdUserError) throw error;
    throw errorHint(error);
  }
}
async function manager(ctx) {
  await command(ctx, 'systemctl', ['--user', 'show-environment']);
}
async function inspect(ctx, unit) {
  const r = await command(ctx, 'systemctl',
    ['--user', 'show', '--no-pager', '--property=' + PROPERTIES, unit]);
  const properties = Object.fromEntries(r.stdout.split(/\r?\n/u).filter(line => line.includes('='))
    .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
  if (!properties.LoadState) fail('verification_failed', 'systemctl 未返回 LoadState', { unit });
  return properties;
}
async function linger(ctx) {
  const r = await command(ctx, 'loginctl',
    ['show-user', String(currentUid(ctx)), '--property=Linger', '--value'], true);
  return r.ok ? (r.stdout.trim() === 'yes' ? 'yes' : r.stdout.trim() === 'no' ? 'no' : 'unknown') : 'unknown';
}
async function reload(ctx, unit, status) {
  try { await command(ctx, 'systemctl', ['--user', 'daemon-reload']); }
  catch (error) {
    fail('partial_change', 'service 文件已' + status + '，但 daemon-reload 失败；未验证 manager 已更新',
      { unit, file_changed: true, reason: error.message });
  }
}
async function create(request, ctx) {
  await manager(ctx);
  await validateService(request, ctx);
  const before = await inspect(ctx, request.unit);
  if (before.LoadState !== 'not-found') fail('already_exists', '用户管理器已存在同名 unit，拒绝覆盖或遮蔽', { unit: request.unit });
  const dir = await unitDirectory(ctx, true);
  const file = path.join(dir, request.unit);
  const fh = await fs.open(file, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW, 0o600)
    .catch(error => {
      if (error.code === 'EEXIST') fail('already_exists', '同名 service 文件已存在，拒绝覆盖');
      throw error;
    });
  try { await fh.writeFile(serviceContents(request), 'utf8'); }
  catch (error) { await fh.close(); await fs.unlink(file).catch(() => {}); throw error; }
  await fh.close();
  await reload(ctx, request.unit, '创建');
  return { ok: true, status: 'created', unit: request.unit, file, enabled: false, started: false };
}
async function update(request, ctx) {
  await manager(ctx);
  await validateService(request, ctx);
  const old = await existingManaged(ctx, request.unit);
  const next = serviceContents(request);
  if (next === old.content) return { ok: true, status: 'unchanged', unit: request.unit };
  const file = old.file, tmp = file + '.tmp-' + process.pid + '-' + Math.random().toString(16).slice(2);
  let staged = false;
  try {
    const fh = await fs.open(tmp, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW, 0o600);
    staged = true;
    try { await fh.writeFile(next, 'utf8'); } finally { await fh.close(); }
    const current = await existingManaged(ctx, request.unit);
    if (current.content !== old.content) fail('conflict', 'service 文件在修改期间发生变化，拒绝覆盖');
    await fs.rename(tmp, file);
    staged = false;
  } finally {
    if (staged) await fs.unlink(tmp).catch(() => {});
  }
  await reload(ctx, request.unit, '更新');
  return { ok: true, status: 'updated', unit: request.unit, file, restart_required: true };
}
async function remove(request, ctx) {
  await manager(ctx);
  const old = await existingManaged(ctx, request.unit);
  const state = await inspect(ctx, request.unit);
  if (!['inactive', 'failed'].includes(state.ActiveState) || state.UnitFileState !== 'disabled') {
    fail('service_busy', '请先停止并禁用 service；拒绝自动停止或删除仍在使用的服务',
      { active: state.ActiveState, enabled: state.UnitFileState });
  }
  // This is a user-owned, marked regular file, never a system unit or symlink.
  const current = await existingManaged(ctx, request.unit);
  if (current.content !== old.content) fail('conflict', 'service 文件在删除前发生变化');
  await fs.unlink(old.file);
  await reload(ctx, request.unit, '移除');
  return { ok: true, status: 'removed', unit: request.unit, file: old.file };
}
export async function run(request, ctx = {}) {
  if (request.mode === 'help') return { ok: true, status: 'help', help: HELP };
  checkPlatform(ctx);
  if (request.mode === 'doctor') {
    const m = await command(ctx, 'systemctl', ['--user', 'show-environment'], true);
    const l = await linger(ctx);
    return { ok: true, status: 'diagnostic', scope: 'user', uid: currentUid(ctx),
      user_manager_available: m.ok, linger: l,
      boot_without_login: m.ok && l === 'yes',
      note: !m.ok ? '当前用户 systemd 管理器不可用，无法验证 service 操作能力'
        : l === 'yes' ? 'linger 已启用；enable 的 service 可随用户管理器启动'
        : 'enable 仅保证用户管理器启动时拉起；无人登录开机自启需 linger=yes（可能需要管理员授权）' };
  }
  if (request.mode === 'linger') {
    if (request.action === 'status') return { ok: true, status: 'linger_status', linger: await linger(ctx) };
    const before = await linger(ctx);
    if (before === 'yes') return { ok: true, status: 'already_enabled', linger: 'yes' };
    try { await command(ctx, 'loginctl', ['enable-linger', String(currentUid(ctx))]); }
    catch (error) {
      fail('permission_required', '无法启用当前用户 linger；需要管理员/Polkit 授权',
        { suggestion: '请由管理员执行 sudo loginctl enable-linger ' + currentUid(ctx), reason: error.message });
    }
    const after = await linger(ctx);
    if (after !== 'yes') fail('verification_failed', 'loginctl 命令结束但未验证 linger=yes', { linger: after });
    return { ok: true, status: 'linger_enabled', linger: after };
  }
  if (request.mode === 'list') {
    const r = await command(ctx, 'systemctl',
      ['--user', 'list-unit-files', '--type=service', '--no-legend', '--no-pager']);
    const services = r.stdout.split(/\r?\n/u).map(line => line.trim().split(/\s+/u))
      .filter(parts => parts[0]?.endsWith('.service') && parts.length >= 2)
      .map(([unit, state, preset]) => ({ unit, state, preset: preset || null }));
    return { ok: true, status: 'listed', scope: 'user', count: services.length, services };
  }
  if (request.mode === 'status') {
    const state = await inspect(ctx, request.unit);
    return { ok: true, status: 'unit_status', unit: request.unit, ...state };
  }
  if (request.mode === 'logs') {
    const r = await command(ctx, 'journalctl',
      ['--user', '--unit=' + request.unit, '--lines=' + request.lines, '--no-pager', '--output=short-iso']);
    return { ok: true, status: 'logs', unit: request.unit, lines_requested: request.lines, text: r.stdout };
  }
  if (request.mode === 'create') return create(request, ctx);
  if (request.mode === 'update') return update(request, ctx);
  if (request.mode === 'remove') return remove(request, ctx);
  if (ACTIONS.has(request.mode)) {
    const args = ['--user', request.mode];
    if (request.now) args.push('--now');
    args.push(request.unit);
    await command(ctx, 'systemctl', args);
    const state = await inspect(ctx, request.unit);
    return { ok: true, status: request.mode + (request.now ? '_now' : ''), unit: request.unit, ...state,
      note: request.mode === 'enable' && (await linger(ctx)) !== 'yes'
        ? '已启用用户管理器自启动；无登录开机启动仍需 linger=yes' : undefined };
  }
  fail('invalid_input', '不支持的请求');
}
export function publicError(error) {
  if (error instanceof SystemdUserError) return { ok: false, status: error.status,
    message: error.message, ...error.details };
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
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
