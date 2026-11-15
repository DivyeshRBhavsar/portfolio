import { createHash } from 'crypto';
import { starterQuestions } from '@/components/character/starterAnswers';
import { LIMITS } from './config';
import { get, setEx } from './redis';

/**
 * Starter questions (components/character/starterAnswers.ts): never counted toward the
 * visitor's limit, and answered from a shared 24-hour cache when possible
 * ("luffy:starter:<hash>"), so the model runs at most once a day per starter.
 */

export type CachedStarter = {
  text: string;
  sources: { title: string; url: string; sourceType: string }[];
  category: string;
  intent: string;
};

/** Lowercase letters and digits only: case, punctuation, apostrophes and emoji don't matter. */
const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const STARTERS = new Map(starterQuestions.map((s) => [normalise(s.question), s]));

/** The starter this message matches exactly (after normalising), or null. */
export function findStarter(message: string): { id: string; question: string } | null {
  return STARTERS.get(normalise(message)) ?? null;
}

const key = (question: string) => `luffy:starter:${createHash('sha256').update(normalise(question)).digest('hex').slice(0, 24)}`;

export async function getCachedStarter(question: string): Promise<CachedStarter | null> {
  const raw = await get(key(question));
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as CachedStarter;
    return typeof value.text === 'string' && value.text.trim() ? value : null;
  } catch {
    return null;
  }
}

export function cacheStarter(question: string, value: CachedStarter): Promise<void> {
  return setEx(key(question), JSON.stringify(value), LIMITS.starterCacheSeconds);
}
