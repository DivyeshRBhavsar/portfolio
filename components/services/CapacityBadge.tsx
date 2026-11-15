'use client';

import { useId, useState } from 'react';
import { workCapacityLess, workCapacityMore } from '@/components/character/luffyLines';
import type { Capacity } from '@/lib/services';

/**
 * "Currently taking 1 new project": a green dot when available, amber when fully booked
 * (decoration only; the text says it). The detail opens below on "Why?" (a button, so it
 * works on touch and with a keyboard, unlike a hover tooltip).
 */
export default function CapacityBadge({ capacity, className = '' }: { capacity: Capacity; className?: string }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const dot = capacity.available ? '--c-topic-career-learning' : '--c-topic-machine-learning';

  return (
    <div className={className}>
      <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border-2 border-ink bg-surface px-4 py-2 text-sm text-ink shadow-sticker">
        <span className="inline-flex items-center gap-2 font-medium">
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-full border border-ink"
            style={{ backgroundColor: `rgb(var(${dot}))` }}
          />
          {capacity.text}
        </span>
        {capacity.detail && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen((o) => !o)}
            className="min-h-6 font-mono text-xs text-red-deep underline underline-offset-4 hover:no-underline"
          >
            {open ? workCapacityLess : workCapacityMore}
          </button>
        )}
      </div>
      {capacity.detail && (
        <p id={detailId} hidden={!open} className="mt-3 max-w-xl text-sm text-ink-muted">
          {capacity.detail}
        </p>
      )}
    </div>
  );
}
