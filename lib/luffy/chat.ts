import { CHAT_ROUTES, HF_ROUTER, MODEL, chatModel, hfToken } from './config';

/**
 * Streaming chat with Qwen through Hugging Face Inference Providers (OpenAI-compatible).
 * The primary route (deepinfra, thinking off) is tried first; on an error or no first
 * token within MODEL.firstTokenMs it retries once on the fallback route (automatic
 * routing, reasoning_effort "none"). 402 (no credits) and 429 (rate limited) end at once.
 * Provider error details are never passed on; callers only see ChatUnavailable.kind.
 */

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class ChatUnavailable extends Error {
  constructor(public kind: 'credits' | 'rate_limit' | 'timeout' | 'error') {
    super(`chat unavailable: ${kind}`);
  }
}

type Route = (typeof CHAT_ROUTES)[keyof typeof CHAT_ROUTES];

/** Open a streaming completion; resolves once the first text token has arrived. */
async function open(route: Route, messages: ChatMessage[], deadline: AbortSignal): Promise<{ first: string; rest: AsyncGenerator<string> }> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  deadline.addEventListener('abort', abort);
  const firstTimer = setTimeout(abort, MODEL.firstTokenMs);
  const fail = (kind: ChatUnavailable['kind']): never => {
    clearTimeout(firstTimer);
    deadline.removeEventListener('abort', abort);
    throw new ChatUnavailable(kind);
  };

  let res: Response;
  try {
    res = await fetch(`${HF_ROUTER}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hfToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: route.model(chatModel()),
        messages,
        temperature: MODEL.temperature,
        max_tokens: MODEL.maxTokens,
        stream: true,
        ...route.extraBody,
      }),
      signal: controller.signal,
    });
  } catch {
    return fail(controller.signal.aborted ? 'timeout' : 'error');
  }
  if (res.status === 402) return fail('credits');
  if (res.status === 429) return fail('rate_limit');
  if (!res.ok || !res.body) return fail('error');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  async function* tokens(): AsyncGenerator<string> {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') return;
          try {
            const json = JSON.parse(data) as { choices?: { delta?: { content?: string | null } }[] };
            const text = json.choices?.[0]?.delta?.content;
            if (text) yield text;
          } catch {
            /* a keep-alive or partial line: skip */
          }
        }
      }
    } finally {
      deadline.removeEventListener('abort', abort);
      reader.cancel().catch(() => {});
    }
  }

  const stream = tokens();
  try {
    const first = await stream.next();
    clearTimeout(firstTimer);
    if (first.done) throw new ChatUnavailable('error');
    return { first: first.value, rest: stream };
  } catch (error) {
    clearTimeout(firstTimer);
    if (error instanceof ChatUnavailable) throw error;
    throw new ChatUnavailable(controller.signal.aborted ? 'timeout' : 'error');
  }
}

/**
 * Stream the answer text. Throws ChatUnavailable before the first token if neither route
 * works; once text is flowing, a later failure just ends the stream.
 */
export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const deadline = AbortSignal.timeout(MODEL.totalMs);
  let opened: { first: string; rest: AsyncGenerator<string> };
  try {
    opened = await open(CHAT_ROUTES.primary, messages, deadline);
  } catch (error) {
    if (error instanceof ChatUnavailable && (error.kind === 'credits' || error.kind === 'rate_limit')) throw error;
    console.warn(`[luffy] primary chat route failed (${(error as ChatUnavailable).kind ?? 'error'}); trying the fallback`);
    opened = await open(CHAT_ROUTES.fallback, messages, deadline);
  }
  yield opened.first;
  try {
    for await (const text of opened.rest) yield text;
  } catch {
    /* timed out or dropped mid-answer: keep what was said */
  }
}

// ── The metadata line ──

export type ModelMeta = { category: string; intent: string; grounded: boolean };

export type MetaParse = { status: 'more' } | { status: 'done'; meta: ModelMeta | null; rest: string };

const MAX_META_CHARS = 400;

/**
 * Look for <<meta {...}>> at the start of the model's output. Tolerates leading spaces,
 * a code fence around it, a missing ">>" (ends at the newline), and junk around the JSON.
 * 'more' = keep buffering; 'done' = meta (or null if absent/unparseable) + the answer text.
 */
export function parseMeta(buffer: string): MetaParse {
  let s = buffer.replace(/^\s+/, '');
  let fenced = false;
  if (s.startsWith('```')) {
    const nl = s.indexOf('\n');
    if (nl < 0) return s.length > MAX_META_CHARS ? { status: 'done', meta: null, rest: buffer } : { status: 'more' };
    s = s.slice(nl + 1).replace(/^\s+/, '');
    fenced = true;
  }
  if (s.length < 6 && '<<meta'.startsWith(s)) return { status: 'more' };
  if (!s.startsWith('<<meta') && !s.startsWith('<< meta')) return { status: 'done', meta: null, rest: buffer };

  const close = s.indexOf('>>', 2);
  const nl = s.indexOf('\n');
  const end = close >= 0 && (nl < 0 || close < nl) ? close + 2 : nl;
  if (end < 0) return s.length > MAX_META_CHARS ? { status: 'done', meta: null, rest: '' } : { status: 'more' };

  const head = s.slice(0, end);
  let rest = s.slice(end).replace(/^\s*\n?/, '');
  if (fenced) rest = rest.replace(/^```\s*\n?/, '');
  rest = rest.replace(/^\s+/, '');

  let meta: ModelMeta | null = null;
  const json = head.slice(head.indexOf('{'), head.lastIndexOf('}') + 1);
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    meta = {
      category: typeof o.category === 'string' ? o.category : '',
      intent: typeof o.intent === 'string' ? o.intent : '',
      grounded: typeof o.grounded === 'boolean' ? o.grounded : o.grounded === 'false' ? false : true,
    };
  } catch {
    meta = null;
  }
  return { status: 'done', meta, rest };
}
