'use client';

import { useSyncExternalStore } from 'react';
import {
  THEME_STORAGE_KEY,
  THEME_TRANSITION_MS,
  isThemeMode,
  resolveTheme,
  type ThemeMode,
  type ThemeName,
} from './themes';

/**
 * The theme lives on <html> as data-theme / data-theme-mode, set first by the pre-paint
 * script. This module is the only thing that changes it afterwards.
 */

const listeners = new Set<() => void>();
let transitionTimer: ReturnType<typeof setTimeout> | undefined;

export function readStoredMode(): ThemeMode {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : 'auto';
  } catch {
    return 'auto';
  }
}

function currentMode(): ThemeMode {
  const value = document.documentElement.getAttribute('data-theme-mode');
  return isThemeMode(value) ? value : 'auto';
}

/** Apply `mode` (and the theme it resolves to right now) to <html>, cross-fading colours. */
export function applyMode(mode: ThemeMode): void {
  const root = document.documentElement;
  const theme: ThemeName = resolveTheme(mode);
  const modeChanged = root.getAttribute('data-theme-mode') !== mode;
  const themeChanged = root.getAttribute('data-theme') !== theme;
  if (!modeChanged && !themeChanged) return;

  if (themeChanged) {
    // Colours fade for 1 s (see .theme-transition in globals.css), then normal
    // transitions come back.
    root.classList.add('theme-transition');
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(
      () => root.classList.remove('theme-transition'),
      THEME_TRANSITION_MS
    );
    root.setAttribute('data-theme', theme);
  }
  root.setAttribute('data-theme-mode', mode);
  listeners.forEach((listener) => listener());
}

/** The header toggle: save the choice and apply it. */
export function setMode(mode: ThemeMode): void {
  try {
    if (mode === 'auto') window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Storage blocked: the choice still applies until the page is reloaded.
  }
  applyMode(mode);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, currentMode, () => 'auto');
}
