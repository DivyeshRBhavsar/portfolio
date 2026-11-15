'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatErrors, chatUnlockLines } from './luffyLines';
import { fill, pick } from './speech';

/**
 * The Ask Luffy panel's conversation with /api/chat (Server-Sent Events read with fetch).
 * One conversation per visit, shared by every place the panel opens from: finished
 * messages, the question counter and any ending are kept in sessionStorage. "Clear chat"
 * only clears what's on screen; the server's limits stay as they are.
 */

export type ChatSource = { title: string; url: string; sourceType: string };

export type ChatMessage = {
  id: string;
  role: 'visitor' | 'luffy';
  text: string;
  /** waiting = no text yet (thinking), streaming = text arriving, done, or error. */
  status: 'waiting' | 'streaming' | 'done' | 'error';
  kind: 'greeting' | 'answer' | 'unlock' | 'error';
  sources?: ChatSource[];
  /** For a failed send: the question to send again. */
  retry?: string;
};

export type EndReason = 'limit' | 'flow_complete' | 'off_track' | 'daily_cap' | 'unavailable';
export type ChatEnding = { reason: EndReason; contact?: { purpose: string; summary: string }; retry?: string };
export type ChatCounter = { questionNumber: number; allowed: number };

type Saved = { messages: ChatMessage[]; counter: ChatCounter | null; ended: ChatEnding | null };

const STORAGE_KEY = 'luffy-chat';
const HISTORY_TURNS = 3;

let nextId = 0;
const newId = () => `m${Date.now().toString(36)}${(nextId++).toString(36)}`;

function load(): Saved {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Saved>;
      return {
        messages: Array.isArray(saved.messages) ? saved.messages.filter((m) => m && m.status === 'done') : [],
        counter: saved.counter ?? null,
        ended: saved.ended ?? null,
      };
    }
  } catch {
    /* storage unavailable */
  }
  return { messages: [], counter: null, ended: null };
}

function save(state: Saved): void {
  try {
    // Only finished messages; greetings are made fresh on each open.
    const messages = state.messages.filter((m) => m.status === 'done' && m.kind !== 'greeting');
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, messages }));
  } catch {
    /* storage unavailable: the chat still works for this panel */
  }
}

/** The last few question/answer turns, for /api/chat's context (never used for limits). */
function historyOf(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.status === 'done' && (m.role === 'visitor' || m.kind === 'answer'))
    .slice(-HISTORY_TURNS * 2)
    .map((m) => ({ role: m.role === 'visitor' ? ('user' as const) : ('assistant' as const), content: m.text }));
}

