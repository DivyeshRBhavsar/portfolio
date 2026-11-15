import { createHash } from 'crypto';
import { EMBEDDING } from './config';
import type { SourceDoc, SourceType } from './sources';

/**
 * Sections → chunks of roughly 150–300 words:
 *   - short neighbouring sections that allow it are joined (up to 300 words);
 *   - a long section is cut into ~250-word windows overlapping by ~40 words;
 *   - every chunk starts with "<title> — <section>:" so it makes sense on its own;
 *   - near-identical chunks (≥ 90% the same word triples) are dropped.
 * Ids are "<doc key>:<n>", stable while the content keeps its order; the hash (text +
 * embedding model) tells the build which chunks changed.
 */

export const CHUNK = { maxWords: 300, targetWords: 250, overlapWords: 40, minWords: 150, duplicateSimilarity: 0.9 };

export type Chunk = {
  id: string;
  sourceType: SourceType;
  title: string;
  url: string;
  section: string;
  /** The full chunk text, prefix included (what gets embedded and shown to the model). */
  text: string;
  hash: string;
  words: number;
};

const words = (s: string) => s.split(/\s+/).filter(Boolean);

function windows(text: string): string[] {
  const w = words(text);
  if (w.length <= CHUNK.maxWords) return [text];
  const out: string[] = [];
  const step = CHUNK.targetWords - CHUNK.overlapWords;
  for (let start = 0; start < w.length; start += step) {
    let end = Math.min(start + CHUNK.targetWords, w.length);
    // Don't leave a tiny tail: stretch the last window to the end instead.
    if (w.length - end < CHUNK.minWords / 2) end = w.length;
    out.push(w.slice(start, end).join(' '));
    if (end === w.length) break;
  }
  return out;
}

function shingles(text: string): Set<string> {
  const w = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + 2 < w.length; i++) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return out;
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const s of a) if (b.has(s)) shared++;
  return shared / (a.size + b.size - shared);
}

export function hashText(text: string): string {
  return createHash('sha256').update(`${EMBEDDING.model}\n${text}`).digest('hex').slice(0, 16);
}

/** One document's chunks (before de-duplication). */
function chunkDoc(doc: SourceDoc): Omit<Chunk, 'id' | 'hash'>[] {
  // 1. Group sections: join mergeable short neighbours up to maxWords.
  const groups: { headings: string[]; text: string; merge: boolean }[] = [];
  for (const section of doc.sections) {
    const body = section.text.trim();
    if (!body) continue;
    const last = groups[groups.length - 1];
    if (last && last.merge && section.merge && words(last.text).length + words(body).length + 8 <= CHUNK.maxWords) {
      last.headings.push(section.heading);
      last.text += `\n\n${section.heading}:\n${body}`;
    } else {
      groups.push({ headings: [section.heading], text: body, merge: section.merge });
    }
  }

  // 2. Cut long groups into overlapping windows; prefix each chunk.
  return groups.flatMap((g) => {
    const section = g.headings.length > 3 ? `${g.headings.slice(0, 3).join(' · ')} …` : g.headings.join(' · ');
    const parts = windows(g.text);
    return parts.map((part, i) => {
      const label = parts.length > 1 ? `${section} (part ${i + 1})` : section;
      const text = `${doc.title} — ${label}:\n${part}`;
      return { sourceType: doc.sourceType, title: doc.title, url: doc.url, section: label, text, words: words(text).length };
    });
  });
}

/** All documents → chunks with stable ids and hashes, near-duplicates removed. */
export function chunkDocs(docs: SourceDoc[]): { chunks: Chunk[]; duplicates: number } {
  const chunks: Chunk[] = [];
  const seen: Set<string>[] = [];
  let duplicates = 0;
  for (const doc of docs) {
    let n = 0;
    for (const c of chunkDoc(doc)) {
      // Compare without the prefix, so the same text under two titles still counts.
      const body = shingles(c.text.slice(c.text.indexOf(':\n') + 2));
      if (seen.some((s) => similarity(s, body) >= CHUNK.duplicateSimilarity)) {
        duplicates++;
        continue;
      }
      seen.push(body);
      chunks.push({ ...c, id: `${doc.key}:${n++}`, hash: hashText(c.text) });
    }
  }
  return { chunks, duplicates };
}
