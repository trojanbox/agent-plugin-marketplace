import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, unitName, serviceContents, run, SystemdUserError } from '../scripts/systemd-user.mjs';

const err = status => error => error instanceof SystemdUserError && error.status === status;
async function fixture(t, { manager = true, linger = 'no', reloadFails = false, denyLinger = false } = {}) {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'systemd-user-test-'));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  const calls = [], state = new Map();
  let lingerState = linger;
  const runner = async (cmd, args) => {
    calls.push([cmd, ...args]);
    if (cmd === 'loginctl') {
      if (args[0] === 'show-user') return { stdout: lingerState + '\n' };
      if (args[0] === 'enable-linger') {
        if (denyLinger) return { code: 1, stderr: 'Access denied by policy' };
        lingerState = 'yes';
        return { stdout: '' };
      }
      throw Error('unexpected loginctl args: ' + args);
    }
    if (cmd === 'journalctl') return { stdout: 'Oct 29 13:01:01 fixture hello\n' };
    assert.equal(cmd, 'systemctl');
    assert.equal(args[0], '--user');
    if (!manager) return { code: 1, stderr: 'Failed to connect to bus: No medium found' };
    if (args[1] === 'show-environment') return { stdout: 'PATH=/usr/bin\n' };
    if (args[1] === 'daemon-reload') {
      return reloadFails ? { code: 1, stderr: 'reload failed' } : { stdout: '' };
    }
    if (args[1] === 'list-unit-files') {
      return { stdout: 'alpha.service enabled enabled\nbeta.service disabled disabled\n' };
    }
    if (args[1] === 'show') {
      const unit = args.at(-1);
      const file = path.join(home, '.config', 'systemd', 'user', unit);
      const exists = await fs.stat(file).then(() => true, () => false);
      const s = state.get(unit) || {};
      return { stdout: [
        'LoadState=' + (exists ? 'loaded' : 'not-found'),
        'ActiveState=' + (s.active || 'inactive'),
        'SubState=dead',
        'UnitFileState=' + (s.enabled || 'disabled'),
        'MainPID=0',
        'FragmentPath=' + (exists ? file : ''),
        'Result=success',
      ].join('\n') + '\n' };
    }
    const action = args[1], unit = args.at(-1);
    const s = state.get(unit) || { active: 'inactive', enabled: 'disabled' };
    if (action === 'enable') { s.enabled = 'enabled'; if (args.includes('--now')) s.active = 'active'; }
    else if (action === 'disable') { s.enabled = 'disabled'; if (args.includes('--now')) s.active = 'inactive'; }
    else if (action === 'start') s.active = 'active';
    else if (action === 'stop') s.active = 'inactive';
    else if (action === 'restart') s.active = 'active';
    else throw Error('unexpected systemctl call: ' + args.join(' '));
    state.set(unit, s);
    return { stdout: '' };
  };
  const ctx = { home, uid: process.getuid(), platform: 'linux', runner };
  return { home, ctx, calls, state, file: name => path.join(home, '.config', 'systemd', 'user', name + '.service') };
}
const createArgs = (name = 'myapp', extras = []) =>
  ['create', name, '--exec', process.execPath, '--arg', '/tmp/demo.js', ...extras];

