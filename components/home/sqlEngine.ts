// Plain module: a tiny SQL subset over in-memory tables, parsed here (no eval, no
// dependency). Supported:
//   SELECT * | col, col … FROM table
//   [WHERE col (= | != | <> | LIKE | < | >) value [AND …]]
//   [ORDER BY col [ASC | DESC]] [LIMIT n] [;]
// Values are 'text' (with '' for a quote) or numbers. Matching ignores case; LIKE knows
// % and _. Numbers compare as numbers, everything else as text ("2024-10" sorts right).
// NULL (a missing value) never matches and sorts last.

import { fill } from '@/components/character/speech';
import { sqlErrors } from '@/components/character/luffyLines';
import type { LifeStory } from '@/lib/lifeStoryTypes';

export type Cell = string | null;
export type Table = { columns: string[]; rows: Cell[][] };
export type Tables = Record<string, Table>;
export type QueryResult = { ok: true; columns: string[]; rows: Cell[][] } | { ok: false; error: string };

/** The tables the terminal queries, built from the life story. */
export function buildTables(story: LifeStory): Tables {
  const v = (value: string | undefined): Cell => value ?? null;
  const toolbox: Cell[][] = [];
  const seen = new Set<string>();
  for (const track of story.tracks?.items ?? []) {
    for (const skill of track.skills) {
      const key = `${skill}\u0000${track.role}`;
      if (!seen.has(key)) {
        seen.add(key);
        toolbox.push([skill, track.role]);
      }
    }
  }
  return {
    career: {
      columns: ['role', 'company', 'kind', 'place', 'start', 'end'],
      rows: (story.experience?.jobs ?? []).map((j) => [j.role, j.company, j.kind, v(j.place), v(j.start), v(j.end)]),
    },
    education: {
      columns: ['degree', 'field', 'school', 'start', 'end'],
      rows: (story.education?.stops ?? []).map((s) => [s.degree, v(s.field), s.school, v(s.start), v(s.end)]),
    },
    toolbox: { columns: ['skill', 'track'], rows: toolbox },
  };
}

// ── Tokens ──

type Token =
  | { type: 'word'; value: string }
  | { type: 'string'; value: string }
  | { type: 'number'; value: string }
  | { type: 'symbol'; value: string };

class SqlError extends Error {}
const err = (template: string, values: Record<string, string> = {}): never => {
  throw new SqlError(fill(template, values));
};

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (ch === "'") {
      let value = '';
      i++;
      for (;;) {
        if (i >= sql.length) err(sqlErrors.unclosedString);
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
          }
          i++;
          break;
        }
        value += sql[i++];
      }
      tokens.push({ type: 'string', value });
    } else if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(sql[i + 1] ?? ''))) {
      const m = sql.slice(i).match(/^-?\d+(\.\d+)?/)!;
      tokens.push({ type: 'number', value: m[0] });
      i += m[0].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const m = sql.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/)!;
      tokens.push({ type: 'word', value: m[0] });
      i += m[0].length;
    } else {
      const two = sql.slice(i, i + 2);
      if (two === '!=' || two === '<>' || two === '<=' || two === '>=') {
        tokens.push({ type: 'symbol', value: two });
        i += 2;
      } else if ('*,=<>;()'.includes(ch)) {
        tokens.push({ type: 'symbol', value: ch });
        i++;
      } else {
        err(sqlErrors.unexpected, { word: ch });
      }
    }
  }
  return tokens;
}

// ── Parser ──

type Op = '=' | '!=' | 'LIKE' | '<' | '>';
type Condition = { column: string; op: Op; value: string };
type Query = {
  columns: string[] | '*';
  table: string;
  where: Condition[];
  order?: { column: string; desc: boolean };
  limit?: number;
};

/** Words we recognise but don't support: a clearer message than "unexpected". */
const UNSUPPORTED = new Set([
  'OR', 'NOT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'GROUP', 'HAVING', 'UNION', 'DISTINCT',
  'IN', 'BETWEEN', 'IS', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'AS',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'OFFSET',
]);

