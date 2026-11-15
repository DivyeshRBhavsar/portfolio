import Link from 'next/link';
import { homeWatchStoryPrefix } from '@/components/character/luffyLines';
import type { StoryRef } from '@/lib/lifeStoryTypes';

/**
 * A named link to a project story: an optional muted label, then the project's name in
 * the accent colour with a small ▶ after it. Screen readers hear
 * "Watch the story: <name>". Story mode opens on /projects/<slug>.
 */
export function NamedStoryLink({
  href,
  name,
  label,
  className = '',
}: {
  href: string;
  name: string;
  label?: string;
  className?: string;
}) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 text-sm sm:text-base ${className}`}>
      {label && <span className="text-ink-muted">{label}</span>}
      <Link
        href={href}
        aria-label={`${homeWatchStoryPrefix}: ${name}`}
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-red-deep underline-offset-4 hover:underline"
      >
        {name}
        <span aria-hidden="true" className="text-xs">▶</span>
      </Link>
    </p>
  );
}

/** A list of named story links (each shows the story's title). */
export default function StoryLinks({ stories, className = '' }: { stories: StoryRef[]; className?: string }) {
  if (stories.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-x-5 ${className}`}>
      {stories.map((story) => (
        <li key={story.slug}>
          <NamedStoryLink href={story.href} name={story.title} />
        </li>
      ))}
    </ul>
  );
}
