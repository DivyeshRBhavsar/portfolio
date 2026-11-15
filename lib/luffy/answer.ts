import { API_REPLIES, LANGUAGE, RETRIEVAL } from './config';
import { ChatUnavailable, parseMeta, streamChat } from './chat';
import { classifyByRules } from './classify';
import { category, getGuardrails, pickOne } from './guardrails';
import { questionScript, scriptShare, systemPrompt, userPrompt, type Turn } from './prompt';
import { hybridSearch, selectContext, type Retrieved, type SearchResult } from './search';
import { cacheStarter, findStarter, getCachedStarter } from './starters';
import {
  INTENTS,
  contactFor,
  countQuestion,
  loadSession,
  overDailyCap,
  releaseLock,
  saveSession,
  type Intent,
  type Kind,
  type SessionState,
  type StopReason,
} from './session';

/**
 * One visitor message → a stream of Server-Sent Events:
 *   meta    { category, intent, questionNumber, allowed, remaining }
 *   token   { text }                       (repeated)
 *   sources [{ title, url, sourceType }]   (on-topic, grounded answers only; max 3)
 *   done    { stopped, reason?, contact? }
 *
 * Order of checks (cheapest first): stopped session → daily caps → rules → retrieval
 * threshold → Qwen. Only the last costs a model call. The session lock (taken by the
 * route) is released when the stream ends. Logs carry error types only, never text.
 */

export type ChatInput = { sessionId: string; ipHash: string; message: string; history: Turn[] };

type DoneReason = StopReason | 'daily_cap' | 'unavailable';

const encoder = new TextEncoder();

function limitReply(reason: StopReason): string {
  const replies = getGuardrails().limitReplies;
  const key = reason === 'limit' ? 'soft_stop' : reason === 'flow_complete' ? 'flow_stop' : 'early_stop';
  return replies[key] ?? replies.soft_stop ?? Object.values(replies)[0] ?? '';
}

/**
 * Sources for an answer (max 3, one per page): the ones the answer names, then any other
 * retrieved source scoring within RETRIEVAL.sourceScoreMargin of the best. No padding.
 */
function pickSources(context: Retrieved[], answer: string) {
  const text = answer.toLowerCase();
  const short = (title: string) => title.split(/:| — /)[0].trim().toLowerCase();
  const unique = context.filter((c, i) => context.findIndex((x) => x.url === c.url) === i);
  const top = Math.max(...context.map((c) => c.hybrid));
  const named = unique.filter((c) => text.includes(short(c.title)));
  const close = unique.filter((c) => !named.includes(c) && c.hybrid >= top - RETRIEVAL.sourceScoreMargin);
  return [...named, ...close].slice(0, RETRIEVAL.maxSources).map((c) => ({ title: c.title, url: c.url, sourceType: c.sourceType }));
}

