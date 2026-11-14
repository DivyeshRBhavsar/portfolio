'use client';

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { PostHeading } from '@/lib/posts';
import {
  continueReadingPrompts,
  continueResumeLabel,
  continueStartOverLabel,
} from '@/components/character/luffyLines';
import { fill, nameComma, pick } from '@/components/character/speech';
import {
  clearPostProgress,
  readPostProgress,
  readVisitor,
  savePostProgress,
} from '@/components/character/visitorMemory';
import ReaderSettingsDialog from './ReaderSettingsDialog';
import ReadingToolbar from './ReadingToolbar';
import TableOfContents from './TableOfContents';
import { isUnfinished, readReaderSettings } from './readerStore';
import { READER_ATTRS, READER_FOCUS_ATTR, applyReaderSettings } from './readerSettings';

const SAVE_EVERY_MS = 1000;
const OFFER_DELAY_MS = 500;
/** Readers above this line (below the toolbar) count as "reading" that block. */
const READING_LINE_GAP = 24;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The article's reading blocks: its top-level elements, with lists split into items. */
function blocksOf(body: HTMLElement): HTMLElement[] {
  return Array.from(body.children).flatMap((el) =>
    el.tagName === 'UL' || el.tagName === 'OL'
      ? (Array.from(el.children) as HTMLElement[])
      : [el as HTMLElement]
  );
}

/**
 * A blog post's reading area: the reader settings (on <html>, see readerSettings.ts),
 * the sticky toolbar with progress, the Contents sidebar, focus mode (F, Esc), and
 * "Continue where you left off?". The article itself is server-rendered children,
 * whose body is the element with class "reader-body".
 */
