'use client';

import { useEffect, useState } from 'react';
import { DIVYESH_CITY, DIVYESH_TIMEZONE, contactTimeLater, contactTimeSoon } from '@/components/character/luffyLines';
import { fill, formatTime } from '@/components/character/speech';

/** Divyesh's time now, and whether a reply is likely soon (9:00–21:00 Toronto time). */
function timeLine(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: DIVYESH_TIMEZONE }).format(now)
  );
  const template = hour >= 9 && hour < 21 ? contactTimeSoon : contactTimeLater;
  return fill(template, { divyeshTime: formatTime(now, DIVYESH_TIMEZONE), city: DIVYESH_CITY });
}

/**
 * "It's 8:15 pm in Waterloo right now, so Divyesh will likely reply soon." (plus
 * replyTime from content/contact.json if set). Worked out in the browser, since the page
 * is static; the line's space is kept while it loads so nothing below jumps.
 */
export default function ReplyTimeLine({ replyTime }: { replyTime?: string }) {
  const [line, setLine] = useState('');
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLine(timeLine(new Date())));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <p className="min-h-5">
      {line}
      {line && replyTime && ` ${replyTime}`}
    </p>
  );
}
