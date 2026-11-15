'use client';

import { X } from 'lucide-react';
import { contactPlanRemove, contactPlanTitle } from '@/components/character/luffyLines';
import { domId, errorId } from './rules';

/** The Work with me planner's summary (?plan=): read-only, sent with the form, removable. */
export default function PlanBox({ plan, onRemove, error }: { plan: string; onRemove: () => void; error?: string }) {
  return (
    <section
      id={domId('plan')}
      tabIndex={-1}
      aria-labelledby="plan-title"
      aria-describedby={error ? errorId('plan') : undefined}
      className="rounded-xl border-2 border-ink bg-peach p-4 outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 id="plan-title" className="font-display font-semibold text-ink">
          📋 {contactPlanTitle}
        </h3>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-sm font-medium text-red-deep hover:underline"
        >
          <X size={15} aria-hidden="true" />
          {contactPlanRemove}
        </button>
      </div>
      <p className="mt-1 whitespace-pre-line break-words text-sm text-ink">{plan}</p>
      {error && (
        <p id={errorId('plan')} className="mt-2 text-sm font-medium text-red-deep">
          {error}
        </p>
      )}
    </section>
  );
}
