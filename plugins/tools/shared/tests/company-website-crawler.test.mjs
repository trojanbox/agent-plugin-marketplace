import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  normalizeSite, canonicalUrl, deduplicateEntries, groupCandidates,
  validateSelection, aggregateStatus,
} from '../scripts/company-crawler-core.mjs';
import {
  initializeConfig, loadConfig, configPaths, execute, callProvider,
} from '../scripts/company-website-crawler.mjs';

const cfg = { firecrawl_api_key: 'firecrawl-test-only', deepseek_api_key: 'deepseek-test-only' };
const asJson = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), {
  status, headers: { 'content-type': 'application/json', ...headers },
});
const dir = async () => fs.mkdtemp(path.join(os.tmpdir(), 'company-crawler-test-'));
const pageHash = url => createHash('sha256').update(url).digest('hex').slice(0, 24);
function providerMock(routes, calls = []) {
  return async (endpoint, args) => {
    const body = JSON.parse(args.body);
    calls.push({ endpoint, body });
    const route = routes.find(x => endpoint.endsWith(x.endpoint) &&
      (x.url === undefined || body.url === x.url));
    if (!route) throw new Error('unmocked provider: ' + endpoint);
    return typeof route.response === 'function' ? route.response() : route.response;
  };
}

test('main/www scope accepts only safe normal domain URLs, keeps content query', () => {
  const site = normalizeSite('example.com');
  assert.equal(site.home_url, 'https://example.com/');
  assert.equal(canonicalUrl('/about#team', site), 'https://example.com/about');
  assert.equal(canonicalUrl('https://www.example.com/catalog?p=2', site),
    'https://www.example.com/catalog?p=2');
  assert.equal(canonicalUrl('https://blog.example.com/about', site), null);
  assert.equal(canonicalUrl('https://example.com.evil.org/', site), null);
  assert.equal(canonicalUrl('file:///etc/passwd', site), null);
  assert.equal(canonicalUrl('http://user:pass@example.com/', site), null);
  assert.throws(() => normalizeSite('http://127.0.0.1'), /公开/);
});

test('candidate grouping is heuristic; different info pages stay distinct', () => {
  const site = normalizeSite('example.com');
  const raw = ['/about/factory', '/about/team', '/about/certifications',
    ...Array.from({ length: 120 }, (_, i) => '/catalog/ring-' + String(i + 1))];
  const discovered = deduplicateEntries(raw, site, 'sitemap');
  const grouped = groupCandidates(discovered.accepted, site.home_url);
  assert.equal(grouped.groups.length, 1);
  assert.equal(grouped.groups[0].count, 120);
  assert.equal(grouped.singles.length, 3);
  assert.equal(grouped.groups[0].homogeneous, 'unverified');
  const valid = validateSelection({
    selected_urls: [site.home_url, 'https://example.com/about/team',
      'https://example.com/catalog/ring-1'],
    primary_language: 'en', homogeneous_groups: [{
      group_id: grouped.groups[0].id, representative_url: 'https://example.com/catalog/ring-1',
    }],
  }, { site }, discovered, grouped);
  assert.equal(valid.selected_urls.length, 3);
  assert.throws(() => validateSelection({ primary_language: 'en', selected_urls: [
    'https://shop.example.com/products', ], homogeneous_groups: [],
  }, { site }, discovered, grouped), /URL/);
  assert.throws(() => validateSelection({ primary_language: 'en', selected_urls: [
    'https://example.com/catalog/ring-1', 'https://example.com/catalog/ring-2',
  ], homogeneous_groups: [{
    group_id: grouped.groups[0].id, representative_url: 'https://example.com/catalog/ring-1',
  }] }, { site }, discovered, grouped), /同质/);
});

test('status: homepage-only discovered incompletely is partial_success', () => {
  assert.deepEqual(aggregateStatus(['https://example.com/'],
    { 'https://example.com/': 'success' }, true), {
    status: 'partial_success', selected_count: 1, success_count: 1,
    failed_count: 0, pending_count: 0, discovery_incomplete: true,
  });
  assert.equal(aggregateStatus(['a'], { a: 'success' }, false).status, 'success');
  assert.equal(aggregateStatus(['a'], { a: 'failed' }, false).status, 'failed');
});

