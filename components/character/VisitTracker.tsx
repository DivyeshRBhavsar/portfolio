'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { blogPostFallbackName, blogPostName, pageNames } from './luffyLines';
import { fill } from './speech';
import { beginSession, recordPage, type VisitedPage } from './visitorMemory';

/** Wait for the new page's content (client navigation commits it after this runs). */
const TITLE_READ_DELAY_MS = 300;

function pageFor(path: string): VisitedPage | null {
  // Project stories: the player marks its title with data-visit-label.
  if (path.startsWith('/projects/')) {
    const title = document.querySelector('[data-visit-label]')?.getAttribute('data-visit-label');
    return title ? { path, label: title, kind: 'story' } : null;
  }
  const label = labelFor(path);
  return label ? { path, label } : null;
}

function labelFor(path: string): string | null {
  if (pageNames[path]) return pageNames[path];
  if (path.startsWith('/blog/')) {
    // The reading room marks the post's title with data-visit-label.
    const title =
      document.querySelector('[data-visit-label]')?.getAttribute('data-visit-label')?.trim() ||
      document.querySelector('main h1')?.textContent?.trim();
    return title ? fill(blogPostName, { title }) : blogPostFallbackName;
  }
  return null; // home, 404s, anything else: not worth "continuing"
}

/** Mounted once in the root layout: starts the visit and remembers the last 3 pages. */
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    beginSession();
    if (pathname === '/') return;
    // Wait for the new page's content (client navigation commits it after this runs).
    const timer = setTimeout(() => {
      const page = pageFor(pathname);
      if (page) recordPage(page);
    }, TITLE_READ_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
