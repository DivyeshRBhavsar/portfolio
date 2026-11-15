import fs from 'fs';
import path from 'path';

/**
 * Luffy's guardrails (content/luffy-guardrails.json): his persona and rules for the
 * system prompt, the question categories for the classifier, his canned replies, and
 * the test questions (Parts 2–4). Checked on load; a mistake throws naming the field, e.g.
 *   content/luffy-guardrails.json: categories[3].counts_as must be one of gibberish, off_topic, …
 */

export const COUNTS_AS = ['gibberish', 'off_topic', 'on_topic_redirect', 'abuse', 'neutral'] as const;
export type CountsAs = (typeof COUNTS_AS)[number];

export type GuardrailCategory = {
  id: string;
  counts_as: CountsAs;
  description: string;
  examples: string[];
  replies: string[];
  /** A page to point to (e.g. /contact). */
  link?: string;
};

export type TestQuestion = {
  q: string;
  /** "answer", "not_sure_or_no", a category id, or a counts_as value. */
  expect: string;
  must_mention?: string[];
};

export type Guardrails = {
  persona: { name: string; role: string; rules: string[] };
  categories: GuardrailCategory[];
  notSureReplies: string[];
  limitReplies: Record<string, string>;
  testQuestions: TestQuestion[];
};

const FILE = 'content/luffy-guardrails.json';
type Obj = Record<string, unknown>;

class GuardrailsError extends Error {}
const fail = (where: string, problem: string): never => {
  throw new GuardrailsError(`${FILE}: ${where} ${problem}`);
};

function obj(v: unknown, where: string): Obj {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : fail(where, 'must be an object');
}
function str(o: Obj, key: string, where: string): string {
  const v = o[key];
  return typeof v === 'string' && v.trim() ? v.trim() : fail(`${where}${key}`, 'must be a non-empty string');
}
function strs(o: Obj, key: string, where: string, min = 1): string[] {
  const v = o[key];
  if (!Array.isArray(v)) return fail(`${where}${key}`, 'must be a list of strings');
  const out = v.map((x, i) => (typeof x === 'string' && x.trim() ? x.trim() : fail(`${where}${key}[${i}]`, 'must be a non-empty string')));
  if (out.length < min) fail(`${where}${key}`, `needs at least ${min} item${min === 1 ? '' : 's'}`);
  return out;
}

let cached: Guardrails | null = null;

export function getGuardrails(): Guardrails {
  if (cached) return cached;
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(path.join(process.cwd(), FILE), 'utf-8'));
  } catch (error) {
    throw new GuardrailsError(`${FILE}: not valid JSON (${(error as Error).message})`);
  }
  const root = obj(data, '(the file)');

  const p = obj(root.persona, 'persona');
  const persona = { name: str(p, 'name', 'persona.'), role: str(p, 'role', 'persona.'), rules: strs(p, 'rules', 'persona.') };

  if (!Array.isArray(root.categories)) fail('categories', 'must be a list');
  const ids = new Set<string>();
  const categories = (root.categories as unknown[]).map((v, i): GuardrailCategory => {
    const at = `categories[${i}].`;
    const c = obj(v, at.slice(0, -1));
    const id = str(c, 'id', at);
    if (ids.has(id)) fail(`${at}id`, `"${id}" is used twice`);
    ids.add(id);
    const countsAs = str(c, 'counts_as', at);
    if (!(COUNTS_AS as readonly string[]).includes(countsAs)) fail(`${at}counts_as`, `must be one of ${COUNTS_AS.join(', ')}`);
    const link = c.link === undefined ? undefined : str(c, 'link', at);
    if (link && !link.startsWith('/')) fail(`${at}link`, 'must be a path on the site, starting with /');
    return {
      id,
      counts_as: countsAs as CountsAs,
      description: str(c, 'description', at),
      examples: strs(c, 'examples', at),
      replies: strs(c, 'replies', at),
      link,
    };
  });

  const notSureReplies = strs(root, 'not_sure_replies', '');
  const lr = obj(root.limit_replies, 'limit_replies');
  const limitReplies = Object.fromEntries(Object.keys(lr).map((k) => [k, str(lr, k, 'limit_replies.')]));

  const allowedExpect = new Set(['answer', 'not_sure_or_no', ...ids, ...COUNTS_AS]);
  if (!Array.isArray(root.test_questions)) fail('test_questions', 'must be a list');
  const testQuestions = (root.test_questions as unknown[]).map((v, i): TestQuestion => {
    const at = `test_questions[${i}].`;
    const t = obj(v, at.slice(0, -1));
    const expect = str(t, 'expect', at);
    if (!allowedExpect.has(expect)) fail(`${at}expect`, `"${expect}" isn't "answer", "not_sure_or_no", a category id or a counts_as value`);
    return { q: str(t, 'q', at), expect, must_mention: t.must_mention === undefined ? undefined : strs(t, 'must_mention', at) };
  });

  cached = { persona, categories, notSureReplies, limitReplies, testQuestions };
  return cached;
}
