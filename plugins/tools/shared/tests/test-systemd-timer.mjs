import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseTimerArgs, timerName, calendarExpression, oneshotContents, timerContents,
  runTimer } from '../scripts/systemd-timer.mjs';
import { SystemdUserError } from '../scripts/systemd-user.mjs';

const fails = status => error => error instanceof SystemdUserError && error.status === status;
const cmd = (name = 'backup', tail = []) =>
  ['create', name, '--exec', process.execPath, '--arg', '/tmp/job.js', '--calendar', '*-*-* 03:00:00', ...tail];

async function fixture(t, options = {}) {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'systemd-timer-test-'));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  const calls = [], state = new Map();
  const file = name => path.join(home, '.config', 'systemd', 'user', name);
  let lingerState = options.linger ?? 'no';
  const runner = async (program, args) => {
    calls.push([program, ...args]);
    if (program === 'systemd-analyze') {
      if (options.noAnalyze) return { code: 1, stderr: 'calendar parser unavailable' };
      const calendar = args.at(-1);
      if (calendar === 'invalid' || calendar === 'never') return { code: 1, stderr: 'Failed to parse calendar specification' };
      return { stdout: 'Normalized form: ' + calendar + '\nNext elapse: Wed 2026-11-04 03:00:00 JST\n' };
    }
    if (program === 'loginctl') {
      if (args[0] === 'show-user') return { stdout: lingerState + '\n' };
      throw Error('timer CLI may not modify linger');
    }
    if (program === 'journalctl') {
      assert.equal(args[0], '--user');
      return { stdout: '2026-11-03 test: success\n' };
    }
    assert.equal(program, 'systemctl');
    assert.equal(args[0], '--user', 'all systemctl commands must be --user scoped');
    if (!options.manager) {
      return { code: 1, stderr: 'Failed to connect to bus: No medium found' };
    }
    if (args[1] === 'show-environment') return { stdout: 'PATH=/usr/bin\n' };
    if (args[1] === 'daemon-reload') return options.reloadFail
      ? { code: 1, stderr: 'reload failed' } : { stdout: '' };
    if (args[1] === 'list-unit-files') return { stdout: 'backup.timer enabled enabled\nabc.timer disabled disabled\n' };
    if (args[1] === 'show') {
      const unit = args.at(-1);
      const exists = await fs.lstat(file(unit)).then(() => true, () => false);
      const s = state.get(unit) ?? {};
      return { stdout: [
        'LoadState=' + (exists ? 'loaded' : 'not-found'),
        'ActiveState=' + (s.active ?? 'inactive'), 'SubState=dead',
        'UnitFileState=' + (unit.endsWith('.timer') ? (s.enabled ?? 'disabled') : 'static'),
        'Result=success', 'FragmentPath=' + (exists ? file(unit) : ''),
        'NextElapseUSecRealtime=' + (s.active === 'active' ? 'Wed 2026-11-04 03:00:00 JST' : ''),
        'LastTriggerUSec=', 'Triggers=' + unit.replace('.timer', '.service'),
      ].join('\n') + '\n' };
    }
    if (args[1] === 'clean') {
      if (options.cleanFail) return { code: 1, stderr: 'cannot clean timestamp' };
      return { stdout: '' };
    }
    const action = args[1], unit = args.at(-1);
    const s = state.get(unit) || {};
    if (action === 'enable') {
      s.enabled = 'enabled';
      if (args.includes('--now')) s.active = 'active';
    } else if (action === 'disable') {
      s.enabled = 'disabled';
      if (args.includes('--now')) s.active = 'inactive';
    } else if (action === 'start') {
      s.active = unit.endsWith('.timer') ? 'active' : 'inactive'; // oneshot exits
    } else if (action === 'stop') s.active = 'inactive';
    else if (action === 'restart') s.active = 'active';
    else throw Error('Unexpected systemctl call: ' + args.join(' '));
    state.set(unit, s);
    return { stdout: '' };
  };
  return { home, calls, state, file, ctx: {
    home, uid: process.getuid(), platform: 'linux', runner,
  } };
}
function invoke(argv, fixture) { return runTimer(parseTimerArgs(argv), fixture.ctx); }