test('private keys: init saves config locally, never outputs keys, requires replace', async t => {
  const home = await dir();
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  const p = configPaths(home);
  const created = await initializeConfig({ home, secrets: ['firecrawl-example-secret', 'deepseek-example-secret'] });
  assert.equal(created.ok, true);
  assert.equal(created.firecrawl_configured, true);
  assert.equal('firecrawl_api_key' in created, false);
  assert.equal((await loadConfig(home)).deepseek_api_key, 'deepseek-example-secret');
  assert.equal((await fs.stat(p.file)).mode & 0o077, 0);
  await assert.rejects(() => initializeConfig({ home, secrets: ['new-example-secret', 'new-example-secret'] }),
    /配置已存在/);
  await initializeConfig({ home, replace: true,
    secrets: ['new-firecrawl-secret', 'new-deepseek-secret'] });
  assert.equal((await loadConfig(home)).firecrawl_api_key, 'new-firecrawl-secret');
});

test('retryable provider HTTP 503 attempts exactly 3, permanent 401 exactly 1', async () => {
  let attempts = 0;
  const unavailable = async () => { attempts++; return asJson({ success: false }, 503); };
  await assert.rejects(() => callProvider('https://api.firecrawl.dev/v2/map', 'fake', {},
    { fetchImpl: unavailable, sleep: async () => {} }), /抓取服务/);
  assert.equal(attempts, 3);
  attempts = 0;
  const unauth = async () => { attempts++; return asJson({ error: 'unauthorized' }, 401); };
  await assert.rejects(() => callProvider('https://api.firecrawl.dev/v2/map', 'fake', {},
    { fetchImpl: unauth, sleep: async () => {} }), /抓取服务/);
  assert.equal(attempts, 1);
});

test('Map technical failure exits failed, never silently Scrape homepage', async t => {
  const root = await dir();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const calls = [];
  const mock = providerMock([{ endpoint: '/map', response: asJson({ error: 'blocked' }, 401) }], calls);
  const result = await execute(['discover', '--url', 'example.com', '--out', root],
    { config: cfg, fetchImpl: mock, sleep: async () => {} });
  assert.equal(result.status, 'failed');
  assert.equal(result.phase, 'map_failed');
  assert.equal(calls.length, 1);
  const manifest = JSON.parse(await fs.readFile(path.join(result.run, 'manifest.json'), 'utf8'));
  assert.equal(manifest.status, 'failed');
  assert.equal(manifest.failures[0].phase, 'map');
});

test('no sitemap + homepage link scrape failure still Fetches homepage, partial_success', async t => {
  const root = await dir();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const calls = [];
  const mock = providerMock([
    { endpoint: '/map', response: asJson({ success: true, links: [] }) },
    { endpoint: '/scrape', response: asJson({ error: 'unavailable' }, 503) },
    { endpoint: '/fetch', response: asJson({ title: 'Company', content: 'Welcome to example.com company services.' }) },
  ], calls);
  const result = await execute(['discover', '--url', 'example.com', '--out', root],
    { config: cfg, fetchImpl: mock, sleep: async () => {} });
  assert.equal(result.status, 'partial_success');
  assert.equal(result.discovery_incomplete, true);
  assert.equal(result.success_count, 1);
  assert.equal(result.failed_count, 0);
  assert.equal(calls.filter(x => x.endpoint.endsWith('/scrape')).length, 3);
});

