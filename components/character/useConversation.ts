'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_VISIBLE_MESSAGES,
  MESSAGE_GAP_MS,
  TYPE_INTERVAL_MS,
  TYPING_INDICATOR_MS,
} from './introAssets';

/** What waits for the visitor once Luffy has finished talking. */
export type Prompt = 'name' | 'chips' | null;

export type MessageLink = { label: string; href: string };

/** What Luffy says: plain text, or text with link buttons shown once it's typed. */
export type Line = string | { text: string; links?: MessageLink[] };

type Message = {
  id: number;
  text: string;
  /** Visitor messages (the Q&A panel's questions) appear at once, never typed. */
  from: 'luffy' | 'visitor';
  links?: MessageLink[];
};

type Active = { message: Message; phase: 'dots' | 'typing' | 'done'; typed: number };

type State = {
  /** Finished messages (only the last few are kept). */
  log: Message[];
  /** Waiting to be said, in order. */
  queue: Message[];
  active: Active | null;
  /** Shown once the queue is empty. */
  pendingPrompt: Prompt;
  prompt: Prompt;
};

export type VisibleMessage = {
  id: number;
  text: string;
  from: 'luffy' | 'visitor';
  links?: MessageLink[];
  /** What's typed so far (the full text once done). */
  shown: string;
  state: 'dots' | 'typing' | 'done';
};

const EMPTY: State = { log: [], queue: [], active: null, pendingPrompt: null, prompt: null };

/** Start the next queued message, or show the prompt once there's nothing left to say. */
function advance(state: State): State {
  if (state.active) return state;
  if (state.queue.length > 0) {
    const [message, ...queue] = state.queue;
    return { ...state, queue, active: { message, phase: 'dots', typed: 0 } };
  }
  if (state.pendingPrompt) return { ...state, prompt: state.pendingPrompt, pendingPrompt: null };
  return state;
}

/**
 * Chat-style messages: each one shows "• • •" for a moment, then types out; older ones
 * stay above, faded. Said with `instant` (reduced motion, same-visit) they appear at once.
 *
 * All transitions run from event handlers or timers (never synchronously in an
 * effect), through `commit`, which also reports each message as it starts.
 */
export function useConversation({
  onMessageStart,
  maxVisible = MAX_VISIBLE_MESSAGES,
}: {
  /** A message is about to type (Luffy's talking clip). */
  onMessageStart?: () => void;
  /** How many messages stay on screen (the stage bubble shows 3). */
  maxVisible?: number;
} = {}) {
  const [state, setState] = useState<State>(EMPTY);
  const stateRef = useRef(state);
  const nextId = useRef(1);
  const onStartRef = useRef(onMessageStart);
  useEffect(() => {
    onStartRef.current = onMessageStart;
  }, [onMessageStart]);

  const commit = useCallback((next: State) => {
    const previous = stateRef.current;
    stateRef.current = next;
    setState(next);
    if (next.active && next.active.message.id !== previous.active?.message.id) {
      onStartRef.current?.();
    }
  }, []);

  /**
   * Queue lines for Luffy. `then` is what to show afterwards ('keep' leaves the current
   * prompt on screen, for idle nudges). `instant` skips the typing.
   */
  const say = useCallback(
    (lines: Line[], then: Prompt | 'keep' = null, instant = false) => {
      const messages: Message[] = lines.map((line) => ({
        id: nextId.current++,
        from: 'luffy',
        ...(typeof line === 'string' ? { text: line } : line),
      }));
      const current = stateRef.current;
      const prompt = then === 'keep' ? current.prompt : null;
      const pendingPrompt = then === 'keep' ? current.pendingPrompt : then;

      if (instant) {
        commit({
          ...current,
          log: [...current.log, ...messages].slice(-maxVisible),
          prompt: then === 'keep' ? current.prompt : then,
          pendingPrompt: null,
        });
        return;
      }
      commit(advance({ ...current, queue: [...current.queue, ...messages], prompt, pendingPrompt }));
    },
    [commit, maxVisible]
  );

  /** The visitor's own message (a picked question), shown at once. Call when not busy. */
  const addVisitorMessage = useCallback(
    (text: string) => {
      const current = stateRef.current;
      const message: Message = { id: nextId.current++, text, from: 'visitor' };
      commit({ ...current, log: [...current.log, message].slice(-maxVisible) });
    },
    [commit, maxVisible]
  );

  /** The visitor answered: hide the prompt until Luffy asks something again. */
  const clearPrompt = useCallback(() => {
    commit({ ...stateRef.current, prompt: null });
  }, [commit]);

  const reset = useCallback(() => commit(EMPTY), [commit]);

  const activeId = state.active?.message.id;
  const phase = state.active?.phase;

  // "• • •" → typing.
  useEffect(() => {
    if (phase !== 'dots') return;
    const timer = setTimeout(() => {
      const current = stateRef.current;
      const active = current.active;
      if (!active || active.message.id !== activeId) return;
      commit({ ...current, active: { ...active, phase: 'typing' } });
    }, TYPING_INDICATOR_MS);
    return () => clearTimeout(timer);
  }, [phase, activeId, commit]);

  // Typing, one character at a time.
  useEffect(() => {
    if (phase !== 'typing') return;
    const interval = setInterval(() => {
      const current = stateRef.current;
      const active = current.active;
      if (!active || active.message.id !== activeId) return;
      const typed = Math.min(active.typed + 1, active.message.text.length);
      const done = typed >= active.message.text.length;
      commit({ ...current, active: { ...active, typed, phase: done ? 'done' : 'typing' } });
    }, TYPE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phase, activeId, commit]);

  // Done: hold briefly, move it to the log, start the next one.
  useEffect(() => {
    if (phase !== 'done') return;
    const timer = setTimeout(() => {
      const current = stateRef.current;
      const active = current.active;
      if (!active || active.message.id !== activeId) return;
      commit(
        advance({
          ...current,
          active: null,
          log: [...current.log, active.message].slice(-maxVisible),
        })
      );
    }, MESSAGE_GAP_MS);
    return () => clearTimeout(timer);
  }, [phase, activeId, commit, maxVisible]);

  const visible: VisibleMessage[] = state.log.map((m) => ({
    id: m.id,
    text: m.text,
    from: m.from,
    links: m.links,
    shown: m.text,
    state: 'done' as const,
  }));
  if (state.active) {
    const { message, typed, phase: activePhase } = state.active;
    visible.push({
      id: message.id,
      text: message.text,
      from: message.from,
      links: message.links,
      shown: activePhase === 'dots' ? '' : message.text.slice(0, typed),
      state: activePhase,
    });
  }

  return {
    visible: visible.slice(-maxVisible),
    /** Finished messages, for the screen-reader live region. */
    log: state.log,
    prompt: state.prompt,
    /** Luffy is still talking (or has more queued). */
    busy: state.active !== null || state.queue.length > 0,
    say,
    addVisitorMessage,
    clearPrompt,
    reset,
  };
}
