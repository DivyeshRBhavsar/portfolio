'use client';

import { useMemo, useState } from 'react';
import { Star, ExternalLink, Github } from 'lucide-react';
import type { Repo } from '@/lib/github';

export default function ProjectGallery({ repos, languages }: { repos: Repo[]; languages: string[] }) {
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
          {filtered.map((repo) => (
            <div
              key={repo.id}
              className="rounded-xl border-2 border-ink/10 bg-surface p-5 flex flex-col hover:border-ink hover:shadow-sticker transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display font-semibold text-ink">{repo.name}</h3>
                {repo.stars > 0 && (
                  <span className="flex items-center gap-1 text-xs font-mono text-ink shrink-0">
                    <Star size={13} className="fill-sun" /> {repo.stars}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-muted flex-1">
                {repo.description || 'No description provided yet.'}
              </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
