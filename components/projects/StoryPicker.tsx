'use client';

import { useEffect, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import LuffyHead from '@/components/character/LuffyHead';
import {
  storyControlLabels,
  storyControls,
  storyPickerLines,
  storyPickerListLabel,
  surpriseMeLabel,
  watchStoryLabel,
} from '@/components/character/luffyLines';
import { fill, nameComma, pick } from '@/components/character/speech';
import { useConversation } from '@/components/character/useConversation';
import { readVisitor } from '@/components/character/visitorMemory';
import type { Story } from '@/lib/storyTypes';
import FullscreenButton from './FullscreenButton';
import NarrationBubble from './NarrationBubble';
import { theatreButton } from './theatreButton';
import StoryText, { ComingSoon } from './StoryText';

/**
 * Story mode's start, inside the overlay: Luffy asks which project to explore, with a
 * card per featured story and "Surprise me 🎲" (only with more than one). Luffy and the
 * buttons stay put; only the card list scrolls if the cards don't all fit.
 */
export default function StoryPicker({
  stories,
  active,
  overlayRef,
  onOpen,
  onClose,
}: {
  /** Featured stories, in order. */
  stories: Story[];
  /** The picker is showing (Luffy only talks then). */
  active: boolean;
  overlayRef: RefObject<HTMLElement | null>;
  onOpen: (slug: string) => void;
  onClose: () => void;
}) {
  const reducedMotion = !!useReducedMotion();
  const conversation = useConversation({ maxVisible: 1 });
  const { say, reset, busy } = conversation;

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

  const surprise = () => onOpen(pick(stories).slug);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
          {storyPickerListLabel}
        </h2>
        <div className="flex gap-2">
          <FullscreenButton target={overlayRef} className={theatreButton} />
          <button
            type="button"
            onClick={onClose}
            aria-label={storyControlLabels.close}
            className={theatreButton}
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

      {stories.length === 0 ? (
        <p className="text-center">
          <ComingSoon />
        </p>
      ) : (
        <ul
          aria-label={storyPickerListLabel}
          className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto overscroll-contain p-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {stories.map((story) => (
            <li key={story.slug}>
              <button
                type="button"
                onClick={() => onOpen(story.slug)}
                className="group flex h-full w-full flex-col rounded-xl border-2 border-ink bg-surface p-5 text-left transition-all hover:-translate-y-1 hover:shadow-sticker"
              >
                <span className="font-display text-lg font-semibold text-ink">
                  <StoryText text={story.title} />
                </span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  <StoryText text={story.hook} />
                </span>
                {story.tags.length > 0 && (
                  <span className="mt-4 flex flex-wrap gap-2">
                    {story.tags.map((tag) => (
                      <span key={tag} className="pill border-ink bg-sun py-1 text-xs text-on-sun">
                        <StoryText text={tag} />
                      </span>
                    ))}
                  </span>
                )}
                <span className="mt-5 font-mono text-sm font-medium text-red-deep group-hover:underline">
                  {watchStoryLabel}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {stories.length > 1 && (
        <div className="text-center">
          <button type="button" onClick={surprise} className={theatreButton}>
            {surpriseMeLabel}
          </button>
        </div>
      )}
    </div>
  );
}
