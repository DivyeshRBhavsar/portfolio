'use client';

import type { ReactNode, RefObject } from 'react';
import { useFocusTrap } from '@/components/character/useFocusTrap';
import { useScrollLock } from './useScrollLock';

/**
 * Story mode's theatre: a fixed full-screen layer (inset 0, 100dvh, safe-area padding)
 * in the theme's page colour, above the header. It's always in the HTML and shown by
 * <html data-projects-view="story"> (app/globals.css), so a story link or saved story
 * mode shows it from the first paint. While open: the page can't scroll (and goes back
 * to its exact position on close), focus stays inside (and returns to the button that
 * opened it), Esc closes. `paused`: a dialog above it (Ask Luffy) has the keyboard.
 */
export default function StoryOverlay({
  open,
  ready,
  paused,
  label,
  overlayRef,
  onClose,
  children,
}: {
  open: boolean;
  /** Past hydration (before that the pre-paint CSS holds the page). */
  ready: boolean;
  paused: boolean;
  label: string;
  overlayRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  useScrollLock(open && ready);
  useFocusTrap(overlayRef, { onEscape: onClose, active: open && ready, paused });

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      className="story-overlay fixed inset-0 z-50 flex-col bg-cream text-ink outline-none"
    >
      {children}
    </div>
  );
}
