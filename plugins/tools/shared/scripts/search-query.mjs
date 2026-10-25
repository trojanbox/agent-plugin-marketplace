/**
 * Query parsing and local envelope matching for the Email Plugin.
 *
 * QQ Mail's IMAP server does not match non-ASCII SEARCH criteria that arrive as
 * RFC 3501 literals, which is exactly how Himalaya 2.2.1 encodes them. The server
 * answers such a search with an empty result set instead of an error, so a CJK
 * keyword silently looks like the mailbox holds no matching mail. The very same
 * criterion sent as a quoted string does match, so the loss happens on the way
 * out, not inside the mailbox.
 *
 * Queries whose text terms are all ASCII keep using the server-side search.
 * Queries with a non-ASCII text term are parsed here and matched against the
 * envelopes this plugin lists, which the server returns without any text
 * criterion and therefore without the broken literal encoding.
 */

export class QueryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QueryError';
    this.status = 'invalid_input';
  }
}

const TEXT_FIELDS = new Set(['subject', 'from', 'to', 'body', 'text']);
const DATE_OPS = new Set(['after', 'before', 'date']);
const FLAG_NAMES = new Set(['seen', 'answered', 'flagged', 'draft']);
const SORT_FIELDS = new Set(['date', 'from', 'to', 'subject']);
// Fields an envelope carries, so a local match can be decided without the body.
const ENVELOPE_FIELDS = new Set(['subject', 'from', 'to']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export function hasNonAscii(text) {
  return typeof text === 'string' && /[^\x00-\x7F]/u.test(text);
}

function tokenize(query) {
  const tokens = [];
  let index = 0;
  while (index < query.length) {
    const char = query[index];
    if (/\s/u.test(char)) { index += 1; continue; }
    if (char === '(' || char === ')') {
      tokens.push({ type: char });
      index += 1;
      continue;
    }
    if (char === '"') {
      let value = '';
      let closed = false;
      index += 1;
      while (index < query.length) {
        const current = query[index];
        if (current === '\\' && index + 1 < query.length) {
          value += query[index + 1];
          index += 2;
          continue;
        }
        if (current === '"') { closed = true; index += 1; break; }
        value += current;
        index += 1;
      }
      if (!closed) throw new QueryError('查询语句中的引号没有闭合');
      tokens.push({ type: 'term', value });
      continue;
    }
    let value = '';
    while (index < query.length && !/[\s()"]/u.test(query[index])) {
      value += query[index];
      index += 1;
    }
    if (value.includes('"')) throw new QueryError('查询语句中的引号位置无效');
    tokens.push({ type: 'term', value });
  }
  return tokens;
}

/**
 * Parse the subset of the Himalaya query language this plugin can answer locally.
 * Returns { ast, sort }; `sort` is null when the query carries no `order by`.
 */
export function parseQuery(query) {
  const tokens = tokenize(String(query ?? ''));
  let index = 0;
  const peek = () => tokens[index];
  const isWord = (token, word) => token && token.type === 'term' && token.value.toLowerCase() === word;

  function expectTerm(label) {
    const token = peek();
    if (!token || token.type !== 'term') throw new QueryError('查询语句缺少' + label);
    index += 1;
    return token.value;
  }

  function parseExpression() {
    let left = parseConjunction();
    while (isWord(peek(), 'or')) {
      index += 1;
      left = { type: 'or', left, right: parseConjunction() };
    }
    return left;
  }

  function parseConjunction() {
    let left = parseUnary();
    while (isWord(peek(), 'and')) {
      index += 1;
      left = { type: 'and', left, right: parseUnary() };
    }
    return left;
  }

  function parseUnary() {
    if (isWord(peek(), 'not')) {
      index += 1;
      return { type: 'not', operand: parseUnary() };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new QueryError('查询语句不完整');
    if (token.type === '(') {
      index += 1;
      const node = parseExpression();
      const closing = peek();
      if (!closing || closing.type !== ')') throw new QueryError('查询语句中的括号没有闭合');
      index += 1;
      return node;
    }
    if (token.type !== 'term') throw new QueryError('查询语句语法错误');
    const keyword = token.value.toLowerCase();
    if (TEXT_FIELDS.has(keyword)) {
      index += 1;
      return { type: 'text', field: keyword, value: expectTerm('条件值') };
    }
    if (DATE_OPS.has(keyword)) {
      index += 1;
      const value = expectTerm('日期');
      if (!DATE_PATTERN.test(value)) throw new QueryError('查询日期必须为 yyyy-mm-dd：' + value);
      return { type: 'date', op: keyword, value };
    }
    if (keyword === 'flag') {
      index += 1;
      const value = expectTerm('标记').toLowerCase();
      if (!FLAG_NAMES.has(value)) throw new QueryError('不支持的邮件标记：' + value);
      return { type: 'flag', value };
    }
    throw new QueryError('不支持的查询条件：' + token.value);
  }

  if (!tokens.length) throw new QueryError('查询语句不能为空');
  const ast = parseExpression();
  let sort = null;
  if (isWord(peek(), 'order')) {
    index += 1;
    if (!isWord(peek(), 'by')) throw new QueryError('排序子句必须是 order by');
    index += 1;
    const field = expectTerm('排序字段').toLowerCase();
    if (!SORT_FIELDS.has(field)) throw new QueryError('不支持的排序字段：' + field);
    let direction = 'asc';
    if (isWord(peek(), 'asc') || isWord(peek(), 'desc')) {
      direction = peek().value.toLowerCase();
      index += 1;
    }
    sort = { field, direction };
  }
  if (index < tokens.length) {
    throw new QueryError('查询语句尾部无法解析：' + tokens[index].value + '（多个条件之间需要用 and 连接）');
  }
  return { ast, sort };
}

function walk(node, visit) {
  if (!node) return;
  visit(node);
  if (node.type === 'and' || node.type === 'or') {
    walk(node.left, visit);
    walk(node.right, visit);
  } else if (node.type === 'not') {
    walk(node.operand, visit);
  }
}

function textOf(envelope, field) {
  if (field === 'subject') return String(envelope?.subject ?? '');
  const people = field === 'from' ? envelope?.from : envelope?.to;
  if (!Array.isArray(people)) return '';
  return people.map((person) => [person?.name, person?.email].filter(Boolean).join(' ')).join(' ');
}

function envelopeDay(envelope) {
  const value = typeof envelope?.date === 'string' ? envelope.date : '';
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/u);
  return match ? match[1] : null;
}

function hasFlag(envelope, name) {
  const flags = Array.isArray(envelope?.flags) ? envelope.flags : [];
  return flags.some((flag) => {
    const iana = typeof flag?.iana === 'string' ? flag.iana.toLowerCase() : '';
    const raw = typeof flag?.raw === 'string' ? flag.raw.toLowerCase() : '';
    return iana === name || raw === '\\' + name;
  });
}

function matchText(envelope, field, term) {
  if (!ENVELOPE_FIELDS.has(field)) return false;
  return textOf(envelope, field).toLowerCase().includes(term.toLowerCase());
}

export function matchesEnvelope(node, envelope) {
  switch (node.type) {
    case 'text':
      return matchText(envelope, node.field, node.value);
    case 'date': {
      const day = envelopeDay(envelope);
      if (!day) return false;
      if (node.op === 'after') return day > node.value;
      if (node.op === 'before') return day < node.value;
      return day === node.value;
    }
    case 'flag':
      return hasFlag(envelope, node.value);
    case 'and':
      return matchesEnvelope(node.left, envelope) && matchesEnvelope(node.right, envelope);
    case 'or':
      return matchesEnvelope(node.left, envelope) || matchesEnvelope(node.right, envelope);
    case 'not':
      return !matchesEnvelope(node.operand, envelope);
    default:
      return false;
  }
}

export function applySort(envelopes, sort) {
  if (!sort) return envelopes;
  const key = (envelope) => {
    if (sort.field === 'subject') return String(envelope?.subject ?? '');
    if (sort.field === 'date') return String(envelope?.date ?? '');
    return textOf(envelope, sort.field);
  };
  const sorted = [...envelopes].sort((left, right) => {
    const a = key(left).toLowerCase();
    const b = key(right).toLowerCase();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
  return sort.direction === 'desc' ? sorted.reverse() : sorted;
}

/**
 * Decide how a query has to be answered. A non-ASCII text term cannot be matched
 * by the QQ IMAP server, so it is answered locally against the listed envelopes.
 */
export function planSearch(query) {
  if (!hasNonAscii(query)) return { mode: 'server' };
  const { ast, sort } = parseQuery(query);
  let nonAsciiText = false;
  let unsupported = null;
  walk(ast, (node) => {
    if (node.type !== 'text') return;
    if (hasNonAscii(node.value)) nonAsciiText = true;
    if (!ENVELOPE_FIELDS.has(node.field)) unsupported = unsupported ?? node.field;
  });
  if (!nonAsciiText) return { mode: 'server' };
  if (unsupported) {
    throw new QueryError(
      '含非 ASCII 条件的 ' + unsupported + ' 检索无法由本插件完成：QQ IMAP 服务端不匹配 literal 形式的非 ASCII 条件。'
      + '请改用 subject、from 或 to 条件。',
    );
  }
  return { mode: 'local', ast, sort };
}
