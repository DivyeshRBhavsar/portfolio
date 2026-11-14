'use client';

import { useLayoutEffect } from 'react';

/**
 * While `locked`: the page can't scroll (the body is pinned in place, which also stops
 * iOS Safari, where overflow: hidden alone doesn't). On unlock, the page goes back to
 * the exact scroll position it had. Before React loads, the CSS rule
 * html[data-projects-view='story'] { overflow: hidden } does the same job.
 */
export function useScrollLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) return;
    const { body } = document;
    const y = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    return () => {
      Object.assign(body.style, previous);
      // 'instant': the page's smooth scrolling would otherwise animate from the top.
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    };
  }, [locked]);
}
