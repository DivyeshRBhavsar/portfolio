import { upstashVector } from './config';
import { fetchJson } from './http';
import type { SourceType } from './sources';

/**
 * Upstash Vector over its REST API (plain fetch, no SDK). Each vector carries the chunk's
 * metadata, including the text Luffy will quote from and the content hash used to skip
 * unchanged chunks on the next build.
 */

export type ChunkMetadata = {
  title: string;
  url: string;
  sourceType: SourceType;
  section: string;
  text: string;
  hash: string;
};

export type IndexInfo = { vectorCount: number; pendingVectorCount: number; dimension: number; similarityFunction: string };

type Result<T> = { result: T };

const call = <T>(path: string, body?: unknown) => {
  const { url, token } = upstashVector();
  return fetchJson<Result<T>>(`${url}${path}`, { token, body }, { label: `Upstash Vector ${path}` }).then((r) => r.result);
};

export const indexInfo = () => call<IndexInfo>('/info');

/** Every vector's id and hash (metadata only, paged). */
export async function listExisting(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  let cursor = '0';
  do {
    const page = await call<{ nextCursor: string; vectors: { id: string; metadata?: Partial<ChunkMetadata> }[] }>('/range', {
      cursor,
      limit: 1000,
      includeMetadata: true,
    });
    for (const v of page.vectors) out.set(v.id, v.metadata?.hash ?? '');
    cursor = page.nextCursor;
  } while (cursor && cursor !== '0' && cursor !== '');
  return out;
}

export async function upsert(items: { id: string; vector: number[]; metadata: ChunkMetadata }[], batchSize = 50): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    await call<string>('/upsert', items.slice(i, i + batchSize));
  }
}

export async function remove(ids: string[], batchSize = 500): Promise<void> {
  for (let i = 0; i < ids.length; i += batchSize) {
    await call<{ deleted: number }>('/delete', ids.slice(i, i + batchSize));
  }
}

export type VectorMatch = { id: string; score: number; metadata: ChunkMetadata };

/**
 * Nearest chunks. Upstash's cosine score is (1 + cosine) / 2, so 0.5 means unrelated and
 * 1 means identical direction.
 */
export function query(vector: number[], topK = 5): Promise<VectorMatch[]> {
  return call<VectorMatch[]>('/query', { vector, topK, includeMetadata: true });
}
