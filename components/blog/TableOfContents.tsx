'use client';

import type { PostHeading } from '@/lib/posts';
import { readerContentsLabel } from '@/components/character/luffyLines';

/**
 * The post's h2/h3 headings as plain #id links: the browser scrolls (smoothly, except
 * with reduced motion: html scroll-behavior in globals.css) and updates the URL hash.
 * The current section has aria-current. A nav landmark, labelled "Contents".
 */
export default function TableOfContents({
  headings,
  activeId,
  onPick,
  id,
}: {
  headings: PostHeading[];
  activeId: string | null;
  /** After a link is followed (the dropdown closes itself). */
  onPick?: () => void;
  id?: string;
}) {
  return (
    <nav aria-label={readerContentsLabel} id={id}>
      <ol className="space-y-1 text-sm">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id} className={heading.depth === 3 ? 'pl-4' : ''}>
              <a
                href={`#${heading.id}`}
                onClick={onPick}
                aria-current={active ? 'location' : undefined}
                className={`block rounded-md border-l-2 py-1.5 pl-3 pr-2 leading-snug transition-colors ${
                  active
                    ? 'border-red-deep font-medium text-ink'
                    : 'border-transparent text-ink-muted hover:border-ink/30 hover:text-ink'
                }`}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
