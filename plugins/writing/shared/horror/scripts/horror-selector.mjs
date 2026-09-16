#!/usr/bin/env node
/** Read-only horror direction catalog tooling. Node built-ins only. */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';

export const DIMENSIONS = Object.freeze(['contexts', 'pressures', 'relationships', 'fears', 'engines', 'anomalies', 'evidence', 'perspectives', 'temporal_forms', 'rhythms', 'choices', 'costs', 'endings', 'everyday_anchors']);
export const DEFAULT_DIMENSIONS = Object.freeze(['contexts', 'relationships', 'engines', 'choices', 'costs', 'endings']);
export const COLUMNS = Object.freeze(['id', 'dimension', 'label', 'family', 'tags', 'content_tags', 'prompt', 'use_when', 'avoid_when', 'risk', 'source_ids', 'provenance']);
export const DEFAULT_CATALOG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../catalogs');
const WEIGHTS = Object.freeze({ contexts: 1, pressures: 2, relationships: 3, fears: 2, engines: 5, anomalies: 2, evidence: 1, perspectives: 1, temporal_forms: 1, rhythms: 1, choices: 5, costs: 4, endings: 4, everyday_anchors: 1 });
const PURPOSE = '构思部件草案；不是已验证的故事，不保证原创，也不要求把每个部件写入正文。';

export class CatalogError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'CatalogError'; this.code = code; this.details = details; }
}
function fail(code, message, details) { throw new CatalogError(code, message, details); }
function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('invalid_input', `${label} must be an object.`);
}
function fields(value, allowed, label) {
  object(value, label);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail('unknown_field', `Unknown ${label} field: ${key}.`);
}
function string(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail('invalid_input', `${label} must be a nonempty string.`);
  return value;
}
function strings(value, label) {
  if (!Array.isArray(value)) fail('invalid_input', `${label} must be an array.`);
  value.forEach((item) => string(item, label));
  if (new Set(value).size !== value.length) fail('duplicate_input', `${label} contains duplicates.`);
  return value;
}
function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail('invalid_input', `${label} must be an integer between ${min} and ${max}.`);
  return value;
}
const split = (value) => value ? value.split('|') : [];
function readJSON(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { fail('invalid_json_file', `Cannot read JSON file: ${path}.`, { reason: error.message }); }
}

/** Strict RFC-style CSV parser: BOM, CRLF and quoted multiline fields supported. */
export function parseCSV(input, label = 'CSV') {
  if (typeof input !== 'string') fail('invalid_csv', `${label} must be text.`);
  const text = input.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], cell = '', state = 'start', line = 1, rowTouched = false;
  const endCell = () => { row.push(cell); cell = ''; state = 'start'; };
  const endRow = () => { endCell(); if (rowTouched || row.length > 1 || row[0] !== '') rows.push(row); row = []; rowTouched = false; };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (state === 'quoted') {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else state = 'closed';
      } else { cell += char; if (char === '\n') line++; }
      continue;
    }
    if (char === ',') { rowTouched = true; endCell(); continue; }
    if (char === '\r' || char === '\n') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      endRow(); line++; continue;
    }
    if (state === 'closed') fail('invalid_csv', `${label}: unexpected character after closing quote at line ${line}.`);
    if (char === '"') {
      if (state !== 'start') fail('invalid_csv', `${label}: quote inside unquoted field at line ${line}.`);
      state = 'quoted'; rowTouched = true;
    } else { state = 'unquoted'; cell += char; rowTouched = true; }
  }
  if (state === 'quoted') fail('invalid_csv', `${label}: unclosed quoted field at line ${line}.`);
  if (rowTouched || row.length || cell || state === 'closed') endRow();
  if (!rows.length) fail('invalid_csv', `${label} is empty.`);
  const width = rows[0].length;
  rows.forEach((values, index) => { if (values.length !== width) fail('invalid_csv', `${label}: row ${index + 1} has ${values.length} columns; expected ${width}.`); });
  return rows;
}

