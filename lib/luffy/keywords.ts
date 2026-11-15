import type { Chunk } from './chunk';
import type { SourceType } from './sources';

/**
 * A small BM25 keyword index over the chunks (term statistics only, no vectors), saved to
 * data/luffy-keywords.json by knowledge:build and used next to vector search, so exact
 * words (names, numbers, "Coast Capital", "0.548") still count.
 */

export const BM25 = { k1: 1.2, b: 0.75 };

export type KeywordDoc = {
  id: string;
  title: string;
  url: string;
  section: string;
  sourceType: SourceType;
  /** Number of terms. */
  length: number;
  /** term → count */
  tf: Record<string, number>;
};

export type KeywordIndex = {
  version: 1;
  builtAt: string;
  docCount: number;
  avgLength: number;
  /** term → number of chunks containing it */
  df: Record<string, number>;
  docs: KeywordDoc[];
};

const STOP = new Set(
  'a about above after again all am an and any are as at be because been before being below between both but by can did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours divyesh bhavsar'.split(
    ' '
  )
);

/** Lowercase words and numbers (decimals kept: "0.548", "16.57"), stop words dropped, light plural trim. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+(?:\.[0-9]+)?/g) ?? [])
    .filter((t) => !STOP.has(t) && (t.length > 1 || /\d/.test(t)))
    .map((t) => (t.length > 4 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t));
}

export function buildKeywordIndex(chunks: Chunk[]): KeywordIndex {
  const df: Record<string, number> = {};
  const docs = chunks.map((c): KeywordDoc => {
    const terms = tokenize(c.text);
    const tf: Record<string, number> = {};
    for (const t of terms) tf[t] = (tf[t] ?? 0) + 1;
    for (const t of Object.keys(tf)) df[t] = (df[t] ?? 0) + 1;
    return { id: c.id, title: c.title, url: c.url, section: c.section, sourceType: c.sourceType, length: terms.length, tf };
  });
  const avgLength = docs.reduce((s, d) => s + d.length, 0) / Math.max(docs.length, 1);
  return { version: 1, builtAt: new Date().toISOString(), docCount: docs.length, avgLength, df, docs };
}

/** BM25 score of every chunk for a query (only chunks with a score above 0). */
export function keywordScores(index: KeywordIndex, query: string): Map<string, number> {
  const terms = [...new Set(tokenize(query))];
  const scores = new Map<string, number>();
  for (const doc of index.docs) {
    let score = 0;
    for (const t of terms) {
      const f = doc.tf[t];
      if (!f) continue;
      const n = index.df[t] ?? 0;
      const idf = Math.log(1 + (index.docCount - n + 0.5) / (n + 0.5));
      score += (idf * f * (BM25.k1 + 1)) / (f + BM25.k1 * (1 - BM25.b + (BM25.b * doc.length) / index.avgLength));
    }
    if (score > 0) scores.set(doc.id, score);
  }
  return scores;
}
