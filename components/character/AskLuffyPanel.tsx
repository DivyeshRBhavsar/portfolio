'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { LUFFY_HEAD } from './introAssets';
import {
  askInputLabel,
  askPanelCloseLabel,
  askPanelTitle,
  askSendLabel,
  luffySaidLabel,
  miniLuffyChatOpenLines,
  starterQuestionsLabel,
  typingIndicatorLabel,
  visitorSaidLabel,
} from './luffyLines';
import { fill, pick } from './speech';
import { starterAnswers, type StarterAnswer } from './starterAnswers';
import { useConversation, type MessageLink } from './useConversation';
import { useFocusTrap } from './useFocusTrap';
import type { MediaFormat } from './useStageSetup';
import { readVisitor } from './visitorMemory';

/** Messages kept on screen in the panel (it scrolls). */
const PANEL_MAX_MESSAGES = 12;
/** Let the panel slide in before Luffy starts typing. */
const OPEN_DELAY_MS = 250;

export type PanelPlacement = 'dock' | 'stage';

/**
 * The scripted Q&A panel (the AI chatbot comes later). Slides up above Mini Luffy
 * ("dock") or opens under the stage's bubble from the "Ask Luffy" chip ("stage").
 * Either way it's a dialog: focus is trapped inside, Esc or the close button closes it.
 */