export function validateCatalog(catalog) {
  object(catalog, 'catalog');
  if (!Array.isArray(catalog.records) || !catalog.records.length) fail('invalid_catalog', 'Catalog records must be a nonempty array.');
  if (!Array.isArray(catalog.sources) || !catalog.sources.length) fail('invalid_catalog', 'Catalog sources must be a nonempty array.');
  const sourceIds = new Set();
  for (const source of catalog.sources) {
    object(source, 'source');
    string(source.id, 'source.id'); string(source.url, 'source.url');
    if (sourceIds.has(source.id)) fail('duplicate_source', `Duplicate source ID: ${source.id}.`);
    try { if (!['http:', 'https:'].includes(new URL(source.url).protocol)) throw new Error('unsupported protocol'); }
    catch { fail('invalid_source', `Source URL must use HTTP(S): ${source.id}.`); }
    sourceIds.add(source.id);
  }
  const ids = new Set(), counts = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, 0]));
  for (const record of catalog.records) {
    fields(record, COLUMNS, 'catalog row');
    for (const column of COLUMNS.filter((column) => column !== 'content_tags')) string(record[column], `row.${column}`);
    if (typeof record.content_tags !== 'string') fail('invalid_catalog', 'row.content_tags must be a string (empty when no content tags apply).');
    if (!DIMENSIONS.includes(record.dimension)) fail('unknown_dimension', `Unknown row dimension: ${record.dimension}.`);
    if (!new RegExp(`^${record.dimension}-[0-9]{3,}$`).test(record.id)) fail('invalid_catalog', `ID does not match dimension: ${record.id}.`);
    if (ids.has(record.id)) fail('duplicate_id', `Duplicate row ID: ${record.id}.`);
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(record.family)) fail('invalid_catalog', `Invalid family: ${record.family}.`);
    for (const field of ['tags', 'content_tags', 'source_ids']) {
      const values = split(record[field]);
      strings(values, `${record.id}.${field}`);
      if (values.some((value) => value !== value.trim())) fail('invalid_catalog', `${record.id}.${field} has surrounding whitespace.`);
    }
    for (const source of split(record.source_ids)) if (!sourceIds.has(source)) fail('unknown_source', `${record.id} references unknown source: ${source}.`);
    if (record.provenance !== 'original_synthesis') fail('invalid_catalog', `Unsupported provenance: ${record.id}.`);
    ids.add(record.id); counts[record.dimension]++;
  }
  for (const [dimension, count] of Object.entries(counts)) if (!count) fail('missing_dimension', `Missing catalog dimension: ${dimension}.`);
  return { valid: true, records: catalog.records.length, dimensions: counts, sources: sourceIds.size };
}

export function loadCatalog(directory = DEFAULT_CATALOG_DIR) {
  let files;
  try { files = readdirSync(directory).filter((name) => name.endsWith('.csv')).sort(); }
  catch (error) { fail('catalog_read_error', `Cannot read catalog directory: ${directory}.`, { reason: error.message }); }
  const expected = DIMENSIONS.map((dimension) => `${dimension}.csv`).sort();
  if (JSON.stringify(files) !== JSON.stringify(expected)) fail('catalog_files', 'Catalog must contain exactly the 14 known dimension CSV files.', { expected, actual: files });
  const records = [];
  for (const file of files) {
    let source;
    try { source = readFileSync(resolve(directory, file), 'utf8'); }
    catch (error) { fail('catalog_read_error', `Cannot read catalog: ${file}.`, { reason: error.message }); }
    const [header, ...rows] = parseCSV(source, file);
    if (JSON.stringify(header) !== JSON.stringify(COLUMNS)) fail('invalid_header', `${file}: header must match the documented 12-column schema.`, { expected: COLUMNS, actual: header });
    for (const row of rows) {
      const record = Object.fromEntries(header.map((key, index) => [key, row[index]]));
      if (`${record.dimension}.csv` !== file) fail('dimension_mismatch', `${record.id}: row dimension does not match file ${file}.`);
      records.push(record);
    }
  }
  const sourceData = readJSON(resolve(directory, 'sources.json'));
  object(sourceData, 'sources file');
  if (sourceData.schemaVersion !== 1) fail('invalid_catalog', 'sources.json schemaVersion must be 1.');
  const catalog = { records: records.sort((a, b) => a.id.localeCompare(b.id, 'en')), sources: sourceData.sources };
  validateCatalog(catalog);
  return catalog;
}

