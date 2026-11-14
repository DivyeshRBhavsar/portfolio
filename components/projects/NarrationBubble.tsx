'use client';

import { useEffect, useRef } from 'react';
import { TypingDots } from '@/components/character/ChatBubble';
import type { VisibleMessage } from '@/components/character/useConversation';

/**
 * Luffy's bubble in story mode: his latest line ("• • •" first, then typed out, as on the
 * home page). The tail points up at his head, or left in the portrait strip and the
 * picker; size and line limits per layout come from .story-bubble in app/globals.css
 * (in the portrait strip, at most 3 lines, scrolling inside the bubble if longer).
 * Screen readers get each finished line once, through the live region.
 */
export default function NarrationBubble({
  messages,
  announced,
  tail = 'auto',
}: {
  messages: VisibleMessage[];
  announced: ReadonlyArray<{ id: number; text: string }>;
  /** auto: up, or left in the portrait strip. */
  tail?: 'auto' | 'left';
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const latest = messages[messages.length - 1];

  // Keep the newest words in view when the text is longer than the bubble.
  const shownLength = latest?.shown.length ?? 0;
  useEffect(() => {
    const node = textRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [latest?.id, shownLength]);

  return (
    <div
      data-tail={tail}
      className="story-bubble relative rounded-2xl border-2 border-ink bg-surface text-ink shadow-sticker"
    >
      <div className="sr-only" aria-live="polite">
        {announced.map((m) => (
          <p key={m.id}>{m.text}</p>
        ))}
      </div>
      <div ref={textRef} aria-hidden="true" className="story-bubble-text overflow-y-auto">
        {latest &&
          (latest.state === 'dots' ? (
            <TypingDots />
          ) : (
            <p>
              {latest.shown}
              {latest.state === 'typing' && (
                <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-caret bg-ink align-middle" />
              )}
            </p>
          ))}
      </div>
    </div>
  );
}
