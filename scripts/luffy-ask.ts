/**
 * npm run luffy:ask -- [--new] [--base http://localhost:3000] "question" ["another" …]
 *
 * Sends questions to the local chat API (/api/chat) and prints the events as they arrive.
 * The session id and the last few turns are kept in a temp file between calls, so limits
 * can be tested across runs; --new starts a fresh session. Several questions in one call
 * are sent one after another in the same session.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

type Turn = { role: 'user' | 'assistant'; content: string };
type Saved = { sessionId?: string; history: Turn[] };

const FILE = path.join(os.tmpdir(), 'luffy-ask-session.json');
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const base = option('--base') ?? 'http://localhost:3000';
const questions = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--base');

function load(): Saved {
  if (flag('--new') || !existsSync(FILE)) return { history: [] };
  try {
    return JSON.parse(readFileSync(FILE, 'utf-8')) as Saved;
  } catch {
    return { history: [] };
  }
}

async function ask(question: string, saved: Saved): Promise<Saved> {
  console.log(`\n❓ ${question}`);
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: base,
      ...(saved.sessionId ? { Cookie: `luffy_sid=${saved.sessionId}` } : {}),
    },
    body: JSON.stringify({ message: question, sessionId: saved.sessionId, history: saved.history }),
  });
  const sessionId = res.headers.get('x-luffy-session') ?? saved.sessionId;
  if (!res.ok || !res.body) {
    console.log(`  HTTP ${res.status}: ${await res.text()}`);
    return { ...saved, sessionId };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  const started = Date.now();
  let firstToken = -1;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let end: number;
    while ((end = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const event = block.match(/^event: (.+)$/m)?.[1];
      const data = JSON.parse(block.match(/^data: (.+)$/m)?.[1] ?? 'null');
      if (event === 'token') {
        if (firstToken < 0) {
          firstToken = Date.now() - started;
          process.stdout.write('  💬 ');
        }
        answer += data.text;
        process.stdout.write(String(data.text).replace(/\n/g, '\n     '));
      } else {
        if (answer && !answer.endsWith('\n') && event !== 'meta') process.stdout.write('\n');
        console.log(`  ${event} ${JSON.stringify(data)}`);
      }
    }
  }
  console.log(`  (first text after ${firstToken} ms, total ${Date.now() - started} ms)`);
  const history = [...saved.history, { role: 'user' as const, content: question }, { role: 'assistant' as const, content: answer }].slice(-6);
  return { sessionId, history };
}

async function main() {
  if (questions.length === 0) {
    console.log('Usage: npm run luffy:ask -- [--new] [--base URL] "question" ["another" …]');
    return;
  }
  let saved = load();
  for (const q of questions) {
    saved = await ask(q, saved);
    writeFileSync(FILE, JSON.stringify(saved));
  }
}

main().catch((error: unknown) => {
  console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
