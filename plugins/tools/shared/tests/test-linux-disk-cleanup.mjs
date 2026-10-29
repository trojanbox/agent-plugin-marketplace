import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs, run, DiskCleanupError } from '../scripts/linux-disk-cleanup.mjs';

const errorIs = status => error => error instanceof DiskCleanupError && error.status === status;
async function fixture(t) {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'safe-disk-test-'));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  const uid = process.getuid();
  const cache = path.join(home, '.cache');
  const npm = path.join(home, '.npm', '_cacache');
  const logs = path.join(home, '.npm', '_logs');
  await fs.mkdir(cache, { recursive: true, mode: 0o700 });
  await fs.mkdir(npm, { recursive: true, mode: 0o700 });
  await fs.mkdir(logs, { recursive: true, mode: 0o700 });
  const npmCalls = [];
  return {
    home, uid, cache, npm, logs, npmCalls,
    ctx: { home, uid, platform: 'linux', now: new Date('2026-10-30T10:00:00.000Z').getTime(),
      // Test-only simulated local human terminal. The production CLI has no injected approver.
      approve: async ({ challenge }) => challenge,
      npmRunner: async (program, args, options) => {
        npmCalls.push({ program, args, options });
        return { stdout: 'Cache verified and compressed\nContent verified: 1 (4 bytes)\n' };
      } },
    async put(relative, text, ageDays = 60) {
      const file = path.join(home, relative);
      await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      await fs.writeFile(file, text);
      if (ageDays !== null) {
        const date = new Date(Date.parse('2026-10-30T10:00:00.000Z') - ageDays * 86400_000);
        await fs.utimes(file, date, date);
      }
      return file;
    },
  };
}
async function invoke(f, args) { return run(parseArgs(args), f.ctx); }

test('CLI parser rejects agent-supplied confirmation and rejects age-based npm maintenance', () => {
  assert.equal(parseArgs([]).mode, 'help');
  assert.deepEqual(parseArgs(['scan']), { mode: 'scan', scope: 'user-cache', olderDays: 30 });
  assert.equal(parseArgs(['report']).mode, 'report');
  assert.equal(parseArgs(['scan', '--scope', 'npm-cache']).scope, 'npm-cache');
  for (const args of [
    ['rm', '-rf', '/'], ['scan', '--path', '/home'], ['scan', '--scope', '/tmp'],
    ['scan', '--scope', 'projects'], ['scan', '--older-than', '0'],
    ['scan', '--older-than', '-1'], ['scan', '--older-than', '3651'],
    ['scan', '--older-than', '01'], ['scan', '--scope', 'user-cache', '--scope', 'npm-cache'],
    ['scan', '--confirm', 'yes'], ['clean'], ['clean', '--confirm', 'yes'],
    ['scan', '--scope', 'npm-cache', '--older-than', '60'],
    ['clean', '--scope', 'npm-cache', '--older-than', '60', '--plan', 'a'.repeat(64)],
    ['clean', '--plan', 'not-sha'],
    ['clean', '--plan', 'a'.repeat(64), '--confirm', 'yes'],
    ['clean', '--plan', 'a'.repeat(64), '--confirm', 'YES'],
    ['doctor', '--scope', 'user-cache'], ['report', '--scope', 'npm-cache'],
  ]) assert.throws(() => parseArgs(args), errorIs('invalid_input'), args.join(' '));
  assert.equal(parseArgs(['clean', '--plan', 'a'.repeat(64)]).mode, 'clean');
});

test('read-only doctor and report expose disk, home and bounded top-level size summary', async t => {
  const f = await fixture(t);
  await f.put('Documents/important.db', 'very-important', 70);
  await f.put('.cache/test.bin', 'cache-data', 70);
  const d = await invoke(f, ['doctor']);
  assert.equal(d.scope, 'current_user');
  assert.equal(d.uid, f.uid);
  assert.equal(d.supported_targets.length, 3);
  const report = await invoke(f, ['report']);
  assert.equal(report.status, 'report');
  assert.ok(report.filesystem.total_bytes >= report.filesystem.free_bytes);
  assert.equal(report.home, f.home);
  assert.ok(report.entries.some(x => x.name === 'Documents' && x.size_bytes >= 10));
  assert.ok(report.entries.some(x => x.name === '.cache'));
  assert.equal(await fs.readFile(path.join(f.home, 'Documents/important.db'), 'utf8'), 'very-important');
  assert.equal(await fs.readFile(path.join(f.home, '.cache/test.bin'), 'utf8'), 'cache-data');
});

