'use client';

import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { TOPICS, topicColor, type TopicSlug } from '@/lib/blogTopics';
import type { PostMeta } from '@/lib/posts';
import LuffyHead from '@/components/character/LuffyHead';
import {
  blogAllPostsHeading,
  blogClearFiltersLabel,
  blogEmptyLines,
  blogPickLabel,
  blogPickLines,
  blogResultsLabel,
  blogSearchLabel,
  blogSearchPlaceholder,
  blogShelfHeading,
  blogShelfProgress,
} from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';
import PostCard from './PostCard';
import PostMetaLine from './PostMetaLine';
import TopicChips from './TopicChips';
import { BLOG_FILTER_PENDING_ATTR } from './readerSettings';
import { isUnfinished, useHydrated, useReadingProgress } from './readerStore';

const SEARCH_URL_DELAY_MS = 250;
const SHELF_SIZE = 3;

/**
 * Reads the query through Next's router (inside Suspense, so the page stays static):
 * on client-side navigation, window.location updates a frame after the page renders.
 */
function SearchParamsBridge({ onChange }: { onChange: (search: string) => void }) {
  const search = useSearchParams().toString();
  useLayoutEffect(() => {
    onChange(search);
  }, [search, onChange]);
  return null;
}

function urlFor(topic: TopicSlug | null, q: string): string {
  const params = new URLSearchParams();
  if (topic) params.set('topic', topic);
  if (q) params.set('q', q);
  const search = params.toString();
  return search ? `/blog?${search}` : '/blog';
}

function matches(post: PostMeta, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return [post.title, post.summary, ...post.tags].some((text) => text.toLowerCase().includes(needle));
}

/** Today's local calendar day as a number: the same for everyone on the same date. */
function dayNumber(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
}

/** A ring showing how much of a post has been read. Decorative; the text says it too. */
function ProgressRing({ value }: { value: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" className="h-11 w-11 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="4" className="stroke-ink/15" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        className="stroke-red"
      />
    </svg>
  );
}

/**
 * /blog: Continue reading (unfinished posts), Luffy's pick, topic chips and search
 * (?topic= and ?q= in the URL), then the matching posts.
 */
