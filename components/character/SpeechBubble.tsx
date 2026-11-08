'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { GREETING } from './introAssets';

const TYPE_INTERVAL_MS = 38;

const primaryButton =
  'rounded-full bg-teal-500 px-5 py-2 text-sm font-medium text-navy-950 transition-all hover:-translate-y-0.5 hover:bg-teal-400 hover:shadow-md';
const secondaryButton =
  'rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-800 transition-all hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-md';

export default function SpeechBubble({
  typing,
  animate,
  focusOnReveal,
  onAbout,
}: {
  /** Type the greeting out; otherwise show it in full immediately. */
  typing: boolean;
  /** False under prefers-reduced-motion: no entrance animations. */
  animate: boolean;
  /** Move focus to the first button once shown (after Skip removes the focused button). */
  focusOnReveal: boolean;
  onAbout: () => void;
}) {
  const [shown, setShown] = useState(typing ? 0 : GREETING.length);
  const done = shown >= GREETING.length;
  const firstButtonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (done) return;
    const interval = setInterval(
      () => setShown((n) => Math.min(n + 1, GREETING.length)),
      TYPE_INTERVAL_MS
    );
    return () => clearInterval(interval);
  }, [done]);

  useEffect(() => {
    if (done && focusOnReveal) firstButtonRef.current?.focus();
  }, [done, focusOnReveal]);

  return (
    <motion.div
      initial={animate && typing ? { opacity: 0, scale: 0.92 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-amber-900/10"
    >
      {/* Tail: points up at the character on mobile, left on wider screens. */}
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-slate-200 bg-white sm:-left-2 sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0 sm:border-b sm:border-t-0"
      />

      <p className="sr-only">{GREETING}</p>
      <p aria-hidden="true" className="relative min-h-[3.5rem] text-lg leading-snug text-slate-800">
        {GREETING.slice(0, shown)}
        {!done && (
          <span className="ml-0.5 inline-block h-5 w-0.5 animate-caret bg-slate-800 align-middle" />
        )}
      </p>

      {done && (
        <motion.div
          initial={animate && typing ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative mt-4 flex flex-wrap gap-2"
        >
          <Link ref={firstButtonRef} href="/projects" className={primaryButton}>
            Projects
          </Link>
          <button type="button" onClick={onAbout} className={secondaryButton}>
            About
          </button>
          <Link href="/contact" className={secondaryButton}>
            Contact
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