test('user-cache scan shows preview, excludes new files, and cannot change contents', async t => {
  const f = await fixture(t);
  await f.put('.cache/older.tmp', 'old1234', 90);
  await f.put('.cache/recent.tmp', 'new12345', 3);
  await f.put('Documents/important.db', 'safe', 365);
  const scan = await invoke(f, ['scan']);
  assert.equal(scan.status, 'plan');
  assert.equal(scan.scope, 'user-cache');
  assert.equal(scan.eligible_count, 1);
  assert.equal(scan.estimated_bytes, 7);
  assert.match(scan.plan, /^[a-f0-9]{64}$/u);
  assert.deepEqual(scan.sample.map(x => x.relative_path), ['older.tmp']);
  assert.equal(scan.older_than_days, 30);
  assert.equal(await fs.readFile(path.join(f.cache, 'older.tmp'), 'utf8'), 'old1234');
});


test('without a local interactive approval cleanup fails closed, even with a valid plan', async t => {
  const f = await fixture(t);
  const candidate = await f.put('.cache/old-for-confirm', 'keep-until-confirmed', 90);
  const scan = await invoke(f, ['scan']);
  const ctx = { ...f.ctx };
  delete ctx.approve; // Unit tests have no local interactive TTY.
  await assert.rejects(() => run(parseArgs(['clean', '--plan', scan.plan]), ctx),
    errorIs('approval_required'));
  assert.equal(await fs.readFile(candidate, 'utf8'), 'keep-until-confirmed');
  f.ctx.approve = async () => 'yes'; // A scripted yes cannot satisfy plan-bound challenge.
  await assert.rejects(() => invoke(f, ['clean', '--plan', scan.plan]), errorIs('approval_denied'));
  assert.equal(await fs.readFile(candidate, 'utf8'), 'keep-until-confirmed');
  await assert.rejects(() => run({
    mode: 'clean', scope: '/tmp', olderDays: 30, plan: scan.plan,
  }, f.ctx), errorIs('invalid_input'));
  await assert.rejects(() => run({
    mode: 'clean', scope: 'user-cache', olderDays: 0, plan: scan.plan,
  }, f.ctx), errorIs('invalid_input'));
  assert.equal(await fs.readFile(candidate, 'utf8'), 'keep-until-confirmed');
});

test('clean deletes only scanned old user-cache files with exact plan and confirm', async t => {
  const f = await fixture(t);
  await f.put('.cache/old-blob', '12345678', 90);
  await f.put('.cache/keep-recent', '1234', 1);
  await f.put('Documents/important.db', 'dont-touch', 99);
  const plan = await invoke(f, ['scan']);
  const cleaned = await invoke(f, ['clean', '--plan', plan.plan]);
  assert.equal(cleaned.status, 'cleaned');
  assert.equal(cleaned.deleted_count, 1);
  assert.equal(cleaned.estimated_bytes, 8);
  assert.equal(await fs.lstat(path.join(f.cache, 'old-blob')).then(() => true, () => false), false);
  assert.equal(await fs.readFile(path.join(f.cache, 'keep-recent'), 'utf8'), '1234');
  assert.equal(await fs.readFile(path.join(f.home, 'Documents/important.db'), 'utf8'), 'dont-touch');
  const second = await invoke(f, ['scan']);
  assert.equal(second.eligible_count, 0);
  await assert.rejects(() => invoke(f, ['clean', '--plan', plan.plan]),
    errorIs('stale_plan'));
});