export default function ReadingRoom({
  slug,
  minutes,
  headings,
  fontClassName,
  children,
}: {
  slug: string;
  minutes: number;
  headings: PostHeading[];
  /** next/font variables for the serif and dyslexia-friendly fonts. */
  fontClassName: string;
  children: ReactNode;
}) {
  const roomRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [offer, setOffer] = useState<{ paragraph: number; line: string } | null>(null);
  /** While the offer is up: don't overwrite the saved place with a smaller one. */
  const holdRef = useRef<number | null>(null);

  // Settings on <html> before paint (the pre-paint script only runs on full loads), and
  // the header's height for the sticky toolbar. Undone when leaving the post.
  useLayoutEffect(() => {
    const root = document.documentElement;
    applyReaderSettings(readReaderSettings());
    const header = document.querySelector<HTMLElement>('.site-header');
    const observer = new ResizeObserver(() => {
      if (header) root.style.setProperty('--header-h', `${header.offsetHeight}px`);
    });
    if (header) observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--header-h');
      READER_ATTRS.forEach((attr) => root.removeAttribute(attr));
      root.removeAttribute(READER_FOCUS_ATTR);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (focus) root.setAttribute(READER_FOCUS_ATTR, '');
    else root.removeAttribute(READER_FOCUS_ATTR);
  }, [focus]);

  // The visitor's saved place in this post, read once when the post opens.
  useEffect(() => {
    const saved = readPostProgress()[slug];
    if (!isUnfinished(saved)) return;
    holdRef.current = saved.progress;
    const timer = setTimeout(() => {
      const line = fill(pick(continueReadingPrompts), { nameComma: nameComma(readVisitor()?.name) });
      setOffer({ paragraph: saved.paragraph, line });
    }, OFFER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [slug]);

  /** Progress, the block being read, the current section, focus mode's middle block. */
  const measure = useEffectEvent(() => {
    const room = roomRef.current;
    const body = room?.querySelector<HTMLElement>('.reader-body');
    if (!room || !body) return null;
    const toolbarBottom =
      room.querySelector('.reader-toolbar')?.getBoundingClientRect().bottom ?? 0;
    const rect = body.getBoundingClientRect();
    const start = rect.top + window.scrollY - toolbarBottom;
    const end = rect.bottom + window.scrollY - window.innerHeight;
    const progress =
      end <= start
        ? window.scrollY >= end
          ? 1
          : 0
        : Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));

    const blocks = blocksOf(body);
    const line = toolbarBottom + READING_LINE_GAP;
    const reading = Math.max(
      0,
      blocks.findIndex((b) => b.getBoundingClientRect().bottom > line)
    );

    let current: string | null = null;
    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el && el.getBoundingClientRect().top <= line + window.innerHeight * 0.2) current = heading.id;
    }

    let middle: HTMLElement | null = null;
    if (document.documentElement.hasAttribute(READER_FOCUS_ATTR)) {
      const mid = window.innerHeight / 2;
      let best = Infinity;
      for (const block of blocks) {
        const r = block.getBoundingClientRect();
        const distance = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (distance < best) {
          best = distance;
          middle = block;
        }
      }
    }
    blocks.forEach((b) => {
      if (b === middle) b.setAttribute('data-reader-current', '');
      else b.removeAttribute('data-reader-current');
    });

    return { progress, reading, current };
  });

  const lastSave = useRef(0);
  const save = useEffectEvent((progress: number, reading: number) => {
    const held = holdRef.current;
    if (held !== null && progress < held) return;
    const stored = readPostProgress()[slug];
    if (progress < 0.02 && !stored) return; // only opened, not read
    savePostProgress(slug, progress, reading);
    lastSave.current = Date.now();
  });

  const update = useEffectEvent((force: boolean) => {
    const m = measure();
    if (!m) return;
    setPercent(Math.round(m.progress * 100));
    setActiveId(m.current);
    // Scrolled past the saved place on their own: the offer has done its job.
    if (holdRef.current !== null && m.progress >= holdRef.current) {
      holdRef.current = null;
      setOffer(null);
    }
    if (force || Date.now() - lastSave.current >= SAVE_EVERY_MS) save(m.progress, m.reading);
  });

  useEffect(() => {
    let frame = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const flush = () => update(true);
    const onScroll = () => {
      // Once scrolling stops, save where it stopped (saves while scrolling are throttled).
      clearTimeout(settle);
      settle = setTimeout(flush, SAVE_EVERY_MS);
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update(false);
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    frame = requestAnimationFrame(() => {
      frame = 0;
      update(false);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      flush(); // client-side navigation away
    };
  }, []);

  // Focus mode changes which block is lit.
  useEffect(() => {
    const frame = requestAnimationFrame(() => update(false));
    return () => cancelAnimationFrame(frame);
  }, [focus]);

  // F toggles focus mode (not while typing or with a modifier); Esc leaves it.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (settingsOpen || event.defaultPrevented) return;
    const target = event.target as HTMLElement | null;
    const typing =
      !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if (event.key === 'Escape' && focus) {
      setFocus(false);
      return;
    }
    if (
      (event.key === 'f' || event.key === 'F') &&
      !typing &&
      !event.repeat &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      setFocus((on) => !on);
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);

  const resume = () => {
    const body = roomRef.current?.querySelector<HTMLElement>('.reader-body');
    const target = offer && body ? blocksOf(body)[offer.paragraph] : null;
    holdRef.current = null;
    setOffer(null);
    if (!target) return;
    const toolbarBottom =
      roomRef.current?.querySelector('.reader-toolbar')?.getBoundingClientRect().bottom ?? 0;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - toolbarBottom - READING_LINE_GAP,
      behavior: reducedMotion() ? 'auto' : 'smooth',
    });
  };

  const startOver = () => {
    holdRef.current = null;
    setOffer(null);
    clearPostProgress(slug);
  };

  return (
    <div ref={roomRef} className={`reading-room ${fontClassName}`}>
      <ReadingToolbar
        percent={percent}
        minutes={minutes}
        headings={headings}
        activeId={activeId}
        focus={focus}
        onToggleFocus={() => setFocus((on) => !on)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Polite, and out of the way: floats at the bottom, never moves the page or
          covers the title. */}
      <div role="status" className="reader-continue pointer-events-none fixed inset-x-0 bottom-4 z-40 px-3">
        {offer && (
          <div className="pointer-events-auto mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 border-ink bg-surface px-4 py-2 text-sm text-ink shadow-sticker">
            <span>{offer.line}</span>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={resume}
                className="min-h-10 rounded-full border-2 border-ink bg-red px-4 font-medium text-white"
              >
                {continueResumeLabel}
              </button>
              <button
                type="button"
                onClick={startOver}
                className="min-h-10 rounded-full border-2 border-ink/40 px-4 text-ink hover:border-ink"
              >
                {continueStartOverLabel}
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        {headings.length > 0 && (
          <aside className="reader-sidebar hidden w-56 shrink-0 lg:block">
            <div className="reader-sidebar-inner">
              <TableOfContents headings={headings} activeId={activeId} />
            </div>
          </aside>
        )}
        <div className="min-w-0 flex-1">
          <div className="reader-column mx-auto">{children}</div>
        </div>
      </div>

      {settingsOpen && <ReaderSettingsDialog onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
