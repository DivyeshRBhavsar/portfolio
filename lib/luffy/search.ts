import keywordIndexJson from '@/data/luffy-keywords.json';
import { RETRIEVAL } from './config';
import { embedQuery } from './embed';
import { keywordScores, type KeywordIndex } from './keywords';
import type { SourceType } from './sources';
import { fetchByIds, query } from './vector';

/**
 * Hybrid retrieval: Upstash Vector (meaning) + the BM25 keyword index (exact words).
 *   cosine  = the real cosine similarity (Upstash reports (1 + cosine) / 2)
 *   keyword = BM25
 *   hybrid  = vectorWeight × cosine + keywordWeight × keyword / (keyword + saturation)
 * Strong keyword hits the vector search missed are added with cosine 0. The keyword index
 * is imported as a module so it's bundled with the API route.
 */

export const keywordIndex = keywordIndexJson as unknown as KeywordIndex;

export type Retrieved = {
  id: string;
  title: string;
  url: string;
  section: string;
  sourceType: SourceType;
  /** The chunk text (title and section prefix included). */
  text: string;
  cosine: number;
  keyword: number;
  hybrid: number;
};

export type SearchResult = {
  /** The best cosine among the vector matches (the relevance threshold uses this). */
  topCosine: number;
  /** All candidates, best first. */
  results: Retrieved[];
};

export async function hybridSearch(question: string): Promise<SearchResult> {
  const vector = await embedQuery(question);
  const [matches, keywords] = await Promise.all([query(vector, RETRIEVAL.vectorTopK), Promise.resolve(keywordScores(keywordIndex, question))]);

  const candidates = new Map<string, Omit<Retrieved, 'hybrid'>>();
  for (const m of matches) {
    candidates.set(m.id, {
      id: m.id,
      title: m.metadata.title,
      url: m.metadata.url,
      section: m.metadata.section,
      sourceType: m.metadata.sourceType,
      text: m.metadata.text,
      cosine: m.score * 2 - 1,
      keyword: keywords.get(m.id) ?? 0,
    });
  }

  // Strong keyword hits the vector search missed (their text comes from Upstash by id).
  const extraIds = [...keywords]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)
    .filter((id) => !candidates.has(id));
  for (const v of await fetchByIds(extraIds)) {
    candidates.set(v.id, {
      id: v.id,
      title: v.metadata.title,
      url: v.metadata.url,
      section: v.metadata.section,
      sourceType: v.metadata.sourceType,
      text: v.metadata.text,
      cosine: 0,
      keyword: keywords.get(v.id) ?? 0,
    });
  }

  const results = [...candidates.values()]
    .map((c) => ({
      ...c,
      hybrid: RETRIEVAL.vectorWeight * c.cosine + RETRIEVAL.keywordWeight * (c.keyword / (c.keyword + RETRIEVAL.keywordSaturation)),
    }))
    .sort((a, b) => b.hybrid - a.hybrid);

  return { topCosine: matches.reduce((best, m) => Math.max(best, m.score * 2 - 1), 0), results };
}

/**
 * The context for an answer: the top candidates, at most `perSource` chunks per source
 * (title), best `contextChunks` overall, so "which projects…" questions see several.
 */
export function selectContext(results: Retrieved[]): Retrieved[] {
  const perTitle = new Map<string, number>();
  const out: Retrieved[] = [];
  for (const r of results.slice(0, RETRIEVAL.candidates)) {
    const n = perTitle.get(r.title) ?? 0;
    if (n >= RETRIEVAL.perSource) continue;
    perTitle.set(r.title, n + 1);
    out.push(r);
    if (out.length >= RETRIEVAL.contextChunks) break;
  }
  return out;
}