test('npm-cache uses native npm cache verify, never directly unlinks _cacache files', async t => {
  const f = await fixture(t);
  const cached = await f.put('.npm/_cacache/index/a', 'a', 99);
  await f.put('.npm/_cacache/content-v2/sha512/b', 'new', 1);
  await f.put('.npm/_logs/2026.log', 'logs', 99);
  await f.put('.npmrc', 'registry=https://private.example.com', 99);
  await f.put('.npm/config', 'persist', 99);
  const cache = await invoke(f, ['scan', '--scope', 'npm-cache']);
  assert.equal(cache.scope, 'npm-cache');
  assert.equal(cache.strategy, 'npm_cache_verify');
  assert.equal(cache.eligible_count, null);
  assert.equal(cache.estimated_bytes, null);
  assert.equal(cache.inspected_count, 2); // Both recent and old cache entries are seen.
  const result = await invoke(f, ['clean', '--scope', 'npm-cache', '--plan', cache.plan]);
  assert.equal(result.status, 'maintenance_completed');
  assert.equal(result.strategy, 'npm_cache_verify');
  assert.equal(result.deleted_count, null); // npm owns any garbage collection.
  assert.equal(result.estimated_bytes, null);
  assert.equal(f.npmCalls.length, 1);
  const call = f.npmCalls[0];
  assert.equal(call.program, 'npm');
  assert.deepEqual(call.args.slice(0, 2), ['cache', 'verify']);
  assert.ok(call.args.includes('--offline'));
  assert.ok(call.args.includes('--ignore-scripts'));
  assert.equal(call.args[call.args.indexOf('--cache') + 1], path.join(f.home, '.npm'));
  assert.equal(call.options.cwd, f.home);
  assert.equal(await fs.readFile(cached, 'utf8'), 'a');
  assert.equal(await fs.readFile(path.join(f.logs, '2026.log'), 'utf8'), 'logs');
  assert.equal(await fs.readFile(path.join(f.home, '.npmrc'), 'utf8'), 'registry=https://private.example.com');
  const logs = await invoke(f, ['scan', '--scope', 'npm-logs']);
  assert.equal(logs.eligible_count, 1);
  await invoke(f, ['clean', '--scope', 'npm-logs', '--plan', logs.plan]);
  assert.equal(await fs.readFile(path.join(f.home, '.npm/config'), 'utf8'), 'persist');
});

test('npm verify rejects dangerous cache trees and changed snapshots before invoking npm', async t => {
  const f = await fixture(t);
  await f.put('.npm/_cacache/index/entry', 'contents', 90);
  const plan = await invoke(f, ['scan', '--scope', 'npm-cache']);
  await f.put('.npm/_cacache/index/new-entry', 'new', 1);
  await assert.rejects(() => invoke(f, ['clean', '--scope', 'npm-cache', '--plan', plan.plan]),
    errorIs('stale_plan'));
  assert.equal(f.npmCalls.length, 0);
  const escaped = await f.put('Documents/important', 'preserve', 90);
  await fs.symlink(escaped, path.join(f.npm, 'unsafe-symlink'));
  await assert.rejects(() => invoke(f, ['scan', '--scope', 'npm-cache']),
    errorIs('unsafe_directory'));
  assert.equal(await fs.readFile(escaped, 'utf8'), 'preserve');
  assert.equal(f.npmCalls.length, 0);
});

test('failed npm-native cache verification stops and reports error without local deletion', async t => {
  const f = await fixture(t);
  const file = await f.put('.npm/_cacache/index/a', 'important-cache', 90);
  f.ctx.npmRunner = async () => { throw new Error('npm exited 1'); };
  const scan = await invoke(f, ['scan', '--scope', 'npm-cache']);
  await assert.rejects(() => invoke(f, ['clean', '--scope', 'npm-cache', '--plan', scan.plan]),
    errorIs('maintenance_failed'));
  assert.equal(await fs.readFile(file, 'utf8'), 'important-cache');
});

test('changed files during user confirmation invalidate the plan before any deletion', async t => {
  const f = await fixture(t);
  const original = await f.put('.cache/approved', 'keep-data', 90);
  f.ctx.approve = async ({ challenge }) => {
    await f.put('.cache/new-since-approval', 'new-data', 90);
    return challenge;
  };
  const plan = await invoke(f, ['scan']);
  await assert.rejects(() => invoke(f, ['clean', '--plan', plan.plan]), errorIs('stale_plan'));
  assert.equal(await fs.readFile(original, 'utf8'), 'keep-data');
});

