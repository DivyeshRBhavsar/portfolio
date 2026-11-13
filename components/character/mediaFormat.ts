'use client';

import { useSyncExternalStore } from 'react';

export type MediaFormat = 'webm' | 'webp';

/**
 * The clips are VP9 with an alpha channel. Recent Safari reports VP9 support but
 * renders the alpha as black, and every iOS browser uses Safari's engine, so those
 * get the animated WebP instead. Decided before any media element exists, so only
 * one format is ever requested.
 */
export function detectFormat(): MediaFormat {
  try {
    const vp9 = document.createElement('video').canPlayType('video/webm; codecs="vp9"');
    if (!vp9) return 'webp';

    const ua = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(ua);

    return isIOS || isSafari ? 'webp' : 'webm';
  } catch {
    return 'webp';
  }
}

let detected: MediaFormat | null = null;
const noSubscribe = () => () => {};

/** The browser's clip format; null on the server and during hydration. */
export function useMediaFormat(): MediaFormat | null {
  return useSyncExternalStore(
    noSubscribe,
    () => (detected ??= detectFormat()),
    () => null
  );
}
