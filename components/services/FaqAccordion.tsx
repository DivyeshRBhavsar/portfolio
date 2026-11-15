'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * The FAQ: each question is a heading holding a button (aria-expanded, aria-controls)
 * that opens its answer. Real buttons, so Tab moves between them and Enter/Space toggle.
 * Several can be open at once.
 */
export default function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const base = useId();
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="divide-y-2 divide-ink/10 rounded-2xl border-2 border-ink bg-surface">
      {items.map((item, i) => {
        const expanded = open.has(i);
        const buttonId = `${base}-q${i}`;
        const panelId = `${base}-a${i}`;
        return (
          <div key={item.q}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-3 text-left font-display font-semibold text-ink hover:text-red-deep"
              >
                {item.q}
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={`shrink-0 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!expanded} className="px-5 pb-5 text-ink-muted">
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
