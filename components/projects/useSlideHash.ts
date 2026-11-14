'use client';

import { useCallback } from 'react';
import { notifyLocation, useLocationHash } from './locationStore';

/**
 * The current slide lives in the URL hash (/projects/<slug>#3), so every slide can be
 * shared and a direct link opens at that slide. Changing slides replaces the hash in
 * place, so the browser's Back button leaves the story instead of stepping through it.
 */

function parse(hash: string): number {
  const n = Number.parseInt(hash.slice(1), 10);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** [slide (1-based, clamped to 1..total), goTo]. Slide 1 on the server. */
export function useSlideHash(total: number): [number, (slide: number) => void] {
  const slide = Math.min(Math.max(parse(useLocationHash()), 1), total);

  const goTo = useCallback(
    (next: number) => {
      const target = Math.min(Math.max(next, 1), total);
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, '', `${pathname}${search}#${target}`);
      notifyLocation();
    },
    [total]
  );

  return [slide, goTo];
}
