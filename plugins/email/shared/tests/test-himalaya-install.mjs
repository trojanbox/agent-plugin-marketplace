import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import {
  assetFor, extractBinaryFromTgz, verifyReleaseDigest,
  downloadOfficialAsset, installPinnedHimalaya,
} from '../scripts/himalaya-install.mjs';

function tarArchive(name, bytes) {
  const payload = Buffer.from(bytes);
  const header = Buffer.alloc(512);
  header.write(name, 0, 'utf8');
  header.write(payload.length.toString(8).padStart(11, '0') + '\0', 124, 'ascii');
  header[156] = 48; // ordinary file
  const padding = Buffer.alloc((512 - payload.length % 512) % 512);
  return gzipSync(Buffer.concat([header, payload, padding, Buffer.alloc(1024)]));
}

test('official platform assets are version-pinned and hashed', () => {
  const linux = assetFor('linux', 'x64');
  assert.match(linux.name, /himalaya\.x86_64-linux\.tgz/u);
  assert.match(linux.url, /^https:\/\/github\.com\/pimalaya\/himalaya\/releases\/download\/v2\.2\.1\//u);
  assert.match(linux.sha256, /^[a-f0-9]{64}$/u);
  assert.match(assetFor('win32', 'x64').name, /windows\.tgz/u);
  assert.match(assetFor('darwin', 'arm64').name, /aarch64-darwin\.tgz/u);
  assert.throws(() => assetFor('win32', 'arm64'), /不支持/u);
});

test('verified TAR extractor only returns the exact binary', () => {
  const binary = Buffer.from('#!/bin/sh\necho himalaya\n');
  const archive = tarArchive('himalaya', binary);
  const digest = createHash('sha256').update(archive).digest('hex');
  verifyReleaseDigest(archive, digest);
  assert.deepEqual(extractBinaryFromTgz(archive, 'linux'), binary);
  assert.throws(() => verifyReleaseDigest(archive, '0'.repeat(64)), /SHA-256/u);
  assert.throws(() => extractBinaryFromTgz(tarArchive('../himalaya', binary), 'linux'), /找不到/u);
  assert.deepEqual(extractBinaryFromTgz(tarArchive('himalaya.exe', binary), 'win32'), binary);
});

test('self-repair install rejects a modified release before writing an executable', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'email-tampered-release-'));
  t.after(() => fs.rm(dir, {recursive: true, force: true}));
  await assert.rejects(
    () => installPinnedHimalaya(dir, {download: async () => tarArchive('himalaya', '#!/bin/sh\nexit 0')}),
    /SHA-256/u
  );
  await assert.rejects(() => fs.stat(path.join(dir, 'bin', 'himalaya')), /ENOENT/u);
});

test('download helper rejects non-GitHub download hosts before contacting network', async () => {
  await assert.rejects(() => downloadOfficialAsset('https://example.com/malware.tgz'), /GitHub 官方/u);
  await assert.rejects(() => downloadOfficialAsset('http://github.com/pimalaya/himalaya'), /GitHub 官方/u);
});
