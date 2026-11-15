import { allCategories, categorizeRepos, type ProjectCategories } from '@/lib/categories';
import { getShowcaseRepos } from '@/lib/github';
import { getStories, storiesByRepoId } from '@/lib/stories';
import { ExternalLink } from 'lucide-react';
import PageHero from '@/components/PageHero';
import {
  projectsHeroCounts,
  projectsHeroGitHub,
  projectsHeroLines,
  projectsHeroSubtitle,
  projectsHeroTitle,
} from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';
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

  // Hero counts: showcase repos, stories, and areas with at least one project or story.
  const areas = new Set(
    [...Object.values(repoCategories), ...Object.values(storyCategories)].flatMap((c) => c.categories)
  );
  const count = (forms: { one: string; other: string }, n: number) =>
    fill(n === 1 ? forms.one : forms.other, { n: String(n) });
  const counts = [
    count(projectsHeroCounts.projects, repos.length),
    count(projectsHeroCounts.stories, stories.length),
    count(projectsHeroCounts.areas, areas.size),
  ].join(' · ');

  return (
    <div>
      <PageHero
        title={projectsHeroTitle}
        subtitle={projectsHeroSubtitle}
        luffy={projectsHeroLines}
        extras={
          <>
            <span className="font-mono">{counts}</span>
            <a
              href="https://github.com/DivyeshRBhavsar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-6 items-center gap-1 font-mono text-ink underline underline-offset-4 hover:no-underline"
            >
              {projectsHeroGitHub}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </>
        }
      />
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 sm:pt-10">
        <ProjectsView
          repos={repos}
          categories={allCategories()}
          repoCategories={repoCategories}
          storyCategories={storyCategories}
          stories={stories}
          storyByRepoId={storyByRepoId}
        />
      </div>
    </div>
  );
}
