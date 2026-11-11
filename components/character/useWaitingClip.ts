'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  CLIP_MS,
  SAFETY_MARGIN_MS,
  WAITING_FIRST_DELAY_MS,
  WAITING_REPEAT_MS,
  WAITING_SETTLE_MS,
} from './introAssets';
import { logStep } from './introDebug';
import type { MediaFormat } from './useIntroSetup';

/**
 * still    → idle float running; next play scheduled.
 * settling → float paused, easing back to rest.
 * starting → clip loading/starting; the still stays visible until it's really playing.
 * playing  → clip visible, still hidden. On end, back to still in the same frame
 *            (the clip holds its last frame until then).
 */
export type WaitingMode = 'still' | 'settling' | 'starting' | 'playing';

function randomRepeatDelay(): number {
  return WAITING_REPEAT_MS.min + Math.random() * (WAITING_REPEAT_MS.max - WAITING_REPEAT_MS.min);
}

export function useWaitingClip({
  enabled,
  format,
  onFirstPlay,
}: {
  /** Allowed to play: idle, first message typed, no reduced motion. */
  enabled: boolean;
  format: MediaFormat;
  onFirstPlay: () => void;
}) {
  const [mode, setMode] = useState<WaitingMode>('still');
  const [plays, setPlays] = useState(0);
  const [broken, setBroken] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const active = enabled && !broken;

  // Schedule the next play. If the tab is hidden when it's due, wait until the
  // visitor comes back, then start a fresh gap.
  useEffect(() => {
    if (!active || mode !== 'still') return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onVisible = () => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onVisible);
      schedule(randomRepeatDelay());
    };
    const schedule = (ms: number) => {
      timer = setTimeout(() => {
        if (document.hidden) document.addEventListener('visibilitychange', onVisible);
        else setMode('settling');
      }, ms);
    };

    schedule(plays === 0 ? WAITING_FIRST_DELAY_MS : randomRepeatDelay());
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active, mode, plays]);

  // Let the float ease back to rest before the clip starts.
  useEffect(() => {
    if (mode !== 'settling') return;
    const timer = setTimeout(() => setMode('starting'), WAITING_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [mode]);

  // WebM: rewind and play the preloaded video. (WebP mounts a fresh <img> instead.)
  useEffect(() => {
    if (mode !== 'starting' || format !== 'webm') return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {
      logStep('waiting: play refused, disabling');
      setBroken(true);
      setMode('still');
    });
  }, [mode, format]);

  // Only acts while a clip is up, so a late "ended" after the safety net is a no-op.
  const finish = (reason: string) => {
    if (mode !== 'starting' && mode !== 'playing') return;
    logStep('waiting: ended', reason);
    setMode('still');
    setPlays((n) => n + 1);
  };
  const finishFromTimer = useEffectEvent(finish);

  // Safety net: clip length + 1 s from starting, restarted once it's actually playing.
  // WebP has no "ended" event, so its measured length ends it.
  useEffect(() => {
    if (mode !== 'starting' && mode !== 'playing') return;
    const lengthMs = CLIP_MS.waiting[format];
    const timers = [
      setTimeout(() => finishFromTimer('safety net'), lengthMs + SAFETY_MARGIN_MS),
    ];
    if (mode === 'playing' && format === 'webp') {
      timers.push(setTimeout(() => finishFromTimer('webp timer'), lengthMs));
    }
    return () => timers.forEach(clearTimeout);
  }, [mode, format]);

  const handlePlaying = () => {
    if (mode !== 'starting') return;
    logStep('waiting: playing', format);
    setMode('playing');
    if (plays === 0) onFirstPlay();
  };

  const handleEnded = () => finish('video ended');

  const handleError = () => {
    logStep('waiting: load error, disabling');
    setBroken(true);
    setMode('still');
  };

  return {
    mode,
    /** Bumps on each play; the WebP path uses it so each play is a fresh animation. */
    plays,
    broken,
    videoRef,
    handlePlaying,
    handleEnded,
    handleError,
  };
}
