'use client';

import { useSyncExternalStore } from 'react';

/**
 * Story mode's three layouts. Keep these queries in step with the .story-theatre rules
 * in app/globals.css (CSS lays out the grid from the first paint; this picks the slide
 * canvas, which needs JS to scale anyway).
 *   portrait  phones and portrait tablets: Luffy strip on top, slide, controls
 *   short     landscape under 500 px tall (phones on their side): slim Luffy column
 *   landscape everything else: slide ~72% left, Luffy column right
 */
export type StoryLayout = 'landscape' | 'short' | 'portrait';

export const PORTRAIT_QUERY = '(orientation: portrait) and (max-width: 899px)';
export const SHORT_QUERY = '(orientation: landscape) and (max-height: 499px)';

function read(): StoryLayout {
  if (window.matchMedia(PORTRAIT_QUERY).matches) return 'portrait';
  if (window.matchMedia(SHORT_QUERY).matches) return 'short';
  return 'landscape';
}

function subscribe(onChange: () => void) {
  const queries = [PORTRAIT_QUERY, SHORT_QUERY].map((q) => window.matchMedia(q));
  queries.forEach((q) => q.addEventListener('change', onChange));
  return () => queries.forEach((q) => q.removeEventListener('change', onChange));
}

/** 'landscape' on the server; the real layout once in the browser. */
export function useStoryLayout(): StoryLayout {
  return useSyncExternalStore(subscribe, read, () => 'landscape');
}
