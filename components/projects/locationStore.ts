'use client';

import { useSyncExternalStore } from 'react';

/**
 * The URL's hash and query as React state. Story mode uses the hash for the slide number
 * (/projects/<slug>#3) and the picker (/projects#stories); the list uses the query for
 * its category (/projects?category=ai-llm). pushState/replaceState don't
 * fire hashchange, so whoever calls them calls notifyLocation() afterwards.
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

export function notifyLocation(): void {
  listeners.forEach((listener) => listener());
}

/** '#3', '#stories' or '' (always '' on the server and during hydration). */
export function useLocationHash(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => ''
  );
}

/** '?category=ai-llm' or '' (always '' on the server and during hydration). */
export function useLocationSearch(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => ''
  );
}
