import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { COLUMNS, DIMENSIONS, DEFAULT_DIMENSIONS, loadCatalog, parseCSV, validateCatalog, listCatalog, searchCatalog, selectCandidates, validateHistory } from '../plugins/writing/shared/horror/scripts/horror-selector.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = resolve(root, 'plugins/writing/shared/horror/scripts/horror-selector.mjs');
function fixture() {
  return { sources: [{ id: 'craft', url: 'https://example.org/craft' }], records: DIMENSIONS.flatMap((dimension) => Array.from({ length: 6 }, (_, index) => ({
    id: `${dimension}-${String(index + 1).padStart(3, '0')}`, dimension, label: `${dimension} ${index + 1}`, family: `family-${index + 1}`,
    tags: index === 0 ? 'shared|first' : 'shared|other', content_tags: index === 5 ? 'violence' : '', prompt: `人物与选择，${index + 1}`,
    use_when: '有明确人物动机', avoid_when: '仅为拼接', risk: '可能形成模板', source_ids: 'craft', provenance: 'original_synthesis',
  }))) };
}
function code(expected) { return (error) => error.code === expected; }
function temporary(t) { const dir = mkdtempSync(resolve(tmpdir(), 'horror-tools-test-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return dir; }
function writeFixture(directory, catalog = fixture()) {
  mkdirSync(directory, { recursive: true });
  const quote = (cell) => `"${cell.replaceAll('"', '""')}"`;
  for (const dimension of DIMENSIONS) writeFileSync(resolve(directory, `${dimension}.csv`), '\uFEFF' + [COLUMNS, ...catalog.records.filter((row) => row.dimension === dimension).map((row) => COLUMNS.map((column) => row[column]))].map((row) => row.map(quote).join(',')).join('\r\n') + '\r\n');
  writeFileSync(resolve(directory, 'sources.json'), JSON.stringify({ schemaVersion: 1, sources: catalog.sources }));
}
function cli(args, cwd = root) { return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' }); }

test('CSV handles BOM, CRLF, quoted comma, escaped quotes and multiline cell', () => {
  assert.deepEqual(parseCSV('\uFEFFid,text\r\na,"one, two\r\nthree ""four"""\r\n'), [['id', 'text'], ['a', 'one, two\r\nthree "four"']]);
  assert.deepEqual(parseCSV('a,b\n1,\n\n'), [['a', 'b'], ['1', '']]);
});
test('malformed CSV cannot silently shift or truncate fields', () => {
  for (const text of ['', 'a,b\n1', 'a,b\n1,2,3', 'a,b\n1,"unterminated', 'a,b\n1,a"b', 'a,b\n1,"x"z']) assert.throws(() => parseCSV(text), code('invalid_csv'));
});
test('catalog validation catches duplicate IDs and source mistakes', () => {
  const catalog = fixture();
  assert.equal(validateCatalog(catalog).records, 84);
  catalog.records.push({ ...catalog.records[0] });
  assert.throws(() => validateCatalog(catalog), code('duplicate_id'));
  catalog.records.pop(); catalog.records[0].source_ids = 'missing';
  assert.throws(() => validateCatalog(catalog), code('unknown_source'));
});
test('real bundled catalog is complete and selectable', () => {
  const catalog = loadCatalog();
  const report = validateCatalog(catalog);
  assert.equal(Object.keys(report.dimensions).length, 14);
  assert.ok(Object.values(report.dimensions).every((count) => count >= 18));
  assert.equal(selectCandidates(catalog, { seed: 'bundled-check' }).candidates.length, 3);
});
test('loading validates actual CSV headers and file dimensions', (t) => {
  const directory = temporary(t); writeFixture(directory);
  assert.equal(loadCatalog(directory).records.length, 84);
  writeFileSync(resolve(directory, 'contexts.csv'), 'id,dimension\ncontexts-001,contexts\n');
  assert.throws(() => loadCatalog(directory), code('invalid_header'));
  writeFixture(directory);
  const path = resolve(directory, 'contexts.csv');
  writeFileSync(path, readFileSync(path, 'utf8').replaceAll('"contexts"', '"engines"'));
  assert.throws(() => loadCatalog(directory), code('dimension_mismatch'));
});
test('list and search expose real records with explicit AND/OR filters', () => {
  const catalog = fixture();
  assert.equal(listCatalog(catalog, { dimensions: ['engines'] }).dimensions[0].count, 6);
  const result = searchCatalog(catalog, { dimensions: ['engines'], tags: ['shared', 'first'], query: '人物', families: ['engines:family-1'] });
  assert.equal(result.total, 1); assert.equal(result.rows[0].id, 'engines-001');
  assert.equal(searchCatalog(catalog, { query: 'does not exist' }).total, 0);
  assert.throws(() => searchCatalog(catalog, { tags: ['unknown'] }), code('unknown_tag'));
  assert.throws(() => searchCatalog(catalog, { limit: NaN }), code('invalid_input'));
});
test('fixed seeds replay full result including ordering and metadata', () => {
  const catalog = fixture(), request = { seed: '可复放-seed', pins: { contexts: 'contexts-001' } };
  assert.deepEqual(selectCandidates(catalog, request), selectCandidates(catalog, request));
  const randomResult = selectCandidates(catalog);
  assert.deepEqual(randomResult, selectCandidates(catalog, { seed: randomResult.seed }));
});
test('candidate diversity changes structure while scene remains pinned', () => {
  const result = selectCandidates(fixture(), { seed: 'fixed-scene', pins: { contexts: 'contexts-001' } });
  assert.deepEqual(result.activeDimensions, DEFAULT_DIMENSIONS);
  assert.ok(result.candidates.every((candidate) => candidate.ids.contexts === 'contexts-001'));
  for (const dimension of ['engines', 'choices', 'costs', 'endings']) assert.ok(new Set(result.candidates.map((candidate) => candidate.families[dimension])).size >= 2, dimension);
  assert.ok(result.candidates.every((candidate) => candidate.reviewRequired.length >= 3));
  assert.equal(result.hardConstraints.relaxed, false);
  assert.equal(result.sampling.optimalityGuaranteed, false);
});
test('pins activate optional dimensions, but cannot contradict explicit axes', () => {
  const catalog = fixture();
  assert.ok(selectCandidates(catalog, { seed: 1, pins: { fears: 'fears-001' } }).activeDimensions.includes('fears'));
  assert.throws(() => selectCandidates(catalog, { dimensions: ['engines'], pins: { fears: 'fears-001' } }), code('incompatible_constraints'));
  assert.throws(() => selectCandidates(catalog, { pins: { engines: 'fears-001' } }), code('incompatible_constraints'));
});
test('excluded IDs, tags, content tags and scoped families remain hard constraints', () => {
  const result = selectCandidates(fixture(), { seed: 3, excludeIds: ['engines-002'], excludeTags: ['violence'], excludeFamilies: ['choices:family-3'] });
  for (const candidate of result.candidates) {
    assert.notEqual(candidate.ids.engines, 'engines-002');
    assert.notEqual(candidate.families.choices, 'family-3');
    assert.ok(candidate.rows.every((row) => !row.content_tags.includes('violence')));
  }
  // Scoped family filters must not erase the same family on another axis.
  const scoped = selectCandidates(fixture(), { seed: 1, count: 1, pins: { contexts: 'contexts-003' }, excludeFamilies: ['choices:family-3'] });
  assert.equal(scoped.candidates[0].ids.contexts, 'contexts-003');
});
test('pin/exclude conflicts and empty pools fail without fallback', () => {
  const catalog = fixture();
  for (const exclusion of [{ excludeIds: ['engines-001'] }, { excludeTags: ['first'] }, { excludeFamilies: ['engines:family-1'] }]) assert.throws(() => selectCandidates(catalog, { pins: { engines: 'engines-001' }, ...exclusion }), code('incompatible_constraints'));
  assert.throws(() => selectCandidates(catalog, { excludeTags: ['shared'] }), code('empty_pool'));
});
test('impossible candidate count reports exact available combinations without duplication', () => {
  const catalog = fixture();
  assert.throws(() => selectCandidates(catalog, { count: 3, dimensions: ['engines'], pins: { engines: 'engines-001' } }), (error) => error.code === 'insufficient_combinations' && error.details.available === '1');
  const result = selectCandidates(catalog, { dimensions: ['engines'], count: 6, seed: 1 });
  assert.equal(result.sampling.exhaustive, true);
  assert.equal(new Set(result.candidates.map((candidate) => candidate.ids.engines)).size, 6);
});
test('unknown identifiers and unsupported fields fail rather than disappear', () => {
  const catalog = fixture();
  for (const [request, expected] of [
    [{ dimensions: ['unknown'] }, 'unknown_dimension'], [{ pins: { typo: 'engines-001' } }, 'unknown_dimension'],
    [{ pins: { engines: 'unknown' } }, 'unknown_id'], [{ excludeIds: ['unknown'] }, 'unknown_id'],
    [{ excludeTags: ['unknown'] }, 'unknown_tag'], [{ excludeFamilies: ['engines:unknown'] }, 'unknown_family'],
    [{ excludeFamilies: ['typo:family-1'] }, 'unknown_family'], [{ include: ['first'] }, 'unknown_field'],
  ]) assert.throws(() => selectCandidates(catalog, request), code(expected));
});
test('invalid sizes, nulls, nonfinite values and duplicate dimensions are rejected', () => {
  const catalog = fixture();
  for (const request of [{ count: 0 }, { count: 9 }, { count: 1.1 }, { count: Infinity }, { count: null }, { sampleSize: NaN }, { sampleSize: 23 }, { sampleSize: 513 }, { pins: null }, { seed: Infinity }, { seed: ' ' }, { seed: {} }, { excludeIds: null }, { dimensions: [] }]) assert.throws(() => selectCandidates(catalog, request), code('invalid_input'));
  assert.throws(() => selectCandidates(catalog, { dimensions: ['engines', 'engines'] }), code('duplicate_input'));
});
test('explicit history reduces structural repetition without overriding hard pins', () => {
  const catalog = fixture(), request = { seed: 'history' };
  const initial = selectCandidates(catalog, request);
  const story = { id: 'previous', families: initial.candidates[0].families, ids: initial.candidates[0].ids };
  const varied = selectCandidates(catalog, request, { history: [story] });
  assert.equal(varied.historyCount, 1);
  assert.ok(varied.candidates[0].history.maxWeightedSimilarity < .6);
  const pinned = selectCandidates(catalog, { seed: 'history', count: 1, pins: story.ids }, { history: [story] });
  assert.equal(pinned.candidates[0].history.maxWeightedSimilarity, 1);
  assert.ok(pinned.candidates[0].warnings.some((warning) => warning.includes('重复较高')));
  assert.deepEqual(pinned.candidates[0].ids, story.ids);
});
test('history family matching is per-dimension and malformed history fails', () => {
  const catalog = fixture();
  const result = selectCandidates(catalog, { seed: 1, count: 1, dimensions: ['engines'], pins: { engines: 'engines-001' } }, { history: [{ families: { contexts: 'family-1' } }] });
  assert.equal(result.candidates[0].history.maxWeightedSimilarity, 0);
  assert.equal(result.candidates[0].history.comparisons[0].comparable, false);
  for (const history of [null, {}, { stories: {} }, [{ families: {} }], [{ families: { engines: 'unknown' } }], [{ families: { engines: 'family-1' }, ids: { engines: 'engines-002' } }]]) assert.throws(() => validateHistory(history, catalog));
});
test('CLI resolves history relative to request file and leaves files untouched', (t) => {
  const directory = temporary(t), catalogDir = resolve(directory, 'catalog'); writeFixture(catalogDir);
  const historyPath = resolve(directory, 'recent.json'), requestPath = resolve(directory, 'request.json');
  const history = JSON.stringify({ stories: [{ families: { engines: 'family-1' } }] });
  writeFileSync(historyPath, history); writeFileSync(requestPath, JSON.stringify({ seed: 'relative-history', historyFile: 'recent.json' }));
  const result = cli(['select', '--request', requestPath, '--catalog-dir', catalogDir], tmpdir());
  assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).historyCount, 1);
  assert.equal(readFileSync(historyPath, 'utf8'), history);
  const invalid = cli(['select', '--request', requestPath, '--request', requestPath, '--catalog-dir', catalogDir]);
  assert.equal(invalid.status, 1); assert.equal(JSON.parse(invalid.stderr).error.code, 'usage'); assert.equal(invalid.stdout, '');
});
test('CLI help works without catalogs and malformed request produces structured failure', (t) => {
  const help = cli(['--help'], tmpdir()); assert.equal(help.status, 0); assert.match(help.stdout, /historyFile/);
  const directory = temporary(t), requestPath = resolve(directory, 'bad.json');
  writeFileSync(requestPath, '{bad');
  const result = cli(['select', '--request', requestPath]);
  assert.equal(result.status, 1); assert.equal(JSON.parse(result.stderr).error.code, 'invalid_json_file'); assert.equal(result.stdout, '');
});
test('relocated writing shared folder runs from arbitrary cwd without marketplace runtime', (t) => {
  const directory = temporary(t), target = resolve(directory, 'installed-writing/shared/horror');
  cpSync(resolve(root, 'plugins/writing/shared/horror/scripts'), resolve(target, 'scripts'), { recursive: true });
  writeFixture(resolve(target, 'catalogs'));
  const result = spawnSync(process.execPath, [resolve(target, 'scripts/horror-selector.mjs'), 'select'], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).candidates.length, 3);
});
