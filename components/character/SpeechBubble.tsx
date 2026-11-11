'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { MESSAGES, NAV_HIGHLIGHT_HOLD_MS, NAV_MENTIONS, TYPE_INTERVAL_MS } from './introAssets';
import { setNavHighlight } from './navHighlight';

const button =
  'inline-flex items-center rounded-full border-2 border-ink px-4 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-sticker';
const primaryButton = `${button} bg-red text-white`;
const accentButton = `${button} bg-sun text-ink`;

/** Pause after the old message fades out before the new one starts typing. */
const SWAP_DELAY_MS = 300;

/** Character ranges of MESSAGES.first during which each mentioned Nav link is highlighted. */
const HOLD_CHARS = Math.ceil(NAV_HIGHLIGHT_HOLD_MS / TYPE_INTERVAL_MS);
const MENTION_RANGES = NAV_MENTIONS.flatMap(({ word, href }) => {
  const ranges: { start: number; end: number; href: string }[] = [];
  const text = MESSAGES.first;
  for (let i = text.indexOf(word); i !== -1; i = text.indexOf(word, i + word.length)) {
    ranges.push({ start: i + 1, end: i + word.length + HOLD_CHARS, href });
  }
  return ranges;
});

/** The most recently started mention whose range covers `shown`. */
function mentionAt(shown: number): string | null {
  let match: { start: number; href: string } | null = null;
  for (const range of MENTION_RANGES) {
    if (shown >= range.start && shown < range.end && (!match || range.start > match.start)) {
      match = range;
    }
  }
  return match?.href ?? null;
}

export type BubbleState = 'hidden' | 'typing' | 'full';
export type MessageKey = keyof typeof MESSAGES;

/**
 * Always rendered so its final size is reserved from the start: Luffy's spot in the
 * hero must not move while the glide is measured or while text types.
 *
 * - First message: typed (state 'typing') or shown at once (state 'full').
 * - Second message: when `message` switches to 'second', the text fades out and the
 *   new one types in; the buttons stay.
 */
export default function SpeechBubble({
  state,
  message,
  animate,
  focusOnReveal,
  onAbout,
  onFirstMessageDone,
}: {
  state: BubbleState;
  message: MessageKey;
  /** False under prefers-reduced-motion: no entrance animations. */
  animate: boolean;
  /** Move focus to the first button once shown (after Skip removes the focused button). */
  focusOnReveal: boolean;
  onAbout: () => void;
  onFirstMessageDone: () => void;
}) {
  const text = MESSAGES[message];

  // Typing progress belongs to one message; reset it when the message changes
  // (adjusting state during render, rather than in an effect).
  const [progress, setProgress] = useState({ message, typed: 0 });
  if (progress.message !== message) setProgress({ message, typed: 0 });

  const instant = message === 'first' && state === 'full';
  const shown = state === 'hidden' ? 0 : instant ? text.length : progress.typed;
  const done = state !== 'hidden' && shown >= text.length;
  const typingActive = state !== 'hidden' && !done;
  const buttonsVisible = message === 'second' || done;
  const firstButtonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!typingActive) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(
      () => {
        interval = setInterval(
          () => setProgress((p) => ({ ...p, typed: Math.min(p.typed + 1, text.length) })),
          TYPE_INTERVAL_MS
        );
      },
      message === 'second' ? SWAP_DELAY_MS : 0
    );
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [typingActive, message, text.length]);

  // Nav highlights only while the first message types.
  const highlight = message === 'first' && state === 'typing' ? mentionAt(shown) : null;
  useEffect(() => {
    setNavHighlight(highlight);
  }, [highlight]);
  useEffect(() => () => setNavHighlight(null), []);

  const firstDone = message === 'first' && done;
  useEffect(() => {
    if (firstDone) onFirstMessageDone();
  }, [firstDone, onFirstMessageDone]);

  useEffect(() => {
    if (done && focusOnReveal) firstButtonRef.current?.focus();
  }, [done, focusOnReveal]);

  const entrance = animate && state === 'typing';

  return (
    <div className={`relative ${state === 'hidden' ? 'invisible' : ''}`}>
      <motion.div
        key={state === 'hidden' ? 'hidden' : 'shown'}
        initial={entrance ? { opacity: 0, scale: 0.92, y: -6 } : false}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative rounded-2xl border-2 border-ink bg-surface p-5 shadow-sticker"
      >
        {/* Tail pointing up at Luffy. */}
        <span
          aria-hidden="true"
          className="absolute -top-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-ink bg-surface"
        />

        {state !== 'hidden' && (
          <p className="sr-only" aria-live="polite">
            {text}
          </p>
        )}

        {/* Ghost layer reserves the size of the longest message plus the buttons;
            the visible layer sits on top of it in the same grid cell. */}
        <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
          <div aria-hidden="true" className="invisible">
            <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
              <BubbleText text={MESSAGES.first} />
              <BubbleText text={MESSAGES.second} />
            </div>
            <ButtonRow>
              <span className={primaryButton}>Projects</span>
              <span className={accentButton}>About</span>
              <span className={accentButton}>Blog</span>
              <span className={accentButton}>Contact</span>
            </ButtonRow>
          </div>

          {state !== 'hidden' && (
            <div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={message}
                  aria-hidden="true"
                  initial={animate ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  exit={animate ? { opacity: 0 } : { opacity: 0, transition: { duration: 0 } }}
                  transition={{ duration: 0.25 }}
                >
                  <BubbleText text={text.slice(0, shown)} caret={!done} />
                </motion.div>
              </AnimatePresence>

              {buttonsVisible && (
                <motion.div
                  initial={entrance ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <ButtonRow>
                    <Link ref={firstButtonRef} href="/projects" className={primaryButton}>
                      Projects
                    </Link>
                    <button type="button" onClick={onAbout} className={accentButton}>
                      About
                    </button>
                    <Link href="/blog" className={accentButton}>
                      Blog
                    </Link>
                    <Link href="/contact" className={accentButton}>
                      Contact
                    </Link>
                  </ButtonRow>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function BubbleText({ text, caret = false }: { text: string; caret?: boolean }) {
  return (
    <p className="relative text-base leading-relaxed text-ink">
      {text}
      {caret && (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-caret bg-ink align-middle" />
      )}
    </p>
  );
}

function ButtonRow({ children }: { children: ReactNode }) {
  return <div className="relative mt-4 flex flex-wrap gap-2">{children}</div>;
}
