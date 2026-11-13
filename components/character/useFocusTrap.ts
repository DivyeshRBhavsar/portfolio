'use client';

import { useEffect, useEffectEvent, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * While mounted: focus moves into `ref` (the container itself, so screen readers read
 * the dialog's label first), Tab and Shift+Tab cycle inside it, focus that escapes
 * (a click elsewhere) is brought back, and Esc calls onEscape. On unmount, focus goes
 * back to what had it before, or to `fallback` if that element is gone.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  { onEscape, fallback }: { onEscape: () => void; fallback?: () => HTMLElement | null }
) {
  const escape = useEffectEvent(onEscape);
  const getFallback = useEffectEvent(() => fallback?.() ?? null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const items = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );

    node.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        escape();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = items();
      if (list.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      const outside = !active || active === node || !node.contains(active);
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !node.contains(event.target)) {
        (items()[0] ?? node).focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn);
      const target = previous && previous.isConnected ? previous : getFallback();
      target?.focus({ preventScroll: true });
    };
  }, [ref]);
}
