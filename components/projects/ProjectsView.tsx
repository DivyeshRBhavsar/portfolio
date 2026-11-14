'use client';

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { fill } from '@/components/character/speech';
import { storyModeLabel, storyRegionLabel } from '@/components/character/luffyLines';
import ProjectGallery from '@/components/ProjectGallery';
import type { Category, ProjectCategories } from '@/lib/categories';
import type { Repo } from '@/lib/github';
import { storyPath, type Story, type StorySummary } from '@/lib/storyTypes';
import { notifyLocation, useLocationHash, useLocationSearch } from './locationStore';
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
/** Set by the layout's script on a direct link with ?category=: hides the list until React shows that category. */
const CATEGORY_PENDING_ATTR = 'data-projects-category-pending';

/**
 * Reports the router's query string. On client navigation Next renders the new page
 * before the address bar changes, so window.location would still show the old query
 * for a frame; the router's value is right in the same render. (In Suspense so the page
 * stays static: during SSR and hydration this renders nothing and the URL is used.)
 */
function SearchParamsBridge({ onChange }: { onChange: (search: string) => void }) {
  const search = useSearchParams().toString();
  useLayoutEffect(() => {
    onChange(search ? `?${search}` : '');
  }, [search, onChange]);
  return null;
}

/** The ?category= slug if it's a real category, else null (All). */
function categoryFrom(search: string, categories: Category[]): string | null {
  const slug = new URLSearchParams(search).get('category');
  return slug && categories.some((c) => c.slug === slug) ? slug : null;
}

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
 * /projects and /projects/<slug>: the view toggle and the repo list (by expertise
 * category: /projects?category=<slug>), plus story mode's overlay (the picker at
 * /projects#stories, keeping the list's category; a story at /projects/<slug>#n).
 * Everything changes the URL in place (no reload), and what's shown follows the URL.
 */
export default function ProjectsView({
  repos,
  categories,
  repoCategories,
  storyCategories,
  stories,
  storyByRepoId,
}: {
  repos: Repo[];
  /** Every category in display order ("Other projects" last). */
  categories: Category[];
  repoCategories: Record<number, ProjectCategories>;
  /** By story slug (inherited from the story's repo). */
  storyCategories: Record<string, ProjectCategories>;
  /** All stories, sorted by order. */
  stories: Story[];
  storyByRepoId: Record<number, StorySummary>;
}) {
  const pathname = usePathname();
  const hash = useLocationHash();
  const locationSearch = useLocationSearch();
  const [routerSearch, setRouterSearch] = useState<string | null>(null);
  const category = categoryFrom(routerSearch ?? locationSearch, categories);
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
      // The list underneath keeps the picker's category (/projects?category=…#stories).
      const list = path === '/projects' ? `/projects${search}` : '/projects';
      window.history.replaceState(window.history.state, '', list);
      window.history.pushState(null, '', `${path}${search}${h}`);
      depth = 1;
      notifyLocation();
    } else if (path === '/projects' && readSavedProjectsView() === 'story') {
      window.history.pushState(null, '', `/projects${search}${PICKER_HASH}`);
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

  // The category from the URL is known now: show the list.
  useLayoutEffect(() => {
    if (ready) document.documentElement.removeAttribute(CATEGORY_PENDING_ATTR);
  }, [ready]);

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
  // From a category view, the picker opens on that category.
  const openPicker = () => push(`/projects${window.location.search}${PICKER_HASH}`);

  // A category chip in the list: its own history entry (shareable; Back steps back).
  const selectCategory = (slug: string | null) => {
    if (slug === category) return;
    const url = slug ? `/projects?category=${encodeURIComponent(slug)}` : '/projects';
    window.history.pushState(null, '', url);
    notifyLocation();
  };
  const openStory = (next: string) => push(storyPath(next));

  const close = () => {
    saveProjectsView('list');
    setAskOpen(false);
    if (depth > 0) {
      const steps = depth;
      depth = 0;
      window.history.go(-steps);
    } else {
      const { pathname: path, search } = window.location;
      window.history.pushState(null, '', path === '/projects' ? `/projects${search}` : '/projects');
      notifyLocation();
    }
  };

  return (
    <div>
      <Suspense fallback={null}>
        <SearchParamsBridge onChange={setRouterSearch} />
      </Suspense>
      <ViewToggle
        view={open ? 'story' : 'list'}
        onChange={(view) => (view === 'story' ? openPicker() : close())}
      />

      <ProjectGallery
        repos={repos}
        categories={categories}
        repoCategories={repoCategories}
        selected={category}
        onSelect={selectCategory}
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
            // A fresh picker each time it opens, starting on the list's category.
            key={pickerOpen ? `open-${category ?? 'all'}` : 'closed'}
            stories={featured}
            categories={categories}
            storyCategories={storyCategories}
            initialCategory={category}
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
