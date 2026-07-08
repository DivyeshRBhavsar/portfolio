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
                ? 'bg-teal-500 text-navy-950 border-teal-500'
                : 'border-navy-700 text-ink-300 hover:border-teal-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-500 font-mono text-sm">No projects match this filter yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {filtered.map((repo) => (
            <div
              key={repo.id}
              className="rounded-lg border border-navy-700 bg-navy-800/40 p-5 flex flex-col hover:border-teal-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display font-semibold text-ink-100">{repo.name}</h3>
                {repo.stars > 0 && (
                  <span className="flex items-center gap-1 text-xs font-mono text-amber-400 shrink-0">
                    <Star size={13} /> {repo.stars}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-300 flex-1">
                {repo.description || 'No description provided yet.'}
              </p>
              <div className="mt-4 flex items-center justify-between">
                {repo.language && (
                  <span className="font-mono text-xs text-teal-400">{repo.language}</span>
                )}
                <div className="flex gap-3">
                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-500 hover:text-teal-400 transition-colors"
                    aria-label={`View ${repo.name} on GitHub`}
                  >
                    <Github size={17} />
                  </a>
                  {repo.homepage && (
                    <a
                      href={repo.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-500 hover:text-teal-400 transition-colors"
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
