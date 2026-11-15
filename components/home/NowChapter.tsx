import Link from 'next/link';
import type { CurrentRepo } from '@/lib/github';
import { formatMonthLong, type NowItem } from '@/lib/lifeStoryTypes';
import { storyPath, type StorySummary } from '@/lib/storyTypes';
import { homeLastUpdated, homeRepoOnGitHub } from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';
import StoryLinks from './StoryLinks';

/**
 * Chapter 4: what Divyesh is doing now, as a list. The "auto:" item shows the GitHub
 * "currently working on" repo (same rules as the home badge); it's left out if GitHub
 * couldn't be reached.
 */
export default function NowChapter({
  items,
  updated,
  currentRepo,
  currentStory,
}: {
  items: NowItem[];
  updated?: string;
  currentRepo: CurrentRepo | null;
  currentStory: StorySummary | null;
}) {
  const shown = items.filter((item) => !item.auto || currentRepo);
  if (shown.length === 0) return null;

  return (
    <div>
      <ol className="space-y-4">
        {shown.map((item) => (
          <li key={item.label} className="flex gap-4 rounded-xl border-2 border-ink/10 bg-surface p-4 sm:p-5">
            <span aria-hidden="true" className="text-2xl leading-none">
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-ink">{item.label}</p>
              {item.auto && currentRepo ? (
                <p className="mt-1 text-ink-muted">
                  {currentStory && (
                    <>
                      <Link
                        href={storyPath(currentStory.slug)}
                        className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-red-deep"
                      >
                        {currentStory.title}
                      </Link>{' '}
                    </>
                  )}
                  <a
                    href={currentRepo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm font-medium text-red-deep underline-offset-4 hover:underline"
                  >
                    {currentRepo.name}
                  </a>{' '}
                  <span className="text-sm">{homeRepoOnGitHub}</span>
                </p>
              ) : (
                <p className="mt-1 text-ink-muted">{item.text}</p>
              )}
              <StoryLinks stories={item.stories} className="mt-3" />
            </div>
          </li>
        ))}
      </ol>
      {updated && (
        <p className="mt-4 font-mono text-xs text-ink-muted">
          {fill(homeLastUpdated, { date: formatMonthLong(updated) })}
        </p>
      )}
    </div>
  );
}
