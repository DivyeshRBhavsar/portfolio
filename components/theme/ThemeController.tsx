'use client';

import { useEffect } from 'react';
import { applyMode, readStoredMode } from './themeStore';
import { THEME_RECHECK_MS, THEME_STORAGE_KEY } from './themes';

/**
 * Mounted once in the root layout. In Auto mode, re-checks the visitor's clock every few
 * minutes and when the tab comes back into view; also follows a toggle changed in
 * another tab.
 */
export default function ThemeController() {
  useEffect(() => {
    const recheck = () => applyMode(readStoredMode());
    const onVisible = () => {
      if (!document.hidden) recheck();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) recheck();
    };

    const interval = setInterval(recheck, THEME_RECHECK_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return null;
}
