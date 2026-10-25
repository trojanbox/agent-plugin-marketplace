import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QueryError, hasNonAscii, parseQuery, planSearch, matchesEnvelope, applySort,
} from '../scripts/search-query.mjs';

const envelope = (over = {}) => ({
  id: '1', subject: '测试邮件', flags: [], date: '2026-10-21T05:24:53Z',
  from: [{ name: 'justwe9517', email: 'justwe9517@foxmail.com' }],
  to: [{ name: 'justwe9517', email: 'justwe9517@foxmail.com' }],
  ...over,
});

test('non-ASCII detection only flags text outside ASCII', () => {
  assert.equal(hasNonAscii('subject hello'), false);
  assert.equal(hasNonAscii('subject 会议'), true);
  assert.equal(hasNonAscii(''), false);
});

test('query parsing covers the documented Himalaya conditions', () => {
  const { ast } = parseQuery('subject 报告 and from a@b.com');
  assert.equal(ast.type, 'and');
  assert.deepEqual(ast.left, { type: 'text', field: 'subject', value: '报告' });
  assert.deepEqual(ast.right, { type: 'text', field: 'from', value: 'a@b.com' });

  const quoted = parseQuery('subject "会议 纪要"');
  assert.deepEqual(quoted.ast, { type: 'text', field: 'subject', value: '会议 纪要' });

  const grouped = parseQuery('(subject a or subject b) and not flag seen');
  assert.equal(grouped.ast.type, 'and');
  assert.equal(grouped.ast.right.type, 'not');

  const sorted = parseQuery('subject a order by subject desc');
  assert.deepEqual(sorted.sort, { field: 'subject', direction: 'desc' });
});

test('unsupported or malformed queries fail with an actionable message', () => {
  assert.throws(() => parseQuery('sujbect 测试'), /不支持的查询条件/u);
  assert.throws(() => parseQuery('subject "未闭合'), /引号没有闭合/u);
  assert.throws(() => parseQuery('after 2026-13'), /yyyy-mm-dd/u);
  assert.throws(() => parseQuery('flag archived'), /不支持的邮件标记/u);
  assert.throws(() => parseQuery('(subject a'), /括号没有闭合/u);
  assert.throws(() => parseQuery(''), /不能为空/u);
});

test('local matching applies case-insensitive substring and boolean operators', () => {
  const mail = envelope();
  const { ast } = parseQuery('subject 测试邮件');
  assert.equal(matchesEnvelope(ast, mail), true);

  const other = parseQuery('subject QUANTUM').ast;
  assert.equal(matchesEnvelope(other, envelope({ subject: 'quantum leap' })), true);

  const fromClause = parseQuery('from foxmail.com').ast;
  assert.equal(matchesEnvelope(fromClause, mail), true);
  assert.equal(matchesEnvelope(fromClause, envelope({ from: [{ email: 'a@other.com' }] })), false);

  const toClause = parseQuery('to justwe9517').ast;
  assert.equal(matchesEnvelope(toClause, mail), true);

  const conjunction = parseQuery('subject 测试邮件 and from foxmail.com').ast;
  assert.equal(matchesEnvelope(conjunction, mail), true);

  const disjunction = parseQuery('subject 无此主题 or subject 测试邮件').ast;
  assert.equal(matchesEnvelope(disjunction, mail), true);

  const negation = parseQuery('not subject 测试邮件').ast;
  assert.equal(matchesEnvelope(negation, mail), false);
});

test('local matching reads the date as written and the message flags', () => {
  const mail = envelope();
  assert.equal(matchesEnvelope(parseQuery('after 2026-10-01').ast, mail), true);
  assert.equal(matchesEnvelope(parseQuery('after 2026-10-21').ast, mail), false);
  assert.equal(matchesEnvelope(parseQuery('before 2026-10-01').ast, mail), false);
  assert.equal(matchesEnvelope(parseQuery('date 2026-10-21').ast, mail), true);
  assert.equal(matchesEnvelope(parseQuery('date 2026-10-20').ast, mail), false);

  const seen = envelope({ flags: [{ raw: '\\Seen', iana: 'seen' }] });
  assert.equal(matchesEnvelope(parseQuery('flag seen').ast, seen), true);
  assert.equal(matchesEnvelope(parseQuery('flag seen').ast, mail), false);
});

test('an ASCII query stays on the server-side search', () => {
  assert.deepEqual(planSearch('subject report'), { mode: 'server' });
  assert.deepEqual(planSearch('after 2026-10-01 and from a@b.com'), { mode: 'server' });
});

test('a non-ASCII term is planned for local matching', () => {
  const plan = planSearch('subject 会议');
  assert.equal(plan.mode, 'local');
  assert.equal(matchesEnvelope(plan.ast, envelope({ subject: '周会纪要' })), false);
  assert.equal(matchesEnvelope(plan.ast, envelope({ subject: '会议纪要' })), true);
});

test('a body condition cannot be answered locally and says so', () => {
  assert.throws(() => planSearch('subject 会议 and body 纪要'), /body 检索无法由本插件完成/u);
  assert.throws(() => planSearch('subject 会议 and text 纪要'), /text 检索无法由本插件完成/u);
});

test('sorting is applied to the locally matched envelopes', () => {
  const envelopes = [
    envelope({ id: '2', subject: 'B 报告' }),
    envelope({ id: '1', subject: 'A 报告' }),
  ];
  assert.deepEqual(applySort(envelopes, { field: 'subject', direction: 'asc' }).map((e) => e.id), ['1', '2']);
  assert.deepEqual(applySort(envelopes, { field: 'subject', direction: 'desc' }).map((e) => e.id), ['2', '1']);
  assert.equal(applySort(envelopes, null), envelopes);
});
