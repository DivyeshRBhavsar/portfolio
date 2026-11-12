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

type Message = { id: number; text: string };

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
}: {
  /** A message is about to type (Luffy's talking clip). */
  onMessageStart: () => void;
}) {
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
      onStartRef.current();
    }
  }, []);

  /**
   * Queue lines for Luffy. `then` is what to show afterwards ('keep' leaves the current
   * prompt on screen, for idle nudges). `instant` skips the typing.
   */
  const say = useCallback(
    (lines: string[], then: Prompt | 'keep' = null, instant = false) => {
      const messages = lines.map((text) => ({ id: nextId.current++, text }));
      const current = stateRef.current;
      const prompt = then === 'keep' ? current.prompt : null;
      const pendingPrompt = then === 'keep' ? current.pendingPrompt : then;

      if (instant) {
        commit({
          ...current,
          log: [...current.log, ...messages].slice(-MAX_VISIBLE_MESSAGES),
          prompt: then === 'keep' ? current.prompt : then,
          pendingPrompt: null,
        });
        return;
      }
      commit(advance({ ...current, queue: [...current.queue, ...messages], prompt, pendingPrompt }));
    },
    [commit]
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
          log: [...current.log, active.message].slice(-MAX_VISIBLE_MESSAGES),
        })
      );
    }, MESSAGE_GAP_MS);
    return () => clearTimeout(timer);
  }, [phase, activeId, commit]);

  const visible: VisibleMessage[] = state.log.map((m) => ({
    id: m.id,
    text: m.text,
    shown: m.text,
    state: 'done' as const,
  }));
  if (state.active) {
    const { message, typed, phase: activePhase } = state.active;
    visible.push({
      id: message.id,
      text: message.text,
      shown: activePhase === 'dots' ? '' : message.text.slice(0, typed),
      state: activePhase,
    });
  }

  return {
    visible: visible.slice(-MAX_VISIBLE_MESSAGES),
    /** Finished messages, for the screen-reader live region. */
    log: state.log,
    prompt: state.prompt,
    /** Luffy is still talking (or has more queued). */
    busy: state.active !== null || state.queue.length > 0,
    say,
    clearPrompt,
    reset,
  };
}
