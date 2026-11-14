import { isValidElement, type ComponentProps, type ReactNode } from 'react';
import { slugCounter, slugify } from '@/lib/slug';

/** The visible text of a heading's children (strings inside inline code, links, emphasis…). */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/**
 * h2 and h3 for MDXRemote, with ids from their text: the same slugify() and numbering
 * as the table of contents (lib/posts.ts), so every Contents link lands on its heading.
 * Make a fresh set per post (the numbering of repeated headings is per post).
 */
export function headingComponents() {
  const nextId = slugCounter();
  return {
    h2: ({ children, ...props }: ComponentProps<'h2'>) => (
      <h2 {...props} id={nextId(slugify(textOf(children)))}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: ComponentProps<'h3'>) => (
      <h3 {...props} id={nextId(slugify(textOf(children)))}>
        {children}
      </h3>
    ),
  };
}
