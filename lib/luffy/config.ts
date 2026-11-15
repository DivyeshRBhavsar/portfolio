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

// ── The answering API (app/api/chat) ──

/** What a request may contain. */
export const REQUEST = {
  maxMessageChars: 300,
  maxBodyBytes: 8 * 1024,
  /** Turns of history from the browser used as context (never for limits). */
  historyTurns: 3,
  historyChars: 300,
};

/**
 * Question limits per session. Neutral questions (greetings, about Luffy) don't count.
 * Relevant = on_topic or on_topic_redirect; off-track = off_topic, gibberish or abuse.
 *   after question 5:  ≥ 4 of the first 5 relevant → limit 10, else stop ("limit")
 *   after question 10: ≥ 4 of questions 6–10 relevant AND ≥ 2 relevant questions with
 *                      intent hiring/project → limit 15, else stop ("flow_complete")
 *   after question 15: stop ("flow_complete")
 *   any time: 3 off-track in a row or 2 abuse in total → stop ("off_track")
 */
export const LIMITS = {
  first: 5,
  second: 10,
  third: 15,
  relevantNeeded: 4,
  hiringOrProjectNeeded: 2,
  offTrackStreak: 3,
  abuseTotal: 2,
  sessionTtlSeconds: 24 * 60 * 60,
  /** One question at a time per session. */
  lockSeconds: 30,
  /** The end-of-conversation summary of relevant questions. */
  summaryMaxChars: 600,
  /** Starter questions' shared answer cache. */
  starterCacheSeconds: 24 * 60 * 60,
};

/** Daily caps (reset at midnight Toronto time). Every accepted message counts. */
export const CAPS = { perIpPerDay: 30, sitePerDay: 300, timeZone: 'America/Toronto' };

/** Hybrid retrieval (vector + keyword) and the relevance threshold. */
export const RETRIEVAL = {
  /** Below this top cosine, the question is off-topic (no model call). */
  threshold: 0.3,
  vectorWeight: 0.75,
  keywordWeight: 0.25,
  /** keyword score → 0..1 as score / (score + saturation) */
  keywordSaturation: 8,
  vectorTopK: 10,
  candidates: 8,
  perSource: 2,
  contextChunks: 5,
  maxSources: 3,
  /** Sources the answer doesn't name are shown only if this close to the best score. */
  sourceScoreMargin: 0.05,
};

/** The chat model call. */
export const MODEL = { temperature: 0.3, maxTokens: 350, firstTokenMs: 8000, totalMs: 25000 };

/**
 * Language safety net, for questions in a non-Latin script only: the first answer is held
 * back; if less than `minScriptShare` of its letters are in the question's script, it's
 * regenerated once with a stricter instruction (only if the first took under
 * `retryIfUnderMs`, to stay inside the route's 30 s). The retry isn't counted.
 */
export const LANGUAGE = { minScriptShare: 0.5, retryIfUnderMs: 12000 };

/** Luffy's replies that aren't in content/luffy-guardrails.json. */
export const API_REPLIES = {
  dailyCap: "I've answered a lot of questions today and need a little rest 😴 Come back tomorrow, or send Divyesh a message on the contact page!",
};

export const SESSION_COOKIE = 'luffy_sid';

let warnedSalt = false;
/**
 * The secret mixed into IP hashes (raw IPs are never stored). Required in production;
 * in development a fixed fallback is used, with a warning.
 */
export function hashSalt(): string {
  const salt = process.env.LUFFY_HASH_SALT?.trim();
  if (salt) return salt;
  if (process.env.NODE_ENV === 'production') return requireEnv('LUFFY_HASH_SALT');
  if (!warnedSalt) {
    console.warn('[luffy] LUFFY_HASH_SALT is not set; using a development fallback.');
    warnedSalt = true;
  }
  return 'luffy-dev-salt';
}

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
  for (const name of ['HF_TOKEN', 'UPSTASH_VECTOR_REST_TOKEN', 'UPSTASH_REDIS_REST_TOKEN', 'LUFFY_HASH_SALT']) {
    const secret = process.env[name]?.trim();
    if (secret) out = out.split(secret).join('[hidden]');
  }
  return out;
}
