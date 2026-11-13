import { getLanguages, getShowcaseRepos } from '@/lib/github';
import { getStories, storiesByRepoId } from '@/lib/stories';
import ProjectsView from './ProjectsView';

/** Shared by /projects and /projects/<slug> (server: GitHub and stories, cached hourly). */
export default async function ProjectsPage() {
  const repos = await getShowcaseRepos();
  const languages = getLanguages(repos);
  const stories = getStories();
  const storyByRepoId = await storiesByRepoId(stories, repos);

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <p className="font-mono text-sm text-red-deep mb-2">/ projects</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-3">Projects</h1>
      <p className="text-ink-muted mb-10 max-w-2xl">
        Pulled live from{' '}
        <a
          href="https://github.com/DivyeshRBhavsar"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-deep underline-offset-4 hover:underline"
        >
          github.com/DivyeshRBhavsar
        </a>
        , refreshed hourly &mdash; this list updates itself as new repos are pushed.
      </p>
      <ProjectsView
        repos={repos}
        languages={languages}
        stories={stories}
        storyByRepoId={storyByRepoId}
      />
    </div>
  );
}