test('npm cache verify executes on an isolated real temporary cache when npm is available', async t => {
  try { execFileSync('npm', ['--version'], { timeout: 3000, stdio: 'ignore' }); }
  catch { t.skip('npm not installed'); return; }
  const f = await fixture(t);
  await f.put('.npm/_cacache/index-v5/test', 'invalid index fixture', 90);
  delete f.ctx.npmRunner; // Real npm, but the cache and HOME are fixture-owned temporary directories.
  const plan = await invoke(f, ['scan', '--scope', 'npm-cache']);
  const result = await invoke(f, ['clean', '--scope', 'npm-cache', '--plan', plan.plan]);
  assert.equal(result.status, 'maintenance_completed');
  assert.equal(result.strategy, 'npm_cache_verify');
  assert.equal(result.deleted_count, null);
  assert.equal(result.estimated_bytes, null);
  assert.match(result.native_output, /Cache|Content|verified|garbage/iu);
  assert.ok((await fs.stat(f.home)).isDirectory());
});

test('snapshot fingerprint detects files added, altered, swapped, removed, or changed age flags', async t => {
  const f = await fixture(t);
  const original = await f.put('.cache/old-a', 'first', 99);
  const plan = await invoke(f, ['scan']);
  await f.put('.cache/old-b', 'second', 99);
  await assert.rejects(() => invoke(f, ['clean', '--plan', plan.plan]),
    errorIs('stale_plan'));
  await fs.rm(path.join(f.cache, 'old-b'));
  await fs.writeFile(original, 'changed');
  await assert.rejects(() => invoke(f, ['clean', '--plan', plan.plan]),
    errorIs('stale_plan'));
  await assert.rejects(() => invoke(f, ['clean', '--older-than', '60', '--plan', plan.plan]), errorIs('stale_plan'));
  assert.equal(await fs.readFile(original, 'utf8'), 'changed');
});

test('symlinks and hardlinks are never selected; target file outside cache remains intact', async t => {
  const f = await fixture(t);
  const important = await f.put('Documents/important.txt', 'do-not-delete', 99);
  await fs.symlink(important, path.join(f.cache, 'link-to-important'));
  await fs.symlink(path.join(f.home, 'Documents'), path.join(f.cache, 'link-dir'));
  const hardlink = path.join(f.cache, 'linked');
  await fs.link(important, hardlink);
  const plan = await invoke(f, ['scan']);
  assert.equal(plan.eligible_count, 0);
  assert.ok(plan.skipped_unsafe >= 2);
  await assert.rejects(() => invoke(f, ['clean', '--plan', plan.plan]),
    errorIs('no_candidates'));
  assert.equal(await fs.readFile(important, 'utf8'), 'do-not-delete');
  assert.equal((await fs.lstat(path.join(f.cache, 'link-dir'))).isSymbolicLink(), true);
});

test('symlinked cache root or writable cache directory rejects even read-only scan', async t => {
  const f = await fixture(t);
  await f.put('.cache/a', 'X', 99);
  await fs.chmod(f.cache, 0o777);
  await assert.rejects(() => invoke(f, ['scan']), errorIs('unsafe_directory'));
  await fs.chmod(f.cache, 0o700);
  await fs.rm(f.cache, { recursive: true });
  await fs.symlink(path.join(f.home, 'Documents'), f.cache);
  await assert.rejects(() => invoke(f, ['scan']), errorIs('unsafe_directory'));
});

test('unsafe nested folders cannot be cleaned and do not impact safe sibling candidates', async t => {
  const f = await fixture(t);
  await f.put('.cache/safe/old.txt', 'delete-me', 91);
  await f.put('.cache/unsafe/keep', 'keep-me', 91);
  await fs.chmod(path.join(f.cache, 'unsafe'), 0o777);
  const plan = await invoke(f, ['scan']);
  assert.equal(plan.eligible_count, 1);
  assert.ok(plan.skipped_unsafe > 0);
  await invoke(f, ['clean', '--plan', plan.plan]);
  assert.equal(await fs.readFile(path.join(f.cache, 'unsafe/keep'), 'utf8'), 'keep-me');
  await fs.chmod(path.join(f.cache, 'unsafe'), 0o700);
});

