'use client';

import { useEffect, useState } from 'react';

const QUERIES = [
  "SELECT focus FROM career WHERE stage = 'current';\n> 'Applied AI & ML Systems'",
  "SELECT stack FROM toolkit WHERE daily_use = true;\n> 'SQL, Python, Snowflake, CatBoost'",
  "SELECT status FROM search WHERE role LIKE '%Data%';\n> 'Open to opportunities'",
];

export default function TerminalHero() {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');

  useEffect(() => {
    const current = QUERIES[index];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (displayed.length < current.length) {
        timeout = setTimeout(() => {
          setDisplayed(current.slice(0, displayed.length + 1));
        }, 22);
      } else {
        timeout = setTimeout(() => setPhase('pausing'), 1800);
      }
    } else if (phase === 'pausing') {
      timeout = setTimeout(() => setPhase('deleting'), 900);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(current.slice(0, displayed.length - 1));
        }, 10);
      } else {
        setIndex((i) => (i + 1) % QUERIES.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, index]);

  return (
    <div className="rounded-lg border border-navy-700 bg-navy-950/60 shadow-2xl shadow-black/20 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-navy-700 bg-navy-900/60">
        <span className="w-2.5 h-2.5 rounded-full bg-ink-500/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-ink-500/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-ink-500/40" />
        <span className="ml-3 text-xs font-mono text-ink-500">career.sql</span>
      </div>
      <pre className="p-6 font-mono text-sm sm:text-base text-teal-400 whitespace-pre-wrap min-h-[7rem] leading-relaxed">
        {displayed}
        <span className="inline-block w-2 bg-teal-400 animate-caret ml-0.5 align-middle h-4" />
      </pre>
    </div>
  );
}
