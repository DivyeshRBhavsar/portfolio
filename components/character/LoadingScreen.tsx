'use client';

/* eslint-disable @next/next/no-img-element -- tiny decorative image; must render
   from the server HTML before React loads. */

import { useEffect, useRef } from 'react';
import { LUFFY_HEAD } from './introAssets';
import { loadingText } from './luffyLines';

/**
 * Plain peach screen with Luffy's head bouncing. In the server HTML, but CSS keeps it
 * invisible for the first 300 ms and only under <html data-stage="welcome">, so a fast
 * load never shows it. After 10 s it removes itself by CSS alone.
 * `done`: fade out if it's showing (or vanish if it never appeared), then onGone.
 */
export default function LoadingScreen({ done, onGone }: { done: boolean; onGone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!done) return;
    const layer = ref.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      const opacity = layer ? Number(getComputedStyle(layer).opacity) : 0;
      if (!layer || opacity < 0.05) {
        onGone();
        return;
      }
      // Take over from the CSS animation at the current opacity, then fade.
      layer.style.animation = 'none';
      layer.style.opacity = String(opacity);
      void layer.offsetWidth;
      layer.style.transition = 'opacity 0.4s ease';
      layer.style.opacity = '0';
      timer = setTimeout(onGone, 400);
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [done, onGone]);

  return (
    <div
      ref={ref}
      role="status"
      className="stage-loading fixed inset-0 z-[70] flex-col items-center justify-center gap-5 bg-peach px-6"
    >
      <img src={LUFFY_HEAD.png} alt="" className="stage-bounce h-24 w-24" draggable={false} />
      <p className="font-body text-base text-ink">{loadingText}</p>
    </div>
  );
}
