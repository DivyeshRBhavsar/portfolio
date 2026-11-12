// Plain module (no 'use client'): the server-rendered layout imports the pre-paint
// script built from these values. The colours themselves live in app/globals.css.

export type ThemeName = 'dawn' | 'day' | 'sunset' | 'night';

/** What the visitor picked with the header toggle. Light = day theme, Dark = night theme. */
export type ThemeMode = 'auto' | 'light' | 'dark';

/** localStorage key for the toggle (absent = auto). */
export const THEME_STORAGE_KEY = 'luffy-theme';

/**
 * Visitor's local hour → theme, for Auto mode. Hours outside every range are night
 * (21–5). Shared with the pre-paint script, so this is the only place to change them.
 */
export const THEME_HOURS: ReadonlyArray<{ from: number; to: number; theme: ThemeName }> = [
  { from: 5, to: 8, theme: 'dawn' },
  { from: 8, to: 17, theme: 'day' },
  { from: 17, to: 21, theme: 'sunset' },
];

/** In Auto mode, re-check the clock this often (so sitting through sunset changes it). */
export const THEME_RECHECK_MS = 5 * 60 * 1000;

/** Length of the colour cross-fade when the theme changes. Matches globals.css. */
export const THEME_TRANSITION_MS = 1000;

export const MODE_ORDER: readonly ThemeMode[] = ['auto', 'light', 'dark'];

export const MODE_LABELS: Record<ThemeMode, string> = {
  auto: 'Auto (follows your time of day)',
  light: 'Light',
  dark: 'Dark',
};

export function themeForHour(hour: number): ThemeName {
  return THEME_HOURS.find((range) => hour >= range.from && hour < range.to)?.theme ?? 'night';
}

export function resolveTheme(mode: ThemeMode, now: Date = new Date()): ThemeName {
  if (mode === 'light') return 'day';
  if (mode === 'dark') return 'night';
  return themeForHour(now.getHours());
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'light' || value === 'dark';
}

/**
 * Inline at the top of <body> (app/layout.tsx), so the theme is set before the first
 * paint and there's no flash of the wrong colours. Mirrors resolveTheme().
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement,m='auto';try{m=localStorage.getItem('${THEME_STORAGE_KEY}')||'auto'}catch(e){}if(m!=='light'&&m!=='dark')m='auto';var t='night';if(m==='light')t='day';else if(m==='auto'){var h=new Date().getHours(),r=${JSON.stringify(THEME_HOURS)};for(var i=0;i<r.length;i++)if(h>=r[i].from&&h<r[i].to)t=r[i].theme}d.setAttribute('data-theme',t);d.setAttribute('data-theme-mode',m)})()`;
