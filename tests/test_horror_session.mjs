import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BRIEF_KEYS, newSession, appendEvent, inspectSession, renderSession, writingBrief } from '../plugins/writing/shared/horror/scripts/story-session.mjs';

const script = fileURLToPath(new URL('../plugins/writing/shared/horror/scripts/story-session.mjs', import.meta.url));
const evidence = { source: 'synthetic-test/user-turn-1', quote: '测试夹具：方向先讨论，采用已确认内容。' };
function initial() { return newSession({ id: 'test-story', title: '测试故事', originalRequest: '只讨论一个有后劲的恐怖故事。', evidence }); }
function add(session, event) { return appendEvent(session, { expectedRevision: session.revision, event }).session; }
function decisions(session = initial()) {
  const values = {
    premise: '邻居互助维持一段不能中断的日常。',
    character: '照护者曾在一次临时离开后失去家人，因此承诺不再让求助无人回应。',
    causalChain: '答应接班 → 身体承受真实变化 → 为保护另一人决定继续接班；每步由责任推动。',
    horror: '门内手臂的关节朝两侧弯曲，交班记录与皮肤上的痕迹对应，未知来源。',
    ending: '以后每次普通交接都唤回尚未偿还的责任，不引入末尾新规则。',
    constraints: '不使用记忆删除、身份替换或全是幻觉；用户只讨论。',
    form: '中文短篇，贴近照护者视角，自然段，不附创作解释。',
  };
  for (const key of BRIEF_KEYS) session = add(session, { id: `d-${key}`, type: 'decision', key, value: values[key], basis: 'user', evidence, reason: '测试夹具中的明确确认。' });
  return session;
}
function review(session) {
  return add(session, { id: `review-${session.revision}`, type: 'review', briefVersion: inspectSession(session).briefVersion, verdict: 'pass', checks: { causality: '照护经历解释接班选择，未靠降智。', distinctness: '责任维持推进，不是调查解谜或多出物件。', constraints: '逐项复查已记禁用，未采用。', ontology: '感官具体，来源与整体机制开放。' }, notes: '测试夹具审阅，不表示读者实验。' });
}
function conclude(session, basis = 'user') {
  return add(session, { id: `conclude-${session.revision}`, type: 'conclude', briefVersion: inspectSession(session).briefVersion, basis, evidence });
}
function authorize(session, mode = 'version') {
  return add(session, { id: `auth-${session.revision}`, type: 'authorize', mode, ...(mode === 'version' ? { briefVersion: inspectSession(session).briefVersion } : {}), evidence });
}
function expectCode(fn, code) { assert.throws(fn, error => error.code === code); }

