'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, LayoutGrid, Pause, Play } from 'lucide-react';
import AskLuffyPanel from '@/components/character/AskLuffyPanel';
import LuffyHead from '@/components/character/LuffyHead';
import {
  slideCounterLabel,
  storyComingSoonLines,
  storyControlLabels,
  storyControls,
  storyEndLines,
  storyRegionLabel,
} from '@/components/character/luffyLines';
import { fill, pick } from '@/components/character/speech';
import { useConversation } from '@/components/character/useConversation';
import { saveStoryProgress } from '@/components/character/visitorMemory';
import { isTodo, usableUrl, type Story } from '@/lib/storyTypes';
import FullscreenButton from './FullscreenButton';
import { theatreButton } from './theatreButton';
import NarrationBubble from './NarrationBubble';
import SlideCanvas, { CanvasFit } from './SlideCanvas';
import SlideBody from './slides/SlideBody';
import { useSlideHash } from './useSlideHash';
import { useStoryLayout } from './useStoryLayout';
import { useSwipe } from './useSwipe';

/** Autoplay moves on this long after the narration finishes typing. */
const AUTOPLAY_DELAY_MS = 2000;
/** Let the new slide settle before Luffy starts talking about it. */
const NARRATION_DELAY_MS = 250;
/** Slide-and-fade: exit + enter stays under 300 ms. */
const SLIDE_OUT_S = 0.11;
const SLIDE_IN_S = 0.16;

/**
 * One project story as a presentation inside the story-mode overlay: the slide (on a
 * fixed canvas, scaled to fit), Luffy narrating beside or above it, and the controls
 * along the bottom. Layouts: .story-theatre in app/globals.css. The slide number lives in
 * the URL hash (#3). Keyboard: ← →, Space for next (Esc closes: the overlay's focus trap).
 * Swipe left/right on touch screens.
 */
