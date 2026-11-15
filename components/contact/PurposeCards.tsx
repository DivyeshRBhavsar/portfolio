'use client';

import { useRef } from 'react';
import { domId, errorId, type Purpose } from './rules';

export type PickHow = 'pointer' | 'key' | 'arrow';

/**
 * The purposes as large cards with radio semantics: one tab stop (the chosen card, or the
 * first), arrow keys move and select, Space/Enter select, a click selects. `how` lets the
 * chat move on for a click or Enter, but not while the visitor arrows through the cards.
 */
export default function PurposeCards({
  purposes,
  value,
  onPick,
  labelledBy,
  error,
}: {
  purposes: Purpose[];
  value: string;
  onPick: (id: string, how: PickHow) => void;
  labelledBy: string;
  error?: string;
}) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const current = purposes.findIndex((p) => p.id === value);

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (delta) {
      e.preventDefault();
      const next = (i + delta + purposes.length) % purposes.length;
      refs.current[next]?.focus();
      onPick(purposes[next].id, 'arrow');
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onPick(purposes[i].id, 'key');
    }
  };

  return (
    <div>
      <div
        id={domId('purpose')}
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-describedby={error ? errorId('purpose') : undefined}
        aria-invalid={!!error || undefined}
        className="grid gap-3 sm:grid-cols-2"
      >
        {purposes.map((p, i) => {
          const checked = p.id === value;
          return (
            <div
              key={p.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="radio"
              aria-checked={checked}
              tabIndex={checked || (current === -1 && i === 0) ? 0 : -1}
              onClick={() => onPick(p.id, 'pointer')}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all hover:-translate-y-0.5 hover:shadow-sticker motion-reduce:hover:translate-y-0 ${
                checked ? 'border-ink bg-sun text-on-sun shadow-sticker' : 'border-ink/30 bg-surface text-ink hover:border-ink'
              }`}
            >
              <span aria-hidden="true" className="text-2xl leading-7">
                {p.emoji}
              </span>
              <span>
                <span className="block font-display font-semibold">{p.label}</span>
                <span className={`mt-0.5 block text-sm ${checked ? 'text-on-sun' : 'text-ink-muted'}`}>{p.description}</span>
              </span>
            </div>
          );
        })}
      </div>
      {error && (
        <p id={errorId('purpose')} className="mt-2 text-sm font-medium text-red-deep">
          {error}
        </p>
      )}
    </div>
  );
}
