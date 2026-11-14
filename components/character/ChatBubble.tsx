'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { typingIndicatorLabel } from './luffyLines';
import type { VisibleMessage } from './useConversation';

/** Newest message fully opaque, older ones fading. */
const FADE = [1, 0.62, 0.4];

/**
 * Luffy's cloud bubble, centred under him: up to 3 messages (newest last), then
 * whatever the visitor can answer with (children), then an optional footer link.
 * Screen readers get each finished message once, through the live region.
 */
export default function ChatBubble({
  messages,
  announced,
  animate,
  children,
  footer,
}: {
  messages: VisibleMessage[];
  /** Finished messages (for aria-live). */
  announced: ReadonlyArray<{ id: number; text: string }>;
  animate: boolean;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.94, y: -6 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative rounded-[1.75rem] border-2 border-ink bg-surface px-5 pb-5 pt-4 shadow-sticker"
    >
      {/* Tail pointing up at Luffy. */}
      <span
        aria-hidden="true"
        className="absolute -top-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-ink bg-surface"
      />

      <div className="sr-only" aria-live="polite">
        {announced.map((m) => (
          <p key={m.id}>{m.text}</p>
        ))}
      </div>

      <div aria-hidden="true" className="relative flex flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((m, i) => (
            <motion.p
              key={m.id}
              layout={animate ? 'position' : false}
              initial={animate ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: FADE[messages.length - 1 - i] ?? 0.4, y: 0 }}
              exit={animate ? { opacity: 0, y: -8 } : { opacity: 0, transition: { duration: 0 } }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="text-base leading-relaxed text-ink"
            >
              {m.state === 'dots' ? (
                <TypingDots />
              ) : (
                <>
                  {m.shown}
                  {m.state === 'typing' && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-caret bg-ink align-middle" />
                  )}
                </>
              )}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      {children}
      {footer}
    </motion.div>
  );
}

export function TypingDots() {
  return (
    <span className="inline-flex h-[1.625rem] items-center gap-1.5" title={typingIndicatorLabel}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-2 w-2 rounded-full bg-ink-muted"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}