test('Agent selection + partial success + resume only failed page', async t => {
  const root = await dir();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const calls = [];
  const mock = providerMock([
    { endpoint: '/map', response: asJson({ success: true, links: [
      { url: 'https://example.com/about' }, { url: 'https://example.com/contact' },
    ] }) },
    { endpoint: '/fetch', url: 'https://example.com/',
      response: asJson({ title: 'Home', content: 'Our company manufactures jewellery, contact us.' }) },
    { endpoint: '/fetch', url: 'https://example.com/about',
      response: asJson({ title: 'About', content: 'Our company was founded in 2000.' }) },
    { endpoint: '/fetch', url: 'https://example.com/contact',
      response: asJson({ error: 'blocked' }, 403) },
  ], calls);
  const discovered = await execute(['discover', '--url', 'example.com', '--out', root],
    { config: cfg, fetchImpl: mock, sleep: async () => {} });
  assert.equal(discovered.status, 'needs_agent_selection');
  const selectionFile = path.join(root, 'selection.json');
  await fs.writeFile(selectionFile, JSON.stringify({
    selected_urls: ['https://example.com/about', 'https://example.com/contact'],
    primary_language: 'en', homogeneous_groups: [],
  }));
  await execute(['select', '--run', discovered.run, '--input', selectionFile], { config: cfg });
  const result = await execute(['fetch', '--run', discovered.run],
    { config: cfg, fetchImpl: mock, sleep: async () => {} });
  assert.equal(result.status, 'partial_success');
  assert.equal(result.success_count, 2);
  assert.equal(result.failed_count, 1);
  const resumedCalls = [];
  const recovered = await execute(['resume', '--run', discovered.run], {
    config: cfg, fetchImpl: providerMock([{
      endpoint: '/fetch', url: 'https://example.com/contact',
      response: asJson({ title: 'Contact', content: 'Contact our team today.' }),
    }], resumedCalls),
    sleep: async () => {},
  });
  assert.equal(recovered.status, 'success');
  assert.equal(recovered.success_count, 3);
  assert.equal(resumedCalls.length, 1);
  const manifest = JSON.parse(await fs.readFile(path.join(discovered.run, 'manifest.json'), 'utf8'));
  assert.ok(manifest.failures.some(x => x.url === 'https://example.com/contact'));
});

test('all selected pages failing yields failed and ok false', async t => {
  const root = await dir();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const mock = providerMock([
    { endpoint: '/map', response: asJson({ success: true, links: ['https://example.com/about'] }) },
    { endpoint: '/fetch', response: asJson({ error: 'blocked' }, 403) },
  ]);
  const discovered = await execute(['discover', '--url', 'example.com', '--out', root],
    { config: cfg, fetchImpl: mock, sleep: async () => {} });
  assert.equal(discovered.status, 'needs_agent_selection');
  const input = path.join(root, 'selection.json');
  await fs.writeFile(input, JSON.stringify({
    selected_urls: ['https://example.com/about'], primary_language: 'en', homogeneous_groups: [],
  }));
  await execute(['select', '--run', discovered.run, '--input', input], { config: cfg });
  const result = await execute(['fetch', '--run', discovered.run],
    { config: cfg, fetchImpl: mock, sleep: async () => {} });
  assert.equal(result.status, 'failed');
  assert.equal(result.ok, false);
  assert.equal(result.success_count, 0);
  assert.equal(result.failed_count, 2);
});

test('repair of corrupted saved content re-fetches and retains evidence', async t => {
  const root = await dir();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const fetchMock = providerMock([
    { endpoint: '/map', response: asJson({ success: true, links: [] }) },
    { endpoint: '/scrape', response: asJson({ success: true, data: { links: [] } }) },
    { endpoint: '/fetch', response: asJson({ title: 'Home', content: 'Initial original homepage content' }) },
  ]);
  const first = await execute(['discover', '--url', 'example.com', '--out', root],
    { config: cfg, fetchImpl: fetchMock, sleep: async () => {} });
  assert.equal(first.status, 'success');
  const page = path.join(first.run, 'pages', pageHash('https://example.com/') + '.json');
  const old = JSON.parse(await fs.readFile(page, 'utf8'));
  old.content = 'modified without sha update';
  await fs.writeFile(page, JSON.stringify(old));
  const repaired = await execute(['resume', '--run', first.run], {
    config: cfg, fetchImpl: providerMock([{
      endpoint: '/fetch', response: asJson({ title: 'New', content: 'Website changed after resume' }),
    }]), sleep: async () => {},
  });
  assert.equal(repaired.status, 'success');
  const content = JSON.parse(await fs.readFile(page, 'utf8'));
  assert.equal(content.content, 'Website changed after resume');
  assert.equal(content.recovered, true);
  const entries = await fs.readdir(path.join(first.run, 'pages'));
  assert.ok(entries.some(x => x.includes('.corrupt-')));
  const manifest = JSON.parse(await fs.readFile(path.join(first.run, 'manifest.json'), 'utf8'));
  assert.equal(manifest.recovered_attempts[0].reason, 'corrupt_file');
});