function indexes(catalog) {
  validateCatalog(catalog);
  return { ids: new Map(catalog.records.map((row) => [row.id, row])), tags: new Set(catalog.records.flatMap((row) => [...split(row.tags), ...split(row.content_tags)])), families: new Set(catalog.records.map((row) => row.family)), scopedFamilies: new Set(catalog.records.map((row) => `${row.dimension}:${row.family}`)) };
}
function dimensions(value, label = 'dimensions') {
  strings(value, label);
  if (!value.length) fail('invalid_input', `${label} cannot be empty.`);
  value.forEach((dimension) => { if (!DIMENSIONS.includes(dimension)) fail('unknown_dimension', `Unknown dimension: ${dimension}.`); });
  return value;
}
function knownList(value, set, label, code) {
  const result = strings(value === undefined ? [] : value, label);
  for (const item of result) if (!set.has(item)) fail(code, `Unknown ${label}: ${item}.`);
  return result;
}
function familyList(value, idx, label) {
  const result = strings(value === undefined ? [] : value, label);
  for (const family of result) if (!(family.includes(':') ? idx.scopedFamilies.has(family) : idx.families.has(family))) fail('unknown_family', `Unknown ${label}: ${family}. Use dimension:family for scoped filtering.`);
  return result;
}
const familyMatches = (row, families) => families.includes(row.family) || families.includes(`${row.dimension}:${row.family}`);

export function listCatalog(catalog, request = {}) {
  fields(request, ['dimensions'], 'list request');
  indexes(catalog);
  const selected = request.dimensions === undefined ? DIMENSIONS : dimensions(request.dimensions);
  return { dimensions: selected.map((dimension) => {
    const rows = catalog.records.filter((row) => row.dimension === dimension);
    return { dimension, count: rows.length, families: [...new Set(rows.map((row) => row.family))].sort(), tags: [...new Set(rows.flatMap((row) => [...split(row.tags), ...split(row.content_tags)]))].sort() };
  }) };
}

export function searchCatalog(catalog, request = {}) {
  fields(request, ['query', 'dimensions', 'tags', 'families', 'limit'], 'search request');
  const idx = indexes(catalog);
  const selected = request.dimensions === undefined ? DIMENSIONS : dimensions(request.dimensions);
  const tags = knownList(request.tags, idx.tags, 'tags', 'unknown_tag');
  const families = familyList(request.families, idx, 'families');
  const query = request.query === undefined ? '' : string(request.query, 'query').toLocaleLowerCase();
  const limit = integer(request.limit === undefined ? 50 : request.limit, 1, 1000, 'limit');
  const rows = catalog.records.filter((row) => selected.includes(row.dimension)
    && tags.every((tag) => [...split(row.tags), ...split(row.content_tags)].includes(tag))
    && (!families.length || familyMatches(row, families))
    && (!query || Object.values(row).some((value) => value.toLocaleLowerCase().includes(query))));
  rows.sort((a, b) => a.id.localeCompare(b.id, 'en'));
  return { total: rows.length, returned: Math.min(rows.length, limit), rows: rows.slice(0, limit), semantics: 'query is a literal case-insensitive substring; tags are AND; families are OR; all supplied filters combine with AND.' };
}

export function validateHistory(input, catalog) {
  const idx = indexes(catalog);
  let stories;
  if (Array.isArray(input)) stories = input;
  else { fields(input, ['stories'], 'history'); stories = input.stories; }
  if (!Array.isArray(stories) || stories.length > 1000) fail('invalid_history', 'history stories must be an array with at most 1000 entries.');
  return stories.map((story, index) => {
    fields(story, ['id', 'families', 'ids'], `history story ${index}`);
    if (story.id !== undefined) string(story.id, 'history story id');
    object(story.families, `history story ${index}.families`);
    if (!Object.keys(story.families).length) fail('invalid_history', `history story ${index} has no family signature.`);
    for (const [dimension, family] of Object.entries(story.families)) {
      if (!DIMENSIONS.includes(dimension)) fail('unknown_dimension', `Unknown history dimension: ${dimension}.`);
      string(family, `history ${dimension} family`);
      if (!idx.scopedFamilies.has(`${dimension}:${family}`)) fail('unknown_family', `Unknown history family: ${dimension}:${family}.`);
    }
    if (story.ids !== undefined) {
      object(story.ids, 'history ids');
      for (const [dimension, id] of Object.entries(story.ids)) {
        if (!DIMENSIONS.includes(dimension)) fail('unknown_dimension', `Unknown history ID dimension: ${dimension}.`);
        string(id, 'history row ID');
        const row = idx.ids.get(id);
        if (!row) fail('unknown_id', `Unknown history ID: ${id}.`);
        if (row.dimension !== dimension || story.families[dimension] !== row.family) fail('invalid_history', `History ID/family mismatch: ${dimension}:${id}.`);
      }
    }
    return { id: story.id ?? `history-${index + 1}`, families: { ...story.families } };
  });
}

