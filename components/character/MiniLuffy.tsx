'use client';

import { useEffect, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LUFFY_HEAD } from './introAssets';
import { miniLuffyLabel, miniLuffyTooltips } from './luffyLines';
import { pick } from './speech';
import { takeTipTurn } from './visitorMemory';

const TIP_DELAY_MS = 2000;
const TIP_SHOW_MS = 5000;

/** How far it slides out to the right when hidden. */
const SLIDE_PX = 112;

/**
 * Luffy's head in a round badge, docked bottom-right at every screen size (the home page
 * gets bottom padding, so it never covers a button). It shows in quiet mode, whenever
 * the stage is scrolled out of view, and while its panel is open; it slides in and out
 * (no slide under reduced motion). Tapping it opens the Ask Luffy panel. A tooltip
 * appears once per visit, ~2 s after the badge first shows, for whatever reason.
 *
 * `beforeSetup`: server HTML and first render. CSS decides then (shown only under
 * <html data-stage="quiet">), so quiet-mode visitors see it from the first paint.
 */
export default function MiniLuffy({
  visible,
  beforeSetup,
  open,
  onToggle,
  buttonRef,
  reducedMotion,
}: {
  visible: boolean;
  beforeSetup: boolean;
  open: boolean;
  onToggle: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
  reducedMotion: boolean;
}) {
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    // Hidden again within 2 s: no tooltip yet (the visit's one turn isn't used up).
    const show = setTimeout(() => {
      if (!takeTipTurn()) return;
      setTip(pick(miniLuffyTooltips));
      // Not cancelled if the badge hides meanwhile, so the tip never comes back later.
      setTimeout(() => setTip(null), TIP_SHOW_MS);
    }, TIP_DELAY_MS);
    return () => clearTimeout(show);
  }, [visible]);

  const showTip = visible && tip !== null && !open;

  if (beforeSetup) {
    return (
      <div className="mini-luffy fixed bottom-4 right-4 z-50">
        <Badge buttonRef={buttonRef} open={open} onClick={onToggle} />
      </div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={
        visible
          ? { x: 0, opacity: 1, visibility: 'visible' }
          : { x: SLIDE_PX, opacity: 0, transitionEnd: { visibility: 'hidden' } }
      }
      transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
      inert={!visible}
      aria-hidden={!visible}
      className="fixed bottom-4 right-4 z-50"
    >
      <AnimatePresence>
        {showTip && (
          <motion.p
            role="status"
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-full right-0 mb-3 w-max max-w-[14rem] rounded-2xl border-2 border-ink bg-surface px-3 py-2 text-sm text-ink shadow-sticker"
          >
            {tip}
            <span
              aria-hidden="true"
              className="absolute -bottom-[9px] right-5 h-4 w-4 rotate-45 border-b-2 border-r-2 border-ink bg-surface"
            />
          </motion.p>
        )}
      </AnimatePresence>

      <Badge
        buttonRef={buttonRef}
        open={open}
        onClick={() => {
          setTip(null);
          onToggle();
        }}
      />
    </motion.div>
  );
}

function Badge({
  buttonRef,
  open,
  onClick,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={miniLuffyLabel}
      aria-haspopup="dialog"
      aria-expanded={open}
      className="block h-14 w-14 overflow-hidden rounded-full border-2 border-ink bg-sun shadow-sticker transition-transform hover:-translate-y-0.5 sm:h-16 sm:w-16"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LUFFY_HEAD.png}
        alt=""
        draggable={false}
        className="h-full w-full select-none object-cover"
      />
    </button>
  );
}
