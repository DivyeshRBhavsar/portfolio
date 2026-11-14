'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fill } from '@/components/character/speech';
import { storyModeLabel, storyRegionLabel } from '@/components/character/luffyLines';
import ProjectGallery from '@/components/ProjectGallery';
import type { Repo } from '@/lib/github';
import { storyPath, type Story, type StorySummary } from '@/lib/storyTypes';
import { notifyLocation, useLocationHash } from './locationStore';
import StoryOverlay from './StoryOverlay';
import StoryPicker from './StoryPicker';
import StoryPlayer from './StoryPlayer';
import ViewToggle from './ViewToggle';
import {
  applyViewAttr,
  readSavedProjectsView,
  saveProjectsView,
  useClientReady,
} from './viewStore';

const PICKER_HASH = '#stories';

function slugFrom(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function isOverlayUrl(): boolean {
  const { pathname, hash } = window.location;
  return slugFrom(pathname) !== null || (pathname === '/projects' && hash === PICKER_HASH);
}

/*
 * History: story mode's URLs sit on top of the list's (/projects). `depth` counts the
 * entries above it that we pushed, so closing goes back to the list entry (and the
 * browser's Back button walks back the same way: story → picker → list). On a direct
 * load of a story or the picker, the list is slipped in underneath, so Back closes story
 * mode rather than leaving the site. Module-level: once per page load.
 */
let depth = 0;
let seeded = false;

/**
 * /projects and /projects/<slug>: the view toggle and the repo list, plus story mode's
 * overlay (the picker at /projects#stories, a story at /projects/<slug>#n). Opening and
 * closing change the URL in place (no reload), and what's open follows the URL.
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
  const hash = useLocationHash();
  const ready = useClientReady();
  const slug = slugFrom(pathname);
  const story = slug ? (stories.find((s) => s.slug === slug) ?? null) : null;
  const pickerOpen = !story && pathname === '/projects' && hash === PICKER_HASH;
  const open = story !== null || pickerOpen;

  const overlayRef = useRef<HTMLDivElement>(null);
  const [askOpen, setAskOpen] = useState(false);

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

  // Once per page load: put the list under a story-mode URL, or open the picker if the
  // visitor left story mode on last time.
  useLayoutEffect(() => {
    if (seeded) return;
    seeded = true;
    const { pathname: path, search, hash: h } = window.location;
    if (isOverlayUrl()) {
      window.history.replaceState(window.history.state, '', '/projects');
      window.history.pushState(null, '', `${path}${search}${h}`);
      depth = 1;
      notifyLocation();
    } else if (path === '/projects' && readSavedProjectsView() === 'story') {
      window.history.pushState(null, '', `/projects${PICKER_HASH}`);
      depth = 1;
      notifyLocation();
    }
  }, []);

  // Back / Forward: keep count of where we are above the list.
  useEffect(() => {
    const onPop = () => {
      depth = isOverlayUrl() ? Math.max(depth - 1, 1) : 0;
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // <html data-projects-view>: CSS shows the overlay and locks scrolling. On a full page
  // load the layout's script set it before paint; the hydration render leaves it alone.
  useLayoutEffect(() => {
    if (ready) applyViewAttr(open ? 'story' : 'list');
  }, [ready, open]);

  // Leaving story mode by any route (✕, Esc, Back) remembers the list for next time.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) saveProjectsView('list');
    wasOpen.current = open;
  }, [open]);

  const push = (url: string) => {
    saveProjectsView('story');
    window.history.pushState(null, '', url);
    depth += 1;
    notifyLocation();
  };
  const openPicker = () => push(`/projects${PICKER_HASH}`);
  const openStory = (next: string) => push(storyPath(next));

  const close = () => {
    saveProjectsView('list');
    setAskOpen(false);
    if (depth > 0) {
      const steps = depth;
      depth = 0;
      window.history.go(-steps);
    } else {
      window.history.pushState(null, '', '/projects');
      notifyLocation();
    }
  };

  return (
    <div>
      <ViewToggle
        view={open ? 'story' : 'list'}
        onChange={(view) => (view === 'story' ? openPicker() : close())}
      />

      <ProjectGallery
        repos={repos}
        languages={languages}
        storyByRepoId={storyByRepoId}
        onWatchStory={openStory}
      />

      <StoryOverlay
        open={open}
        ready={ready}
        paused={askOpen}
        label={story ? fill(storyRegionLabel, { title: story.title }) : storyModeLabel}
        overlayRef={overlayRef}
        onClose={close}
      >
        {story ? (
          <StoryPlayer
            key={story.slug}
            story={story}
            nextStory={nextStory}
            overlayRef={overlayRef}
            onOpenStory={openStory}
            onAllStories={openPicker}
            onClose={close}
            onAskOpenChange={setAskOpen}
          />
        ) : (
          <StoryPicker
            stories={featured}
            active={pickerOpen}
            overlayRef={overlayRef}
            onOpen={openStory}
            onClose={close}
          />
        )}
      </StoryOverlay>
    </div>
  );
}
