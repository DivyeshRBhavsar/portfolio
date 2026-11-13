'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { CurrentRepo } from '@/lib/github';
import { storyPath, type StorySummary } from '@/lib/storyTypes';
import { currentlyWorkingLabel, updatedLabels } from './luffyLines';
import { fill } from './speech';

const MINUTE = 60_000;
const DAY = 86_400_000;

// The current minute: stable between ticks, and null on the server, so the
// "updated X days ago" part is worked out in the browser (and stays right between
// the hourly data refreshes).
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, MINUTE);
  return () => clearInterval(timer);
}
const getMinute = () => Math.floor(Date.now() / MINUTE);
const getServerMinute = () => null;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function updatedText(pushedAt: string, minute: number): string | null {
  const pushed = new Date(pushedAt);
  if (Number.isNaN(pushed.getTime())) return null;
  const days = Math.max(0, Math.round((startOfDay(new Date(minute * MINUTE)) - startOfDay(pushed)) / DAY));
  if (days === 0) return updatedLabels.today;
  if (days === 1) return updatedLabels.yesterday;
  return fill(updatedLabels.days, { days: String(days) });
}

/**
 * "🔨 Currently working on: repo · updated 3 days ago", under Luffy's bubble. With a
 * project story: "…: Story title (repo) · updated …", the title opening the story.
 */
export default function WorkingOnBadge({
  repo,
  story = null,
}: {
  repo: CurrentRepo;
  story?: StorySummary | null;
}) {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  const updated = minute === null ? null : updatedText(repo.pushedAt, minute);

  return (
    <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-sm text-ink-muted">
      <span>{currentlyWorkingLabel}</span>
      {story && (
        <Link
          href={storyPath(story.slug)}
          className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-red-deep"
        >
          {story.title}
        </Link>
      )}
      <a
        href={repo.htmlUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono font-medium text-red-deep underline-offset-4 hover:underline"
      >
        {story ? <span aria-hidden="true">(</span> : null}
        {repo.name}
        {story ? <span aria-hidden="true">)</span> : null}
      </a>
      {updated && (
        <>
          <span aria-hidden="true">·</span>
          <span>{updated}</span>
        </>
      )}
    </p>
  );
}
