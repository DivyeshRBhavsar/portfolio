'use client';

import { useEffect, useEffectEvent } from 'react';
import { IDLE_NUDGE_MS, IDLE_REPEAT_MS } from './introAssets';

const INTERACTIONS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

function randomRepeat(): number {
  return IDLE_REPEAT_MS.min + Math.random() * (IDLE_REPEAT_MS.max - IDLE_REPEAT_MS.min);
}

/**
 * Calls onIdle after IDLE_NUDGE_MS with no interaction, then again every 12–15 s while
 * the visitor stays idle. Any interaction restarts the countdown. If the tab is hidden
 * when it's due, it waits for the visitor to come back, then starts a fresh gap.
 */
export function useIdle({ enabled, onIdle }: { enabled: boolean; onIdle: () => void }) {
  const fire = useEffectEvent(onIdle);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onVisible = () => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onVisible);
      schedule(randomRepeat());
    };
    const schedule = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (document.hidden) {
          document.addEventListener('visibilitychange', onVisible);
          return;
        }
        fire();
        schedule(randomRepeat());
      }, ms);
    };
    const restart = () => {
      document.removeEventListener('visibilitychange', onVisible);
      schedule(IDLE_NUDGE_MS);
    };

    restart();
    INTERACTIONS.forEach((type) => window.addEventListener(type, restart, { passive: true }));
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      INTERACTIONS.forEach((type) => window.removeEventListener(type, restart));
    };
  }, [enabled]);
}
