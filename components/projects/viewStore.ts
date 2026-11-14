'use client';

import { useSyncExternalStore } from 'react';
import { VIEW_ATTR, VIEW_KEY, type ProjectsViewName } from './viewScript';

export type { ProjectsViewName };

let current: ProjectsViewName | null = null;
const listeners = new Set<() => void>();

/** The saved view, straight from storage (also during hydration). */
export function readSavedProjectsView(): ProjectsViewName {
  try {
    return window.localStorage.getItem(VIEW_KEY) === 'story' ? 'story' : 'list';
  } catch {
    return 'list';
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const noSubscribe = () => () => {};

/**
 * false on the server and during hydration, true afterwards (and on client navigation,
 * where there's no hydration). Until then the saved view isn't known to React yet, but
 * the layout's pre-paint script has already set the attribute.
 */
export function useClientReady(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  );
}

/**
 * The saved view: read from storage at once on client navigation; 'list' on the server
 * and during hydration (then the stored value, in the render right after).
 */
export function useSavedProjectsView(): ProjectsViewName {
  return useSyncExternalStore(
    subscribe,
    () => (current ??= readSavedProjectsView()),
    () => 'list'
  );
}

export function saveProjectsView(view: ProjectsViewName): void {
  current = view;
  try {
    window.localStorage.setItem(VIEW_KEY, view);
  } catch {
    // Storage blocked: the choice lasts until the page is left.
  }
  listeners.forEach((listener) => listener());
}

/** Keep <html data-projects-view> in step (client navigation skips the inline script). */
export function applyViewAttr(view: ProjectsViewName): void {
  document.documentElement.setAttribute(VIEW_ATTR, view);
}