export default function BlogLibrary({ posts }: { posts: PostMeta[] }) {
  const [urlSearch, setUrlSearch] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hydrated = useHydrated();
  const progress = useReadingProgress();

  const params = new URLSearchParams(urlSearch ?? '');
  const counts: Partial<Record<TopicSlug, number>> = {};
  posts.forEach((p) => (counts[p.topic] = (counts[p.topic] ?? 0) + 1));
  const topicParam = params.get('topic');
  const topic =
    TOPICS.find((t) => t.slug === topicParam && (counts[t.slug] ?? 0) > 0)?.slug ?? null;
  const q = draft ?? params.get('q') ?? '';
  const needle = q.trim();
  const filtered = !!topic || !!needle;
  const shown = posts.filter((p) => (!topic || p.topic === topic) && matches(p, needle));

  const onUrl = useCallback((search: string) => {
    setUrlSearch(search);
    // Back/Forward to a different search: show the URL's, not what was being typed.
    const urlQ = new URLSearchParams(search).get('q') ?? '';
    setDraft((d) => (d !== null && d.trim() === urlQ ? d : null));
  }, []);

  // A shared filtered link: the list was hidden before paint until this point.
  useLayoutEffect(() => {
    if (urlSearch !== null) document.documentElement.removeAttribute(BLOG_FILTER_PENDING_ATTR);
  }, [urlSearch]);
  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const selectTopic = (slug: TopicSlug | null) => {
    clearTimeout(typingTimer.current);
    window.history.pushState(null, '', urlFor(slug, needle));
  };

  const type = (value: string) => {
    setDraft(value);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      window.history.replaceState(null, '', urlFor(topic, value.trim()));
    }, SEARCH_URL_DELAY_MS);
  };

  const clearFilters = () => {
    clearTimeout(typingTimer.current);
    setDraft(null);
    window.history.pushState(null, '', '/blog');
  };

  // Client-only (local date, local progress); a same-size placeholder until then.
  const day = dayNumber();
  const unread = posts.filter((p) => !progress[p.slug]?.finished);
  const pickFrom = unread.length > 0 ? unread : posts;
  const pick = hydrated ? pickFrom[day % pickFrom.length] : null;
  const pickLine = blogPickLines[day % blogPickLines.length];
  const shelf = posts
    .filter((p) => isUnfinished(progress[p.slug]))
    .sort((a, b) => progress[b.slug].updatedAt - progress[a.slug].updatedAt)
    .slice(0, SHELF_SIZE);

  const emptyLine = blogEmptyLines[(needle.length + (topic?.length ?? 0)) % blogEmptyLines.length];
  const resultsText =
    shown.length === 1 ? blogResultsLabel.one : fill(blogResultsLabel.other, { n: String(shown.length) });

  return (
    <div>
      <Suspense fallback={null}>
        <SearchParamsBridge onChange={onUrl} />
      </Suspense>

      {!filtered && shelf.length > 0 && (
        <section aria-labelledby="blog-shelf" className="mb-12">
          <h2 id="blog-shelf" className="font-display text-xl font-bold text-ink">
            {blogShelfHeading}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shelf.map((post) => {
              const entry = progress[post.slug];
              const left = Math.max(1, Math.ceil(post.readingMinutes * (1 - entry.progress)));
              return (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex h-full items-center gap-3 rounded-xl border-2 border-ink/10 bg-surface p-4 transition-all hover:border-ink hover:shadow-sticker"
                  >
                    <ProgressRing value={entry.progress} />
                    <span className="min-w-0">
                      <span className="line-clamp-2 font-display font-semibold leading-snug text-ink">
                        {post.title}
                      </span>
                      <span className="mt-1 block font-mono text-xs text-ink-muted">
                        {fill(blogShelfProgress, {
                          n: String(Math.round(entry.progress * 100)),
                          total: String(left),
                        })}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!filtered && (
        <section aria-labelledby="blog-pick" className="mb-12">
          <div className="relative min-h-[12rem] overflow-hidden rounded-2xl border-2 border-ink bg-peach p-5 shadow-sticker sm:p-6">
            <div className="flex items-center gap-3">
              <LuffyHead talking={false} className="h-12 w-12" />
              <div>
                <h2 id="blog-pick" className="font-display text-lg font-bold text-ink">
                  {blogPickLabel}
                </h2>
                {pick && <p className="text-sm text-ink-muted">{pickLine}</p>}
              </div>
            </div>
            {pick && (
              <Link
                href={`/blog/${pick.slug}`}
                className="group mt-4 block rounded-xl border-2 border-ink/10 bg-surface p-4 transition-all hover:border-ink"
              >
                <span
                  aria-hidden="true"
                  className="mb-2 block h-1 w-12 rounded-full"
                  style={{ backgroundColor: topicColor(pick.topic) }}
                />
                <span className="block font-display text-xl font-semibold leading-snug text-ink group-hover:text-red-deep">
                  {pick.title}
                </span>
                <span className="mt-2 block text-sm text-ink-muted">{pick.summary}</span>
                <PostMetaLine post={pick} className="mt-3" />
              </Link>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="blog-all">
        <h2 id="blog-all" className="font-display text-xl font-bold text-ink">
          {blogAllPostsHeading}
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="relative block max-w-md">
            <span className="sr-only">{blogSearchLabel}</span>
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => type(e.target.value)}
              placeholder={blogSearchPlaceholder}
              className="min-h-11 w-full rounded-full border-2 border-ink/25 bg-surface py-2 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <TopicChips counts={counts} total={posts.length} selected={topic} onSelect={selectTopic} />
        </div>

        <p role="status" className="sr-only">
          {filtered ? resultsText : ''}
        </p>

        <div className="blog-library-results mt-8">
          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-ink/25 px-6 py-12 text-center">
              <LuffyHead talking={false} className="h-14 w-14" />
              <p className="max-w-sm text-ink">{emptyLine}</p>
              <button
                type="button"
                onClick={clearFilters}
                className="pill min-h-11 border-ink bg-sun text-on-sun hover:shadow-sticker"
              >
                {blogClearFiltersLabel}
              </button>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {shown.map((post) => (
                <li key={post.slug}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
