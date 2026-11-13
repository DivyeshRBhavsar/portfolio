'use client';

import { useEffect, useEffectEvent, type RefObject } from 'react';

const MIN_DISTANCE_PX = 50;

/**
 * Horizontal swipes on touch screens: swipe left → onLeft (next), right → onRight
 * (back). Mostly-vertical movements are left to page scrolling. The element should
 * have `touch-action: pan-y` so the browser doesn't take horizontal gestures.
 */
export function useSwipe(
  ref: RefObject<HTMLElement | null>,
  { onLeft, onRight }: { onLeft: () => void; onRight: () => void }
) {
  const left = useEffectEvent(onLeft);
  const right = useEffectEvent(onRight);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let start: { x: number; y: number; id: number } | null = null;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    };
    const onUp = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) < MIN_DISTANCE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) left();
      else right();
    };
    const onCancel = () => {
      start = null;
    };

    node.addEventListener('pointerdown', onDown);
    node.addEventListener('pointerup', onUp);
    node.addEventListener('pointercancel', onCancel);
    return () => {
      node.removeEventListener('pointerdown', onDown);
      node.removeEventListener('pointerup', onUp);
      node.removeEventListener('pointercancel', onCancel);
    };
  }, [ref]);
}