test('unit names, option syntax and scheduled expression are strictly bounded', () => {
  assert.deepEqual(parseTimerArgs([]), { mode: 'help' });
  assert.deepEqual(timerName('myjob.timer'),
    { base: 'myjob', timer: 'myjob.timer', service: 'myjob.service' });
  for (const n of ['../bad', '/tmp/job', 'other@1', 'one.service', '*.timer',
    'foo/bar', 'Foo.timer', '.hidden', '--system']) assert.throws(() => timerName(n), fails('invalid_input'));
  for (const e of ['', ' 03:00', 'bad\n[Service]\nExecStart=evil',
    'daily;OnUnitActiveSec=1s', 'daily%U', '--help', 'daily #comment', '毎日']) {
    assert.throws(() => calendarExpression(e), fails('invalid_input'), e);
  }
  for (const args of [
    ['calendar'], ['calendar', 'daily', 'hourly'],
    ['create', 'job', '--calendar', 'daily'],
    ['create', 'job', '--exec', process.execPath],
    cmd('job', ['--persistent', 'TRUE']),
    cmd('job', ['--accuracy', '10s']),
    cmd('job', ['--exec', process.execPath]),
    cmd('job', ['--arg', ';']),
    cmd('job', ['--arg', 'x\nExecStart=malicious']),
    cmd('job', ['--cwd', '/tmp/../etc']),
    cmd('job', ['--unknown', 'yes']),
    ['update', 'job', '--calendar', 'daily'],
    ['update', 'job', '--confirm', 'yes'],
    ['update', 'job', '--exec', process.execPath, '--confirm', 'yes'],
    ['remove', 'job'], ['run-now', 'job'], ['stop', 'job', '--now'],
    ['logs', 'job', '--lines', '501'], ['doctor', '--help'],
  ]) assert.throws(() => parseTimerArgs(args), fails('invalid_input'), args.join(' '));
});

test('timer pair uses static oneshot service, no inline shell or install section for service', () => {
  const request = parseTimerArgs(cmd('app', ['--arg', 'foo$bar%u', '--arg', 'a b',
    '--description', 'Scheduled job', '--cwd', '/tmp', '--persistent', 'yes', '--accuracy', '1s']));
  const s = oneshotContents(request), timer = timerContents(request);
  assert.match(s, /\[Service\]\nType=oneshot\n/u);
  assert.match(s, /ExecStart="[^"]+" "\/tmp\/job.js" "foo\$\$bar%%u" "a b"/u);
  assert.match(s, /WorkingDirectory="\/tmp"/u);
  assert.doesNotMatch(s, /WantedBy=|Restart=|Type=simple/u);
  assert.match(timer, /\[Timer\]\nOnCalendar=\*-\*-\* 03:00:00\nPersistent=yes\nAccuracySec=1s/u);
  assert.match(timer, /Unit=app.service/u);
  assert.match(timer, /\[Install\]\nWantedBy=timers.target/u);
  assert.doesNotMatch(timer, /WantedBy=multi-user.target|OnBootSec=/u);
});

test('read-only calendar preview checks host parser; invalid calendar never writes files', async t => {
  const f = await fixture(t, { manager: true });
  const preview = await invoke(['calendar', 'Mon..Fri *-*-* 09:00:00'], f);
  assert.equal(preview.status, 'calendar_preview');
  assert.match(preview.preview, /Next elapse/u);
  assert.ok(f.calls.every(c => c[0] !== 'systemctl'));
  assert.throws(() => parseTimerArgs(cmd('bad', ['--calendar', 'invalid'])), fails('invalid_input'));
  const invalid = parseTimerArgs(['create', 'bad', '--exec', process.execPath, '--calendar', 'invalid']);
  await assert.rejects(() => runTimer(invalid, f.ctx), fails('invalid_calendar'));
  assert.equal(await fs.lstat(f.file('bad.timer')).then(() => true, () => false), false);
});

test('doctor reports real prerequisites and does not perform writes or activation', async t => {
  const f = await fixture(t, { manager: false, noAnalyze: true });
  const d = await invoke(['doctor'], f);
  assert.equal(d.scope, 'user');
  assert.equal(d.user_manager_available, false);
  assert.equal(d.calendar_parser_available, false);
  assert.equal(d.unattended_schedule_ready, false);
  assert.ok(f.calls.every(c => !['start', 'enable', 'daemon-reload', 'enable-linger'].includes(c[1])));
  await assert.rejects(() => invoke(cmd('block'), f), fails('user_manager_unavailable'));
  assert.equal(await fs.lstat(f.file('block.service')).then(() => true, () => false), false);
  const healthy = await fixture(t, { manager: true, linger: 'yes' });
  assert.equal((await invoke(['doctor'], healthy)).unattended_schedule_ready, true);
});

