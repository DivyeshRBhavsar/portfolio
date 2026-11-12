'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Full-screen dim layer with a soft circular hole on Luffy. `up` starts the lights-up:
 * the hole widens and the layer fades (CSS transitions, see .stage-dim in globals.css).
 * Shown only while <html data-stage> is welcome or lights, and it removes itself after
 * 10 s by CSS alone if anything gets stuck.
 */
export default function Spotlight({
  up,
  target,
}: {
  up: boolean;
  /** Luffy's box: the hole is centred on it. */
  target: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Position the hole on Luffy (scrolling is locked at the top while this shows).
  useLayoutEffect(() => {
    const place = () => {
      const layer = ref.current;
      const box = target.current?.getBoundingClientRect();
      if (!layer || !box) return;
      layer.style.setProperty('--spot-x', `${box.left + box.width / 2}px`);
      layer.style.setProperty('--spot-y', `${box.top + box.height / 2}px`);
      layer.style.setProperty('--spot-size', `${Math.max(box.width, box.height) * 0.72}px`);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [target]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`stage-dim pointer-events-none fixed inset-0 z-[55] ${up ? 'is-up' : ''}`}
    />
  );
}