export function useLuffyChat(greeting: () => string) {
  const [state, setState] = useState<Saved>(() => {
    const saved = load();
    const hasConversation = saved.messages.some((m) => m.role === 'visitor');
    return hasConversation
      ? saved
      : { ...saved, messages: [{ id: newId(), role: 'luffy', text: greeting(), status: 'done', kind: 'greeting' }, ...saved.messages] };
  });
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
  const stateRef = useRef(state);

  /** Apply a change now (the ref is always current, even before React re-renders). */
  const update = useCallback((fn: (s: Saved) => Saved) => {
    const next = fn(stateRef.current);
    stateRef.current = next;
    setState(next);
  }, []);

  // Persist whenever nothing is streaming (so half-written answers aren't saved).
  useEffect(() => {
    if (!streaming) save(state);
  }, [state, streaming]);

  // Closing the panel mid-answer stops reading (the server finishes on its own).
  useEffect(() => () => abortRef.current?.abort(), []);

  const patch = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
    update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === id ? fn(m) : m)) }));

  const send = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      const current = stateRef.current;
      if (!message || streamingRef.current || current.ended) return;

      const history = historyOf(current.messages);
      const visitorId = newId();
      const luffyId = newId();
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          { id: visitorId, role: 'visitor', text: message, status: 'done', kind: 'answer' },
          { id: luffyId, role: 'luffy', text: '', status: 'waiting', kind: 'answer' },
        ],
      }));
      streamingRef.current = true;
      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const fail = (text: string, retry?: string) =>
        patch(luffyId, (m) => ({ ...m, text, status: 'error', kind: 'error', retry }));

      let unlocked = 0;
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          if (res.status === 429) fail(chatErrors.busy);
          else if (res.status === 400 || res.status === 403 || res.status === 413) fail(chatErrors.rejected);
          else fail(chatErrors.network, message);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let end: number;
          while ((end = buffer.indexOf('\n\n')) >= 0) {
            const block = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            const event = block.match(/^event: (.+)$/m)?.[1];
            const dataLine = block.match(/^data: (.+)$/m)?.[1];
            if (!event || !dataLine) continue;
            const data = JSON.parse(dataLine);
            if (event === 'meta') {
              const prevAllowed = stateRef.current.counter?.allowed ?? 0;
              if (prevAllowed && data.allowed > prevAllowed) unlocked = data.allowed - prevAllowed;
              update((s) => ({ ...s, counter: { questionNumber: data.questionNumber, allowed: data.allowed } }));
            } else if (event === 'token') {
              patch(luffyId, (m) => ({ ...m, text: m.text + data.text, status: 'streaming' }));
            } else if (event === 'sources') {
              patch(luffyId, (m) => ({ ...m, sources: data as ChatSource[] }));
            } else if (event === 'done') {
              patch(luffyId, (m) => ({ ...m, status: 'done' }));
              const reason = data.reason as EndReason | undefined;
              if (data.stopped && reason) update((s) => ({ ...s, ended: { reason, contact: data.contact } }));
              else if (reason === 'unavailable') update((s) => ({ ...s, ended: { reason, retry: message } }));
            }
          }
        }
        // Stream ended without "done" (dropped): keep what arrived, or say so.
        patch(luffyId, (m) => (m.status === 'done' ? m : m.text ? { ...m, status: 'done' } : { ...m, text: chatErrors.network, status: 'error', kind: 'error', retry: message }));
        if (unlocked > 0) {
          update((s) => ({
            ...s,
            messages: [...s.messages, { id: newId(), role: 'luffy', text: fill(pick(chatUnlockLines), { n: String(unlocked) }), status: 'done', kind: 'unlock' }],
          }));
        }
      } catch {
        if (controller.signal.aborted) {
          // The panel closed: drop the unfinished pair so it isn't half-saved.
          update((s) => ({ ...s, messages: s.messages.filter((m) => m.id !== luffyId && m.id !== visitorId) }));
        } else {
          fail(chatErrors.network, message);
        }
      } finally {
        abortRef.current = null;
        streamingRef.current = false;
        setStreaming(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads state through refs
    [update]
  );

  /** Send a failed question again (replacing the failed pair). */
  const retry = useCallback(
    (question: string) => {
      update((s) => {
        const messages = [...s.messages];
        // Remove the last Luffy reply and the visitor message before it.
        const lastLuffy = messages.map((m) => m.role).lastIndexOf('luffy');
        if (lastLuffy >= 0) messages.splice(lastLuffy, 1);
        const lastVisitor = messages.map((m) => m.role).lastIndexOf('visitor');
        if (lastVisitor >= 0 && messages[lastVisitor].text === question) messages.splice(lastVisitor, 1);
        return { ...s, messages, ended: s.ended?.reason === 'unavailable' ? null : s.ended };
      });
      void send(question);
    },
    [send, update]
  );

  /** Clear what's on screen (the server's limits and any ending stay). */
  const clear = useCallback(() => {
    update((s) => ({ ...s, messages: [{ id: newId(), role: 'luffy', text: greeting(), status: 'done', kind: 'greeting' }] }));
  }, [greeting, update]);

  return { ...state, streaming, send, retry, clear };
}
