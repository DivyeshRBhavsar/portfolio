'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  contactPlanTitle,
  contactSummaryEmpty,
  contactSummaryFrom,
  contactSummaryTitle,
  contactSummaryToggle,
} from '@/components/character/luffyLines';
import { findPurpose, summaryLine, type ContactConfig, type ContactValues } from './rules';

const EXCERPT = 180;

/** How the message will look: the summary line, who it's from, and the start of the message. */
function Preview({ config, values }: { config: ContactConfig; values: ContactValues }) {
  const purpose = findPurpose(config, values.purpose);
  if (!purpose) return <p className="text-sm text-ink-muted">{contactSummaryEmpty}</p>;
  const from = [values.name, values.email && `<${values.email}>`].filter(Boolean).join(' ');
  const message = values.message.trim();
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium text-ink">{summaryLine(purpose, values.fields)}</p>
      {from && (
        <p className="text-ink-muted">
          {contactSummaryFrom}: <span className="break-all text-ink">{from}</span>
        </p>
      )}
      {values.plan && <p className="text-ink-muted">📋 {contactPlanTitle}</p>}
      {message && (
        <p className="whitespace-pre-line break-words border-l-2 border-ink/20 pl-3 text-ink">
          {message.length > EXCERPT ? `${message.slice(0, EXCERPT)}…` : message}
        </p>
      )}
    </div>
  );
}

/** The live summary as a side panel (desktop). */
export function SummaryPanel({ config, values }: { config: ContactConfig; values: ContactValues }) {
  return (
    <section aria-labelledby="summary-title" className="rounded-2xl border-2 border-ink bg-surface p-5 shadow-sticker">
      <h2 id="summary-title" className="mb-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
        {contactSummaryTitle}
      </h2>
      <Preview config={config} values={values} />
    </section>
  );
}

/** The live summary, collapsed, just above the Send button (phones). */
export function SummaryToggle({ config, values }: { config: ContactConfig; values: ContactValues }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="rounded-xl border-2 border-ink/20 bg-surface">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between px-4 py-2 text-left text-sm font-medium text-ink"
      >
        {contactSummaryToggle}
        <ChevronDown size={16} aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={id} hidden={!open} className="px-4 pb-4">
        <Preview config={config} values={values} />
      </div>
    </div>
  );
}

/** The summary inline (the chat's review step). */
export function SummaryInline({ config, values }: { config: ContactConfig; values: ContactValues }) {
  return (
    <div className="rounded-xl border-2 border-ink/20 bg-surface p-4">
      <Preview config={config} values={values} />
    </div>
  );
}
