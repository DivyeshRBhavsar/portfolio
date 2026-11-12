'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { CLIPS, CLIP_SETTLE_MS, SAFETY_MARGIN_MS, type ClipName } from './introAssets';
import { logStep } from './introDebug';
import type { MediaFormat } from './useStageSetup';

/**
 * settling → float paused, easing back to rest.
 * starting → clip loading/starting; the still stays visible until it's really playing.
 * playing  → clip visible, still hidden. On end, back to the still in the same frame
 *            (every clip starts and ends on the neutral pose).
 */
export type ClipMode = 'settling' | 'starting' | 'playing';
export type CurrentClip = { clip: ClipName; mode: ClipMode; id: number };

/**
 * Luffy's reaction clips (talking, celebrate, waiting…): never two at once.
 * play(clip) drops the request if one is already running; play(clip, { queue: true })
 * plays it after the current one instead.
 */
export function useReactionClips({ format, enabled }: { format: MediaFormat; enabled: boolean }) {
  const [current, setCurrent] = useState<CurrentClip | null>(null);
  const [broken, setBroken] = useState<ReadonlySet<ClipName>>(() => new Set());
  const queueRef = useRef<ClipName[]>([]);
  const currentRef = useRef<CurrentClip | null>(null);
  const nextId = useRef(1);

  const set = useCallback((next: CurrentClip | null) => {
    currentRef.current = next;
    setCurrent(next);
  }, []);

  const play = useCallback(
    (clip: ClipName, options: { queue?: boolean } = {}) => {
      if (!enabled || broken.has(clip)) return;
      if (currentRef.current) {
        if (options.queue) queueRef.current.push(clip);
        return;
      }
      set({ clip, mode: 'settling', id: nextId.current++ });
    },
    [broken, enabled, set]
  );

  /** Next queued clip (already at rest, so no settle), or back to the still. */
  const finish = useCallback(
    (id: number, reason: string) => {
      const playing = currentRef.current;
      if (!playing || playing.id !== id) return; // late event after the safety net
      logStep(`clip ${playing.clip}: ended`, reason);
      const next = queueRef.current.shift();
      set(next ? { clip: next, mode: 'starting', id: nextId.current++ } : null);
    },
    [set]
  );
  const finishFromTimer = useEffectEvent(finish);

  const stop = useCallback(() => {
    queueRef.current = [];
    set(null);
  }, [set]);

  // Let the float ease back to rest before the clip starts.
  useEffect(() => {
    if (current?.mode !== 'settling') return;
    const { id } = current;
    const timer = setTimeout(() => {
      if (currentRef.current?.id === id) set({ ...currentRef.current, mode: 'starting' });
    }, CLIP_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [current, set]);

  // Safety net: length + 1 s from starting, restarted once it's actually playing.
  // WebP has no "ended" event, so its measured length ends it.
  useEffect(() => {
    if (current?.mode !== 'starting' && current?.mode !== 'playing') return;
    const { id, clip, mode } = current;
    const lengthMs = CLIPS[clip].ms[format];
    const timers = [setTimeout(() => finishFromTimer(id, 'safety net'), lengthMs + SAFETY_MARGIN_MS)];
    if (mode === 'playing' && format === 'webp') {
      timers.push(setTimeout(() => finishFromTimer(id, 'webp timer'), lengthMs));
    }
    return () => timers.forEach(clearTimeout);
  }, [current, format]);

  const handlePlaying = useCallback(
    (id: number) => {
      const playing = currentRef.current;
      if (!playing || playing.id !== id || playing.mode !== 'starting') return;
      logStep(`clip ${playing.clip}: playing`, format);
      set({ ...playing, mode: 'playing' });
    },
    [format, set]
  );

  const handleError = useCallback(
    (clip: ClipName) => {
      logStep(`clip ${clip}: failed, disabled`);
      setBroken((previous) => new Set(previous).add(clip));
      queueRef.current = queueRef.current.filter((c) => c !== clip);
      if (currentRef.current?.clip === clip) set(null);
    },
    [set]
  );

  return {
    current,
    /** A clip is running or about to (the float is paused). */
    busy: current !== null,
    play,
    stop,
    handlePlaying,
    handleEnded: finish,
    handleError,
  };
}
