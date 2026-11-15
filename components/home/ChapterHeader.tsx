'use client';

import { useEffect, useRef, useState } from 'react';
import LuffyHead from '@/components/character/LuffyHead';

const TYPE_MS = 24;
/** The pause between one line and the next. */
const LINE_PAUSE_MS = 550;
const REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * A chapter's heading (with an optional small kicker above it) and Luffy's head with his
 * line(s) in one bubble. The lines type out once, one after another with a short pause,
 * the first time the header scrolls into view (all at once with reduced motion). Screen
 * readers get every line straight away; the typing is visual only. The full lines are
 * laid out invisibly underneath, so the bubble never changes size.
 */
export default function ChapterHeader({
  id,
  title,
  luffy,
  kicker,
  level = 2,
}: {
  /** The heading's id (the section's aria-labelledby). */
  id: string;
  title: string;
  /** One line, or several typed in sequence (each on its own line). */
  luffy: string | string[];
  kicker?: string;
  level?: 2 | 3;
}) {
  const lines = typeof luffy === 'string' ? [luffy] : luffy;
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(0);
  const [started, setStarted] = useState(false);
  const Heading = level === 2 ? 'h2' : 'h3';

  // Where each line starts in the overall count of typed characters.
  const starts: number[] = [];
  let total = 0;
  for (const line of lines) {
    starts.push(total);
    total += line.length;
  }

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (window.matchMedia(REDUCED).matches) setTyped(Number.MAX_SAFE_INTEGER);
        setStarted(true);
      },
      { threshold: 0.6 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const done = typed >= total;
  // Pause before the next line starts (the count is at a line boundary).
  const atBreak = typed > 0 && starts.includes(typed);
  useEffect(() => {
    if (!started || done) return;
    const timer = setTimeout(() => setTyped((n) => n + 1), atBreak ? LINE_PAUSE_MS : TYPE_MS);
    return () => clearTimeout(timer);
  }, [started, done, typed, atBreak]);

  return (
    <div ref={ref} className="mb-8">
      {kicker && <p className="mb-2 font-mono text-sm uppercase tracking-wide text-red-deep">{kicker}</p>}
      <Heading id={id} className="font-display text-2xl font-bold text-ink sm:text-3xl">
        {title}
      </Heading>
      <div className="mt-4 flex items-start gap-3">
        <LuffyHead talking={started && !done} className="h-11 w-11" />
        <div className="relative max-w-xl space-y-1.5 rounded-2xl rounded-tl-sm border-2 border-ink bg-surface px-4 py-2.5 text-sm text-ink shadow-sticker sm:text-base">
          {lines.map((line, i) => (
            <p key={i}>
              <span className="sr-only">{line}</span>
              <span aria-hidden="true" className="grid">
                <span className="invisible col-start-1 row-start-1">{line}</span>
                <span className="col-start-1 row-start-1">{line.slice(0, Math.max(0, typed - starts[i]))}</span>
              </span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
