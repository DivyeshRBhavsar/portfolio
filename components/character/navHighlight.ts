'use client';

import { useSyncExternalStore } from 'react';

/**
 * Tiny shared store: the speech bubble writes the href of the section it's typing,
 * the Nav reads it to briefly highlight that link.
 */
let current: string | null = null;
const listeners = new Set<() => void>();

export function setNavHighlight(href: string | null): void {
  if (current === href) return;
  current = href;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useNavHighlight(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null
  );
}
