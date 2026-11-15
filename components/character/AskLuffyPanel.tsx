'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { RotateCcw, Send, X } from 'lucide-react';
import ChatText from './ChatText';
import LuffyHead from './LuffyHead';
import {
  askInputLabel,
  askPanelCloseLabel,
  askPanelTitle,
  askSendLabel,
  chatCharCount,
  chatClear,
  chatContactButton,
  chatContinueButton,
  chatCounter,
  chatEndedNotes,
  chatSourcePrefix,
  chatSourcesLabel,
  chatThinkingLabel,
  chatTrustLine,
  chatTryAgain,
  luffySaidLabel,
  miniLuffyChatOpenLines,
  starterQuestionsLabel,
} from './luffyLines';
import { fill, pick } from './speech';
import { starterQuestions } from './starterAnswers';
import { useFocusTrap } from './useFocusTrap';
import { useLuffyChat, type ChatMessage, type ChatSource } from './useLuffyChat';
import { readVisitor } from './visitorMemory';

/** Same as the API's limit (lib/luffy/config.ts REQUEST.maxMessageChars). */
const MAX_CHARS = 300;
const SHOW_COUNT_FROM = 250;

/** dock: above Mini Luffy · stage: under the home bubble · corner: bottom-right, no badge */
export type PanelPlacement = 'dock' | 'stage' | 'corner';

const greeting = () => fill(pick(miniLuffyChatOpenLines), { nameComma: readVisitor()?.name ? `, ${readVisitor()?.name}` : '' });

/**
 * Bottom offset that keeps a fixed panel above the phone's on-screen keyboard
 * (visualViewport shrinks when it opens). 0 when there's no keyboard.
 */
function useKeyboardInset(enabled: boolean): { inset: number; viewport: number | null } {
  const [state, setState] = useState<{ inset: number; viewport: number | null }>({ inset: 0, viewport: null });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!enabled || !vv) return;
    const update = () =>
      setState({ inset: Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)), viewport: Math.round(vv.height) });
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [enabled]);
  return state;
}

/**
 * Ask Luffy: the chat with the RAG chatbot (/api/chat). Slides up above Mini Luffy
 * ("dock"), opens under the stage's bubble from the "Ask Luffy" chip ("stage"), or in
 * the bottom-right corner on other pages ("corner", e.g. at the end of a story). Either
 * way it's a dialog: focus is trapped inside, Esc or the close button closes it.
 */
