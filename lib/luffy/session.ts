import { createHash } from 'crypto';
import { CAPS, LIMITS, hashSalt } from './config';
import type { CountsAs } from './guardrails';
import { del, get, pipeline, setEx, setNx } from './redis';

/**
 * Per-session state (Upstash Redis, 24 h), the question limits, and the daily caps.
 * Stored per session: counts, the {category, intent} of each counted question, the
 * off-track streak, abuse count, why it stopped, and the visitor's relevant questions
 * (only for the end-of-conversation summary). Nothing else is stored.
 */

export const INTENTS = ['hiring', 'project', 'learning', 'casual'] as const;
export type Intent = (typeof INTENTS)[number];

/** "on_topic" or a guardrail category's counts_as. */
export type Kind = 'on_topic' | CountsAs;

export type StopReason = 'limit' | 'flow_complete' | 'off_track';

export type SessionState = {
  /** Counted questions so far (neutral ones don't count). */
  count: number;
  /** Current limit: 5, 10 or 15. */
  allowed: number;
  questions: { category: string; intent: Intent; relevant: boolean }[];
  offTrackStreak: number;
  abuse: number;
  stopped: StopReason | null;
  /** The visitor's relevant questions, for the summary only. */
  relevantQuestions: string[];
};

export const newSession = (): SessionState => ({
  count: 0,
  allowed: LIMITS.first,
  questions: [],
  offTrackStreak: 0,
  abuse: 0,
  stopped: null,
  relevantQuestions: [],
});

const key = (id: string) => `luffy:s:${id}`;
const lockKey = (id: string) => `luffy:lock:${id}`;

export async function loadSession(id: string): Promise<SessionState> {
  const raw = await get(key(id));
  if (!raw) return newSession();
  try {
    return { ...newSession(), ...(JSON.parse(raw) as Partial<SessionState>) };
  } catch {
    return newSession();
  }
}

export const saveSession = (id: string, state: SessionState) => setEx(key(id), JSON.stringify(state), LIMITS.sessionTtlSeconds);

/** One question at a time per session. */
export const acquireLock = (id: string) => setNx(lockKey(id), '1', LIMITS.lockSeconds);
export const releaseLock = (id: string) => del(lockKey(id));

const isRelevant = (kind: Kind) => kind === 'on_topic' || kind === 'on_topic_redirect';

/**
 * Count one question and apply the rules (pure: returns the new state). Neutral
 * questions change nothing. Early stops come first, then the 5 / 10 / 15 checks.
 */
export function countQuestion(
  state: SessionState,
  q: { category: string; kind: Kind; intent: Intent; text: string }
): SessionState {
  if (q.kind === 'neutral') return state;
  const relevant = isRelevant(q.kind);
  const next: SessionState = {
    ...state,
    count: state.count + 1,
    questions: [...state.questions, { category: q.category, intent: q.intent, relevant }],
    offTrackStreak: relevant ? 0 : state.offTrackStreak + 1,
    abuse: state.abuse + (q.kind === 'abuse' ? 1 : 0),
    relevantQuestions: relevant ? [...state.relevantQuestions, q.text.trim().slice(0, 200)] : state.relevantQuestions,
  };

  if (next.offTrackStreak >= LIMITS.offTrackStreak || next.abuse >= LIMITS.abuseTotal) {
    return { ...next, stopped: 'off_track' };
  }
  const relevantIn = (from: number, to: number) => next.questions.slice(from, to).filter((x) => x.relevant).length;

  if (next.count === LIMITS.first && next.allowed === LIMITS.first) {
    return relevantIn(0, LIMITS.first) >= LIMITS.relevantNeeded ? { ...next, allowed: LIMITS.second } : { ...next, stopped: 'limit' };
  }
  if (next.count === LIMITS.second && next.allowed === LIMITS.second) {
    const hiringOrProject = next.questions.filter((x) => x.relevant && (x.intent === 'hiring' || x.intent === 'project')).length;
    return relevantIn(LIMITS.first, LIMITS.second) >= LIMITS.relevantNeeded && hiringOrProject >= LIMITS.hiringOrProjectNeeded
      ? { ...next, allowed: LIMITS.third }
      : { ...next, stopped: 'flow_complete' };
  }
  if (next.count >= LIMITS.third) return { ...next, stopped: 'flow_complete' };
  return next;
}

/** For the contact page: the main purpose and a short list of the relevant questions. */
export function contactFor(state: SessionState): { purpose: 'job' | 'freelance' | 'question'; summary: string } {
  // The most common intent among relevant questions (a tie → "question").
  const tally = (intent: Intent) => state.questions.filter((q) => q.relevant && q.intent === intent).length;
  const hiring = tally('hiring');
  const project = tally('project');
  const other = Math.max(tally('learning'), tally('casual'));
  const purpose = hiring > project && hiring > other ? 'job' : project > hiring && project > other ? 'freelance' : 'question';
  let summary = '';
  for (const q of state.relevantQuestions) {
    const line = `• ${q}`;
    if ((summary ? summary.length + 1 : 0) + line.length > LIMITS.summaryMaxChars) break;
    summary += (summary ? '\n' : '') + line;
  }
  return { purpose, summary };
}

// ── Daily caps (midnight Toronto) ──

function torontoClock(now: Date): { date: string; secondsToMidnight: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: CAPS.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  const elapsed = Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second);
  return { date: `${parts.year}-${parts.month}-${parts.day}`, secondsToMidnight: 24 * 3600 - elapsed };
}

/** A salted hash of the IP: raw IPs are never stored. */
export function hashIp(ip: string): string {
  return createHash('sha256').update(`${hashSalt()}:${ip}`).digest('hex').slice(0, 32);
}

/** Count one message against both caps; true when either is over. */
export async function overDailyCap(ipHash: string, now = new Date()): Promise<boolean> {
  const { date, secondsToMidnight } = torontoClock(now);
  const expireAt = Math.floor(now.getTime() / 1000) + secondsToMidnight;
  const ipKey = `luffy:cap:ip:${ipHash}:${date}`;
  const siteKey = `luffy:cap:site:${date}`;
  const [ipCount, , siteCount] = await pipeline([
    ['INCR', ipKey],
    ['EXPIREAT', ipKey, expireAt],
    ['INCR', siteKey],
    ['EXPIREAT', siteKey, expireAt],
  ]);
  return Number(ipCount) > CAPS.perIpPerDay || Number(siteCount) > CAPS.sitePerDay;
}