export default function AskLuffyPanel({
  placement,
  format,
  reducedMotion,
  onClose,
  returnFocus,
}: {
  placement: PanelPlacement;
  format: MediaFormat;
  reducedMotion: boolean;
  onClose: () => void;
  /** Where focus goes on close if the button that opened the panel is gone. */
  returnFocus?: () => HTMLElement | null;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const conversation = useConversation({ maxVisible: PANEL_MAX_MESSAGES });
  const { say, addVisitorMessage, clearPrompt, visible, log, prompt, busy } = conversation;

  useFocusTrap(panelRef, { onEscape: onClose, fallback: returnFocus });

  // Opening line, once the panel is in.
  useEffect(() => {
    const timer = setTimeout(() => {
      const name = readVisitor()?.name;
      const line = fill(pick(miniLuffyChatOpenLines), { nameComma: name ? `, ${name}` : '' });
      say([line], 'chips', reducedMotion);
    }, reducedMotion ? 0 : OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [say, reducedMotion]);

  // Stage placement: bring it into view under the bubble.
  useEffect(() => {
    if (placement !== 'stage') return;
    panelRef.current?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [placement, reducedMotion]);

  // Keep the newest message in view.
  const last = visible[visible.length - 1];
  const lastKey = last ? `${last.id}:${last.shown.length}:${last.state}` : '';
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastKey, prompt]);

  const ask = (starter: StarterAnswer) => {
    clearPrompt();
    addVisitorMessage(starter.question);
    say([{ text: starter.answer, links: starter.links }], 'chips', reducedMotion);
  };

  const talking = busy && !reducedMotion;
  const dock = placement === 'dock';

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ transformOrigin: dock ? '100% 100%' : '50% 0%' }}
      className={`${
        dock
          ? 'fixed bottom-[5.5rem] right-4 z-[60] w-[min(22rem,calc(100vw-2rem))]'
          : 'relative mt-6 w-full max-w-md scroll-mb-6'
      } flex max-h-[min(34rem,calc(100svh-7rem))] flex-col rounded-2xl border-2 border-ink bg-surface text-left shadow-sticker outline-none`}
    >
      <div className="flex items-center gap-3 border-b-2 border-ink/10 px-4 py-3">
        <PanelAvatar talking={talking} format={format} />
        <h2 id={titleId} className="flex-1 font-display text-lg font-semibold text-ink">
          {askPanelTitle}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={askPanelCloseLabel}
          className="rounded-full border-2 border-transparent p-1 text-ink-muted transition-colors hover:border-ink hover:text-ink"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="sr-only" aria-live="polite">
        {log.map((m) => (
          <p key={m.id}>
            {m.from === 'visitor' ? visitorSaidLabel : luffySaidLabel} {m.text}
          </p>
        ))}
      </div>

      {/* Message text is read from the live region above; links stay reachable here. */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {visible.map((m) =>
          m.from === 'visitor' ? (
            <p
              key={m.id}
              aria-hidden="true"
              className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-sun px-3.5 py-2 text-sm text-on-sun"
            >
              {m.text}
            </p>
          ) : (
            <div key={m.id} className="max-w-[90%]">
              <p aria-hidden="true" className="w-fit rounded-2xl rounded-bl-md border-2 border-ink/10 bg-cream px-3.5 py-2 text-sm leading-relaxed text-ink">
                {m.state === 'dots' ? (
                  <PanelDots />
                ) : (
                  <>
                    {m.shown}
                    {m.state === 'typing' && (
                      <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-caret bg-ink align-middle" />
                    )}
                  </>
                )}
              </p>
              {m.state === 'done' && m.links && m.links.length > 0 && (
                <AnswerLinks links={m.links} onFollow={onClose} />
              )}
            </div>
          )
        )}
      </div>

      {prompt === 'chips' && (
        <div role="group" aria-label={starterQuestionsLabel} className="flex flex-wrap gap-2 px-4 pb-3">
          {starterAnswers.map((starter) => (
            <button
              key={starter.id}
              type="button"
              onClick={() => ask(starter)}
              className="rounded-full border-2 border-ink bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun"
            >
              {starter.question}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => event.preventDefault()}
        className="flex items-center gap-2 border-t-2 border-ink/10 px-4 py-3"
      >
        <label htmlFor={`${titleId}-input`} className="sr-only">
          {askInputLabel}
        </label>
        <input
          id={`${titleId}-input`}
          type="text"
          disabled
          placeholder={askInputLabel}
          className="min-w-0 flex-1 cursor-not-allowed rounded-full border-2 border-ink/15 bg-cream px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
        <button
          type="submit"
          disabled
          className="cursor-not-allowed rounded-full border-2 border-ink/15 px-3.5 py-2 text-sm font-medium text-ink-muted"
        >
          {askSendLabel}
        </button>
      </form>
    </motion.div>
  );
}

/** Link buttons under an answer. Site links close the panel as they navigate. */
function AnswerLinks({ links, onFollow }: { links: MessageLink[]; onFollow: () => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {links.map((link) =>
        link.href.startsWith('/') ? (
          <Link
            key={link.href + link.label}
            href={link.href}
            onClick={onFollow}
            className="rounded-full border-2 border-ink px-3 py-1 text-xs font-medium text-red-deep transition-colors hover:bg-sun hover:text-on-sun"
          >
            {link.label} <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <a
            key={link.href + link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border-2 border-ink px-3 py-1 text-xs font-medium text-red-deep transition-colors hover:bg-sun hover:text-on-sun"
          >
            {link.label} <span aria-hidden="true">↗</span>
          </a>
        )
      )}
    </div>
  );
}

/** luffy-head: the looping clip while he's answering, the still otherwise. */
function PanelAvatar({ talking, format }: { talking: boolean; format: MediaFormat }) {
  const [broken, setBroken] = useState(false);
  const animated = talking && !broken;
  const className = 'h-full w-full object-cover';
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-sun">
      {animated && format === 'webm' ? (
        <video
          src={LUFFY_HEAD.webm}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className={className}
          onError={() => setBroken(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={animated ? LUFFY_HEAD.webp : LUFFY_HEAD.png}
          alt=""
          draggable={false}
          className={className}
          onError={() => setBroken(true)}
        />
      )}
    </span>
  );
}

function PanelDots() {
  return (
    <span className="inline-flex h-5 items-center gap-1.5" title={typingIndicatorLabel}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-muted"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}
