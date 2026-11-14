'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/components/character/useFocusTrap';
import {
  askPanelCloseLabel,
  readerDefaultLabel,
  readerFontOptions,
  readerResetDone,
  readerResetLabel,
  readerSettingsDone,
  readerSettingsGroups,
  readerSettingsTitle,
  readerSizeOptions,
  readerThemeAutoHint,
  readerThemeOptions,
  readerWidthOptions,
} from '@/components/character/luffyLines';
import { resetReaderSettings, updateReaderSettings, useReaderSettings } from './readerStore';
import {
  READER_DEFAULTS,
  READER_FONTS,
  READER_SIZES,
  READER_THEMES,
  READER_WIDTHS,
  isDefaultReader,
  type ReaderSettings,
} from './readerSettings';

type Option = { value: string; label: string; full?: string; hint?: string };

/** How long "Settings reset" stays, and how long it takes to fade. */
const NOTICE_MS = 1600;
const NOTICE_FADE_MS = 400;

/** Swatches for the reading themes (Auto shows the site's own colours). */
const THEME_SWATCH: Record<ReaderSettings['theme'], string> = {
  auto: 'linear-gradient(135deg, rgb(var(--c-cream)) 50%, rgb(var(--c-peach)) 50%)',
  paper: '#ffffff',
  sepia: '#f6efde',
  night: '#14161e',
};

/**
 * "Aa": a modal dialog (focus trapped, Esc or Done closes) with four radio groups. Each
 * change applies at once, so the reader sees it behind the dialog, and is saved.
 */
export default function ReaderSettingsDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const settings = useReaderSettings();
  useFocusTrap(ref, { onEscape: onClose });
  const atDefaults = isDefaultReader(settings);
  const [notice, setNotice] = useState<'shown' | 'fading' | null>(null);

  // "Settings reset": shown, then faded out, then removed.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(
      () => setNotice(notice === 'shown' ? 'fading' : null),
      notice === 'shown' ? NOTICE_MS : NOTICE_FADE_MS
    );
    return () => clearTimeout(timer);
  }, [notice]);

  // aria-disabled (not disabled), so the button keeps focus after a reset.
  const reset = () => {
    if (atDefaults) return;
    resetReaderSettings();
    setNotice('shown');
  };

  const groups: { key: keyof ReaderSettings; options: Option[] }[] = [
    {
      key: 'size',
      options: READER_SIZES.map((v) => ({
        value: v,
        label: readerSizeOptions[v].short,
        full: readerSizeOptions[v].full,
      })),
    },
    { key: 'width', options: READER_WIDTHS.map((v) => ({ value: v, label: readerWidthOptions[v] })) },
    { key: 'font', options: READER_FONTS.map((v) => ({ value: v, label: readerFontOptions[v] })) },
    {
      key: 'theme',
      options: READER_THEMES.map((v) => ({
        value: v,
        label: readerThemeOptions[v],
        hint: v === 'auto' ? readerThemeAutoHint : undefined,
      })),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border-2 border-ink bg-surface p-5 text-ink shadow-sticker outline-none sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="font-display text-lg font-bold">
            {readerSettingsTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={askPanelCloseLabel}
            className="grid h-11 w-11 place-items-center rounded-full text-ink-muted hover:bg-ink/10 hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 space-y-5">
          {groups.map((group) => (
            <fieldset key={group.key}>
              <legend className="mb-2 font-mono text-xs uppercase tracking-wide text-ink-muted">
                {readerSettingsGroups[group.key]}
              </legend>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const checked = settings[group.key] === option.value;
                  return (
                    <label
                      key={option.value}
                      title={option.hint ?? option.full}
                      className={`reader-option relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-sm transition-colors ${
                        checked
                          ? 'border-ink bg-sun text-on-sun'
                          : 'border-ink/25 text-ink hover:border-ink'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`reader-${group.key}`}
                        value={option.value}
                        checked={checked}
                        onChange={() =>
                          updateReaderSettings({ [group.key]: option.value } as Partial<ReaderSettings>)
                        }
                        className="sr-only"
                      />
                      {group.key === 'theme' && (
                        <span
                          aria-hidden="true"
                          className="h-4 w-4 rounded-full border border-ink/40"
                          style={{ background: THEME_SWATCH[option.value as ReaderSettings['theme']] }}
                        />
                      )}
                      <span
                        aria-hidden={option.full ? 'true' : undefined}
                        className={
                          group.key === 'font'
                            ? `reader-font-sample reader-font-sample-${option.value}`
                            : undefined
                        }
                      >
                        {option.label}
                      </span>
                      {option.full && <span className="sr-only">{option.full}</span>}
                      {option.value === READER_DEFAULTS[group.key] && (
                        <span className="rounded-full border border-current px-1.5 font-mono text-[10px] uppercase leading-4 tracking-wide">
                          {readerDefaultLabel}
                        </span>
                      )}
                      {option.hint && <span className="sr-only">: {option.hint}</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            aria-disabled={atDefaults}
            className={`min-h-11 flex-1 rounded-full border-2 px-4 font-medium transition-colors ${
              atDefaults
                ? 'cursor-not-allowed border-ink/15 text-ink-muted'
                : 'border-ink text-ink hover:bg-ink/10'
            }`}
          >
            {readerResetLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-full border-2 border-ink bg-red px-4 font-medium text-white hover:shadow-sticker"
          >
            {readerSettingsDone}
          </button>
        </div>
        <p
          aria-live="polite"
          className={`mt-3 min-h-5 text-center text-sm font-medium text-ink transition-opacity duration-[400ms] ${
            notice === 'shown' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {notice ? `✓ ${readerResetDone}` : ''}
        </p>
      </div>
    </div>
  );
}
