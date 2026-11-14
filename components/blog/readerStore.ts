'use client';

import { useSyncExternalStore } from 'react';
import { POST_FINISHED_AT, VISITOR_KEY, readPostProgress, type PostProgress } from '@/components/character/visitorMemory';
import {
  READER_DEFAULTS,
  READER_KEY,
  applyReaderSettings,
  parseReaderSettings,
  type ReaderSettings,
} from './readerSettings';

/**
 * Client-side state for the blog: the reader settings (one shared copy, so the "Aa"
 * dialog and the page agree) and the visitor's reading progress per post. Both come
 * from localStorage; on the server and during hydration they're the defaults.
 */

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

// ── Reader settings ──

let current: ReaderSettings | null = null;

function storedRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readReaderSettings(): ReaderSettings {
  if (!current) current = parseReaderSettings(storedRaw(READER_KEY));
  return current;
}

export function useReaderSettings(): ReaderSettings {
  return useSyncExternalStore(subscribe, readReaderSettings, () => READER_DEFAULTS);
}

/** Apply at once, then save (with storage blocked it still applies, for this visit). */
export function updateReaderSettings(patch: Partial<ReaderSettings>): void {
  current = { ...readReaderSettings(), ...patch };
  applyReaderSettings(current);
  try {
    window.localStorage.setItem(READER_KEY, JSON.stringify(current));
  } catch {
    // Blocked: not remembered next time.
  }
  notify();
}

/** Back to READER_DEFAULTS: applied at once, and the saved settings removed. */
export function resetReaderSettings(): void {
  current = { ...READER_DEFAULTS };
  applyReaderSettings(current);
  try {
    window.localStorage.removeItem(READER_KEY);
  } catch {
    // Blocked: nothing was saved anyway.
  }
  notify();
}

// ── Reading progress ──

let progressRaw: string | null | undefined;
let progressCache: Record<string, PostProgress> = {};
const NONE: Record<string, PostProgress> = {};

function readProgressSnapshot(): Record<string, PostProgress> {
  const raw = storedRaw(VISITOR_KEY);
  if (raw !== progressRaw) {
    progressRaw = raw;
    progressCache = readPostProgress();
  }
  return progressCache;
}

/** Per post slug, how far this visitor got ({} on the server and during hydration). */
export function useReadingProgress(): Record<string, PostProgress> {
  return useSyncExternalStore(subscribe, readProgressSnapshot, () => NONE);
}

/** Started (5% or more) but not finished: what "Continue reading" offers. */
export function isUnfinished(entry: PostProgress | undefined): entry is PostProgress {
  return !!entry && !entry.finished && entry.progress >= 0.05 && entry.progress < POST_FINISHED_AT;
}

/** For saves on this page: the progress hook re-reads storage. */
export const notifyProgress = notify;

const noopSubscribe = () => () => {};

/** false on the server and during hydration, true after. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