export function answerStream(input: ChatInput): ReadableStream<Uint8Array> {
  const { sessionId, ipHash, message, history } = input;

  return new ReadableStream({
    async start(controller) {
      let sentMeta = false;
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      const token = (text: string) => text && send('token', { text });
      const meta = (categoryId: string, intent: Intent, s: SessionState) => {
        sentMeta = true;
        const remaining = s.stopped ? 0 : Math.max(0, s.allowed - s.count);
        send('meta', { category: categoryId, intent, questionNumber: s.count, allowed: s.allowed, remaining });
      };
      const done = (stopped: boolean, reason?: DoneReason, contact?: ReturnType<typeof contactFor>) => send('done', { stopped, ...(reason ? { reason } : {}), ...(contact ? { contact } : {}) });

      let state: SessionState | null = null;

      // Starter questions never count, ignore the visitor's history (their answer is
      // shared through the cache), and are served from the cache when possible.
      const starter = findStarter(message);
      const promptHistory = starter ? [] : history;

      /** Count a question, save it, and close with the stop reply if this one stopped the session. */
      const count = async (categoryId: string, kind: Kind, intent: Intent) => {
        const prev = state!;
        if (starter) return { prev, next: prev };
        const next = countQuestion(prev, { category: categoryId, kind, intent, text: message });
        if (next !== prev) await saveSession(sessionId, next);
        state = next;
        return { prev, next };
      };
      const finish = (prev: SessionState, next: SessionState) => {
        if (next.stopped && !prev.stopped) token(`\n\n${limitReply(next.stopped)}`);
        const contact = next.stopped === 'limit' || next.stopped === 'flow_complete' ? contactFor(next) : undefined;
        done(!!next.stopped, next.stopped ?? undefined, contact);
      };
      const unavailable = (kind: string) => {
        console.warn(`[luffy] answer unavailable: ${kind}`);
        const s = state ?? { count: 0, allowed: 0 };
        if (!sentMeta) meta('unavailable', 'casual', s as SessionState);
        token(pickOne(getGuardrails().notSureReplies));
        done(false, 'unavailable');
      };
      const canned = async (categoryId: string, intent: Intent) => {
        const cat = category(categoryId)!;
        const { prev, next } = await count(categoryId, cat.counts_as, intent);
        meta(categoryId, intent, next);
        token(pickOne(cat.replies));
        finish(prev, next);
      };

      try {
        state = await loadSession(sessionId);

        // Already stopped: the matching limit reply, no model call, not counted.
        if (state.stopped) {
          meta('stopped', 'casual', state);
          token(limitReply(state.stopped));
          const contact = state.stopped === 'off_track' ? undefined : contactFor(state);
          done(true, state.stopped, contact);
          return;
        }

        // A starter answered in the last 24 hours: from the cache, free (no cap, no count).
        if (starter) {
          const cached = await getCachedStarter(starter.question).catch(() => null);
          if (cached) {
            const intent = (INTENTS as readonly string[]).includes(cached.intent) ? (cached.intent as Intent) : 'casual';
            meta(cached.category, intent, state);
            for (const piece of cached.text.match(/\S+\s*/g) ?? []) token(piece);
            if (cached.sources.length) send('sources', cached.sources);
            done(false);
            return;
          }
        }

        // Daily caps (every accepted message counts).
        if (await overDailyCap(ipHash)) {
          meta('daily_cap', 'casual', state);
          token(API_REPLIES.dailyCap);
          done(true, 'daily_cap');
          return;
        }

        // 1. Rules.
        const rule = classifyByRules(message, (id) => !!category(id));
        if (rule) return await canned(rule.categoryId, rule.intent);

        // 2. Retrieval and the relevance threshold.
        let search: SearchResult;
        try {
          search = await hybridSearch(message);
        } catch (error) {
          return unavailable(`retrieval (${(error as Error).name})`);
        }
        if (search.topCosine < RETRIEVAL.threshold) {
          const offTopic = category('off_topic_general') ?? getGuardrails().categories.find((c) => c.counts_as === 'off_topic');
          if (offTopic) return await canned(offTopic.id, 'casual');
        }

        // 3. Qwen.
        const context = selectContext(search.results);
        /** Start an answer and read past its metadata line. */
        const openAnswer = async (strictLanguage: boolean) => {
          const stream = streamChat([
            { role: 'system', content: systemPrompt() },
            { role: 'user', content: userPrompt(message, context, promptHistory, strictLanguage) },
          ]);
          let buffer = '';
          let parsed = parseMeta('');
          while (parsed.status === 'more') {
            const next = await stream.next();
            if (next.done) break;
            buffer += next.value;
            parsed = parseMeta(buffer);
          }
          if (!buffer) throw new ChatUnavailable('error');
          return {
            stream,
            metaLine: parsed.status === 'done' ? parsed.meta : null,
            firstText: parsed.status === 'done' ? parsed.rest : buffer.replace(/^\s*<<\s?meta[^\n]*\n?/, ''),
          };
        };

        const startedAt = Date.now();
        let first: Awaited<ReturnType<typeof openAnswer>>;
        try {
          first = await openAnswer(false);
        } catch (error) {
          return unavailable(error instanceof ChatUnavailable ? `model (${error.kind})` : 'model (error)');
        }
        const { metaLine } = first;

        const validCategory = metaLine && (metaLine.category === 'on_topic' || category(metaLine.category)) ? metaLine.category : 'on_topic';
        const intent = (INTENTS as readonly string[]).includes(metaLine?.intent ?? '') ? (metaLine!.intent as Intent) : 'casual';
        const grounded = metaLine?.grounded ?? true;
        const kind: Kind = validCategory === 'on_topic' ? 'on_topic' : category(validCategory)!.counts_as;

        // Counted once, whatever happens below (a language retry isn't an extra question).
        const { prev, next } = await count(validCategory, kind, intent);
        meta(validCategory, intent, next);

        // Drop whitespace before the first real text (the newline after the meta line).
        let answer = '';
        const emit = (text: string) => {
          const t = answer ? text : text.replace(/^\s+/, '');
          if (!t) return;
          answer += t;
          token(t);
        };

        const script = questionScript(message);
        if (!script) {
          // Latin-script questions stream straight through.
          emit(first.firstText);
          for await (const text of first.stream) emit(text);
        } else {
          // Non-Latin script: hold the first answer back and check its language.
          let draft = first.firstText;
          for await (const text of first.stream) draft += text;
          const inTime = Date.now() - startedAt < LANGUAGE.retryIfUnderMs;
          if (scriptShare(draft, script) >= LANGUAGE.minScriptShare || !inTime) {
            emit(draft);
          } else {
            console.info('[luffy] language retry');
            try {
              const second = await openAnswer(true);
              emit(second.firstText);
              for await (const text of second.stream) emit(text);
            } catch {
              emit(draft); // the retry failed: the first answer is better than none
            }
          }
        }
        if (!answer.trim()) token(pickOne(getGuardrails().notSureReplies));

        if (validCategory === 'on_topic' && grounded && answer.trim()) {
          const sources = pickSources(context, answer);
          if (sources.length) send('sources', sources);
          if (starter) {
            await cacheStarter(starter.question, { text: answer.trim(), sources, category: validCategory, intent }).catch(() => {
              console.warn('[luffy] starter cache write failed');
            });
          }
        }
        finish(prev, next);
      } catch (error) {
        console.error(`[luffy] chat failed: ${(error as Error).name}`);
        try {
          if (!sentMeta) unavailable('internal');
          else done(false, 'unavailable');
        } catch {
          /* stream already closed */
        }
      } finally {
        await releaseLock(sessionId).catch(() => {});
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });
}