export default function StoryPlayer({
  story,
  nextStory,
  overlayRef,
  onOpenStory,
  onAllStories,
  onClose,
  onAskOpenChange,
}: {
  story: Story;
  /** For "Next project" (null hides it). */
  nextStory: Story | null;
  /** The overlay (for full screen). */
  overlayRef: RefObject<HTMLElement | null>;
  onOpenStory: (slug: string) => void;
  onAllStories: () => void;
  onClose: () => void;
  /** The Ask Luffy panel opened or closed (the overlay's focus trap stands aside). */
  onAskOpenChange: (open: boolean) => void;
}) {
  const total = story.slides.length;
  const [slide, setSlide] = useSlideHash(total);
  const layout = useStoryLayout();
  const reducedMotion = !!useReducedMotion();
  const animate = !reducedMotion;

  const swipeRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(1);
  const [autoplay, setAutoplay] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  /** Which slide Luffy's current narration belongs to. */
  const [narratedSlide, setNarratedSlide] = useState<number | null>(null);

  const conversation = useConversation({ maxVisible: 1 });
  const { say, reset, busy } = conversation;

  const current = story.slides[slide - 1];
  const isLast = slide === total;
  const narrating = narratedSlide === slide && busy;
  const narrationDone = narratedSlide === slide && !busy;
  const endReady = isLast && conversation.prompt === 'chips';

  /* ---------- Moving between slides ---------- */

  const goTo = useCallback(
    (target: number, manual = true) => {
      const next = Math.min(Math.max(target, 1), total);
      if (manual || next === total) setAutoplay(false); // any manual action pauses autoplay
      if (next === slide) return;
      setDirection(next > slide ? 1 : -1);
      setSlide(next);
    },
    [slide, total, setSlide]
  );
  const next = useCallback(() => goTo(slide + 1), [goTo, slide]);
  const back = useCallback(() => goTo(slide - 1), [goTo, slide]);

  // Narration for each slide (after a short settle), plus the closing line on the last.
  useEffect(() => {
    const narration = isTodo(current.narration) ? pick(storyComingSoonLines) : current.narration;
    const timer = setTimeout(
      () => {
        reset();
        setNarratedSlide(slide);
        say(
          isLast ? [narration, pick(storyEndLines)] : [narration],
          isLast ? 'chips' : null,
          reducedMotion
        );
      },
      reducedMotion ? 0 : NARRATION_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, [slide, current, isLast, reducedMotion, reset, say]);

  // Autoplay: 2 s after the narration finishes, on to the next slide.
  useEffect(() => {
    if (!autoplay || !narrationDone || isLast) return;
    const timer = setTimeout(() => goTo(slide + 1, false), AUTOPLAY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoplay, narrationDone, isLast, goTo, slide]);

  // Remember where the visitor is, for the home page's "Continue".
  useEffect(() => {
    saveStoryProgress(story.slug, slide, total);
  }, [story.slug, slide, total]);

  // Page title while the story is open (the server sets it on a direct link).
  useEffect(() => {
    const previous = document.title;
    document.title = `${story.title} — Divyesh Bhavsar`;
    return () => {
      document.title = previous;
    };
  }, [story.title]);

  /* ---------- Keyboard and swipe ---------- */

  useEffect(() => {
    if (askOpen) return; // the panel has the keyboard
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        back();
      } else if (event.key === ' ') {
        // On a focused button or link, Space presses it instead.
        if (target?.closest('button, a')) return;
        event.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [askOpen, next, back]);

  useSwipe(swipeRef, { onLeft: next, onRight: back });

  const setAsk = (open: boolean) => {
    setAskOpen(open);
    onAskOpenChange(open);
  };

  const counter = fill(slideCounterLabel, { n: String(slide), total: String(total) });
  const repoUrl = usableUrl(story.repo) ? story.repo : null;

  return (
    <section
      aria-label={fill(storyRegionLabel, { title: story.title })}
      data-visit-label={story.title}
      className="story-theatre"
    >
      <p className="sr-only" aria-live="polite">
        {counter}: {current.title}
      </p>

      <div ref={swipeRef} className="st-slide">
        <SlideCanvas layout={layout}>
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={slide}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d * 40, opacity: 0 }),
                center: { x: 0, opacity: 1, transition: { duration: animate ? SLIDE_IN_S : 0 } },
                exit: (d: number) => ({
                  x: d * -40,
                  opacity: 0,
                  transition: { duration: animate ? SLIDE_OUT_S : 0 },
                }),
              }}
              initial={animate ? 'enter' : false}
              animate="center"
              exit="exit"
              className="min-h-full"
            >
              <CanvasFit>
                <SlideBody slide={current} story={story} animate={animate} focusing={narrating} />
              </CanvasFit>
            </motion.div>
          </AnimatePresence>
        </SlideCanvas>
      </div>

      <div className="st-luffy">
        <div className="st-top">
          <FullscreenButton target={overlayRef} className={theatreButton} />
          <button
            type="button"
            onClick={onClose}
            aria-label={storyControlLabels.close}
            className={theatreButton}
          >
            <span className="st-wide">{storyControls.close}</span>
            <span className="st-compact" aria-hidden="true">
              {storyControls.closeShort}
            </span>
          </button>
        </div>
        <div className="st-narrator">
          <LuffyHead talking={busy && animate} className="st-head" />
          {conversation.visible.length > 0 && (
            <NarrationBubble messages={conversation.visible} announced={conversation.log} />
          )}
        </div>
      </div>

      <div ref={controlsRef} className="st-controls">
        <div className="st-nav">
          <button
            type="button"
            onClick={back}
            disabled={slide === 1}
            aria-label={storyControlLabels.back}
            className={theatreButton}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            <span className="st-wide">{storyControls.back}</span>
          </button>

          <ol aria-label={storyControlLabels.dots} className="flex min-w-0 flex-1 justify-center">
            {story.slides.map((_, i) => {
              const n = i + 1;
              return (
                <li key={n} className="flex min-w-0 shrink">
                  <button
                    type="button"
                    onClick={() => goTo(n)}
                    aria-label={fill(storyControlLabels.dot, { n: String(n) })}
                    aria-current={n === slide ? 'step' : undefined}
                    className="group flex h-11 w-11 min-w-6 shrink items-center justify-center"
                  >
                    <span
                      className={`block h-2.5 rounded-full transition-all ${
                        n === slide
                          ? 'w-6 bg-red'
                          : 'w-2.5 bg-ink-muted/50 group-hover:bg-ink-muted'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ol>

          <button
            type="button"
            onClick={next}
            disabled={isLast}
            aria-label={storyControlLabels.next}
            className={theatreButton}
          >
            <span className="st-wide">{storyControls.next}</span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="st-actions">
          {endReady ? (
            <>
              {nextStory && (
                <button
                  type="button"
                  onClick={() => onOpenStory(nextStory.slug)}
                  className={theatreButton}
                >
                  {storyControls.nextProject}
                </button>
              )}
              <button type="button" onClick={() => setAsk(true)} className={theatreButton}>
                {storyControls.askLuffy}
              </button>
              <button type="button" onClick={onClose} className={theatreButton}>
                {storyControls.backToList}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onAllStories}
                aria-label={storyControlLabels.allStories}
                className={theatreButton}
              >
                <LayoutGrid size={16} aria-hidden="true" className="st-compact" />
                <span className="st-wide">{storyControls.allStories}</span>
              </button>
              <button
                type="button"
                onClick={() => setAutoplay((on) => !on && !isLast)}
                disabled={isLast}
                aria-pressed={autoplay}
                aria-label={autoplay ? storyControlLabels.pause : storyControlLabels.autoplay}
                className={theatreButton}
              >
                {autoplay ? (
                  <Pause size={16} aria-hidden="true" />
                ) : (
                  <Play size={16} aria-hidden="true" />
                )}
                <span className="st-wide">
                  {autoplay ? storyControls.pause : storyControls.autoplay}
                </span>
              </button>
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={storyControlLabels.openRepo}
                  className={theatreButton}
                >
                  {storyControls.openRepo}
                </a>
              )}
            </>
          )}
          <span aria-hidden="true" className="st-wide font-mono text-xs text-ink-muted">
            {slide} / {total}
          </span>
        </div>
      </div>

      {askOpen && (
        <AskLuffyPanel
          placement="corner"
          reducedMotion={reducedMotion}
          onClose={() => setAsk(false)}
          returnFocus={() => controlsRef.current?.querySelector<HTMLElement>('button') ?? null}
        />
      )}
    </section>
  );
}
