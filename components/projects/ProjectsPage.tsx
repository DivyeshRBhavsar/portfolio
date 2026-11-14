import { allCategories, categorizeRepos, type ProjectCategories } from '@/lib/categories';
import { getShowcaseRepos } from '@/lib/github';
import { getStories, storiesByRepoId } from '@/lib/stories';
import ProjectsView from './ProjectsView';

/** Shared by /projects and /projects/<slug> (server: GitHub and stories, cached hourly). */
export default async function ProjectsPage() {
  const repos = await getShowcaseRepos();
  const stories = getStories();
  const [storyByRepoId, repoCategories] = await Promise.all([
    storiesByRepoId(stories, repos),
    categorizeRepos(repos),
  ]);
  // Stories inherit their repo's categories ("Other projects" if the repo isn't found).
  const storyCategories: Record<string, ProjectCategories> = {};
  for (const [repoId, summary] of Object.entries(storyByRepoId)) {
    const cats = repoCategories[Number(repoId)];
    if (cats) storyCategories[summary.slug] = cats;
  }

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
        categories={allCategories()}
        repoCategories={repoCategories}
        storyCategories={storyCategories}
        stories={stories}
        storyByRepoId={storyByRepoId}
      />
    </div>
  );
}
