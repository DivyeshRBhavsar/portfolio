'use client';

import { useId, useState } from 'react';
import { Star, ExternalLink, Github } from 'lucide-react';
import type { Category, ProjectCategories } from '@/lib/categories';
import type { Repo } from '@/lib/github';
import type { StorySummary } from '@/lib/storyTypes';
import CategoryChips from '@/components/projects/CategoryChips';
import StoryText from '@/components/projects/StoryText';
import {
  cardCategoriesLabel,
  cardTechLabel,
  categoryLessLabel,
  categoryMoreLabel,
  categorySkillsLabel,
  watchStoryLabel,
} from '@/components/character/luffyLines';

/**
 * The repo list, by expertise: [All] then the category chips (with counts).
 * All: a section per category in display order (name, description, skills), each
 * project only under its main category, its other categories as labels on the card.
 * A category: every project with that category (main or secondary), as one grid.
 * Order within a grid comes from the server (FEATURED_ORDER, then most recent).
 *
 * Phones (< 640px): the chips stay in one sideways-scrolling row, spacing is tighter,
 * and each category shows its name with a "More" button for its description and skills,
 * so the first project is on the first screen. Tablet and desktop are unchanged.
 */
export default function ProjectGallery({
  repos,
  categories,
  repoCategories,
  selected,
  onSelect,
  storyByRepoId = {},
  onWatchStory,
}: {
  repos: Repo[];
  /** Every category in display order ("Other projects" last). */
  categories: Category[];
  repoCategories: Record<number, ProjectCategories>;
  /** The chosen category slug, or null for All. */
  selected: string | null;
  onSelect: (slug: string | null) => void;
  /** Repos with a project story: their card uses the story's title and hook. */
  storyByRepoId?: Record<number, StorySummary>;
  onWatchStory?: (slug: string) => void;
}) {
  const catsOf = (repo: Repo) =>
    repoCategories[repo.id] ?? { categories: ['other'], main: 'other' };
  const counts: Record<string, number> = {};
  repos.forEach((repo) =>
    catsOf(repo).categories.forEach((slug) => (counts[slug] = (counts[slug] ?? 0) + 1))
  );
  const nameOf = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
  const current = categories.find((c) => c.slug === selected) ?? null;

  const card = (repo: Repo, hide: string) => (
    <ProjectCard
      key={repo.id}
      repo={repo}
      story={storyByRepoId[repo.id]}
      labels={catsOf(repo)
        .categories.filter((slug) => slug !== hide)
        .map(nameOf)}
      onWatchStory={onWatchStory}
    />
  );

  return (
    <div className="projects-list">
      <div className="mb-10 max-sm:mb-2.5">
        <CategoryChips
          categories={categories}
          counts={counts}
          total={repos.length}
          selected={current?.slug ?? null}
          onSelect={onSelect}
          kind="projects"
          oneRowOnPhones
        />
      </div>

      {repos.length === 0 ? (
        <p className="text-ink-muted font-mono text-sm">No projects match this filter yet.</p>
      ) : current ? (
        <section aria-labelledby={`category-${current.slug}`}>
          <h2 id={`category-${current.slug}`} className="sr-only">
            {current.name}
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {repos
              .filter((r) => catsOf(r).categories.includes(current.slug))
              .map((r) => card(r, current.slug))}
          </div>
        </section>
      ) : (
        <div className="space-y-16 max-sm:space-y-10">
          {categories.map((category) => {
            const inSection = repos.filter((r) => catsOf(r).main === category.slug);
            if (inSection.length === 0) return null;
            return (
              <section key={category.slug} aria-labelledby={`category-${category.slug}`}>
                <CategoryIntro category={category} />
                <div className="mt-6 grid sm:grid-cols-2 gap-5 max-sm:mt-1">
                  {inSection.map((r) => card(r, category.slug))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * A category's heading, description and skills. On phones only the name shows, with a
 * small "More" button (aria-expanded) for the rest; from 640px up it's all shown as before.
 */
function CategoryIntro({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const hasDetails = !!category.description || category.skills.length > 0;
  return (
    <>
      <div className="max-sm:flex max-sm:items-center max-sm:justify-between max-sm:gap-3">
        <h2 id={`category-${category.slug}`} className="font-display text-2xl font-bold text-ink max-sm:text-xl">
          {category.name}
        </h2>
        {hasDetails && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((o) => !o)}
            className="-my-2 inline-flex min-h-11 shrink-0 items-center rounded-full px-2 font-mono text-xs font-medium text-red-deep underline underline-offset-4 hover:no-underline sm:hidden"
          >
            {open ? categoryLessLabel : categoryMoreLabel}
            <span className="sr-only">: {category.name}</span>
          </button>
        )}
      </div>
      <div id={detailsId} className={open ? '' : 'max-sm:hidden'}>
        <p className="mt-2 max-w-2xl text-ink-muted">{category.description}</p>
        {category.skills.length > 0 && (
          <ul aria-label={categorySkillsLabel} className="mt-4 flex flex-wrap gap-2">
            {category.skills.map((skill) => (
              <li key={skill} className="pill border-ink bg-sun py-1 text-xs text-on-sun">
                {skill}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function ProjectCard({
  repo,
  story,
  labels,
  onWatchStory,
}: {
  repo: Repo;
  story?: StorySummary;
  /** Its other categories. */
  labels: string[];
  onWatchStory?: (slug: string) => void;
}) {
  return (
    <div className="rounded-xl border-2 border-ink/10 bg-surface p-5 flex flex-col hover:border-ink hover:shadow-sticker transition-all">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words font-display font-semibold text-ink">
          {story ? <StoryText text={story.title} /> : repo.name}
        </h3>
        {repo.stars > 0 && (
          <span className="flex items-center gap-1 text-xs font-mono text-ink shrink-0">
            <Star size={13} className="fill-sun" /> {repo.stars}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-ink-muted flex-1 max-sm:text-[15px]">
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
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {repo.language && (
            <span className="rounded-full border border-red-deep/40 px-2 py-0.5 font-mono text-xs text-red-deep">
              <span className="sr-only">{cardTechLabel}: </span>
              {repo.language}
            </span>
          )}
          {labels.length > 0 && <span className="sr-only">{cardCategoriesLabel}:</span>}
          {labels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-ink/20 bg-cream px-2 py-0.5 text-xs text-ink-muted"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 gap-3">
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
}
