'use client';

import { useEffect, useState } from 'react';

export type MediaFormat = 'webm' | 'webp';

export type IntroSetup = {
  format: MediaFormat;
  reducedMotion: boolean;
  seenThisSession: boolean;
};

const SEEN_KEY = 'luffy-intro-seen';

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

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Returns null during SSR and the first client render, then the browser's setup. */
export function useIntroSetup(): IntroSetup | null {
  const [setup, setSetup] = useState<IntroSetup | null>(null);

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
