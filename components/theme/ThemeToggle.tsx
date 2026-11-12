'use client';

import { Moon, Sun, SunMoon } from 'lucide-react';
import { setMode, useThemeMode } from './themeStore';
import { MODE_LABELS, MODE_ORDER, type ThemeMode } from './themes';

const ICONS: Record<ThemeMode, typeof Sun> = { auto: SunMoon, light: Sun, dark: Moon };

/** Header button: Auto → Light → Dark → Auto. */
export default function ThemeToggle() {
  const mode = useThemeMode();
  const next = MODE_ORDER[(MODE_ORDER.indexOf(mode) + 1) % MODE_ORDER.length];
  const Icon = ICONS[mode];
  const label = `Theme: ${MODE_LABELS[mode]}. Switch to ${MODE_LABELS[next]}.`;

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      aria-label={label}
      title={label}
      className="rounded-full p-1.5 text-ink transition-colors hover:text-red-deep"
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
