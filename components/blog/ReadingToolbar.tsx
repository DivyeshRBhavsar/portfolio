'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import type { PostHeading } from '@/lib/posts';
import {
  readerContentsLabel,
  readerDone,
  readerExitFocusLabel,
  readerFocusLabel,
  readerMinutesLeft,
  readerMoreLabel,
  readerProgressLabel,
  readerProgressValue,
  readerSettingsButton,
  readerSettingsButtonLabel,
  readerTip,
  readerToolbarLabel,
} from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';
import { READER_TIP_KEY } from './readerSettings';
import TableOfContents from './TableOfContents';

const LUFFY_HEAD_PNG = '/character/luffy-head.png';
const TIP_DELAY_MS = 900;
const TIP_SHOW_MS = 6000;

/**
 * A reading-toolbar tool. Later parts (listen, highlights, notes) add entries here.
 * `phone: 'menu'` moves it into the "⋯" menu below the sm breakpoint.
 */
export type ReaderTool = {
  key: string;
  label: string;
  icon: ReactNode;
  pressed?: boolean;
  onSelect: () => void;
  phone?: 'menu' | 'inline';
};

/**
 * A disclosure: a button that shows a panel below it. Esc (focus back on the button), a
 * pick or a click outside closes it. Used for Contents (narrow screens) and "⋯".
 */
function Dropdown({
  button,
  buttonLabel,
  className = '',
  align,
  children,
}: {
  button: ReactNode;
  /** Accessible name when the button shows only an icon. */
  buttonLabel?: string;
  className?: string;
  align: 'left' | 'right';
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };
  return (
    <div ref={wrapRef} onKeyDown={onKeyDown} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={buttonLabel}
        onClick={() => setOpen(!open)}
        className={iconButton}
      >
        {button}
      </button>
      {open && (
        <div
          id={panelId}
          className={`absolute top-full mt-2 rounded-xl border-2 border-ink bg-surface p-1.5 shadow-sticker ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** The "Aa" tooltip: once ever (localStorage), on the first post a visitor opens. */
function useFirstTimeTip(): [boolean, () => void] {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let seen = true;
    try {
      seen = window.localStorage.getItem(READER_TIP_KEY) === '1';
    } catch {
      // Storage blocked: never show it (it couldn't be remembered).
    }
    if (seen) return;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const show = setTimeout(() => {
      try {
        window.localStorage.setItem(READER_TIP_KEY, '1');
      } catch {
        // Ignore.
      }
      setShown(true);
      hide = setTimeout(() => setShown(false), TIP_SHOW_MS);
    }, TIP_DELAY_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);
  useEffect(() => {
    if (!shown) return;
    const dismiss = () => setShown(false);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, [shown]);
  return [shown, () => setShown(false)];
}

const iconButton =
  'inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm text-ink hover:bg-ink/10 aria-pressed:bg-sun aria-pressed:text-on-sun';

export default function ReadingToolbar({
  percent,
  minutes,
  headings,
  activeId,
  focus,
  onToggleFocus,
  onOpenSettings,
}: {
  /** 0–100, of the article body. */
  percent: number;
  /** The post's whole reading time. */
  minutes: number;
  headings: PostHeading[];
  activeId: string | null;
  focus: boolean;
  onToggleFocus: () => void;
  onOpenSettings: () => void;
}) {
  const [tip, dismissTip] = useFirstTimeTip();

  const done = percent >= 90;
  const left = Math.max(1, Math.ceil(minutes * (1 - percent / 100)));
  const leftText = done ? readerDone : fill(readerMinutesLeft, { n: String(left) });

  const tools: ReaderTool[] = [
    {
      key: 'focus',
      label: readerFocusLabel,
      icon: <Eye size={17} aria-hidden="true" />,
      pressed: focus,
      onSelect: onToggleFocus,
      phone: 'menu',
    },
  ];
  const menuTools = tools.filter((t) => t.phone === 'menu');

  return (
    <div className="reader-toolbar border-b border-ink/10 bg-cream/95 backdrop-blur">
      {/* Progress through the article body, with Luffy riding the end of it. */}
      <div
        role="progressbar"
        aria-label={readerProgressLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={fill(readerProgressValue, {
          n: String(percent),
          total: String(done ? 0 : left),
        })}
        className="reader-progress relative h-[2px] bg-ink/10 sm:h-[3px]"
        style={{ '--reader-progress': percent / 100 } as React.CSSProperties}
      >
        <div className="reader-progress-fill absolute inset-0 bg-red" />
        {/* eslint-disable-next-line @next/next/no-img-element -- 16px decoration */}
        <img
          src={LUFFY_HEAD_PNG}
          alt=""
          width={16}
          height={16}
          className="reader-progress-head pointer-events-none absolute top-1/2 h-4 w-4 rounded-full border border-ink bg-sun object-cover"
        />
      </div>

      <div
        role="toolbar"
        aria-label={readerToolbarLabel}
        className="mx-auto flex h-12 max-w-6xl items-center gap-1 px-3 sm:px-6"
      >
        {headings.length > 0 && (
          <Dropdown
            align="left"
            className="lg:hidden"
            button={
              <>
                {readerContentsLabel}
                <ChevronDown size={15} aria-hidden="true" />
              </>
            }
          >
            {(close) => (
              <div className="max-h-[65vh] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto p-0.5">
                <TableOfContents headings={headings} activeId={activeId} onPick={close} />
              </div>
            )}
          </Dropdown>
        )}

        <p className="ml-1 truncate font-mono text-xs text-ink-muted" aria-hidden="true">
          {leftText}
        </p>

        <div className="ml-auto flex items-center gap-1">
          {focus && (
            <button type="button" onClick={onToggleFocus} className={`${iconButton} sm:hidden border border-ink`}>
              <EyeOff size={16} aria-hidden="true" />
              {readerExitFocusLabel}
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                dismissTip();
                onOpenSettings();
              }}
              aria-label={readerSettingsButtonLabel}
              aria-haspopup="dialog"
              className={`${iconButton} font-display text-base font-bold`}
            >
              {readerSettingsButton}
            </button>
            {/* Always rendered (empty when hidden), so screen readers announce the tip.
                Any click or key press dismisses it. */}
            <div role="status" className="absolute right-0 top-full z-10 mt-3">
              {tip && (
                <p className="reader-tip w-56 rounded-xl border-2 border-ink bg-sun p-3 text-sm text-on-sun shadow-sticker">
                  {readerTip}
                </p>
              )}
            </div>
          </div>

          {tools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={tool.onSelect}
              aria-pressed={tool.pressed}
              className={`${iconButton} ${tool.phone === 'menu' ? 'hidden sm:inline-flex' : ''}`}
            >
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          ))}

          {menuTools.length > 0 && (
            <Dropdown
              align="right"
              className="sm:hidden"
              buttonLabel={readerMoreLabel}
              button={<MoreHorizontal size={18} aria-hidden="true" />}
            >
              {(close) => (
                <ul className="w-48">
                  {menuTools.map((tool) => (
                    <li key={tool.key}>
                      <button
                        type="button"
                        aria-pressed={tool.pressed}
                        onClick={() => {
                          close();
                          tool.onSelect();
                        }}
                        className={`${iconButton} w-full justify-start`}
                      >
                        {tool.icon}
                        {tool.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
}
