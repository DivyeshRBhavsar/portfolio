/**
 * npm run luffy:reset -- --caps | --sessions | --starters | --all
 *
 * Development only: deletes Luffy's Redis keys so limits and caches can be tested from
 * scratch. Finds keys with SCAN (never KEYS), shows how many it found, asks for
 * confirmation, then deletes them with DEL in batches.
 *   --caps      daily caps          luffy:cap:*
 *   --sessions  visitor sessions    luffy:s:*
 *   --starters  starter answers     luffy:starter:*
 *   --all       all three (never the FAQ log keys)
 * Refuses to run when NODE_ENV is "production". Never prints tokens.
 */
import readline from 'readline';
import { redact } from '@/lib/luffy/config';
import { pipeline } from '@/lib/luffy/redis';
import { loadEnv } from './env';

const GROUPS = {
  caps: { pattern: 'luffy:cap:*', label: 'daily caps' },
  sessions: { pattern: 'luffy:s:*', label: 'sessions' },
  starters: { pattern: 'luffy:starter:*', label: 'starter answers' },
} as const;
type Group = keyof typeof GROUPS;

const SCAN_COUNT = 500;
const DEL_BATCH = 100;

/** Every key matching the pattern, found with SCAN (cursor by cursor). */
async function scan(pattern: string): Promise<string[]> {
  const keys = new Set<string>();
  let cursor = '0';
  do {
    const [reply] = await pipeline([['SCAN', cursor, 'MATCH', pattern, 'COUNT', SCAN_COUNT]]);
    const [next, batch] = reply as [string, string[]];
    for (const k of batch) keys.add(k);
    cursor = String(next);
  } while (cursor !== '0');
  return [...keys];
}

async function remove(keys: string[]): Promise<number> {
  let removed = 0;
  for (let i = 0; i < keys.length; i += DEL_BATCH) {
    const [count] = await pipeline([['DEL', ...keys.slice(i, i + DEL_BATCH)]]);
    removed += Number(count);
  }
  return removed;
}

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function main() {
  loadEnv();
  if (process.env.NODE_ENV === 'production') {
    console.error('✖ luffy:reset is for development only and refuses to run when NODE_ENV is "production".');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const groups: Group[] = args.includes('--all')
    ? ['caps', 'sessions', 'starters']
    : (Object.keys(GROUPS) as Group[]).filter((g) => args.includes(`--${g}`));
  if (groups.length === 0) {
    console.log('Usage: npm run luffy:reset -- --caps | --sessions | --starters | --all');
    return;
  }

  const found = await Promise.all(groups.map(async (g) => ({ group: g, keys: await scan(GROUPS[g].pattern) })));
  for (const { group, keys } of found) console.log(`  ${GROUPS[group].label.padEnd(16)} ${GROUPS[group].pattern.padEnd(17)} ${keys.length} key${keys.length === 1 ? '' : 's'}`);
  const total = found.reduce((s, f) => s + f.keys.length, 0);
  if (total === 0) {
    console.log('\nNothing to delete.');
    return;
  }

  if (!(await confirm(`\nDelete these ${total} key${total === 1 ? '' : 's'} from Upstash Redis? (y/N) `))) {
    console.log('Cancelled: nothing was deleted.');
    return;
  }
  const removed = await remove(found.flatMap((f) => f.keys));
  console.log(`Removed ${removed} key${removed === 1 ? '' : 's'}.`);
}

main().catch((error: unknown) => {
  console.error(`\n✖ ${redact(error instanceof Error ? error.message : String(error))}`);
  process.exit(1);
});
