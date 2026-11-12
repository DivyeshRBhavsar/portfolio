import {
  DIVYESH_CITY,
  DIVYESH_TIMEZONE,
  diffTzFreeLines,
  diffTzSleepingLines,
  diffTzWorkingLines,
  sameTimezoneLines,
  type TimeSlot,
} from './luffyLines';

/**
 * Helpers for Luffy's lines (all text lives in luffyLines.ts). Results are plain
 * strings rendered as React text, so a visitor's name can never become HTML.
 */

export type Placeholders = Partial<
  Record<'name' | 'visitorTime' | 'divyeshTime' | 'city' | 'lastPage' | 'nameComma' | 'title', string>
>;

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** Fill {placeholders}; unknown ones become empty. */
export function fill(template: string, values: Placeholders): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key as keyof Placeholders] ?? '');
}

/** earlyMorning 5–8 · morning 8–12 · afternoon 12–17 · evening 17–21 · night 21–24 · lateNight 0–5 */
export function timeSlot(hour: number): TimeSlot {
  if (hour < 5) return 'lateNight';
  if (hour < 8) return 'earlyMorning';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

export function isWeekend(now: Date): boolean {
  const day = now.getDay();
  return day === 0 || day === 6;
}

/**
 * "9:15 pm" in the visitor's locale. Where the locale uses a 12-hour clock, "PM" and
 * "p.m." both become "pm" (so a line ending in "." never shows "p.m..").
 */
export function formatTime(now: Date, timeZone?: string): string {
  const text = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  }).format(now);
  return text
    .replace(/\b([ap])\.\s?m\./gi, (_, letter: string) => `${letter.toLowerCase()}m`)
    .replace(/\b(AM|PM)\b/g, (m) => m.toLowerCase());
}

/** Divyesh's local hour and UTC offset (minutes) right now. */
function divyeshClock(now: Date): { hour: number; offsetMin: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DIVYESH_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  const nowMinute = Math.floor(now.getTime() / 60000) * 60000;
  return { hour: get('hour'), offsetMin: Math.round((asUtc - nowMinute) / 60000) };
}

/**
 * Same zone (offsets within 1 hour) → sameTimezoneLines. Otherwise by Divyesh's hour:
 * 9–18 working · 7–9 or 18–23 free · 23–7 sleeping.
 */
export function timeZoneLine(now: Date = new Date()): string {
  const visitorOffset = -now.getTimezoneOffset();
  const { hour, offsetMin } = divyeshClock(now);
  const values: Placeholders = {
    visitorTime: formatTime(now),
    divyeshTime: formatTime(now, DIVYESH_TIMEZONE),
    city: DIVYESH_CITY,
  };

  let lines: readonly string[];
  if (Math.abs(visitorOffset - offsetMin) <= 60) lines = sameTimezoneLines;
  else if (hour >= 9 && hour < 18) lines = diffTzWorkingLines;
  else if ((hour >= 7 && hour < 9) || (hour >= 18 && hour < 23)) lines = diffTzFreeLines;
  else lines = diffTzSleepingLines;

  return fill(pick(lines), values);
}