function rng(seed) {
  let state = 2166136261;
  for (const char of seed) { state ^= char.codePointAt(0); state = Math.imul(state, 16777619); }
  return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
}
function similarity(first, second, active) {
  let matchedWeight = 0, comparedWeight = 0;
  const matchedDimensions = [], comparedDimensions = [];
  for (const dimension of active) {
    if (first[dimension] === undefined || second[dimension] === undefined) continue;
    comparedWeight += WEIGHTS[dimension]; comparedDimensions.push(dimension);
    if (first[dimension] === second[dimension]) { matchedWeight += WEIGHTS[dimension]; matchedDimensions.push(dimension); }
  }
  return { score: comparedWeight ? matchedWeight / comparedWeight : 0, matchedDimensions, comparedDimensions, comparable: comparedWeight > 0 };
}
const signature = (rows) => Object.fromEntries(rows.map((row) => [row.dimension, row.family]));

/** Generates bounded, reproducible component drafts; never writes a catalog or history. */
export function selectCandidates(catalog, request = {}, options = {}) {
  fields(request, ['seed', 'count', 'dimensions', 'pins', 'excludeIds', 'excludeTags', 'excludeFamilies', 'historyFile', 'sampleSize'], 'select request');
  fields(options, ['history', 'baseDir'], 'selection options');
  const idx = indexes(catalog);
  let seed = request.seed;
  if (seed === undefined) seed = randomBytes(12).toString('hex');
  if (!(typeof seed === 'string' && seed.trim().length > 0) && !(typeof seed === 'number' && Number.isFinite(seed))) fail('invalid_input', 'seed must be a nonempty string or finite number.');
  seed = String(seed);
  const count = integer(request.count === undefined ? 3 : request.count, 1, 8, 'count');
  const sampleSize = integer(request.sampleSize === undefined ? 256 : request.sampleSize, 24, 512, 'sampleSize');
  const active = [...(request.dimensions === undefined ? DEFAULT_DIMENSIONS : dimensions(request.dimensions))];
  const pins = request.pins === undefined ? {} : request.pins;
  object(pins, 'pins');
  for (const dimension of Object.keys(pins).sort()) {
    if (!DIMENSIONS.includes(dimension)) fail('unknown_dimension', `Unknown pin dimension: ${dimension}.`);
    const id = string(pins[dimension], `pins.${dimension}`), row = idx.ids.get(id);
    if (!row) fail('unknown_id', `Unknown pinned ID: ${id}.`);
    if (row.dimension !== dimension) fail('incompatible_constraints', `Pinned ID ${id} does not belong to ${dimension}.`);
    if (!active.includes(dimension)) {
      if (request.dimensions !== undefined) fail('incompatible_constraints', `Pinned dimension ${dimension} is not in explicit dimensions.`);
      active.push(dimension);
    }
  }
  const excludeIds = knownList(request.excludeIds, new Set(idx.ids.keys()), 'excludeIds', 'unknown_id');
  const excludeTags = knownList(request.excludeTags, idx.tags, 'excludeTags', 'unknown_tag');
  const excludeFamilies = familyList(request.excludeFamilies, idx, 'excludeFamilies');
  const allowed = (row) => !excludeIds.includes(row.id)
    && ![...split(row.tags), ...split(row.content_tags)].some((tag) => excludeTags.includes(tag))
    && !familyMatches(row, excludeFamilies);
  const pools = active.map((dimension) => {
    if (pins[dimension] && !allowed(idx.ids.get(pins[dimension]))) fail('incompatible_constraints', `Pinned ID ${pins[dimension]} is also excluded.`, { dimension, id: pins[dimension] });
    const rows = catalog.records.filter((row) => row.dimension === dimension && allowed(row) && (!pins[dimension] || row.id === pins[dimension]));
    if (!rows.length) fail('empty_pool', `No allowed rows remain in dimension ${dimension}; constraints have not been relaxed.`, { dimension });
    return rows.sort((a, b) => a.id.localeCompare(b.id, 'en'));
  });
  if (request.historyFile !== undefined && options.history !== undefined) fail('incompatible_constraints', 'Supply historyFile or explicit API history, not both.');
  if (options.baseDir !== undefined) string(options.baseDir, 'baseDir');
  const history = validateHistory(request.historyFile === undefined ? (options.history === undefined ? [] : options.history) : readJSON(resolve(options.baseDir ?? process.cwd(), string(request.historyFile, 'historyFile'))), catalog);
  const possible = pools.reduce((total, pool) => total * BigInt(pool.length), 1n);
  if (possible < BigInt(count)) fail('insufficient_combinations', `Only ${possible} unique combinations satisfy the hard constraints; requested ${count}.`, { available: possible.toString(), requested: count });
  const random = rng(seed), samples = [], seen = new Set();
  const add = (rows) => {
    const key = rows.map((row) => row.id).join('|');
    if (seen.has(key)) return;
    seen.add(key); samples.push({ rows, families: signature(rows), tie: random() });
  };
  const exhaustive = possible <= BigInt(sampleSize);
  if (exhaustive) {
    const visit = (depth, rows) => { if (depth === pools.length) return add(rows); for (const row of pools[depth]) visit(depth + 1, [...rows, row]); };
    visit(0, []);
  } else {
    // The explicit attempt cap bounds runtime even under constrained/small pools.
    for (let attempt = 0; attempt < sampleSize * 12 && samples.length < sampleSize; attempt++) add(pools.map((pool) => pool[Math.floor(random() * pool.length)]));
  }
  if (samples.length < count) fail('search_exhausted', 'Bounded sampling did not find enough distinct candidates; this does not prove the constraints are impossible.', { sampled: samples.length, requested: count, possibleCombinations: possible.toString() });
  for (const sample of samples) {
    sample.historyComparisons = history.map((story) => ({ storyId: story.id, ...similarity(sample.families, story.families, active) }));
    sample.historyPenalty = Math.max(0, ...sample.historyComparisons.filter((entry) => entry.comparable).map((entry) => entry.score));
  }
  const chosen = [];
  while (chosen.length < count) {
    let best = null, bestScore = -Infinity;
    for (const candidate of samples) {
      if (chosen.includes(candidate)) continue;
      const distance = chosen.length ? Math.min(...chosen.map((other) => 1 - similarity(candidate.families, other.families, active).score)) : 1;
      const score = .65 * distance + .35 * (1 - candidate.historyPenalty) + candidate.tie * 1e-9;
      if (score > bestScore) { best = candidate; bestScore = score; }
    }
    chosen.push(best);
  }
  const warnings = [];
  if (!history.length) warnings.push('没有显式提供近期作品记录；结果不包含跨会话去重。');
  if (history.some((story) => !active.some((dimension) => story.families[dimension] !== undefined))) warnings.push('部分历史记录与激活维度无交集，无法进行结构重复比较。');
  const candidates = chosen.map((candidate, index) => {
    const comparisons = chosen.filter((other) => other !== candidate).map((other) => 1 - similarity(candidate.families, other.families, active).score);
    const minDistance = comparisons.length ? Math.min(...comparisons) : null;
    const candidateWarnings = [];
    if (minDistance !== null && minDistance < .45) candidateWarnings.push('与其他候选的加权结构差异有限；请改变推进机制、关键选择、代价或结尾作用，而不只更换场景。');
    if (candidate.historyPenalty >= .6) candidateWarnings.push('与至少一篇近期记录在可比较维度上重复较高；请人工核对人物选择—异常升级—结尾作用。');
    return { id: `candidate-${index + 1}`, rows: candidate.rows, families: candidate.families, ids: Object.fromEntries(candidate.rows.map((row) => [row.dimension, row.id])), history: { maxWeightedSimilarity: candidate.historyPenalty, comparisons: candidate.historyComparisons }, diversity: { minWeightedDistanceToOtherCandidates: minDistance }, hardConstraintsSatisfied: true, semanticCompatibility: 'unreviewed', warnings: candidateWarnings, reviewRequired: ['逐项核验 use_when 与 avoid_when 是否适合人物、世界和用户偏好。', '写出人物处境 → 行动选择 → 异常后果 → 结尾作用的因果桥；不能成立时重选或舍弃部件。', '确认禁用内容、终极未知和创作讨论中的已定事项；标签筛选不能代替语义审查。'] };
  });
  return { purpose: PURPOSE, seed, activeDimensions: active, count, hardConstraints: { pins: { ...pins }, excludeIds, excludeTags, excludeFamilies, satisfied: true, relaxed: false }, sampling: { sampled: samples.length, sampleSize, exhaustive, possibleCombinations: possible.toString(), optimalityGuaranteed: false }, comparisonWeights: Object.fromEntries(active.map((dimension) => [dimension, WEIGHTS[dimension]])), historyCount: history.length, warnings, candidates };
}

