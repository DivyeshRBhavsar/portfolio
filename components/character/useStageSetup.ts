'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { REDUCED_QUERY, armFailsafe, setStageAttr } from './introGuard';
import {
  beginSession,
  markHomeSeen,
  readHomeSeen,
  readVisitor,
  type SessionInfo,
} from './visitorMemory';

export type MediaFormat = 'webm' | 'webp';

export type StageSetup = {
  format: MediaFormat;
  reducedMotion: boolean;
  /** Home stage already ran this visit (reload, or back to /): no welcome. */
  sameVisit: boolean;
  session: SessionInfo;
  name: string;
  /** "Skip to portfolio" was used before: start collapsed, Mini Luffy docked. */
  quiet: boolean;
};

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia(REDUCED_QUERY).matches;
  } catch {
    return false;
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

/**
 * Returns null during SSR and the first client render, then the browser's setup.
 * `onSetup` runs once, right after it's known (from a frame callback, not an effect).
 */
export function useStageSetup(onSetup: (setup: StageSetup) => void): StageSetup | null {
  const [setup, setSetup] = useState<StageSetup | null>(null);
  const onSetupRef = useRef(onSetup);
  useEffect(() => {
    onSetupRef.current = onSetup;
  }, [onSetup]);

  // Before paint: on a client-side navigation to the home page the guard script didn't
  // run, so set the stage's starting state here (same rule as the script).
  useLayoutEffect(() => {
    // Page load: the script already decided (and started its failsafe clock).
    if (document.documentElement.hasAttribute('data-stage')) return;
    if (readVisitor()?.quiet) {
      setStageAttr('quiet');
      return;
    }
    const welcome = !readHomeSeen() && !prefersReducedMotion();
    setStageAttr(welcome ? 'welcome' : 'chat');
    if (welcome) armFailsafe();
  }, []);

  useEffect(() => {
    // Read and mark inside the frame callback: in dev, StrictMode's extra
    // mount/unmount cancels the first frame, so the visit isn't marked as seen
    // before the instance that stays mounted reads the flag.
    const frame = requestAnimationFrame(() => {
      const sameVisit = readHomeSeen();
      markHomeSeen();
      const next: StageSetup = {
        format: detectFormat(),
        reducedMotion: prefersReducedMotion(),
        sameVisit,
        session: beginSession(),
        name: readVisitor()?.name ?? '',
        quiet: readVisitor()?.quiet === true,
      };
      setSetup(next);
      onSetupRef.current(next);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return setup;
}
