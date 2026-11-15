/**
 * Luffy's chatbot settings (server and scripts only). Secrets come from the environment
 * (.env.local locally, project/repository secrets in production and CI) and are never
 * logged. The knowledge base lives in an Upstash Vector index whose dimension must match
 * EMBEDDING.dimension; scripts/knowledge-build.ts checks that before writing anything.
 */

export const EMBEDDING = {
  model: 'Qwen/Qwen3-Embedding-0.6B',
  dimension: 1024,
  /**
   * Qwen3-Embedding works best with an instruction on the query side only; passages are
   * embedded as they are. Qwen's standard retrieval instruction: a site-specific one
   * ("…about Divyesh…") dominated short questions and pulled every query towards generic
   * "About Divyesh" chunks, so nonsense scored as high as real questions.
   */
  queryInstruction: 'Given a web search query, retrieve relevant passages that answer the query',
} as const;

export const DEFAULT_CHAT_MODEL = 'Qwen/Qwen3.5-9B';

/**
 * How Luffy calls the chat model (Part 2). Qwen3.5-9B "thinks" by default, which can use
 * the whole token budget before any answer (16 s and no reply on ovhcloud), so thinking
 * is switched off:
 *   primary   pinned to deepinfra, chat_template_kwargs.enable_thinking = false (≈0.8 s)
 *   fallback  automatic provider routing with reasoning_effort "none" (≈1.4 s), used if
 *             the primary fails
 * `model` is the HF_CHAT_MODEL (or default) id; the primary appends ":deepinfra".
 */
export const CHAT_ROUTES = {
  primary: {
    provider: 'deepinfra',
    model: (model: string) => `${model}:deepinfra`,
    extraBody: { chat_template_kwargs: { enable_thinking: false } },
  },
  fallback: {
    provider: 'auto',
    model: (model: string) => model,
    extraBody: { reasoning_effort: 'none' },
  },
} as const;

/** Hugging Face Inference Providers (OpenAI-compatible chat lives at /v1/chat/completions). */
export const HF_ROUTER = 'https://router.huggingface.co';

/** The local keyword index for hybrid search (BM25 term stats, no vectors). */
export const KEYWORD_INDEX_PATH = 'data/luffy-keywords.json';

/** The site's own address, for absolute links in answers later (paths are stored relative). */
export const SITE_PATHS = {
  story: (slug: string) => `/projects/${slug}`,
  blog: (slug: string) => `/blog/${slug}`,
  life: () => '/',
  services: () => '/work-with-me',
};

class LuffyConfigError extends Error {}

/** A required environment variable, or a clear error naming it (never its value). */
export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new LuffyConfigError(`${name} is not set. Add it to .env.local (see .env.example).`);
  }
  return value;
}

export function hfToken(): string {
  return requireEnv('HF_TOKEN');
}

export function chatModel(): string {
  return process.env.HF_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;
}

export function upstashVector(): { url: string; token: string } {
  return { url: requireEnv('UPSTASH_VECTOR_REST_URL').replace(/\/$/, ''), token: requireEnv('UPSTASH_VECTOR_REST_TOKEN') };
}

export function upstashRedis(): { url: string; token: string } {
  return { url: requireEnv('UPSTASH_REDIS_REST_URL').replace(/\/$/, ''), token: requireEnv('UPSTASH_REDIS_REST_TOKEN') };
}

/** Replace any configured secret in a message with [hidden] (for error output). */
export function redact(message: string): string {
  let out = message;
  for (const name of ['HF_TOKEN', 'UPSTASH_VECTOR_REST_TOKEN', 'UPSTASH_REDIS_REST_TOKEN']) {
    const secret = process.env[name]?.trim();
    if (secret) out = out.split(secret).join('[hidden]');
  }
  return out;
}