export const HELP = `Horror direction selector — Node built-ins only, read-only.
Usage: node horror-selector.mjs <validate|list|search|select> [--request FILE] [--catalog-dir DIR]
       node horror-selector.mjs --help

All successful commands return JSON. Errors return JSON to stderr with a nonzero exit code.
Paths: catalog defaults relative to this script; request/catalog paths relative to cwd;
historyFile relative to the request file (cwd for API/direct requests). No history is written.

validate: no request fields. Checks all 14 CSV files, 12-column schema, IDs and source links.
list request: {"dimensions":["engines"]} (optional; lists counts, tags, families).
search request: {"query":"责任","dimensions":["engines"],"tags":[],"families":[],"limit":50}
  query: literal case-insensitive substring; tags AND; families OR; filters AND.
select request: {"seed":"draft-1","count":3,"dimensions":["contexts","relationships","engines","choices","costs","endings"],
  "pins":{"contexts":"contexts-001"},"excludeIds":[],"excludeTags":[],"excludeFamilies":[],
  "historyFile":"recent.json","sampleSize":256}
  All fields optional. count 1..8; sampleSize 24..512. Unknown fields/IDs/tags/families fail.
  Default six dimensions are editable draft prompts, not mandatory story slots.
  A pin activates its dimension unless explicit dimensions omit it (then error).
  excludeTags matches tags AND content_tags as an exclusion union.
  Family filters: dimension:family scopes to one axis; bare family applies to all axes.
  Seed is returned for replay. Hard constraints are never relaxed. History is a soft penalty.
  Bounded sampling seeks diversity; it cannot guarantee optimality, coherence or originality.
history JSON: {"stories":[{"id":"story-1","families":{"engines":"known-family"},"ids":{"engines":"engines-001"}}]}
  A direct stories array is also accepted. Only current known dimension/family/ID values are valid;
  ids is optional and, if supplied, must match families. At most 1000 records.

API exports: parseCSV, validateCatalog, loadCatalog, listCatalog, searchCatalog,
  validateHistory, selectCandidates(catalog, request, {history?, baseDir?}), runCLI.
Returned candidates require use_when/avoid_when and causal-bridge review before writing.
`;

