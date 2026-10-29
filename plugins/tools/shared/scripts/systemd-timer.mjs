#!/usr/bin/env node
/** Linux systemd --user calendar timer, paired with a one-shot service. No sudo or shell. */
import * as fs from 'node:fs/promises';
import { constants as flags } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SystemdUserError, publicError, cleanLine, escapeToken, escapePath, escapeValue,
  checkPlatform, currentUid, unitPath, lstatOrNull, unitDirectory, validateService,
  command, manager, linger,
} from './systemd-user.mjs';

const MARKER = '# Managed by agent-plugin-marketplace:tools/linux-systemd-timer';
const PROPERTIES = 'LoadState,ActiveState,SubState,UnitFileState,FragmentPath,Result,NextElapseUSecRealtime,LastTriggerUSec,Triggers';
const ACTIONS = new Set(['start', 'stop', 'restart', 'enable', 'disable']);
const ACCURACY = new Set(['1s', '1min', '5min']);
const SUFFIX_TIMER = '.timer', SUFFIX_SERVICE = '.service';

export const HELP = [
  'systemd --user Timer：按日历规则定时触发一次性 service，仅当前普通用户，无 sudo/root',
  '  doctor                                     只读检查 user manager、calendar parser、linger',
  '  calendar EXPR                             校验 OnCalendar 表达式，预览本机下次触发时间（只读）',
  '  list                                       列出当前用户全部 timer unit files（只读）',
  '  status NAME                                查看 NAME.timer、NAME.service 真实状态及下次/上次时间',
  '  logs NAME [--lines 100]                    查看 NAME.service 的执行日志（最多 500 行）',
  '  create NAME --exec ABS --calendar EXPR [--arg VALUE ...] [--cwd ABS] [--env-file ABS]',
  '              [--description TEXT] [--persistent yes|no] [--accuracy 1s|1min|5min]',
  '  update NAME [--calendar EXPR] [--persistent yes|no] [--accuracy ...] --confirm yes',
  '  start|stop|restart NAME                    激活、停用或重新调度 timer；Persistent=yes 可能立即补跑',
  '  enable|disable NAME [--now]                配置用户管理器自启 timer；--now 同时启停',
  '  run-now NAME --confirm yes                 明确要求立即运行一次配套 service',
  '  remove NAME --confirm yes                  仅删除本工具创建且停用/禁用的 timer+service 配对',
  '默认只创建文件、daemon-reload，不启动/启用。Persistent=no：timer 未运行期间错过的日历时刻默认不补跑。',
  '登录前定时运行需要 linger=yes；请在用户明确授权后使用已有 systemd-user CLI 配置 linger。',
].join('\n');

function invalid(message) { throw new SystemdUserError('invalid_input', message); }
function fail(status, message, details = {}) { throw new SystemdUserError(status, message, details); }
function ensure(check, message) { if (!check) invalid(message); }

export function timerName(name) {
  ensure(typeof name === 'string' && /^[a-z][a-z0-9_-]{0,63}(?:\.timer)?$/u.test(name),
    'NAME 仅接受小写字母开头、数字/小写字母/连字符/下划线（可带 .timer），禁止路径、模板与通配符');
  const base = name.endsWith('.timer') ? name.slice(0, -6) : name;
  return { base, timer: base + SUFFIX_TIMER, service: base + SUFFIX_SERVICE };
}
export function calendarExpression(value) {
  ensure(typeof value === 'string' && value.trim() === value && value.length >= 1 && value.length <= 160,
    '--calendar 必须是长度 1..160 的日历表达式');
  cleanLine(value, '--calendar');
  ensure(/^[A-Za-z0-9*.,+:/_ -]+$/u.test(value) && !value.startsWith('-'),
    '--calendar 包含不支持的字符或选项；禁止分号、百分号、换行与 shell 操作符');
  return value;
}

function parseFlags(rest, allowed) {
  const out = { args: [] }, seen = new Set();
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i], value = rest[i + 1];
    ensure(allowed.includes(flag) && value !== undefined, '参数未知或缺少值：' + (flag || 'unknown'));
    ensure(flag === '--arg' || !seen.has(flag), '重复参数：' + flag);
    seen.add(flag);
    if (flag === '--arg') {
      ensure(value !== ';', '独立分号不能作为 ExecStart 参数');
      out.args.push(cleanLine(value, '--arg'));
      ensure(out.args.length <= 64, '--arg 最多 64 个');
    } else if (flag === '--exec') out.bin = cleanLine(value, '--exec');
    else if (flag === '--cwd') out.cwd = cleanLine(value, '--cwd');
    else if (flag === '--env-file') out.envFile = cleanLine(value, '--env-file');
    else if (flag === '--description') out.description = cleanLine(value, '--description');
    else if (flag === '--calendar') out.calendar = calendarExpression(value);
    else if (flag === '--accuracy') out.accuracy = value;
    else if (flag === '--persistent') out.persistent = value;
    else if (flag === '--confirm') out.confirm = value;
  }
  if (out.accuracy !== undefined) ensure(ACCURACY.has(out.accuracy), '--accuracy 仅支持 1s/1min/5min');
  if (out.persistent !== undefined) ensure(['yes', 'no'].includes(out.persistent), '--persistent 仅支持 yes/no');
  return out;
}

