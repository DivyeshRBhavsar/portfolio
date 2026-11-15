'use client';

import {
  categoryAllLabel,
  categoryChipsLabel,
  categoryCountLabels,
} from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';
import type { Category } from '@/lib/categories';

/**
 * [All n] then each category with its count, in display order (empty ones hidden).
 * Real buttons with aria-pressed; `selected` null = All. `oneRowOnPhones`: under 640px
 * the chips stay in one row that scrolls sideways (faded edges), instead of wrapping.
 */
export default function CategoryChips({
  categories,
  counts,
  total,
  selected,
  onSelect,
  kind,
  oneRowOnPhones = false,
}: {
  categories: Category[];
  /** Projects (or stories) per category slug. */
  counts: Record<string, number>;
  total: number;
  selected: string | null;
  onSelect: (slug: string | null) => void;
  kind: 'projects' | 'stories';
  oneRowOnPhones?: boolean;
}) {
  const chips = [
    { slug: null, name: categoryAllLabel, count: total },
    ...categories
      .filter((c) => (counts[c.slug] ?? 0) > 0)
      .map((c) => ({ slug: c.slug, name: c.name, count: counts[c.slug] })),
  ];

  return (
    <div
      role="group"
      aria-label={categoryChipsLabel[kind]}
      className={`flex flex-wrap gap-2 ${oneRowOnPhones ? 'chip-row max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:px-2.5 max-sm:py-0.5' : ''}`}
    >
      {chips.map((chip) => {
        const pressed = chip.slug === selected;
        return (
          <button
            key={chip.slug ?? 'all'}
            type="button"
            aria-pressed={pressed}
            onClick={() => onSelect(chip.slug)}
            className={`pill inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap ${
              pressed
                ? 'border-ink bg-sun text-on-sun'
                : 'border-ink-muted bg-surface text-ink hover:border-ink hover:bg-sun/40'
            }`}
          >
            <span>{chip.name}</span>
            <span
              aria-hidden="true"
              className={`rounded-full px-1.5 font-mono text-xs ${
                pressed ? 'bg-on-sun/10' : 'bg-ink/10'
              }`}
            >
              {chip.count}
            </span>
            <span className="sr-only">
              (
              {chip.count === 1
                ? categoryCountLabels[kind].one
                : fill(categoryCountLabels[kind].other, { n: String(chip.count) })}
              )
            </span>
          </button>
        );
      })}
    </div>
  );
}