function parse(tokens: Token[]): Query {
  let pos = 0;
  const peek = () => tokens[pos];
  const isWord = (t: Token | undefined, word: string) =>
    t?.type === 'word' && t.value.toUpperCase() === word;
  const describe = (t: Token) => (t.type === 'string' ? `'${t.value}'` : t.value);
  const unexpected = (t: Token | undefined): never => {
    if (!t) return err(sqlErrors.unexpected, { word: '(end)' });
    if (t.type === 'word' && UNSUPPORTED.has(t.value.toUpperCase())) {
      return err(sqlErrors.unsupported, { word: t.value.toUpperCase() });
    }
    if (t.type === 'symbol' && (t.value === '<=' || t.value === '>=' || t.value === '(' || t.value === ')')) {
      return err(sqlErrors.unsupported, { word: t.value });
    }
    return err(sqlErrors.unexpected, { word: describe(t) });
  };
  const identifier = (): string => {
    const t = peek();
    if (t?.type !== 'word' || UNSUPPORTED.has(t.value.toUpperCase())) return unexpected(t);
    pos++;
    return t.value.toLowerCase();
  };

  if (!isWord(peek(), 'SELECT')) err(sqlErrors.notSelect);
  pos++;

  let columns: string[] | '*';
  if (peek()?.type === 'symbol' && peek().value === '*') {
    pos++;
    columns = '*';
  } else {
    if (!peek() || isWord(peek(), 'FROM')) err(sqlErrors.noColumns);
    columns = [identifier()];
    while (peek()?.type === 'symbol' && peek().value === ',') {
      pos++;
      columns.push(identifier());
    }
  }

  if (!isWord(peek(), 'FROM')) {
    if (!peek()) err(sqlErrors.noFrom);
    unexpected(peek());
  }
  pos++;
  if (!peek()) err(sqlErrors.noFrom);
  const table = identifier();

  const where: Condition[] = [];
  if (isWord(peek(), 'WHERE')) {
    pos++;
    for (;;) {
      const column = identifier();
      const t = peek();
      let op: Op;
      if (t?.type === 'symbol' && ['=', '!=', '<>', '<', '>'].includes(t.value)) {
        op = t.value === '<>' ? '!=' : (t.value as Op);
      } else if (isWord(t, 'LIKE')) {
        op = 'LIKE';
      } else if (t && (t.type === 'word' && UNSUPPORTED.has(t.value.toUpperCase()) || t.value === '<=' || t.value === '>=')) {
        return unexpected(t);
      } else {
        return err(sqlErrors.badOperator, { column });
      }
      pos++;
      const value = peek();
      if (!value || (value.type !== 'string' && value.type !== 'number')) {
        err(sqlErrors.badValue, { word: op });
      }
      pos++;
      where.push({ column, op, value: value!.value });
      if (isWord(peek(), 'AND')) {
        pos++;
        continue;
      }
      break;
    }
  }

  let order: Query['order'];
  if (isWord(peek(), 'ORDER')) {
    pos++;
    if (!isWord(peek(), 'BY')) unexpected(peek());
    pos++;
    const column = identifier();
    let desc = false;
    if (isWord(peek(), 'ASC')) pos++;
    else if (isWord(peek(), 'DESC')) {
      desc = true;
      pos++;
    }
    order = { column, desc };
  }

  let limit: number | undefined;
  if (isWord(peek(), 'LIMIT')) {
    pos++;
    const t = peek();
    if (t?.type !== 'number' || !/^\d+$/.test(t.value)) err(sqlErrors.badLimit);
    limit = Number(t!.value);
    pos++;
  }

  if (peek()?.type === 'symbol' && peek().value === ';') pos++;
  if (pos < tokens.length) unexpected(peek());
  return { columns, table, where, order, limit };
}

// ── Running it ──

const isNumeric = (s: string) => /^-?\d+(\.\d+)?$/.test(s);

/** <0, 0, >0. Numbers as numbers, else case-insensitive text. */
function compare(a: string, b: string): number {
  if (isNumeric(a) && isNumeric(b)) return Number(a) - Number(b);
  return a.toLowerCase().localeCompare(b.toLowerCase());
}

function likeToRegExp(pattern: string): RegExp {
  const body = pattern
    .split('')
    .map((ch) => (ch === '%' ? '.*' : ch === '_' ? '.' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('');
  return new RegExp(`^${body}$`, 'is');
}

function matches(cell: Cell, op: Op, value: string): boolean {
  if (cell === null) return false;
  switch (op) {
    case '=':
      return compare(cell, value) === 0;
    case '!=':
      return compare(cell, value) !== 0;
    case '<':
      return compare(cell, value) < 0;
    case '>':
      return compare(cell, value) > 0;
    case 'LIKE':
      return likeToRegExp(value).test(cell);
  }
}

export function runQuery(sql: string, tables: Tables): QueryResult {
  try {
    if (!sql.trim()) err(sqlErrors.empty);
    const query = parse(tokenize(sql));
    const table = tables[query.table];
    if (!table) err(sqlErrors.unknownTable, { table: query.table });
    const index = (column: string) => {
      const i = table.columns.indexOf(column);
      if (i < 0) err(sqlErrors.unknownColumn, { column, table: query.table, columns: table.columns.join(', ') });
      return i;
    };
    const columns = query.columns === '*' ? table.columns : query.columns;
    const picks = columns.map(index);
    const filters = query.where.map((c) => ({ ...c, i: index(c.column) }));
    let rows = table.rows.filter((row) => filters.every((c) => matches(row[c.i], c.op, c.value)));
    if (query.order) {
      const i = index(query.order.column);
      const dir = query.order.desc ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const x = a[i];
        const y = b[i];
        if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1; // NULL last
        return compare(x, y) * dir;
      });
    }
    if (query.limit !== undefined) rows = rows.slice(0, query.limit);
    return { ok: true, columns, rows: rows.map((row) => picks.map((i) => row[i])) };
  } catch (error) {
    if (error instanceof SqlError) return { ok: false, error: error.message };
    throw error;
  }
}