export function parseTimerArgs(argv) {
  if (argv.length === 0 || (argv.length === 1 && ['help', '-h', '--help'].includes(argv[0]))) {
    return { mode: 'help' };
  }
  const [mode, name, ...rest] = argv;
  if (['doctor', 'list'].includes(mode)) {
    ensure(argv.length === 1, mode + ' 不允许额外参数');
    return { mode };
  }
  if (mode === 'calendar') {
    ensure(argv.length === 2, 'calendar 需要且只支持一个 OnCalendar 表达式');
    return { mode, calendar: calendarExpression(name) };
  }
  ensure(['status', 'logs', 'create', 'update', 'remove', 'run-now', ...ACTIONS].includes(mode),
    '未知命令，运行 --help 查看用法');
  const units = timerName(name);
  if (mode === 'status') {
    ensure(rest.length === 0, 'status 不接受额外参数');
    return { mode, ...units };
  }
  if (mode === 'logs') {
    const lines = rest.length === 0 ? 100 : (() => {
      ensure(rest.length === 2 && rest[0] === '--lines' && /^[0-9]{1,3}$/u.test(rest[1]),
        'logs 仅支持 --lines 1..500');
      const count = Number(rest[1]);
      ensure(count >= 1 && count <= 500, '日志行数必须是 1..500');
      return count;
    })();
    return { mode, ...units, lines };
  }
  if (mode === 'remove' || mode === 'run-now') {
    ensure(rest.length === 2 && rest[0] === '--confirm' && rest[1] === 'yes',
      mode + ' 必须显式指定 --confirm yes');
    return { mode, ...units };
  }
  if (ACTIONS.has(mode)) {
    const now = rest.length === 1 && rest[0] === '--now';
    ensure(rest.length === 0 || (now && ['enable', 'disable'].includes(mode)),
      '只有 enable/disable 支持 --now');
    return { mode, ...units, now };
  }
  const createFlags = ['--exec', '--arg', '--cwd', '--env-file', '--description',
    '--calendar', '--persistent', '--accuracy'];
  const updateFlags = ['--calendar', '--persistent', '--accuracy', '--confirm'];
  const fields = parseFlags(rest, mode === 'create' ? createFlags : updateFlags);
  if (mode === 'create') {
    ensure(fields.bin && path.isAbsolute(fields.bin), 'create 必须传入绝对路径 --exec');
    ensure(fields.calendar, 'create 必须提供 --calendar 表达式');
    for (const item of [fields.bin, fields.cwd, fields.envFile].filter(Boolean)) {
      ensure(path.isAbsolute(item) && !item.split(path.sep).includes('..'), '路径必须为没有 .. 组件的绝对路径');
    }
    ensure(!fields.description || fields.description.length <= 200, '--description 不超过 200 字符');
    return { mode, ...units, ...fields, persistent: fields.persistent ?? 'no', accuracy: fields.accuracy ?? '1min' };
  }
  ensure(fields.confirm === 'yes', 'update 必须显式指定 --confirm yes');
  ensure(['calendar', 'accuracy', 'persistent'].some(field => fields[field] !== undefined),
    'update 至少指定一项 --calendar/--persistent/--accuracy');
  return { mode, ...units, ...fields };
}

