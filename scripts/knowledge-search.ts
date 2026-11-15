/**
 * npm run knowledge:search [-- "Your question" "Another question"]
 *
 * Tries Luffy's retrieval: embeds each question, asks Upstash Vector for the nearest
 * chunks, scores the same question against the keyword index, and prints the top 5 by a
 * combined score. With no questions it runs a fixed set (including one nonsense input
 * that should score low). Never prints tokens.
 *
 * Scores: cosine = the real cosine similarity (Upstash reports (1 + cosine) / 2);
 * keyword = BM25; hybrid = 0.75 × cosine + 0.25 × keyword / (keyword + 8).
 */
import { readFileSync } from 'fs';
import path from 'path';
import { KEYWORD_INDEX_PATH, redact } from '@/lib/luffy/config';
import { embedQuery } from '@/lib/luffy/embed';
import { keywordScores, type KeywordIndex } from '@/lib/luffy/keywords';
import { query } from '@/lib/luffy/vector';
import { loadEnv } from './env';

const DEFAULT_QUESTIONS = [
  'What did Divyesh do at Coast Capital?',
  'How accurate was the candidate ranking model?',
  'Does he build websites?',
  "What's his master's degree?",
  'How does a project with him work?',
  'asdfghjkl',
];

export const HYBRID = { vectorWeight: 0.75, keywordWeight: 0.25, keywordSaturation: 8 };

async function main() {
  loadEnv();
  const questions = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const index = JSON.parse(readFileSync(path.join(process.cwd(), KEYWORD_INDEX_PATH), 'utf-8')) as KeywordIndex;
  const byId = new Map(index.docs.map((d) => [d.id, d]));

  for (const q of questions.length ? questions : DEFAULT_QUESTIONS) {
    const vector = await embedQuery(q);
    const matches = await query(vector, 10);
    const keywords = keywordScores(index, q);

    const candidates = new Map<string, { cosine: number; keyword: number; title: string; section: string; url: string }>();
    for (const m of matches) {
      candidates.set(m.id, { cosine: m.score * 2 - 1, keyword: keywords.get(m.id) ?? 0, title: m.metadata.title, section: m.metadata.section, url: m.metadata.url });
    }
    // Strong keyword hits the vector search missed (cosine unknown: counted as 0).
    for (const [id, kw] of [...keywords].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      const d = byId.get(id);
      if (d && !candidates.has(id)) candidates.set(id, { cosine: 0, keyword: kw, title: d.title, section: d.section, url: d.url });
    }
    const ranked = [...candidates.values()]
      .map((c) => ({
        ...c,
        hybrid: HYBRID.vectorWeight * c.cosine + HYBRID.keywordWeight * (c.keyword / (c.keyword + HYBRID.keywordSaturation)),
      }))
      .sort((a, b) => b.hybrid - a.hybrid)
      .slice(0, 5);

    console.log(`\n❓ ${q}`);
    for (const r of ranked) {
      console.log(
        `  ${r.hybrid.toFixed(3)}  (cos ${r.cosine.toFixed(3)}, kw ${r.keyword.toFixed(1).padStart(4)})  ${r.title} — ${r.section}  ${r.url}`
      );
    }
  }
}

main().catch((error: unknown) => {
  console.error(`\n✖ ${redact(error instanceof Error ? error.message : String(error))}`);
  process.exit(1);
});
