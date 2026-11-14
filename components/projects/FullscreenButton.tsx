'use client';

import { useSyncExternalStore, type RefObject } from 'react';
import { storyControlLabels, storyControls } from '@/components/character/luffyLines';

const DESKTOP_QUERY = '(hover: hover) and (pointer: fine)';

function subscribe(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
}

/** null on the server; else whether the button applies here, and whether we're full screen. */
function snapshot(): string {
  const supported = document.fullscreenEnabled && window.matchMedia(DESKTOP_QUERY).matches;
  return `${supported ? 1 : 0}${document.fullscreenElement ? 1 : 0}`;
}

/**
 * "⛶ Full screen" for the story overlay (Fullscreen API). Desktop only: hidden where the
 * API isn't available or on touch devices (phones and tablets already fill the screen).
 */
export default function FullscreenButton({
  target,
  className,
}: {
  target: RefObject<HTMLElement | null>;
  className: string;
}) {
  const state = useSyncExternalStore(subscribe, snapshot, () => '00');
  const supported = state[0] === '1';
  const full = state[1] === '1';
  if (!supported) return null;

  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void target.current?.requestFullscreen().catch(() => {});
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={full}
      aria-label={full ? storyControlLabels.exitFullScreen : storyControlLabels.fullScreen}
      className={className}
    >
      {full ? storyControls.exitFullScreen : storyControls.fullScreen}
    </button>
  );
}