test('create writes paired user-owned files only, no start/enable, exposes schedule preview', async t => {
  const f = await fixture(t, { manager: true });
  const result = await invoke(cmd('backup'), f);
  assert.equal(result.status, 'created');
  assert.equal(result.timer, 'backup.timer');
  assert.equal(result.service, 'backup.service');
  assert.equal(result.persistent, 'no');
  assert.equal(result.accuracy, '1min');
  assert.equal(result.enabled, false);
  assert.equal(result.started, false);
  assert.match(result.calendar_preview, /Next elapse/u);
  const s = await fs.readFile(f.file('backup.service'), 'utf8');
  const timer = await fs.readFile(f.file('backup.timer'), 'utf8');
  assert.match(s, /Type=oneshot/u);
  assert.match(timer, /Persistent=no/u);
  assert.equal((await fs.stat(f.file('backup.service'))).mode & 0o777, 0o600);
  assert.equal((await fs.stat(f.file('backup.timer'))).mode & 0o777, 0o600);
  assert.ok(!f.calls.some(c => c.includes('enable') || c.includes('start')));
  assert.equal(f.calls.filter(c => c.includes('daemon-reload')).length, 1);
});

test('list/status/logs/enable --now and manual run are scoped and report actual status', async t => {
  const f = await fixture(t, { manager: true, linger: 'no' });
  await invoke(cmd('notify'), f);
  const list = await invoke(['list'], f);
  assert.equal(list.count, 2);
  assert.equal(list.timers[0].unit, 'backup.timer');
  const inactive = await invoke(['status', 'notify'], f);
  assert.equal(inactive.timer_state.ActiveState, 'inactive');
  assert.equal(inactive.linger, 'no');
  const enabled = await invoke(['enable', 'notify', '--now'], f);
  assert.equal(enabled.timer_state.ActiveState, 'active');
  assert.equal(enabled.timer_state.UnitFileState, 'enabled');
  assert.equal(enabled.linger, 'no');
  const log = await invoke(['logs', 'notify', '--lines', '17'], f);
  assert.match(log.text, /test: success/u);
  assert.equal(log.service, 'notify.service');
  const serviceCallsBefore = f.calls.filter(c => c.includes('notify.service') && c.includes('start')).length;
  assert.throws(() => parseTimerArgs(['run-now', 'notify']), fails('invalid_input'));
  assert.equal(f.calls.filter(c => c.includes('notify.service') && c.includes('start')).length, serviceCallsBefore);
  const now = await invoke(['run-now', 'notify', '--confirm', 'yes'], f);
  assert.equal(now.status, 'run_requested');
  assert.ok(f.calls.some(c => c[0] === 'systemctl' && c.includes('start') && c.includes('notify.service')));
  await invoke(['disable', 'notify', '--now'], f);
  assert.equal((await invoke(['status', 'notify'], f)).timer_state.UnitFileState, 'disabled');
  for (const c of f.calls) {
    assert.notEqual(c[0], 'sudo');
    if (c[0] === 'systemctl') assert.equal(c[1], '--user');
  }
});

test('update changes only timer schedule, preserves omitted fields and requires explicit restart', async t => {
  const f = await fixture(t, { manager: true });
  await invoke(cmd('report', ['--persistent', 'yes', '--accuracy', '1s']), f);
  const serviceBefore = await fs.readFile(f.file('report.service'), 'utf8');
  const changed = await invoke(['update', 'report', '--calendar', 'Mon..Fri *-*-* 04:00:00', '--confirm', 'yes'], f);
  assert.equal(changed.status, 'updated');
  assert.equal(changed.restart_required, true);
  assert.equal(changed.persistent, 'yes');
  assert.equal(changed.accuracy, '1s');
  assert.equal(await fs.readFile(f.file('report.service'), 'utf8'), serviceBefore);
  const unit = await fs.readFile(f.file('report.timer'), 'utf8');
  assert.match(unit, /OnCalendar=Mon\.\.Fri \*-\*-\* 04:00:00/u);
  assert.match(unit, /Persistent=yes/u);
  assert.equal((await invoke(['update', 'report', '--calendar', 'Mon..Fri *-*-* 04:00:00',
    '--confirm', 'yes'], f)).status, 'unchanged');
  assert.ok(!f.calls.some(c => c.includes('restart')));
  const files = await fs.readdir(path.dirname(f.file('report.timer')));
  assert.deepEqual(files.filter(x => x.includes('.tmp-')), []);
});