export default function AskLuffyPanel({
  placement,
  reducedMotion,
  onClose,
  returnFocus,
  prefill,
}: {
  placement: PanelPlacement;
  reducedMotion: boolean;
  onClose: () => void;
  /** Where focus goes on close if the button that opened the panel is gone. */
  returnFocus?: () => HTMLElement | null;
  /** Put in the input (not sent), e.g. "Tell me more about …" from a story. */
  prefill?: string;
}) {
  const titleId = useId();
  const inputId = `${titleId}-input`;
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(prefill ?? '');
  const chat = useLuffyChat(greeting);
  const { messages, counter, ended, streaming, send, retry, clear } = chat;
  const docked = placement !== 'stage';
  const keyboard = useKeyboardInset(docked);

  useFocusTrap(panelRef, { onEscape: onClose, fallback: returnFocus });

  // Stage placement: bring it into view under the bubble.
  useEffect(() => {
    if (placement !== 'stage') return;
    panelRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, [placement, reducedMotion]);

  // Keep the newest message in view (inside the panel only).
  const last = messages[messages.length - 1];
  const lastKey = last ? `${last.id}:${last.text.length}:${last.status}:${last.sources?.length ?? 0}` : '';
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastKey, ended]);

  const thinking = last?.role === 'luffy' && last.status === 'waiting';
  const talking = last?.role === 'luffy' && last.status === 'streaming' && !reducedMotion;
  const hasQuestions = messages.some((m) => m.role === 'visitor');
  const lastAnswer = [...messages].reverse().find((m) => m.role === 'luffy' && (m.status === 'done' || m.status === 'error'));

  const submit = (text: string) => {
    if (!text.trim() || streaming || ended) return;
    void send(text);
    setDraft('');
  };

  const disabled = streaming || !!ended;
  const counterText = counter && counter.questionNumber > 0 ? fill(chatCounter, { n: String(counter.questionNumber), total: String(counter.allowed) }) : '';

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
      style={{
        transformOrigin: docked ? '100% 100%' : '50% 0%',
        ...(docked && keyboard.inset > 0 && keyboard.viewport
          ? { bottom: keyboard.inset + 12, maxHeight: keyboard.viewport - 24 }
          : {}),
      }}
      className={`${
        docked
          ? `fixed ${placement === 'dock' ? 'bottom-[5.5rem]' : 'bottom-4'} right-4 z-[60] w-[min(24rem,calc(100vw-2rem))] max-h-[min(36rem,calc(100dvh-7rem))]`
          : 'relative mt-6 w-full max-w-md scroll-mb-6 max-h-[min(36rem,calc(100dvh-6rem))]'
      } flex flex-col rounded-2xl border-2 border-ink bg-surface text-left shadow-sticker outline-none`}
    >
      <div className="flex items-center gap-3 border-b-2 border-ink/10 px-4 py-3">
        <span className={thinking && !reducedMotion ? 'luffy-thinking' : ''}>
          <LuffyHead talking={talking} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-lg font-semibold leading-tight text-ink">
            {askPanelTitle}
          </h2>
          {counterText && <p className="font-mono text-xs text-ink-muted">{counterText}</p>}
        </div>
        {hasQuestions && !streaming && (
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-2 py-1 text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            {chatClear}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={askPanelCloseLabel}
          className="rounded-full border-2 border-transparent p-1 text-ink-muted transition-colors hover:border-ink hover:text-ink"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Each finished answer is announced once (not every token). */}
      <div className="sr-only" aria-live="polite">
        {lastAnswer && hasQuestions && (
          <p key={lastAnswer.id}>
            {luffySaidLabel} {lastAnswer.text}
          </p>
        )}
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
        {messages.map((m) => (
          <Message key={m.id} message={m} onFollow={onClose} onRetry={retry} streaming={streaming} />
        ))}

        {ended && (
          <div className="rounded-xl border-2 border-ink/10 bg-peach px-3.5 py-3 text-sm text-ink">
            <p>{chatEndedNotes[ended.reason]}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(ended.reason === 'limit' || ended.reason === 'flow_complete') && ended.contact && (
                <Link
                  href={`/contact?purpose=${encodeURIComponent(ended.contact.purpose)}&plan=${encodeURIComponent(ended.contact.summary)}`}
                  onClick={onClose}
                  className="rounded-full border-2 border-ink bg-red px-3.5 py-1.5 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-sticker motion-reduce:hover:translate-y-0"
                >
                  {chatContinueButton}
                </Link>
              )}
              {(ended.reason === 'daily_cap' || ended.reason === 'unavailable') && (
                <Link
                  href="/contact"
                  onClick={onClose}
                  className="rounded-full border-2 border-ink bg-surface px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun"
                >
                  {chatContactButton}
                </Link>
              )}
              {ended.reason === 'unavailable' && ended.retry && (
                <button
                  type="button"
                  onClick={() => retry(ended.retry!)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-surface px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  {chatTryAgain}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {!hasQuestions && !ended && (
        <div role="group" aria-label={starterQuestionsLabel} className="flex flex-wrap gap-2 px-4 pb-3">
          {starterQuestions.map((starter) => (
            <button
              key={starter.id}
              type="button"
              disabled={streaming}
              onClick={() => submit(starter.question)}
              className="rounded-full border-2 border-ink bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun disabled:opacity-60"
            >
              {starter.question}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
        className="border-t-2 border-ink/10 px-4 pb-2 pt-3"
      >
        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            {askInputLabel}
          </label>
          <input
            id={inputId}
            type="text"
            value={draft}
            maxLength={MAX_CHARS}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={askInputLabel}
            autoComplete="off"
            enterKeyHint="send"
            aria-describedby={draft.length >= SHOW_COUNT_FROM ? `${inputId}-count` : undefined}
            className="min-w-0 flex-1 rounded-full border-2 border-ink-muted bg-cream px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:border-ink disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={disabled || !draft.trim()}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-red px-3.5 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:border-ink/15 disabled:bg-surface disabled:text-ink-muted"
          >
            <Send size={14} aria-hidden="true" />
            {askSendLabel}
          </button>
        </div>
        {draft.length >= SHOW_COUNT_FROM && (
          <p id={`${inputId}-count`} className="mt-1 text-right font-mono text-xs text-ink-muted">
            {fill(chatCharCount, { n: String(draft.length), total: String(MAX_CHARS) })}
          </p>
        )}
        <p className="mt-2 text-center text-[11px] leading-snug text-ink-muted">{chatTrustLine}</p>
      </form>
    </motion.div>
  );
}

function Message({
  message: m,
  onFollow,
  onRetry,
  streaming,
}: {
  message: ChatMessage;
  onFollow: () => void;
  onRetry: (question: string) => void;
  streaming: boolean;
}) {
  if (m.role === 'visitor') {
    return (
      <p className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-sun px-3.5 py-2 text-sm text-on-sun">
        {m.text}
      </p>
    );
  }
  return (
    <div className="max-w-[92%]">
      {/* The list isn't live (no token-by-token reading); finished answers are announced
          once by the live region above, and stay browsable here with their links. */}
      <div
        className={`w-fit break-words rounded-2xl rounded-bl-md border-2 px-3.5 py-2 text-sm leading-relaxed ${
          m.kind === 'unlock' ? 'border-ink bg-sun text-on-sun' : 'border-ink/10 bg-cream text-ink'
        }`}
      >
        {m.status === 'waiting' ? <PanelDots /> : <ChatText text={m.text} onFollow={onFollow} />}
      </div>
      {m.status === 'done' && m.sources && m.sources.length > 0 && <Sources sources={m.sources} onFollow={onFollow} />}
      {m.status === 'error' && m.retry && (
        <button
          type="button"
          disabled={streaming}
          onClick={() => onRetry(m.retry!)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-xs font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun disabled:opacity-60"
        >
          <RotateCcw size={13} aria-hidden="true" />
          {chatTryAgain}
        </button>
      )}
    </div>
  );
}

/** "📖 Title" chips: stories open story mode, posts open the post. Following one closes the panel. */
function Sources({ sources, onFollow }: { sources: ChatSource[]; onFollow: () => void }) {
  return (
    <ul aria-label={chatSourcesLabel} className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((s) => (
        <li key={s.url}>
          <Link
            href={s.url}
            onClick={onFollow}
            className="inline-flex max-w-[16rem] items-center gap-1 rounded-full border-2 border-ink/20 bg-surface px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-sun hover:text-on-sun"
          >
            <span aria-hidden="true">{chatSourcePrefix}</span>
            <span className="truncate">{s.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PanelDots() {
  return (
    <span className="inline-flex h-5 items-center gap-1.5" role="status" aria-label={chatThinkingLabel}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-muted" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}