export function runCLI(argv = process.argv.slice(2)) {
  try {
    if (argv.length === 1 && ['--help', '-h'].includes(argv[0])) { process.stdout.write(HELP); return 0; }
    const command = argv[0];
    if (!['validate', 'list', 'search', 'select'].includes(command)) fail('usage', 'Expected validate, list, search, select or --help.');
    const flags = {};
    for (let i = 1; i < argv.length; i += 2) {
      const name = argv[i], value = argv[i + 1];
      if (!['--request', '--catalog-dir'].includes(name) || !value || value.startsWith('--')) fail('usage', `Unknown flag or missing value: ${name}.`);
      if (Object.hasOwn(flags, name)) fail('usage', `Repeated flag: ${name}.`);
      flags[name] = value;
    }
    const requestPath = flags['--request'] ? resolve(flags['--request']) : undefined;
    const request = requestPath ? readJSON(requestPath) : {};
    const catalog = loadCatalog(flags['--catalog-dir'] ? resolve(flags['--catalog-dir']) : DEFAULT_CATALOG_DIR);
    let result;
    if (command === 'validate') { fields(request, [], 'validate request'); result = validateCatalog(catalog); }
    if (command === 'list') result = listCatalog(catalog, request);
    if (command === 'search') result = searchCatalog(catalog, request);
    if (command === 'select') result = selectCandidates(catalog, request, { baseDir: requestPath ? dirname(requestPath) : process.cwd() });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ error: { code: error.code ?? 'internal_error', message: error.message, details: error.details ?? {} } })}\n`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = runCLI();
