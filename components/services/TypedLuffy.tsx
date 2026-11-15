'use client';

import { useEffect, useRef, useState } from 'react';
import LuffyHead from '@/components/character/LuffyHead';

const TYPE_MS = 24;
const REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * Luffy's head and one line in his bubble, typed once the first time it scrolls into
 * view (at once with reduced motion). Screen readers get the whole line straight away;
 * the full line is laid out invisibly underneath so the bubble never changes size.
 */
export default function TypedLuffy({ line, className = '' }: { line: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(0);
  const [started, setStarted] = useState(false);

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

  const done = typed >= line.length;
  useEffect(() => {
    if (!started || done) return;
    const timer = setInterval(() => setTyped((n) => n + 1), TYPE_MS);
    return () => clearInterval(timer);
  }, [started, done]);

  return (
    <div ref={ref} className={`flex items-start gap-3 ${className}`}>
      <LuffyHead talking={started && !done} className="h-12 w-12" />
      <p className="max-w-xl rounded-2xl rounded-tl-sm border-2 border-ink bg-surface px-4 py-2.5 text-sm text-ink shadow-sticker sm:text-base">
        <span className="sr-only">{line}</span>
        <span aria-hidden="true" className="grid">
          <span className="invisible col-start-1 row-start-1">{line}</span>
          <span className="col-start-1 row-start-1">{line.slice(0, typed)}</span>
        </span>
      </p>
    </div>
  );
}
