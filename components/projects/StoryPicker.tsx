'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import LuffyHead from '@/components/character/LuffyHead';
import {
  categoryAllLabel,
  storyControlLabels,
  storyCategoryLines,
  storyControls,
  storyPickerLines,
  storyPickerListLabel,
  surpriseMeLabel,
  watchStoryLabel,
} from '@/components/character/luffyLines';
import { fill, nameComma, pick } from '@/components/character/speech';
import { useConversation } from '@/components/character/useConversation';
import { readVisitor } from '@/components/character/visitorMemory';
import type { Category, ProjectCategories } from '@/lib/categories';
import type { Story } from '@/lib/storyTypes';
import CategoryChips from './CategoryChips';
import FullscreenButton from './FullscreenButton';
import NarrationBubble from './NarrationBubble';
import { theatreButton } from './theatreButton';
import StoryText, { ComingSoon } from './StoryText';

/** The slim bar's height on phones (the header collapses into it). */
const SLIM_BAR_PX = 48;
/** Tags shown per card on phones. */
const PHONE_TAGS = 3;

/**
 * Story mode's start, inside the overlay: Luffy asks which project to explore, with the
 * expertise chips (stories only, empty ones hidden), a card per featured story, and
 * "Surprise me 🎲" (only with more than one). Picking a chip filters the cards and Luffy
 * says that category's line.
 *   Tablet and desktop: Luffy and the buttons stay put; only the card list scrolls.
 *   Phones (< 640px): the whole picker is one scroll container; the full header scrolls
 *   away and a slim sticky bar takes its place; chips stay in one sideways-scrolling
 *   row; cards are compact; Close and Surprise me sit in a sticky bottom bar.
 */

