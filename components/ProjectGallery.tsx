'use client';

import { useMemo, useState } from 'react';
import { Star, ExternalLink, Github } from 'lucide-react';
import type { Repo } from '@/lib/github';
import type { StorySummary } from '@/lib/storyTypes';
import StoryText from '@/components/projects/StoryText';
import { watchStoryLabel } from '@/components/character/luffyLines';

export default function ProjectGallery({
  repos,
  languages,
  storyByRepoId = {},
  onWatchStory,
}: {
  repos: Repo[];
  languages: string[];
  /** Repos with a project story: their card uses the story's title and hook. */
  storyByRepoId?: Record<number, StorySummary>;
  onWatchStory?: (slug: string) => void;
}) {
  const [active, setActive] = useState<string>('All');

  const filtered = useMemo(() => {
    if (active === 'All') return repos;
    return repos.filter((r) => r.language === active);
  }, [repos, active]);

  const filters = ['All', ...languages];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`pill ${
              active === f
                ? 'bg-sun text-on-sun border-ink'
                : 'bg-surface border-ink-muted text-ink hover:border-ink hover:bg-sun/40'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-muted font-mono text-sm">No projects match this filter yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {filtered.map((repo) => {
            const story = storyByRepoId[repo.id];
            return (
              <div
                key={repo.id}
                className="rounded-xl border-2 border-ink/10 bg-surface p-5 flex flex-col hover:border-ink hover:shadow-sticker transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display font-semibold text-ink">
                    {story ? <StoryText text={story.title} /> : repo.name}
                  </h3>
                  {repo.stars > 0 && (
                    <span className="flex items-center gap-1 text-xs font-mono text-ink shrink-0">
                      <Star size={13} className="fill-sun" /> {repo.stars}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-ink-muted flex-1">
                  {story ? (
                    <StoryText text={story.hook} />
                  ) : (
                    repo.description || 'No description provided yet.'
                  )}
                </p>
                {story && onWatchStory && (
                  <button
                    type="button"
                    onClick={() => onWatchStory(story.slug)}
                    className="mt-4 self-start min-h-11 rounded-full border-2 border-ink bg-red px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-sticker"
                  >
                    {watchStoryLabel}
                  </button>
                )}
                <div className="mt-4 flex items-center justify-between">
                  {repo.language && (
                    <span className="font-mono text-xs text-red-deep">{repo.language}</span>
                  )}
                  <div className="flex gap-3">
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-muted hover:text-red-deep transition-colors"
                      aria-label={`View ${repo.name} on GitHub`}
                    >
                      <Github size={17} />
                    </a>
                    {repo.homepage && (
                      <a
                        href={repo.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-muted hover:text-red-deep transition-colors"
                        aria-label={`Open live demo of ${repo.name}`}
                      >
                        <ExternalLink size={17} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
