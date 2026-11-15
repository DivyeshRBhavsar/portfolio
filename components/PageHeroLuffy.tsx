'use client';

import { useEffect, useRef, useState } from 'react';
import LuffyHead from '@/components/character/LuffyHead';
import { fill, nameComma } from '@/components/character/speech';
import { readVisitor } from '@/components/character/visitorMemory';

const TYPE_MS = 24;
const REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * PageHero's Luffy: his head and one line in his bubble, typed once the first time it
 * scrolls into view (at once with reduced motion). Given several lines he says one at
 * random, and {nameComma} becomes ", Priya" when the visitor's name is known; both are
 * worked out in the browser as typing starts (the server renders the first line, no
 * name). Screen readers get the whole line straight away; the full line is laid out
 * invisibly underneath so the bubble never changes size.
 */
export default function PageHeroLuffy({
  lines,
  headClass,
  bubbleClass,
  textClass = '',
}: {
  lines: string[];
  headClass: string;
  bubbleClass: string;
  /** Extra classes for the visible text (e.g. clamping it on phones; screen readers get it all). */
  textClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(0);
  const [started, setStarted] = useState(false);
  const [line, setLine] = useState(() => fill(lines[0] ?? '', { nameComma: '' }));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const pick = lines[Math.floor(Math.random() * lines.length)] ?? '';
        setLine(fill(pick, { nameComma: nameComma(readVisitor()?.name) }));
        if (window.matchMedia(REDUCED).matches) setTyped(Number.MAX_SAFE_INTEGER);
        setStarted(true);
      },
      { threshold: 0.6 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [lines]);

  const done = typed >= line.length;
  useEffect(() => {
    if (!started || done) return;
    const timer = setInterval(() => setTyped((n) => n + 1), TYPE_MS);
    return () => clearInterval(timer);
  }, [started, done]);

  return (
    <div ref={ref} className="flex items-start gap-3">
      <LuffyHead talking={started && !done} className={headClass} />
      <p className={`rounded-2xl rounded-tl-sm border-2 border-ink bg-surface text-ink shadow-sticker ${bubbleClass}`}>
        <span className="sr-only">{line}</span>
        <span aria-hidden="true" className={`grid ${textClass}`}>
          <span className="invisible col-start-1 row-start-1">{line}</span>
          <span className="col-start-1 row-start-1">{line.slice(0, typed)}</span>
        </span>
      </p>
    </div>
  );
}