export default function StoryPicker({
  stories,
  categories,
  storyCategories,
  initialCategory,
  active,
  overlayRef,
  onOpen,
  onClose,
}: {
  /** Featured stories, in order. */
  stories: Story[];
  categories: Category[];
  storyCategories: Record<string, ProjectCategories>;
  /** The list's category when story mode was opened (ignored if it has no stories). */
  initialCategory: string | null;
  /** The picker is showing (Luffy only talks then). */
  active: boolean;
  overlayRef: RefObject<HTMLElement | null>;
  onOpen: (slug: string) => void;
  onClose: () => void;
}) {
  const reducedMotion = !!useReducedMotion();
  const conversation = useConversation({ maxVisible: 1 });
  const { say, reset, busy } = conversation;

  const catsOf = (story: Story) => storyCategories[story.slug]?.categories ?? ['other'];
  const counts: Record<string, number> = {};
  stories.forEach((story) =>
    catsOf(story).forEach((slug) => (counts[slug] = (counts[slug] ?? 0) + 1))
  );
  const [selected, setSelected] = useState<string | null>(
    initialCategory && counts[initialCategory] ? initialCategory : null
  );
  const shown = selected ? stories.filter((story) => catsOf(story).includes(selected)) : stories;

  const pickCategory = (slug: string | null) => {
    if (slug === selected) return;
    setSelected(slug);
    const lines = slug ? storyCategoryLines[slug] : storyPickerLines;
    if (!lines?.length) return;
    reset();
    say([fill(pick(lines), { nameComma: nameComma(readVisitor()?.name) })], null, reducedMotion);
  };

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(
      () => {
        reset();
        const line = fill(pick(storyPickerLines), { nameComma: nameComma(readVisitor()?.name) });
        say([line], null, reducedMotion);
      },
      reducedMotion ? 0 : 200
    );
    return () => clearTimeout(timer);
  }, [active, reducedMotion, reset, say]);

  const surprise = () => onOpen(pick(shown).slug);

  // Phones: the full header scrolls away with the cards; once it's under the slim bar's
  // line, the slim sticky bar shows (it takes no layout space, so nothing jumps). The
  // marker sits at the end of the full header; desktop never scrolls this container.
  const scrollRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const root = scrollRef.current;
    const marker = markerRef.current;
    if (!root || !marker) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setCollapsed(!entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0) + SLIM_BAR_PX),
      { root, rootMargin: `-${SLIM_BAR_PX}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  const categoryName = selected ? (categories.find((c) => c.slug === selected)?.name ?? categoryAllLabel) : categoryAllLabel;

  return (
    <div
      ref={scrollRef}
      className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-4 sm:gap-6 max-sm:block max-sm:space-y-4 max-sm:overflow-y-auto max-sm:overflow-x-hidden max-sm:overscroll-contain"
    >
      {/* Phones: the slim bar, shown once the full header has scrolled away. Decorative
          (it repeats the header), so screen readers skip it. */}
      <div aria-hidden="true" className="sticky top-0 z-20 h-0 sm:hidden">
        <div
          className={`absolute inset-x-0 top-0 flex items-center gap-2 border-b-2 border-ink/10 bg-cream/95 backdrop-blur transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
            collapsed ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
          }`}
          style={{ height: SLIM_BAR_PX }}
        >
          <LuffyHead talking={false} className="h-8 w-8" />
          <span className="font-display font-semibold text-ink">{storyPickerListLabel}</span>
          <span className="ml-auto max-w-[45%] truncate rounded-full bg-sun px-2.5 py-0.5 text-xs font-medium text-on-sun">
            {categoryName}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
          {storyPickerListLabel}
        </h2>
        <div className="flex gap-2">
          <FullscreenButton target={overlayRef} className={theatreButton} />
          {/* Phones: Close is in the bottom bar. */}
          <button
            type="button"
            onClick={onClose}
            aria-label={storyControlLabels.close}
            className={`${theatreButton} max-sm:hidden`}
          >
            <span className="hidden sm:inline">{storyControls.close}</span>
            <span className="sm:hidden" aria-hidden="true">
              {storyControls.closeShort}
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 sm:gap-4">
        <LuffyHead talking={busy && !reducedMotion} className="h-14 w-14 sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1 pl-2">
          {conversation.visible.length > 0 && (
            <NarrationBubble
              messages={conversation.visible}
              announced={conversation.log}
              tail="left"
            />
          )}
        </div>
      </div>

      {stories.length > 0 && (
        <CategoryChips
          categories={categories}
          counts={counts}
          total={stories.length}
          selected={selected}
          onSelect={pickCategory}
          kind="stories"
          oneRowOnPhones
        />
      )}

      {/* The end of the full header (the slim bar shows once this scrolls under it). */}
      <div ref={markerRef} aria-hidden="true" className="h-px max-sm:!mt-0 sm:hidden" />

      {stories.length === 0 ? (
        <p className="text-center">
          <ComingSoon />
        </p>
      ) : (
        <ul
          aria-label={storyPickerListLabel}
          className="grid content-start gap-4 p-1 max-sm:!mt-2 max-sm:gap-3 sm:min-h-0 sm:flex-1 sm:grid-cols-2 sm:overflow-y-auto sm:overscroll-contain lg:grid-cols-3"
        >
          {shown.map((story) => (
            <li key={story.slug}>
              <button
                type="button"
                onClick={() => onOpen(story.slug)}
                className="group flex h-full w-full flex-col rounded-xl border-2 border-ink bg-surface p-5 text-left transition-all hover:-translate-y-1 hover:shadow-sticker max-sm:p-3.5"
              >
                <span className="font-display text-lg font-semibold text-ink max-sm:text-base">
                  <StoryText text={story.title} />
                </span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted max-sm:mt-1 max-sm:line-clamp-2">
                  <StoryText text={story.hook} />
                </span>
                {story.tags.length > 0 && (
                  <span className="mt-4 flex flex-wrap gap-2 max-sm:mt-2.5 max-sm:max-h-[2.125rem] max-sm:gap-1.5 max-sm:overflow-hidden">
                    {story.tags.map((tag, i) => (
                      <span
                        key={tag}
                        className={`pill border-ink bg-sun py-1 text-xs text-on-sun ${i >= PHONE_TAGS ? 'max-sm:hidden' : ''}`}
                      >
                        <StoryText text={tag} />
                      </span>
                    ))}
                  </span>
                )}
                <span className="mt-5 font-mono text-sm font-medium text-red-deep group-hover:underline max-sm:hidden">
                  {watchStoryLabel}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {shown.length > 1 && (
        <div className="text-center max-sm:hidden">
          <button type="button" onClick={surprise} className={theatreButton}>
            {surpriseMeLabel}
          </button>
        </div>
      )}

      {/* Phones: Close and Surprise me, always in reach at the bottom (the overlay's
          safe-area padding keeps them above the home indicator). */}
      <div className="sticky bottom-0 z-20 flex gap-2 border-t-2 border-ink/10 bg-cream/95 pt-2 backdrop-blur sm:hidden">
        <button type="button" onClick={onClose} aria-label={storyControlLabels.close} className={`${theatreButton} flex-1`}>
          {storyControls.close}
        </button>
        {shown.length > 1 && (
          <button type="button" onClick={surprise} className={`${theatreButton} flex-1`}>
            {surpriseMeLabel}
          </button>
        )}
      </div>
    </div>
  );
}
