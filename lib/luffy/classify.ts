import type { Intent } from './session';

/**
 * The cheapest checks: plain rules, no model call. A match names a guardrail category
 * (content/luffy-guardrails.json) and Luffy answers with one of its replies. Anything
 * unsure goes on to retrieval and the model instead; a missed rule only costs a model
 * call, while a wrong match would brush off a genuine question.
 *
 * Other languages are never "gibberish": a message mostly in a non-Latin script
 * (Devanagari, Gujarati, Arabic, Chinese…) skips that rule, and a Latin-script message
 * is only gibberish when it's clearly keyboard-mashing, repeated characters or words,
 * or no letters at all (an unfamiliar language like Spanish passes through).
 */

export type RuleMatch = { categoryId: string; intent: Intent };

const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];

/** Share of letters that are in a non-Latin script. */
function nonLatinShare(text: string): number {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return 0;
  const latin = letters.filter((ch) => /\p{Script=Latin}/u.test(ch)).length;
  return 1 - latin / letters.length;
}

/** A run along one keyboard row, either direction ("asdf", "lkjh", "qwe"). */
function isKeyboardRun(token: string): boolean {
  if (token.length < 3) return false;
  return KEYBOARD_ROWS.some((row) => row.includes(token) || [...row].reverse().join('').includes(token));
}

function isGibberish(text: string): boolean {
  const t = text.toLowerCase().trim();
  // No letters at all: "????", "1234567", "!!!".
  if (!/\p{L}/u.test(t)) return true;
  // Long runs of one character: "jjjjjjjjjj", "aaaaaah".
  if (/(\p{L})\1{4,}/u.test(t)) return true;
  const tokens = t.match(/[a-z0-9]+/g) ?? [];
  if (tokens.length === 0) return false;
  // Keyboard rows: "asdfghjkl", "qwe rty uio".
  const mashed = tokens.filter((tok) => isKeyboardRun(tok)).length;
  if (mashed / tokens.length >= 0.6 && tokens.join('').length >= 6) return true;
  // The same word again and again: "lol lol lol".
  if (tokens.length >= 3 && new Set(tokens).size === 1) return true;
  // Long letter strings with no vowels at all: "xkcdqwrtz".
  const noVowels = tokens.filter((tok) => tok.length >= 6 && /^[a-z]+$/.test(tok) && !/[aeiouy]/.test(tok)).length;
  return noVowels > 0 && noVowels / tokens.length >= 0.5;
}

const GREETING =
  /^(hi|hii+|hello|hey|heya|hiya|yo|howdy|namaste|good (morning|afternoon|evening)|thanks|thank you|thank u|thx|ty|cheers|bye|goodbye|see you|ok|okay|cool|nice|great)( (there|luffy|so much|a lot))?[\s!.,?🙂😊👋🙏😄]*$/i;
const ABOUT_LUFFY = [
  /^(who|what) are you\b/i,
  /\bare you (an? )?(ai|bot|robot|human|real|chatbot|person|llm)\b/i,
  /\bwho (made|built|created|programmed) you\b/i,
  /\bwhat('?s| is) your name\b/i,
  /^what can you do\b/i,
  /^how are you\b/i,
];

const INJECTION = [
  /\bignore (all |any |the |your )?(previous |prior |above |earlier |preceding )?(instructions|prompts?|rules|directions)\b/i,
  /\b(disregard|forget) (all |any |the |your )?(previous |prior |above )?(instructions|prompts?|rules)\b/i,
  /\b(system|developer|hidden|initial) prompt\b/i,
  /\breveal (your|the) (prompt|instructions|rules|context)\b/i,
  /\byou are now\b/i,
  /\b(developer|god|admin|dan) mode\b/i,
  /\bjailbreak/i,
  /\bpretend (to be|you are|you're)\b/i,
  /\bact as (a|an|my|if)\b/i,
  /\brepeat (everything|the text|your instructions) above\b/i,
];

const SENSITIVE = [
  /\bhow old\b/i,
  /\b(his|divyesh'?s) age\b/i,
  /\bmarried\b|\bwife\b|\bgirlfriend\b|\bboyfriend\b|\bspouse\b|\bdating\b/i,
  /\breligio(n|us)\b|\bcaste\b|\bpolitic(s|al)\b/i,
  /\b(home|his|divyesh'?s) address\b|\bwhere (exactly )?does (he|divyesh) live\b/i,
  /\bphone number\b|\bcell number\b|\bhis number\b/i,
  /\bvisa status\b|\bimmigration\b|\bcitizenship\b|\bpr status\b|\bwork permit\b/i,
  /\b(his|divyesh'?s) (health|medical|disability)\b|\bis (he|divyesh) (sick|ill|disabled)\b/i,
  /\bhow much does (he|divyesh) (earn|make)\b|\bnet worth\b|\bhis income\b|\bcurrent salary\b/i,
];

const COMPENSATION: { pattern: RegExp; intent: Intent }[] = [
  { pattern: /\bsalary\b|\bsalaries\b|\bcompensation\b|\bpay (range|expectations?)\b|\bexpected pay\b/i, intent: 'hiring' },
  { pattern: /\bnotice period\b|\bstart date\b|\bwhen can (he|divyesh|you) start\b/i, intent: 'hiring' },
  { pattern: /\bsponsor(ship)?\b/i, intent: 'hiring' },
  { pattern: /\b(hourly|daily|day|weekly) rate\b|\b(his|your) rates?\b|\brate (card|per hour)\b/i, intent: 'project' },
  { pattern: /\bhow much (would|will|does|do|is|for)\b.*\b(cost|charge|charges|price|quote)\b|\bwhat (would|will) it cost\b/i, intent: 'project' },
];

/** A guardrail category for the message, or null to go on to retrieval and the model. */
export function classifyByRules(message: string, hasCategory: (id: string) => boolean): RuleMatch | null {
  const text = message.trim();
  const match = (categoryId: string, intent: Intent = 'casual') => (hasCategory(categoryId) ? { categoryId, intent } : null);

  if (INJECTION.some((p) => p.test(text))) return match('prompt_injection');
  if (GREETING.test(text) || ABOUT_LUFFY.some((p) => p.test(text))) return match('about_luffy');
  if (nonLatinShare(text) < 0.5 && isGibberish(text)) return match('gibberish');
  if (SENSITIVE.some((p) => p.test(text))) return match('sensitive_personal');
  const comp = COMPENSATION.find((c) => c.pattern.test(text));
  if (comp) return match('compensation_and_availability', comp.intent);
  return null;
}
