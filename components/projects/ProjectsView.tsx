'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import ProjectGallery from '@/components/ProjectGallery';
import type { Repo } from '@/lib/github';
import { storyPath, type Story, type StorySummary } from '@/lib/storyTypes';
import StoryPicker from './StoryPicker';
import StoryPlayer from './StoryPlayer';
import ViewToggle from './ViewToggle';
import {
  applyViewAttr,
  saveProjectsView,
  useClientReady,
  useSavedProjectsView,
  type ProjectsViewName,
} from './viewStore';

function slugFrom(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * /projects and /projects/<slug>: the view toggle, then the repo list, story mode's
 * picker, or a story's slides. Opening and closing a story changes the URL in place
 * (no reload); the open story follows the URL, so the browser's Back button closes it.
 */
export default function ProjectsView({
  repos,
  languages,
  stories,
  storyByRepoId,
}: {
  repos: Repo[];
  languages: string[];
  /** All stories, sorted by order. */
  stories: Story[];
  storyByRepoId: Record<number, StorySummary>;
}) {
  const pathname = usePathname();
  const slug = slugFrom(pathname);
  const story = slug ? (stories.find((s) => s.slug === slug) ?? null) : null;
  const saved = useSavedProjectsView();
  const ready = useClientReady();
  const view: ProjectsViewName = story ? 'story' : saved;
  const topRef = useRef<HTMLDivElement>(null);
  /** The visitor opened a story here (rather than arriving on its link). */
  const [openedHere, setOpenedHere] = useState(false);

  const featured = stories.filter((s) => s.featured);
  const others = featured.filter((s) => s.slug !== story?.slug);
  // "Next project": the next featured story after this one, wrapping around.
  const nextStory = story
    ? (others.find(
        (s) => s.order > story.order || (s.order === story.order && s.slug > story.slug)
      ) ??
      others[0] ??
      null)
    : null;

  // <html data-projects-view> (CSS shows one view). Full page load: the layout's script
  // set it before paint, so the hydration render (which can't know the saved view yet)
  // leaves it alone. Client navigation: set here, before the first paint.
  useLayoutEffect(() => {
    if (ready) applyViewAttr(view);
  }, [ready, view]);

  const toTop = () => {
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start' });
  };

  const openStory = (next: string) => {
    setOpenedHere(true);
    window.history.pushState(null, '', storyPath(next));
    toTop();
  };

  const closeStory = (to: ProjectsViewName) => {
    saveProjectsView(to);
    window.history.pushState(null, '', '/projects');
    toTop();
    topRef.current?.focus({ preventScroll: true });
  };

  const changeView = (next: ProjectsViewName) => {
    saveProjectsView(next);
    if (story) window.history.pushState(null, '', '/projects');
  };

  return (
    <div ref={topRef} tabIndex={-1} className="scroll-mt-24 outline-none">
      <ViewToggle view={view} onChange={changeView} />

      {story ? (
        <StoryPlayer
          key={story.slug}
          story={story}
          nextStory={nextStory}
          focusOnOpen={openedHere}
          onOpenStory={openStory}
          onClose={() => closeStory('story')}
          onBackToList={() => closeStory('list')}
        />
      ) : (
        <>
          {/* Both are in the HTML; <html data-projects-view> shows one (no flash). */}
          <div className="projects-list-view">
            <ProjectGallery
              repos={repos}
              languages={languages}
              storyByRepoId={storyByRepoId}
              onWatchStory={openStory}
            />
          </div>
          <div className="projects-story-view">
            <StoryPicker stories={featured} active={view === 'story'} onOpen={openStory} />
          </div>
        </>
      )}
    </div>
  );
}