test('create refuses collisions, old service manager files and untrusted/symlinked units', async t => {
  const f = await fixture(t, { manager: true });
  await invoke(cmd('existing'), f);
  await assert.rejects(() => invoke(cmd('existing'), f), fails('already_exists'));
  const other = f.file('custom.service');
  await fs.writeFile(other, '[Service]\nType=oneshot\n');
  await assert.rejects(() => invoke(cmd('custom'), f), fails('already_exists'));
  const otherTimer = f.file('outsider.timer');
  await fs.writeFile(otherTimer, '[Timer]\nOnCalendar=daily\n');
  await assert.rejects(() => invoke(['remove', 'outsider', '--confirm', 'yes'], f), fails('not_managed'));
  const destination = path.join(f.home, 'outside-unit');
  await fs.writeFile(destination, 'keep');
  await fs.symlink(destination, f.file('symlink.timer'));
  await assert.rejects(() => invoke(['remove', 'symlink', '--confirm', 'yes'], f), fails('file_security'));
  assert.equal(await fs.readFile(destination, 'utf8'), 'keep');
});

test('remove refuses enabled or currently running timer and only cleans persistent timestamp after stop', async t => {
  const f = await fixture(t, { manager: true });
  await invoke(cmd('cleanup', ['--persistent', 'yes']), f);
  await invoke(['enable', 'cleanup', '--now'], f);
  await assert.rejects(() => invoke(['remove', 'cleanup', '--confirm', 'yes'], f), fails('timer_busy'));
  assert.ok(!f.calls.some(c => c.includes('clean')));
  await invoke(['disable', 'cleanup', '--now'], f);
  const removed = await invoke(['remove', 'cleanup', '--confirm', 'yes'], f);
  assert.equal(removed.status, 'removed');
  assert.equal(removed.removed.length, 2);
  assert.ok(f.calls.some(c => c[0] === 'systemctl' && c.includes('clean') && c.includes('--what=state')));
  for (const suffix of ['.service', '.timer']) {
    assert.equal(await fs.lstat(f.file('cleanup' + suffix)).then(() => true, () => false), false);
  }
});

test('failed timestamp clean prevents removal; reload failure reports partial state', async t => {
  const f = await fixture(t, { manager: true, cleanFail: true });
  await invoke(cmd('safety', ['--persistent', 'yes']), f);
  await assert.rejects(() => invoke(['remove', 'safety', '--confirm', 'yes'], f), fails('command_failed'));
  assert.equal((await fs.stat(f.file('safety.timer'))).isFile(), true);
  const bad = await fixture(t, { manager: true, reloadFail: true });
  await assert.rejects(() => invoke(cmd('partial'), bad), fails('partial_change'));
  assert.equal((await fs.stat(bad.file('partial.timer'))).isFile(), true);
  assert.equal((await fs.stat(bad.file('partial.service'))).isFile(), true);
});

test('environment file requires current user ownership and private permissions', async t => {
  const f = await fixture(t, { manager: true });
  const env = path.join(f.home, 'job.env');
  await fs.writeFile(env, 'SECRET=fixture\n');
  await fs.chmod(env, 0o644);
  await assert.rejects(() => invoke(cmd('envtask', ['--env-file', env]), f), fails('file_security'));
  await fs.chmod(env, 0o600);
  await invoke(cmd('envtask', ['--env-file', env]), f);
  assert.match(await fs.readFile(f.file('envtask.service'), 'utf8'), /EnvironmentFile="/u);
  const symlink = path.join(f.home, 'envlink');
  await fs.symlink(env, symlink);
  await assert.rejects(() => invoke(cmd('envlinktask', ['--env-file', symlink]), f), fails('file_security'));
});

test('root or unsupported platform cannot use timer CLI or write files', async t => {
  const f = await fixture(t, { manager: true });
  await assert.rejects(() => runTimer(parseTimerArgs(cmd('root')), { ...f.ctx, uid: 0 }), fails('unsupported_user'));
  await assert.rejects(() => runTimer(parseTimerArgs(cmd('mac')), { ...f.ctx, platform: 'darwin' }), fails('unsupported_platform'));
  assert.ok(!f.calls.some(c => c[0] === 'sudo' || c.includes('enable-linger')));
});

test('tampers to pair marker or unsafe directory are rejected by mutating operations', async t => {
  const f = await fixture(t, { manager: true });
  await invoke(cmd('safejob'), f);
  await fs.writeFile(f.file('safejob.service'), '[Service]\nType=oneshot\n');
  await assert.rejects(() => invoke(['enable', 'safejob'], f), fails('not_managed'));
  const second = await fixture(t, { manager: true });
  await invoke(cmd('dirjob'), second);
  const dir = path.dirname(second.file('dirjob.timer'));
  await fs.chmod(dir, 0o777);
  await assert.rejects(() => invoke(['remove', 'dirjob', '--confirm', 'yes'], second), fails('file_security'));
  await fs.chmod(dir, 0o700);
});
