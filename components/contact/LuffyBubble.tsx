'use client';

import { useEffect, useState } from 'react';
import LuffyHead from '@/components/character/LuffyHead';

const TYPE_MS = 22;
const REDUCED = '(prefers-reduced-motion: reduce)';

/** One line, typed out with Luffy's talking head (at once with reduced motion). */
function Typed({ text, onTalking }: { text: string; onTalking: (talking: boolean) => void }) {
  const [typed, setTyped] = useState(0);
  const done = typed >= text.length;

  useEffect(() => {
    if (window.matchMedia(REDUCED).matches) {
      const frame = requestAnimationFrame(() => setTyped(text.length));
      return () => cancelAnimationFrame(frame);
    }
    const timer = setInterval(() => setTyped((n) => n + 1), TYPE_MS);
    return () => clearInterval(timer);
  }, [text]);

  useEffect(() => {
    onTalking(!done);
  }, [done, onTalking]);

  return (
    <span aria-hidden="true" className="grid">
      <span className="invisible col-start-1 row-start-1">{text}</span>
      <span className="col-start-1 row-start-1">{text.slice(0, typed)}</span>
    </span>
  );
}

/**
 * Luffy's head and his bubble. The line types out each time it changes, with his
 * talking head playing meanwhile. Screen readers get each line once, whole, through the
 * live region (the chat's questions).
 */
export default function LuffyBubble({ text, live = false }: { text: string; live?: boolean }) {
  const [talking, setTalking] = useState(false);
  return (
    <div className="flex items-start gap-3">
      <LuffyHead talking={talking} className="h-14 w-14" />
      <div className="relative min-w-0 max-w-xl flex-1 rounded-2xl rounded-tl-sm border-2 border-ink bg-surface px-4 py-3 text-base text-ink shadow-sticker">
        <p className="sr-only" aria-live={live ? 'polite' : undefined}>
          {text}
        </p>
        {/* Keyed by the text: each new line starts typing from the beginning. */}
        <Typed key={text} text={text} onTalking={setTalking} />
      </div>
    </div>
  );
}