test('strict CLI routing and unit names block paths, command injection, missing confirmation', () => {
  assert.deepEqual(parseArgs([]), { mode: 'help' });
  assert.equal(unitName('my-app.service'), 'my-app.service');
  for (const name of ['/etc/systemd/user/evil', '../x', 'foo/bar', 'foo@bar', '*.service', '.hidden', '--user']) {
    assert.throws(() => unitName(name), err('invalid_input'));
  }
  for (const argv of [
    ['create', 'x', '--exec', 'relative'],
    ['create', 'x', '--exec', process.execPath, '--description', 'a\n[Service]\nExecStart=/bin/sh'],
    ['create', 'x', '--exec', process.execPath, '--arg', 'a\rExecStart=oops'],
    ['create', 'x', '--exec', process.execPath, '--arg', ';'],
    ['create', 'x', '--exec', process.execPath, '--cwd', '/tmp/../etc'],
    ['create', 'x', '--exec', process.execPath, '--weird', 'value'],
    ['create', 'x', '--exec', process.execPath, '--exec', process.execPath],
    ['update', 'x', '--exec', process.execPath],
    ['remove', 'x'],
    ['stop', 'x', '--now'],
    ['logs', 'x', '--lines', '501'],
    ['linger', 'enable'],
  ]) assert.throws(() => parseArgs(argv), err('invalid_input'), argv.join(' '));
});
test('service template safely quotes argv, escapes expansion, and only installs in user default.target', () => {
  const spec = parseArgs(createArgs('demo', ['--arg', 'a b', '--arg', 'dollar$var%v', '--arg', 'quote"x\\y',
    '--cwd', '/tmp', '--description', 'My % app', '--restart', 'always']));
  const unit = serviceContents(spec);
  assert.match(unit, /^# Managed by agent-plugin-marketplace:tools\/linux-systemd-user/mu);
  assert.ok(unit.includes('ExecStart="' + process.execPath + '" "/tmp/demo.js" "a b" "dollar$$var%%v" "quote\\"x\\\\y"'));
  assert.match(unit, /Description=My %% app/u);
  assert.match(unit, /WorkingDirectory="\/tmp"/u);
  const special = serviceContents(parseArgs(createArgs('special', ['--cwd', '/tmp/price$cost%z'])));
  assert.ok(special.includes('WorkingDirectory="/tmp/price$cost%%z"'));
  assert.match(unit, /Restart=always/u);
  assert.match(unit, /WantedBy=default.target/u);
  assert.doesNotMatch(unit, /WantedBy=multi-user.target|User=root|ExecStart=\/bin\/sh/u);
});
test('create, inspect, logs, enable, linger, disable and remove through explicitly user-scoped calls', async t => {
  const f = await fixture(t);
  const created = await run(parseArgs(createArgs()), f.ctx);
  assert.equal(created.status, 'created');
  assert.equal(created.enabled, false);
  assert.equal(created.started, false);
  assert.equal((await fs.stat(f.file('myapp'))).mode & 0o777, 0o600);
  assert.equal((await run(parseArgs(['status', 'myapp']), f.ctx)).LoadState, 'loaded');
  const logs = await run(parseArgs(['logs', 'myapp', '--lines', '20']), f.ctx);
  assert.match(logs.text, /fixture hello/u);
  const listed = await run(parseArgs(['list']), f.ctx);
  assert.equal(listed.count, 2);
  const enabled = await run(parseArgs(['enable', 'myapp', '--now']), f.ctx);
  assert.equal(enabled.UnitFileState, 'enabled');
  assert.equal(enabled.ActiveState, 'active');
  assert.match(enabled.note, /linger=yes/u);
  assert.equal((await run(parseArgs(['linger', 'status']), f.ctx)).linger, 'no');
  const enabling = await run(parseArgs(['linger', 'enable', '--confirm', 'yes']), f.ctx);
  assert.equal(enabling.status, 'linger_enabled');
  await assert.rejects(() => run(parseArgs(['remove', 'myapp', '--confirm', 'yes']), f.ctx), err('service_busy'));
  await run(parseArgs(['disable', 'myapp', '--now']), f.ctx);
  const removed = await run(parseArgs(['remove', 'myapp', '--confirm', 'yes']), f.ctx);
  assert.equal(removed.status, 'removed');
  assert.equal(await fs.stat(f.file('myapp')).then(() => true, () => false), false);
  for (const call of f.calls) {
    assert.notEqual(call[0], 'sudo');
    if (call[0] === 'systemctl') assert.equal(call[1], '--user');
  }
});
test('update changes marked unit atomically, requires confirmation and never silently restarts', async t => {
  const f = await fixture(t);
  await run(parseArgs(createArgs('app2')), f.ctx);
  const old = await fs.readFile(f.file('app2'), 'utf8');
  const updated = await run(parseArgs(['update', 'app2', '--exec', process.execPath, '--arg', '/tmp/new.js',
    '--cwd', '/tmp', '--confirm', 'yes']), f.ctx);
  assert.equal(updated.status, 'updated');
  assert.equal(updated.restart_required, true);
  assert.notEqual(await fs.readFile(f.file('app2'), 'utf8'), old);
  assert.equal((await run(parseArgs(['update', 'app2', '--exec', process.execPath, '--arg', '/tmp/new.js',
    '--cwd', '/tmp', '--confirm', 'yes']), f.ctx)).status, 'unchanged');
  assert.ok(!f.calls.some(call => call.includes('restart')));
  assert.deepEqual((await fs.readdir(path.dirname(f.file('app2')))).filter(x => x.endsWith('.tmp')), []);
});
test('create refuses collisions; unmarked units and symlinks cannot be replaced or removed', async t => {
  const f = await fixture(t);
  await run(parseArgs(createArgs('original')), f.ctx);
  await assert.rejects(() => run(parseArgs(createArgs('original')), f.ctx), err('already_exists'));
  const unrelated = f.file('custom');
  await fs.writeFile(unrelated, '[Service]\nExecStart=/bin/true\n');
  await assert.rejects(() => run(parseArgs(['remove', 'custom', '--confirm', 'yes']), f.ctx), err('not_managed'));
  await assert.rejects(() => run(parseArgs(['update', 'custom', '--exec', process.execPath,
    '--confirm', 'yes']), f.ctx), err('not_managed'));
  const external = path.join(f.home, 'outside');
  await fs.writeFile(external, 'external content');
  await fs.symlink(external, f.file('symlink'));
  await assert.rejects(() => run(parseArgs(['remove', 'symlink', '--confirm', 'yes']), f.ctx), err('file_security'));
  assert.equal(await fs.readFile(external, 'utf8'), 'external content');
});
test('env file needs current ownership and private mode; nonexistent binary is rejected before file creation', async t => {
  const f = await fixture(t);
  const env = path.join(f.home, 'app.env');
  await fs.writeFile(env, 'TOKEN=fixture\n');
  await fs.chmod(env, 0o644);
  await assert.rejects(() => run(parseArgs(createArgs('envdemo', ['--env-file', env])), f.ctx), err('file_security'));
  await fs.chmod(env, 0o600);
  await run(parseArgs(createArgs('envdemo', ['--env-file', env])), f.ctx);
  assert.ok((await fs.readFile(f.file('envdemo'), 'utf8')).includes('EnvironmentFile="' + env + '"'));
  await assert.rejects(() => run(parseArgs(['create', 'missing', '--exec', '/nonexistent/exec']), f.ctx),
    err('invalid_input'));
  assert.equal(await fs.stat(f.file('missing')).then(() => true, () => false), false);
});
test('unsupported platform and root are rejected; no-user-bus does not create a service', async t => {
  const f = await fixture(t, { manager: false });
  assert.equal((await run(parseArgs(['doctor']), f.ctx)).user_manager_available, false);
  await assert.rejects(() => run(parseArgs(createArgs('offline')), f.ctx), err('user_manager_unavailable'));
  assert.equal(await fs.stat(f.file('offline')).then(() => true, () => false), false);
  await assert.rejects(() => run(parseArgs(['list']), { ...f.ctx, uid: 0 }), err('unsupported_user'));
  await assert.rejects(() => run(parseArgs(['list']), { ...f.ctx, platform: 'darwin' }), err('unsupported_platform'));
});
test('reload failure reports persistent partial change; no false claim of success', async t => {
  const f = await fixture(t, { reloadFails: true });
  await assert.rejects(() => run(parseArgs(createArgs('partial')), f.ctx), err('partial_change'));
  assert.equal((await fs.stat(f.file('partial'))).isFile(), true);
});
test('parent symlink and world-writable unit directories are rejected for managed writes', async t => {
  const f = await fixture(t);
  await run(parseArgs(createArgs('safe')), f.ctx);
  const unitDir = path.dirname(f.file('safe'));
  await fs.chmod(unitDir, 0o777);
  await assert.rejects(() => run(parseArgs(['update', 'safe', '--exec', process.execPath,
    '--confirm', 'yes']), f.ctx), err('file_security'));
  await fs.chmod(unitDir, 0o700);
  const second = await fixture(t);
  await fs.mkdir(path.join(second.home, '.config'), { mode: 0o700 });
  await fs.symlink(unitDir, path.join(second.home, '.config', 'systemd'));
  await assert.rejects(() => run(parseArgs(createArgs('linkdemo')), second.ctx), err('file_security'));
});

test('linger refuses implicit privilege escalation, and reports admin requirement on policy denial', async t => {
  const f = await fixture(t, { denyLinger: true });
  await assert.rejects(() => run(parseArgs(['linger', 'enable', '--confirm', 'yes']), f.ctx),
    err('permission_required'));
  assert.ok(!f.calls.some(c => c[0] === 'sudo'));
});
