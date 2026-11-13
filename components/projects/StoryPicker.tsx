'use client';

import { useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import ChatBubble from '@/components/character/ChatBubble';
import LuffyHead from '@/components/character/LuffyHead';
import {
  storyPickerLines,
  storyPickerListLabel,
  surpriseMeLabel,
  watchStoryLabel,
} from '@/components/character/luffyLines';
import { fill, nameComma, pick } from '@/components/character/speech';
import { useConversation } from '@/components/character/useConversation';
import { readVisitor } from '@/components/character/visitorMemory';
import type { Story } from '@/lib/storyTypes';
import { ComingSoon } from './StoryText';
import StoryText from './StoryText';

/**
 * Story mode's start: Luffy asks which project to explore, with a card per featured
 * story and "Surprise me 🎲" (only when there's more than one).
 */
export default function StoryPicker({
  stories,
  active,
  onOpen,
}: {
  /** Featured stories, in order. */
  stories: Story[];
  /** Story mode is showing (Luffy only talks then). */
  active: boolean;
  onOpen: (slug: string) => void;
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
    <div>
      <div className="mx-auto mb-10 flex max-w-xl flex-col items-center gap-4">
        <LuffyHead talking={busy && !reducedMotion} className="h-20 w-20" />
        <div className="w-full">
          {conversation.visible.length > 0 && (
            <ChatBubble
              messages={conversation.visible}
              announced={conversation.log}
              animate={!reducedMotion}
            />
          )}
        </div>
      </div>

      {stories.length === 0 ? (
        <p className="text-center">
          <ComingSoon />
        </p>
      ) : (
        <>
          <ul aria-label={storyPickerListLabel} className="grid gap-5 sm:grid-cols-2">
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
          {stories.length > 1 && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={surprise}
                className="min-h-11 rounded-full border-2 border-ink bg-surface px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun"
              >
                {surpriseMeLabel}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
