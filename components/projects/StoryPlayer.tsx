'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import AskLuffyPanel from '@/components/character/AskLuffyPanel';
import ChatBubble from '@/components/character/ChatBubble';
import IntentChips, { type Chip } from '@/components/character/IntentChips';
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
import SlideBody from './slides/SlideBody';
import StoryText from './StoryText';
import { useSlideHash } from './useSlideHash';
import { useSwipe } from './useSwipe';

/** Autoplay moves on this long after the narration finishes typing. */
const AUTOPLAY_DELAY_MS = 2000;
/** Let the new slide settle before Luffy starts talking about it. */
const NARRATION_DELAY_MS = 250;
/** Slide-and-fade: exit + enter stays under 300 ms. */
const SLIDE_OUT_S = 0.11;
const SLIDE_IN_S = 0.16;

const controlButton =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun disabled:cursor-not-allowed disabled:border-ink/20 disabled:text-ink-muted disabled:hover:bg-surface';

/**
 * One project story as slides, with Luffy narrating each one beside it. The slide
 * number lives in the URL hash (#3). Keyboard: ← →, Space for next, Esc to close.
 * Swipe left/right on touch screens.
 */
export default function StoryPlayer({
  story,
  nextStory,
  focusOnOpen,
  onOpenStory,
  onClose,
  onBackToList,
}: {
  story: Story;
  /** For "Next project" (null hides it). */
  nextStory: Story | null;
  /** Opened by the visitor on this page (not a direct link): move focus to the story. */
  focusOnOpen: boolean;
  onOpenStory: (slug: string) => void;
  onClose: () => void;
  onBackToList: () => void;
}) {
  const total = story.slides.length;
  const [slide, setSlide] = useSlideHash(total);
  const reducedMotion = !!useReducedMotion();
  const animate = !reducedMotion;

  const regionRef = useRef<HTMLElement>(null);
  const swipeRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(1);
  const [autoplay, setAutoplay] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  /** Which slide Luffy's current narration belongs to. */
  const [narratedSlide, setNarratedSlide] = useState<number | null>(null);

  const conversation = useConversation({ maxVisible: 2 });
  const { say, reset, busy } = conversation;

  const current = story.slides[slide - 1];
  const isLast = slide === total;
  const narrationDone = narratedSlide === slide && !busy;

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

  useEffect(() => {
    if (!focusOnOpen) return;
    regionRef.current?.focus({ preventScroll: true });
  }, [focusOnOpen]);

  /* ---------- Keyboard and swipe ---------- */

  useEffect(() => {
    if (askOpen) return; // the panel has the keyboard (its Esc closes it)
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) {
        return;
      }
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
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [askOpen, next, back, onClose]);

  useSwipe(swipeRef, { onLeft: next, onRight: back });

  /* ---------- End of story ---------- */

  const endChips: Chip[] = [
    ...(nextStory
      ? [
          {
            key: 'next',
            label: storyControls.nextProject,
            onSelect: () => onOpenStory(nextStory.slug),
          },
        ]
      : []),
    { key: 'ask', label: storyControls.askLuffy, onSelect: () => setAskOpen(true) },
    { key: 'list', label: storyControls.backToList, onSelect: onBackToList },
  ];

  const counter = fill(slideCounterLabel, { n: String(slide), total: String(total) });
  const repoUrl = usableUrl(story.repo) ? story.repo : null;

  return (
    <section
      ref={regionRef}
      tabIndex={-1}
      aria-label={fill(storyRegionLabel, { title: story.title })}
      data-visit-label={story.title}
      className="outline-none"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          <StoryText text={story.title} />
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={storyControlLabels.close}
          className={controlButton}
        >
          {storyControls.close}
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {counter}: {current.title}
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        {/* Luffy: above the slide on mobile, in the corner beside it on wide screens. */}
        <div className="flex flex-col items-center gap-4 lg:order-2 lg:sticky lg:top-24">
          <LuffyHead talking={busy && animate} className="h-16 w-16 sm:h-20 sm:w-20" />
          <div ref={bubbleRef} tabIndex={-1} className="w-full max-w-md outline-none">
            {conversation.visible.length > 0 && (
              <ChatBubble
                messages={conversation.visible}
                announced={conversation.log}
                animate={animate}
              >
                {conversation.prompt === 'chips' && (
                  <IntentChips chips={endChips} animate={animate} />
                )}
              </ChatBubble>
            )}
          </div>
        </div>

        <div className="relative flex min-h-[26rem] flex-col rounded-2xl border-2 border-ink bg-surface shadow-sticker lg:order-1">
          <div
            ref={swipeRef}
            className="flex-1 overflow-hidden px-5 py-6 sm:px-8 [touch-action:pan-y]"
          >
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={slide}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ x: d * 28, opacity: 0 }),
                  center: { x: 0, opacity: 1, transition: { duration: animate ? SLIDE_IN_S : 0 } },
                  exit: (d: number) => ({
                    x: d * -28,
                    opacity: 0,
                    transition: { duration: animate ? SLIDE_OUT_S : 0 },
                  }),
                }}
                initial={animate ? 'enter' : false}
                animate="center"
                exit="exit"
                className="h-full"
              >
                <SlideBody slide={current} story={story} animate={animate} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls stay at the bottom of the slide area (sticky on long slides). */}
          <div className="sticky bottom-0 z-10 rounded-b-2xl border-t-2 border-ink/10 bg-surface px-3 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={back}
                disabled={slide === 1}
                aria-label={storyControlLabels.back}
                className={controlButton}
              >
                <ChevronLeft size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{storyControls.back}</span>
              </button>

              <ol aria-label={storyControlLabels.dots} className="flex flex-wrap justify-center">
                {story.slides.map((_, i) => {
                  const n = i + 1;
                  return (
                    <li key={n}>
                      <button
                        type="button"
                        onClick={() => goTo(n)}
                        aria-label={fill(storyControlLabels.dot, { n: String(n) })}
                        aria-current={n === slide ? 'step' : undefined}
                        className="group flex h-11 min-w-[1.375rem] items-center justify-center"
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
                className={controlButton}
              >
                <span className="hidden sm:inline">{storyControls.next}</span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setAutoplay((on) => !on && !isLast)}
                disabled={isLast}
                aria-pressed={autoplay}
                aria-label={autoplay ? storyControlLabels.pause : storyControlLabels.autoplay}
                className={controlButton}
              >
                {autoplay ? (
                  <Pause size={16} aria-hidden="true" />
                ) : (
                  <Play size={16} aria-hidden="true" />
                )}
                {autoplay ? storyControls.pause : storyControls.autoplay}
              </button>
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={storyControlLabels.openRepo}
                  className={controlButton}
                >
                  {storyControls.openRepo}
                </a>
              )}
              <span aria-hidden="true" className="font-mono text-xs text-ink-muted">
                {slide} / {total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {askOpen && (
        <AskLuffyPanel
          placement="corner"
          reducedMotion={reducedMotion}
          onClose={() => setAskOpen(false)}
          returnFocus={() => bubbleRef.current}
        />
      )}
    </section>
  );
}
