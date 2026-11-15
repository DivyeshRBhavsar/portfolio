/**
 * npm run knowledge:search [-- "Your question" "Another question"]
 *
 * Tries Luffy's retrieval (lib/luffy/search.ts, the same search the chat API uses):
 * embeds each question, asks Upstash Vector for the nearest chunks, scores the question
 * against the keyword index, and prints the top 5 by the combined score. With no
 * questions it runs a fixed set (including one nonsense input that should score low).
 * Never prints tokens.
 */
import { redact } from '@/lib/luffy/config';
import { hybridSearch } from '@/lib/luffy/search';
import { loadEnv } from './env';

const DEFAULT_QUESTIONS = [
  'What did Divyesh do at Coast Capital?',
  'How accurate was the candidate ranking model?',
  'Does he build websites?',
  "What's his master's degree?",
  'How does a project with him work?',
  'asdfghjkl',
];

async function main() {
  loadEnv();
  const questions = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  for (const q of questions.length ? questions : DEFAULT_QUESTIONS) {
    const { topCosine, results } = await hybridSearch(q);
    console.log(`\n❓ ${q}   (top cosine ${topCosine.toFixed(3)})`);
    for (const r of results.slice(0, 5)) {
      console.log(`  ${r.hybrid.toFixed(3)}  (cos ${r.cosine.toFixed(3)}, kw ${r.keyword.toFixed(1).padStart(4)})  ${r.title} — ${r.section}  ${r.url}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(`\n✖ ${redact(error instanceof Error ? error.message : String(error))}`);
  process.exit(1);
});
