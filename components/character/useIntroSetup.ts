'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

export type MediaFormat = 'webm' | 'webp';

export type IntroSetup = {
  format: MediaFormat;
  reducedMotion: boolean;
  seenThisSession: boolean;
};

import { REDUCED_QUERY, SEEN_KEY, SKIP_CSS, SKIP_STYLE_ID } from './introGuard';

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Storage blocked: the intro simply plays again next visit.
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia(REDUCED_QUERY).matches;
  } catch {
    return false;
  }
}

/** Same rule as the guard script, for client-side navigations (where it didn't run). */
function hideOverlayFromNowOn(): void {
  if (document.getElementById(SKIP_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = SKIP_STYLE_ID;
  style.textContent = SKIP_CSS;
  document.head.appendChild(style);
}

/**
 * The clips are VP9 with an alpha channel. Recent Safari reports VP9 support but
 * renders the alpha as black, and every iOS browser uses Safari's engine, so those
 * get the animated WebP instead. Decided before any media element exists, so only
 * one format is ever requested.
 */
function detectFormat(): MediaFormat {
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

/** Returns null during SSR and the first client render, then the browser's setup. */
export function useIntroSetup(): IntroSetup | null {
  const [setup, setSetup] = useState<IntroSetup | null>(null);

  // Before paint: on a client-side navigation back to the homepage the guard script
  // didn't run, so hide the overlay here if the intro shouldn't play.
  useLayoutEffect(() => {
    if (readSeen() || prefersReducedMotion()) hideOverlayFromNowOn();
  }, []);

  useEffect(() => {
    // Read and mark inside the frame callback: in dev, StrictMode's extra
    // mount/unmount cancels the first frame, so the session isn't marked as seen
    // before the instance that stays mounted reads the flag.
    const frame = requestAnimationFrame(() => {
      const seenThisSession = readSeen();
      markSeen();
      setSetup({ format: detectFormat(), reducedMotion: prefersReducedMotion(), seenThisSession });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return setup;
}