test('missing target is read-only and never creates directories', async t => {
  const f = await fixture(t);
  await fs.rm(f.cache, { recursive: true });
  const result = await invoke(f, ['scan']);
  assert.equal(result.status, 'missing_target');
  assert.equal(result.eligible_count, 0);
  assert.equal(await fs.lstat(f.cache).then(() => true, () => false), false);
});

test('root contexts, macOS, or arbitrary home path are refused', async t => {
  const f = await fixture(t);
  await assert.rejects(() => run(parseArgs(['scan']), { ...f.ctx, uid: 0 }),
    errorIs('unsupported_user'));
  await assert.rejects(() => run(parseArgs(['scan']), { ...f.ctx, platform: 'darwin' }),
    errorIs('unsupported_platform'));
  await assert.rejects(() => run(parseArgs(['scan']), { ...f.ctx, home: '/tmp/../etc' }),
    errorIs('invalid_input'));
});

test('bounded scan rejects huge candidate trees rather than returning incomplete actionable plan', async t => {
  const f = await fixture(t);
  await f.put('.cache/first', 'one', 99);
  await f.put('.cache/second', 'two', 99);
  await assert.rejects(() => run(parseArgs(['scan']), { ...f.ctx, scanLimit: 1 }),
    errorIs('scan_limit'));
});


test('project-like trees and database or credential files inside cache are protected', async t => {
  const f = await fixture(t);
  await f.put('.cache/project-a/package.json', '{"private":true}', 100);
  await f.put('.cache/project-a/src/app.js', 'important-source', 100);
  await f.put('.cache/.git/config', 'important-git-config', 100);
  await f.put('.cache/node_modules/pkg/index.js', 'dependency-source', 100);
  await f.put('.cache/package.json', 'project-root-metadata', 100);
  await f.put('.cache/appdata/storage.sqlite', 'important-database', 100);
  await f.put('.cache/appdata/token.pem', 'important-credential', 100);
  await f.put('.cache/appdata/.env', 'IMPORTANT=1', 100);
  await f.put('.cache/disposable/old.tar.gz', 'safe-old-cache', 100);
  const plan = await invoke(f, ['scan']);
  assert.equal(plan.eligible_count, 1);
  assert.deepEqual(plan.sample.map(x => x.relative_path), ['disposable/old.tar.gz']);
  assert.ok(plan.skipped_unsafe >= 4);
  await invoke(f, ['clean', '--plan', plan.plan]);
  assert.equal(await fs.readFile(path.join(f.cache, 'project-a/src/app.js'), 'utf8'), 'important-source');
  assert.equal(await fs.readFile(path.join(f.cache, '.git/config'), 'utf8'), 'important-git-config');
  assert.equal(await fs.readFile(path.join(f.cache, 'node_modules/pkg/index.js'), 'utf8'), 'dependency-source');
  assert.equal(await fs.readFile(path.join(f.cache, 'package.json'), 'utf8'), 'project-root-metadata');
  assert.equal(await fs.readFile(path.join(f.cache, 'appdata/storage.sqlite'), 'utf8'), 'important-database');
  assert.equal(await fs.readFile(path.join(f.cache, 'appdata/token.pem'), 'utf8'), 'important-credential');
  assert.equal(await fs.readFile(path.join(f.cache, 'appdata/.env'), 'utf8'), 'IMPORTANT=1');
});
test('report bounds deep directory listings and marks incomplete sizes', async t => {
  const f = await fixture(t);
  await f.put('Documents/one', '1111', 5);
  await f.put('Documents/two', '2222', 5);
  const r = await run(parseArgs(['report']), { ...f.ctx, reportLimit: 1 });
  assert.equal(r.status, 'report');
  assert.equal(r.truncated, true);
  assert.ok(r.scanned_entries <= 1);
  assert.match(r.note, /下限/u);
});

test('candidate replacement after final plan cannot result in accidental other-file deletion', async t => {
  const f = await fixture(t);
  const file = await f.put('.cache/old', 'old', 91);
  const plan = await invoke(f, ['scan']);
  await fs.rm(file);
  await fs.symlink(await f.put('Documents/keep', 'preserve', 99), file);
  await assert.rejects(() => invoke(f, ['clean', '--plan', plan.plan]),
    errorIs('stale_plan'));
  assert.equal(await fs.readFile(path.join(f.home, 'Documents/keep'), 'utf8'), 'preserve');
});
