'use client';

import { useState } from 'react';
import TerminalHero from '@/components/TerminalHero';
import { formatRange, type Job, type JobKind } from '@/lib/lifeStoryTypes';
import {
  homeDidLabel,
  homeExperienceViewLabel,
  homeExperienceViews,
  homeKindLabels,
  homeLearnedLabel,
} from '@/components/character/luffyLines';
import StoryLinks from './StoryLinks';
import type { Tables } from './sqlEngine';

/** Kind colours: the existing topic colours (dots and stripes only; the label is text). */
export const KIND_COLOR: Record<JobKind, string> = {
  data: 'rgb(var(--c-topic-data-engineering))',
  software: 'rgb(var(--c-topic-web-development))',
};

export function KindTag({ kind }: { kind: JobKind }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-2 py-0.5 text-xs font-medium text-ink">
      <span aria-hidden="true" className="h-2 w-2 rounded-full ring-1 ring-ink/30" style={{ backgroundColor: KIND_COLOR[kind] }} />
      {homeKindLabels[kind]}
    </span>
  );
}

/**
 * Chapter 2: [Timeline] [Query my experience]. The timeline is an ordered list of job
 * cards, newest first; the query view is the SQL terminal over the same data.
 */
export default function ExperienceChapter({ jobs, tables }: { jobs: Job[]; tables: Tables }) {
  const [view, setView] = useState<'timeline' | 'query'>('timeline');

  return (
    <div>
      <div role="group" aria-label={homeExperienceViewLabel} className="mb-8 inline-flex rounded-full border-2 border-ink bg-surface p-1">
        {(['timeline', 'query'] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`min-h-10 rounded-full px-4 text-sm font-medium transition-colors ${
              view === v ? 'bg-ink text-cream' : 'text-ink hover:bg-ink/10'
            }`}
          >
            {homeExperienceViews[v]}
          </button>
        ))}
      </div>

      {view === 'timeline' ? (
        <ol className="space-y-5">
          {jobs.map((job) => {
            const dates = formatRange(job.start, job.end);
            return (
              <li
                key={`${job.role}-${job.company}`}
                className="relative overflow-hidden rounded-xl border-2 border-ink/10 bg-surface p-5 pl-6"
              >
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: KIND_COLOR[job.kind] }} />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <KindTag kind={job.kind} />
                  {dates && <span className="font-mono text-xs text-ink-muted">{dates}</span>}
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink">{job.role}</h3>
                <p className="text-ink">
                  {job.company}
                  {job.place && <span className="text-ink-muted"> · {job.place}</span>}
                </p>
                {(job.did || job.learned) && (
                  <dl className="mt-3 space-y-2 text-sm">
                    {job.did && (
                      <div>
                        <dt className="font-medium text-ink">{homeDidLabel}</dt>
                        <dd className="text-ink-muted">{job.did}</dd>
                      </div>
                    )}
                    {job.learned && (
                      <div>
                        <dt className="font-medium text-ink">{homeLearnedLabel}</dt>
                        <dd className="text-ink-muted">{job.learned}</dd>
                      </div>
                    )}
                  </dl>
                )}
                <StoryLinks stories={job.stories} className="mt-4" />
              </li>
            );
          })}
        </ol>
      ) : (
        <TerminalHero tables={tables} />
      )}
    </div>
  );
}
