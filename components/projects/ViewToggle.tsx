'use client';

import { projectsViewLabels } from '@/components/character/luffyLines';
import type { ProjectsViewName } from './viewStore';

const VIEWS: ProjectsViewName[] = ['list', 'story'];

/**
 * [📋 List view] [🎬 Story mode with Luffy]. The highlighted button follows
 * <html data-projects-view> (app/globals.css), so it's right from the first paint.
 */
export default function ViewToggle({
  view,
  onChange,
}: {
  view: ProjectsViewName;
  onChange: (view: ProjectsViewName) => void;
}) {
  return (
    <div
      role="group"
      aria-label={projectsViewLabels.group}
      className="mb-10 inline-flex flex-wrap gap-1 rounded-3xl border-2 border-ink bg-surface p-1"
    >
      {VIEWS.map((v) => (
        <button
          key={v}
          type="button"
          data-view={v}
          aria-pressed={view === v}
          onClick={() => onChange(v)}
          className="projects-view-btn min-h-11 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        >
          {projectsViewLabels[v]}
        </button>
      ))}
    </div>
  );
}
