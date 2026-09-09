#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(await fs.readFile(path.join(here, 'UPSTREAM.json'), 'utf8'));
const target = path.join(here, 'upstream');
const args = new Set(process.argv.slice(2));
const verifyOnly = args.has('--verify-only');
const force = args.has('--force');
const markerPath = path.join(target, '.upstream.json');
const required = ['SKILL.md', 'system-prompt.md', 'project-types.json'];

function assertSafe(rel) {
  if (!rel || path.isAbsolute(rel) || rel.includes('\0')) throw new Error(`unsafe path: ${rel}`);
  const normalized = path.posix.normalize(rel.replaceAll('\\', '/'));
  if (normalized === '..' || normalized.startsWith('../')) throw new Error(`path traversal: ${rel}`);
  const resolved = path.resolve(target, normalized);
  const prefix = path.resolve(target) + path.sep;
  if (resolved !== path.resolve(target) && !resolved.startsWith(prefix)) throw new Error(`path escape: ${rel}`);
  return { normalized, resolved };
}

async function readMarker() {
  try { return JSON.parse(await fs.readFile(markerPath, 'utf8')); } catch { return null; }
}

async function verify() {
  const marker = await readMarker();
  if (!marker || marker.commit !== cfg.commit || marker.subtreeSha !== cfg.subtreeSha) {
    throw new Error('upstream hydration missing or pinned revision mismatch');
  }
  for (const rel of required) await fs.access(assertSafe(rel).resolved);
  const pt = JSON.parse(await fs.readFile(assertSafe('project-types.json').resolved, 'utf8'));
  if (!Array.isArray(pt.projectTypes) || pt.projectTypes.length !== 13) throw new Error('unexpected project-types.json');
  console.log(JSON.stringify({ ok: true, mode: 'verify', commit: cfg.commit, subtreeSha: cfg.subtreeSha, files: marker.files }, null, 2));
}

if (verifyOnly) {
  await verify();
  process.exit(0);
}

const existing = await readMarker();
if (existing?.commit === cfg.commit && existing?.subtreeSha === cfg.subtreeSha && !force) {
  await verify();
  process.exit(0);
}

const apiHeaders = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'agent-plugin-marketplace-baoyu-materializer' };
if (process.env.GITHUB_TOKEN) apiHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const treeUrl = `https://api.github.com/repos/${cfg.repository}/git/trees/${cfg.rootTreeSha}?recursive=1`;
const treeRes = await fetch(treeUrl, { headers: apiHeaders });
if (!treeRes.ok) throw new Error(`GitHub tree fetch failed: ${treeRes.status} ${await treeRes.text()}`);
const tree = await treeRes.json();
if (tree.truncated) throw new Error('GitHub returned a truncated tree; refusing partial hydration');

const prefix = `${cfg.subtreePath}/`;
const entries = tree.tree.filter((e) => e.type === 'blob' && e.path.startsWith(prefix));
if (!entries.length) throw new Error(`pinned subtree not found: ${cfg.subtreePath}`);

// Confirm the subtree object itself still matches the reviewed SHA.
const subtreeEntry = tree.tree.find((e) => e.type === 'tree' && e.path === cfg.subtreePath);
if (!subtreeEntry || subtreeEntry.sha !== cfg.subtreeSha) {
  throw new Error(`subtree SHA mismatch: expected ${cfg.subtreeSha}, got ${subtreeEntry?.sha ?? 'missing'}`);
}

await fs.rm(target, { recursive: true, force: true });
await fs.mkdir(target, { recursive: true });

let completed = 0;
const queue = [...entries];
const workers = Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const entry = queue.shift();
    const rel = entry.path.slice(prefix.length);
    const { normalized, resolved } = assertSafe(rel);
    const raw = `https://raw.githubusercontent.com/${cfg.repository}/${cfg.commit}/${cfg.subtreePath}/${normalized}`;
    const res = await fetch(raw, { headers: { 'User-Agent': apiHeaders['User-Agent'] } });
    if (!res.ok) throw new Error(`raw fetch failed ${res.status}: ${normalized}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, bytes);
    completed += 1;
  }
});
await Promise.all(workers);

await fs.writeFile(markerPath, JSON.stringify({
  repository: cfg.repository,
  commit: cfg.commit,
  rootTreeSha: cfg.rootTreeSha,
  subtreePath: cfg.subtreePath,
  subtreeSha: cfg.subtreeSha,
  files: completed,
  hydratedAt: new Date().toISOString()
}, null, 2) + '\n');

await verify();
