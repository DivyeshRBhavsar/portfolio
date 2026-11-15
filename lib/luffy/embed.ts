import { EMBEDDING, HF_ROUTER, hfToken } from './config';
import { HttpError, fetchJson } from './http';

/**
 * Embeddings for Qwen3-Embedding through Hugging Face Inference Providers. The model is
 * served by more than one provider route (deepinfra is live; hf-inference has been
 * unreliable for it), and which one answers can change, so the routes are tried in
 * order and the first that works is remembered for the rest of the run. Auth/billing
 * problems (401/402/403) stop at once with a clear message.
 */

type Route = { name: string; call: (texts: string[]) => Promise<number[][]> };

const token = () => hfToken();

const ROUTES: Route[] = [
  {
    name: 'deepinfra',
    call: async (texts) => {
      const out = await fetchJson<{ data: { embedding: number[]; index: number }[] }>(
        `${HF_ROUTER}/deepinfra/v1/openai/embeddings`,
        { token: token(), body: { model: EMBEDDING.model, input: texts, encoding_format: 'float' } },
        { label: 'embeddings (deepinfra)' }
      );
      return [...out.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
    },
  },
  {
    name: 'hf-inference',
    call: async (texts) => {
      const out = await fetchJson<number[][] | number[][][]>(
        `${HF_ROUTER}/hf-inference/models/${EMBEDDING.model}/pipeline/feature-extraction`,
        { token: token(), body: { inputs: texts, normalize: true } },
        { label: 'embeddings (hf-inference)' }
      );
      // Some models return token-level vectors: [batch][tokens][dim]. Take the first (CLS/pooled).
      return (out as unknown[]).map((v) => (Array.isArray((v as unknown[])[0]) ? (v as number[][])[0] : (v as number[])));
    },
  },
];

let working: Route | null = null;

function fatal(error: unknown): boolean {
  return error instanceof HttpError && [401, 402, 403].includes(error.status);
}

async function embedRaw(texts: string[]): Promise<number[][]> {
  if (working) return working.call(texts);
  const failures: string[] = [];
  for (const route of ROUTES) {
    try {
      const vectors = await route.call(texts);
      if (vectors.length !== texts.length || !vectors.every((v) => Array.isArray(v) && v.length > 0)) {
        failures.push(`${route.name}: unexpected response shape`);
        continue;
      }
      working = route;
      return vectors;
    } catch (error) {
      if (fatal(error)) {
        const status = (error as HttpError).status;
        const hint =
          status === 401
            ? 'HF_TOKEN was rejected (invalid or revoked). Create a new token with the "Make calls to Inference Providers" permission and update .env.local.'
            : status === 402
              ? 'The Hugging Face account has no inference credits left.'
              : 'HF_TOKEN lacks permission to call Inference Providers.';
        throw new Error(`Embeddings failed: ${hint}`);
      }
      failures.push((error as Error).message);
    }
  }
  throw new Error(`Embeddings failed on every route:\n  ${failures.join('\n  ')}`);
}

/** Which provider route answered (after the first call). */
export function embeddingRoute(): string | null {
  return working?.name ?? null;
}

/** Normalise to unit length (cosine), whatever the provider returned. */
function normalise(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

/** Passages for the index, in batches. */
export async function embedPassages(texts: string[], batchSize = 16, onBatch?: (done: number) => void): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = await embedRaw(texts.slice(i, i + batchSize));
    out.push(...batch.map(normalise));
    onBatch?.(Math.min(i + batchSize, texts.length));
  }
  return out;
}

/** A visitor's question (with Qwen3-Embedding's query instruction). */
export async function embedQuery(question: string): Promise<number[]> {
  const [v] = await embedRaw([`Instruct: ${EMBEDDING.queryInstruction}\nQuery: ${question}`]);
  return normalise(v);
}
