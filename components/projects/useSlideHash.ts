'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * The current slide lives in the URL hash (/projects/<slug>#3), so every slide can be
 * shared and a direct link opens at that slide. Changing slides replaces the hash in
 * place, so the browser's Back button leaves the story instead of stepping through it.
 */

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('hashchange', listener);
    window.removeEventListener('popstate', listener);
  };
}

function hashSlide(): number {
  const n = Number.parseInt(window.location.hash.slice(1), 10);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** [slide (1-based, clamped to 1..total), goTo]. Slide 1 on the server. */
export function useSlideHash(total: number): [number, (slide: number) => void] {
  const raw = useSyncExternalStore(subscribe, hashSlide, () => 1);
  const slide = Math.min(Math.max(raw, 1), total);

  const goTo = useCallback(
    (next: number) => {
      const target = Math.min(Math.max(next, 1), total);
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, '', `${pathname}${search}#${target}`);
      listeners.forEach((listener) => listener());
    },
    [total]
  );

  return [slide, goTo];
}