test('two CLI writers using one revision cannot overwrite each other', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'horror-concurrent-'));
  const filename = path.join(directory, 'session.json');
  try {
    fs.writeFileSync(filename, JSON.stringify(initial()));
    const attempts = ['first', 'second'].map(id => {
      const input = path.join(directory, `${id}.json`);
      fs.writeFileSync(input, JSON.stringify({ expectedRevision: 0, event: { id, type: 'question', text: `并发问题 ${id}`, blocking: true } }));
      return new Promise((resolve, reject) => {
        const process = spawn(globalThis.process.execPath, [script, 'record', '--session', filename, '--input', input]);
        let stderr = '';
        process.stderr.on('data', data => { stderr += data; });
        process.once('error', reject);
        process.once('close', code => resolve({ code, stderr }));
      });
    });
    const results = await Promise.all(attempts);
    assert.equal(results.filter(result => result.code === 0).length, 1);
    assert.ok(['session_locked', 'revision_conflict'].includes(JSON.parse(results.find(result => result.code !== 0).stderr).code));
    const session = JSON.parse(fs.readFileSync(filename, 'utf8'));
    assert.equal(inspectSession(session).revision, 1);
    assert.equal(session.events.length, 1);
    assert.ok(['first', 'second'].includes(session.events[0].id));
    assert.equal(fs.existsSync(`${filename}.lock`), false);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('proposal remains provisional; complete decisions alone do not certify readiness', () => {
  const session = add(initial(), { id: 'proposal-1', type: 'proposal', key: 'premise', value: '候选方向', reason: '尚未得到用户回应。' });
  assert.equal(inspectSession(session).decisions.premise, undefined);
  assert.equal(inspectSession(session).readyToWrite, false);
  assert.equal(inspectSession(decisions()).readyToWrite, false);
});

test('ready, concluded, and writing authorization are separate requirements', () => {
  let session = review(decisions());
  assert.equal(inspectSession(session).readyToWrite, true);
  expectCode(() => writingBrief(session), 'writing_not_authorized');
  session = conclude(session);
  assert.equal(inspectSession(session).canWrite, false);
  session = authorize(session);
  assert.equal(writingBrief(session).brief.character.includes('照护者'), true);
});

test('advance authorization survives discussion but does not skip its conclusion', () => {
  let session = authorize(initial(), 'after-discussion');
  session = review(decisions(session));
  assert.equal(inspectSession(session).canWrite, false);
  session = conclude(session);
  assert.equal(inspectSession(session).canWrite, true);
  session = authorize(session, 'none');
  assert.equal(inspectSession(session).readyToWrite, true);
  assert.equal(inspectSession(session).canWrite, false);
  session = authorize(session);
  assert.equal(inspectSession(session).canWrite, true);
});

test('brief revisions invalidate old review, conclusion and version authorization', () => {
  let session = authorize(conclude(review(decisions())));
  const previous = inspectSession(session).decisions.ending;
  session = add(session, { id: 'ending-v2', type: 'decision', key: 'ending', value: '由普通求助声重新唤回责任。', basis: 'user', evidence, supersedes: previous.id, reason: '用户改了结尾方向。' });
  assert.equal(inspectSession(session).readyToWrite, false);
  session = conclude(review(session));
  assert.equal(inspectSession(session).canWrite, false);
  session = authorize(session);
  assert.equal(inspectSession(session).canWrite, true);
  assert.equal(session.events.find(e => e.id === previous.id).value, previous.value);
});

test('delegation must be explicit and scoped; assistant proposal is insufficient', () => {
  let session = initial();
  const event = { id: 'delegated-decision', type: 'decision', key: 'form', value: '第三人称', basis: 'delegated', evidence, reason: '用户委托选择。' };
  expectCode(() => add(session, event), 'missing_delegation');
  session = add(session, { id: 'delegate-form', type: 'delegate', keys: ['form'], evidence });
  session = add(session, event);
  expectCode(() => add(session, { ...event, id: 'unauthorized', key: 'ending' }), 'missing_delegation');
  expectCode(() => conclude(review(decisions()), 'delegated'), 'missing_delegation');
});

test('explicit delegation allows completion without repeated confirmation', () => {
  let session = add(initial(), { id: 'delegate-all', type: 'delegate', keys: [...BRIEF_KEYS], evidence });
  session = authorize(session, 'after-discussion');
  for (const key of BRIEF_KEYS) session = add(session, { id: `d-${key}`, type: 'decision', key, value: `测试已委托字段 ${key}。`, basis: 'delegated', evidence, reason: '在用户授权范围内完成。' });
  session = conclude(review(session), 'delegated');
  assert.equal(inspectSession(session).canWrite, true);
});

test('delegation can be revoked and granted again without erasing previous decisions', () => {
  let session = add(initial(), { id: 'delegate-all', type: 'delegate', keys: [...BRIEF_KEYS], evidence });
  for (const key of BRIEF_KEYS) session = add(session, { id: `d-${key}`, type: 'decision', key, value: `测试已委托字段 ${key}。`, basis: 'delegated', evidence, reason: '在用户授权范围内完成。' });
  session = authorize(conclude(review(session), 'delegated'), 'after-discussion');
  assert.equal(inspectSession(session).canWrite, true);
  session = add(session, { id: 'revoke', type: 'delegate', mode: 'revoke', keys: ['ending'], evidence });
  assert.equal(inspectSession(session).canWrite, false);
  const event = { id: 'new-ending', type: 'decision', key: 'ending', value: '新的候选结尾', basis: 'delegated', evidence, supersedes: 'd-ending', reason: '尝试在已撤回授权下修改' };
  expectCode(() => add(session, event), 'missing_delegation');
  assert.equal(inspectSession(session).decisions.ending.id, 'd-ending');
  expectCode(() => conclude(session, 'delegated'), 'missing_delegation');
  session = add(session, { id: 'grant-again', type: 'delegate', mode: 'grant', keys: ['ending'], evidence });
  session = add(session, event);
  assert.equal(inspectSession(session).decisions.ending.id, 'new-ending');
});

test('mixed user confirmation and delegation can conclude under standing writing intent', () => {
  let session = authorize(initial(), 'after-discussion');
  for (const key of ['premise', 'character']) session = add(session, { id: `d-${key}`, type: 'decision', key, value: `用户已确认 ${key}`, basis: 'user', evidence, reason: '测试实际确认。' });
  const remaining = BRIEF_KEYS.filter(key => !['premise', 'character'].includes(key));
  session = add(session, { id: 'delegate-remaining', type: 'delegate', keys: remaining, evidence });
  for (const key of remaining) session = add(session, { id: `d-${key}`, type: 'decision', key, value: `其余委托 ${key}`, basis: 'delegated', evidence, reason: '测试委托范围。' });
  session = conclude(review(session), 'delegated');
  assert.equal(writingBrief(session).brief.premise, '用户已确认 premise');
  session = add(session, { id: 'revoke-ending', type: 'delegate', mode: 'revoke', keys: ['ending'], evidence });
  expectCode(() => conclude(session, 'delegated'), 'missing_delegation');
  expectCode(() => writingBrief(session), 'writing_not_authorized');
});

test('blocking questions prevent writing and a fresh blocker cancels conclusion', () => {
  let session = authorize(conclude(review(decisions())));
  session = add(session, { id: 'question-1', type: 'question', text: '新要求与结尾冲突', blocking: true });
  assert.equal(inspectSession(session).canWrite, false);
  expectCode(() => conclude(session), 'not_ready');
  session = add(session, { id: 'resolve-1', type: 'resolve', questionId: 'question-1', answer: '维持已确认结尾。', evidence });
  assert.equal(inspectSession(session).readyToWrite, true);
  assert.equal(inspectSession(session).canWrite, false);
  session = conclude(session);
  assert.equal(inspectSession(session).canWrite, true);
});

test('review requiring revision stops writing; unknown ontology is allowed as nonblocking', () => {
  let session = authorize(conclude(review(decisions())));
  const prior = inspectSession(session).review;
  session = add(session, { id: 'revise-review', type: 'review', briefVersion: prior.briefVersion, verdict: 'revise', checks: prior.checks, notes: '人物动机有缺口。' });
  assert.equal(inspectSession(session).canWrite, false);
  session = add(session, { id: 'ontology-question', type: 'question', text: '它是否是生命保持开放。', blocking: false });
  session = conclude(review(session));
  assert.equal(inspectSession(session).canWrite, true);
});

test('retries with stable event id are idempotent before revision check; reuse conflicts', () => {
  const event = { id: 'q1', type: 'question', text: '选择哪个方向', blocking: true };
  const input = { expectedRevision: 0, event };
  const result = appendEvent(initial(), input);
  assert.equal(appendEvent(result.session, input).unchanged, true);
  expectCode(() => appendEvent(result.session, { ...input, event: { ...event, text: '不同问题' } }), 'event_conflict');
  expectCode(() => appendEvent(result.session, { expectedRevision: 0, event: { ...event, id: 'q2' } }), 'revision_conflict');
});

test('journal rejects phantom resolutions, stale reviews, fake supersedes and injected fields', () => {
  expectCode(() => add(initial(), { id: 'r1', type: 'resolve', questionId: 'constructor', answer: '不存在的问题', evidence }), 'invalid_resolution');
  expectCode(() => add(decisions(), { id: 'd2', type: 'decision', key: 'ending', value: '改写', basis: 'user', evidence, reason: '没有显式替换旧决定' }), 'revision_conflict');
  expectCode(() => add(initial(), { id: 'bad', type: 'constructor' }), 'invalid_event');
  expectCode(() => add(initial(), { id: 'bad', type: 'authorize', mode: 'none', evidence, canWrite: true }), 'unknown_field');
  const session = review(decisions());
  expectCode(() => add(session, { ...inspectSession(session).review, id: 'stale', briefVersion: 1 }), 'stale_brief');
  expectCode(() => inspectSession({ ...session, revision: 900 }), 'invalid_session');
});

test('Issue target is explicit, consistent and only caller-reported evidence', () => {
  let session = initial();
  const event = { id: 'issue-1', type: 'issue', repository: 'owner/stories', number: 9, url: 'https://github.com/owner/stories/issues/9', verifiedMarker: '<!-- horror-session:test-story:revision:0 -->', evidence: { source: 'synthetic-test/tool-readback', quote: '工具回读编号、标题和正文标记。' } };
  expectCode(() => add(session, { ...event, url: 'https://github.com/another/repo/issues/9' }), 'target_mismatch');
  session = add(session, event);
  assert.equal(inspectSession(session).issue.repository, 'owner/stories');
  expectCode(() => add(session, { ...event, id: 'move', repository: 'owner/other', url: 'https://github.com/owner/other/issues/9' }), 'target_mismatch');
  expectCode(() => add(session, { ...event, id: 'future', verifiedMarker: '<!-- horror-session:test-story:revision:99 -->' }), 'invalid_marker');
});

test('render includes original request, proposals, revisions, reasons, evidence and marker', () => {
  let session = decisions();
  session = add(session, { id: 'e2', type: 'decision', key: 'ending', value: '新结尾含 ~~~ 与 ```', basis: 'user', evidence, reason: '保留修订原因', supersedes: 'd-ending' });
  const text = renderSession(session);
  assert.match(text, /【创作】测试故事/);
  assert.match(text, /horror-session:test-story:revision:8/);
  assert.match(text, /只讨论一个有后劲的恐怖故事/);
  assert.match(text, /不引入末尾新规则/);
  assert.match(text, /保留修订原因/);
  assert.match(text, /synthetic-test\/user-turn-1/);
  assert.match(text, /~~~~json/);
});

test('CLI is portable, never overwrites an existing journal and leaves invalid writes unchanged', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'horror-session-'));
  try {
    const movedScript = path.join(dir, 'story-session.mjs');
    fs.copyFileSync(script, movedScript);
    const file = path.join(dir, 'journal.json');
    const input = path.join(dir, 'input.json');
    fs.writeFileSync(input, JSON.stringify({ id: 'portable', title: '便携测试', originalRequest: '测试请求', evidence }));
    const cli = (...args) => spawnSync(process.execPath, [movedScript, ...args], { cwd: os.tmpdir(), encoding: 'utf8' });
    assert.equal(cli('init', '--session', file, '--input', input).status, 0);
    const before = fs.readFileSync(file, 'utf8');
    assert.notEqual(cli('init', '--session', file, '--input', input).status, 0);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
    fs.writeFileSync(input, JSON.stringify({ expectedRevision: 0, event: { id: 'bad', type: 'decision', key: 'form', value: '格式', basis: 'delegated', evidence, reason: '没有委托' } }));
    assert.notEqual(cli('record', '--session', file, '--input', input).status, 0);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
    assert.equal(fs.existsSync(`${file}.lock`), false);
    assert.equal(cli('validate', '--session', file).status, 0);
    assert.notEqual(cli('brief', '--session', file).status, 0);
    fs.writeFileSync(`${file}.lock`, 'test lock');
    assert.match(cli('record', '--session', file, '--input', input).stderr, /session_locked/);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