export function timerContents(request) {
  const name = request.base;
  const calendar = calendarExpression(request.calendar);
  ensure(['yes', 'no'].includes(request.persistent) && ACCURACY.has(request.accuracy),
    'Timer 参数缺失或无效');
  return [
    MARKER, '[Unit]', 'Description=' + escapeValue(request.description || name + ' schedule'),
    '', '[Timer]', 'OnCalendar=' + calendar,
    'Persistent=' + request.persistent,
    'AccuracySec=' + request.accuracy,
    'Unit=' + request.service,
    '', '[Install]', 'WantedBy=timers.target', '',
  ].join('\n');
}
export function oneshotContents(request) {
  return [
    MARKER, '[Unit]', 'Description=' + escapeValue(request.description || request.base),
    '', '[Service]', 'Type=oneshot',
    'ExecStart=' + [request.bin, ...request.args].map(escapeToken).join(' '),
    ...(request.cwd ? ['WorkingDirectory=' + escapePath(request.cwd)] : []),
    ...(request.envFile ? ['EnvironmentFile=' + escapePath(request.envFile)] : []),
    '',
  ].join('\n');
}
function properties(text) {
  return Object.fromEntries(text.split(/\r?\n/u).filter(line => line.includes('='))
    .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
}
async function show(ctx, name) {
  const result = await command(ctx, 'systemctl',
    ['--user', 'show', '--no-pager', '--property=' + PROPERTIES, name]);
  const data = properties(result.stdout);
  if (!data.LoadState) fail('verification_failed', 'systemctl 没有返回 LoadState', { unit: name });
  return data;
}
async function calendarCheck(expr, ctx) {
  const calendar = calendarExpression(expr);
  try {
    const r = await command(ctx, 'systemd-analyze', ['calendar', '--iterations=3', '--', calendar]);
    return { calendar, preview: r.stdout.slice(0, 12000) };
  } catch (error) {
    if (error.status === 'command_failed') {
      fail('invalid_calendar', '系统无法解析 OnCalendar；请使用符合当前 systemd 版本的表达式',
        { calendar, reason: String(error.details?.error || '').slice(0, 400) });
    }
    throw error;
  }
}
async function daemonReload(ctx, name, operation) {
  try { await command(ctx, 'systemctl', ['--user', 'daemon-reload']); }
  catch (error) {
    fail('partial_change', 'Timer 配对 unit 文件已' + operation + '，但 daemon-reload 失败',
      { timer: name, files_changed: true, reason: error.message });
  }
}
async function managedFile(ctx, name) {
  await unitDirectory(ctx);
  const file = unitPath(ctx, name);
  const st = await lstatOrNull(file);
  if (!st) fail('not_found', '未找到本工具创建的 unit 文件', { unit: name });
  if (!st.isFile() || st.isSymbolicLink() || st.nlink !== 1 || st.uid !== currentUid(ctx)
    || (st.mode & 0o022) !== 0) {
    fail('file_security', '拒绝操作符号链接、硬链接、其他用户拥有或他人可写的 unit', { unit: name });
  }
  const content = await fs.readFile(file, 'utf8');
  if (!content.startsWith(MARKER + '\n')) fail('not_managed', '只操作本工具创建的 unit', { unit: name });
  return { file, content };
}
async function managedPair(ctx, request) {
  const timer = await managedFile(ctx, request.timer);
  const service = await managedFile(ctx, request.service);
  if (!timer.content.includes('\nUnit=' + request.service + '\n')
    || !timer.content.includes('\nWantedBy=timers.target\n')
    || !service.content.includes('\nType=oneshot\n')) {
    fail('not_managed', 'unit 配对关系已被修改，拒绝操作', { timer: request.timer });
  }
  return { timer, service };
}
async function exclusiveFile(file, content) {
  let handle;
  try { handle = await fs.open(file, flags.O_WRONLY | flags.O_CREAT | flags.O_EXCL | flags.O_NOFOLLOW, 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') fail('already_exists', '同名 unit 文件已存在，拒绝覆盖', { file });
    throw error;
  }
  let failure;
  try { await handle.writeFile(content, 'utf8'); } catch (error) { failure = error; }
  try { await handle.close(); } catch (error) { failure ??= error; }
  if (failure) {
    try { await fs.unlink(file); }
    catch { fail('partial_change', '暂存文件写入失败且清理失败，需检查文件', { file }); }
    throw failure;
  }
}
async function create(request, ctx) {
  await manager(ctx);
  await validateService(request, ctx);
  const schedule = await calendarCheck(request.calendar, ctx);
  const [timerState, serviceState] = await Promise.all([
    show(ctx, request.timer), show(ctx, request.service),
  ]);
  if (timerState.LoadState !== 'not-found' || serviceState.LoadState !== 'not-found') {
    fail('already_exists', '当前用户管理器已有同名 timer 或 service，拒绝覆盖', { timer: request.timer });
  }
  const dir = await unitDirectory(ctx, true);
  const paths = [path.join(dir, request.service), path.join(dir, request.timer)];
  for (const file of paths) if (await lstatOrNull(file)) {
    fail('already_exists', '同名文件已存在，拒绝覆盖', { file });
  }
  const created = [];
  try {
    for (const [file, text] of [[paths[0], oneshotContents(request)], [paths[1], timerContents(request)]]) {
      // Include the created path before writing so partial-write failures also clean up.
      try {
        const handle = await fs.open(file, flags.O_WRONLY | flags.O_CREAT | flags.O_EXCL | flags.O_NOFOLLOW, 0o600);
        created.push(file);
        try { await handle.writeFile(text, 'utf8'); } finally { await handle.close(); }
      } catch (error) {
        if (error.code === 'EEXIST') fail('already_exists', '写入时发现同名 unit 文件，拒绝覆盖', { file });
        throw error;
      }
    }
  } catch (error) {
    const failed = [];
    for (const file of created.reverse()) {
      try { await fs.unlink(file); } catch { failed.push(file); }
    }
    if (failed.length) fail('partial_change', '配对文件创建失败，回收部分文件也失败，需要人工核对',
      { files_left: failed, reason: error.message });
    throw error;
  }
  await daemonReload(ctx, request.timer, '创建');
  const [afterTimer, afterService] = await Promise.all([
    show(ctx, request.timer), show(ctx, request.service),
  ]);
  if (afterTimer.LoadState !== 'loaded' || afterService.LoadState !== 'loaded') {
    fail('partial_change', '文件已写入且 daemon-reload 已执行，但未确认两个 unit 被正确加载',
      { timer: request.timer, files_changed: true, timer_load: afterTimer.LoadState,
        service_load: afterService.LoadState });
  }
  return { ok: true, status: 'created', timer: request.timer, service: request.service,
    files: { service: paths[0], timer: paths[1] }, calendar: schedule.calendar,
    calendar_preview: schedule.preview, persistent: request.persistent, accuracy: request.accuracy,
    enabled: false, started: false };
}
function previousTimer(request, original) {
  const entries = Object.fromEntries(['OnCalendar', 'Persistent', 'AccuracySec'].map(key => {
    const matches = [...original.matchAll(new RegExp('^' + key + '=(.*)$', 'gm'))];
    if (matches.length !== 1) fail('invalid_state', '已有 timer 配置格式发生变化，请先检查原文件', { field: key });
    return [key, matches[0][1]];
  }));
  const newCalendar = request.calendar ?? entries.OnCalendar;
  const persistent = request.persistent ?? entries.Persistent;
  const accuracy = request.accuracy ?? entries.AccuracySec;
  ensure(['yes', 'no'].includes(persistent) && ACCURACY.has(accuracy), '当前 timer 设置不在受支持的更新范围');
  let text = original;
  text = text.replace(/^OnCalendar=.*$/mu, 'OnCalendar=' + calendarExpression(newCalendar))
    .replace(/^Persistent=.*$/mu, 'Persistent=' + persistent)
    .replace(/^AccuracySec=.*$/mu, 'AccuracySec=' + accuracy);
  return { content: text, calendar: newCalendar, persistent, accuracy };
}
async function update(request, ctx) {
  await manager(ctx);
  const pair = await managedPair(ctx, request);
  const next = previousTimer(request, pair.timer.content);
  await calendarCheck(next.calendar, ctx);
  if (next.content === pair.timer.content) {
    return { ok: true, status: 'unchanged', timer: request.timer };
  }
  const file = pair.timer.file, stage = file + '.tmp-' + process.pid + '-' + Math.random().toString(16).slice(2);
  let staged = false;
  try {
    await exclusiveFile(stage, next.content);
    staged = true;
    const latest = await managedPair(ctx, request);
    if (latest.timer.content !== pair.timer.content || latest.service.content !== pair.service.content) {
      fail('conflict', 'Timer 配对 unit 在更新期间改变，拒绝覆盖');
    }
    await fs.rename(stage, file);
    staged = false;
  } finally {
    if (staged) await fs.unlink(stage).catch(() => {});
  }
  await daemonReload(ctx, request.timer, '更新');
  return { ok: true, status: 'updated', timer: request.timer, calendar: next.calendar,
    persistent: next.persistent, accuracy: next.accuracy,
    restart_required: true,
    note: '若 timer 已激活，需要用户确认后单独 restart，新的下次执行时间以重启后的 systemctl status 为准' };
}
async function remove(request, ctx) {
  await manager(ctx);
  const pair = await managedPair(ctx, request);
  const [timer, service] = await Promise.all([show(ctx, request.timer), show(ctx, request.service)]);
  if (!['inactive', 'failed'].includes(timer.ActiveState) || timer.UnitFileState !== 'disabled'
    || !['inactive', 'failed'].includes(service.ActiveState)) {
    fail('timer_busy', '先停止并禁用 timer，等待配套 service 结束后才能删除',
      { timer_active: timer.ActiveState, timer_enabled: timer.UnitFileState, service_active: service.ActiveState });
  }
  const latest = await managedPair(ctx, request);
  if (latest.timer.content !== pair.timer.content || latest.service.content !== pair.service.content) {
    fail('conflict', '配对文件在删除前发生变化，拒绝继续');
  }
  // Persistent=yes stores a timestamp; clean it before removing the timer unit.
  if (pair.timer.content.includes('\nPersistent=yes\n')) {
    await command(ctx, 'systemctl', ['--user', 'clean', '--what=state', request.timer]);
  }
  const deleted = [];
  for (const file of [pair.timer.file, pair.service.file]) {
    try { await fs.unlink(file); deleted.push(file); }
    catch (error) {
      fail('partial_change', '配对 unit 删除部分失败，需要人工检查', { deleted, remaining: file, reason: error.message });
    }
  }
  await daemonReload(ctx, request.timer, '删除');
  return { ok: true, status: 'removed', timer: request.timer, service: request.service, removed: deleted };
}
export async function runTimer(request, ctx = {}) {
  if (request.mode === 'help') return { ok: true, status: 'help', help: HELP };
  checkPlatform(ctx);
  if (request.mode === 'doctor') {
    const m = await command(ctx, 'systemctl', ['--user', 'show-environment'], true);
    const c = await command(ctx, 'systemd-analyze', ['calendar', '--iterations=1', '--', 'daily'], true);
    const l = await linger(ctx);
    return { ok: true, status: 'diagnostic', scope: 'user', uid: currentUid(ctx),
      user_manager_available: m.ok, calendar_parser_available: c.ok, linger: l,
      unattended_schedule_ready: m.ok && c.ok && l === 'yes' };
  }
  if (request.mode === 'calendar') {
    const schedule = await calendarCheck(request.calendar, ctx);
    return { ok: true, status: 'calendar_preview', ...schedule,
      note: '预览使用当前宿主的时区和规则；启用后 timer 的实际触发仍受到 AccuracySec 影响' };
  }
  if (request.mode === 'list') {
    await manager(ctx);
    const r = await command(ctx, 'systemctl', ['--user', 'list-unit-files',
      '--type=timer', '--no-legend', '--no-pager']);
    const items = r.stdout.split(/\r?\n/u).map(line => line.trim().split(/\s+/u))
      .filter(parts => parts[0]?.endsWith('.timer') && parts.length >= 2)
      .map(([unit, state, preset]) => ({ unit, state, preset: preset ?? null }));
    return { ok: true, status: 'listed', scope: 'user', count: items.length, timers: items };
  }
  if (request.mode === 'status') {
    await manager(ctx);
    const [timer, service] = await Promise.all([show(ctx, request.timer), show(ctx, request.service)]);
    return { ok: true, status: 'timer_status', timer: request.timer, service: request.service,
      timer_state: timer, service_state: service, linger: await linger(ctx) };
  }
  if (request.mode === 'logs') {
    await manager(ctx);
    const r = await command(ctx, 'journalctl', ['--user', '--unit=' + request.service,
      '--lines=' + request.lines, '--no-pager', '--output=short-iso']);
    return { ok: true, status: 'logs', service: request.service, lines_requested: request.lines, text: r.stdout };
  }
  if (request.mode === 'create') return await create(request, ctx);
  if (request.mode === 'update') return await update(request, ctx);
  if (request.mode === 'remove') return await remove(request, ctx);
  if (request.mode === 'run-now') {
    await manager(ctx);
    await managedPair(ctx, request);
    await command(ctx, 'systemctl', ['--user', 'start', request.service]);
    const state = await show(ctx, request.service);
    return { ok: true, status: 'run_requested', service: request.service, state,
      note: 'systemctl start 已返回，任务执行结果须结合 Result 和 journalctl 日志确认' };
  }
  if (ACTIONS.has(request.mode)) {
    await manager(ctx);
    await managedPair(ctx, request);
    const args = ['--user', request.mode];
    if (request.now) args.push('--now');
    args.push(request.timer);
    await command(ctx, 'systemctl', args);
    const state = await show(ctx, request.timer);
    return { ok: true, status: request.mode + (request.now ? '_now' : ''),
      timer: request.timer, timer_state: state,
      ...(request.mode === 'enable' ? { linger: await linger(ctx) } : {}),
      note: 'timer active 表示调度器已运行，实际任务是否执行需要检查 service 日志' };
  }
  fail('invalid_input', '不支持的 Timer 请求');
}
export async function main(argv = process.argv.slice(2)) {
  try {
    const result = await runTimer(parseTimerArgs(argv));
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stdout.write(JSON.stringify(publicError(error), null, 2) + '\n');
    process.exitCode = 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
