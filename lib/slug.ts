/**
 * Heading ids for blog posts. The table of contents (from the Markdown source, in
 * lib/posts.ts) and the rendered headings (components/blog/mdxHeadings.tsx) both run
 * the heading's text through slugify(), and number repeats the same way (-2, -3…), so
 * every Contents link finds its heading. Plain module: used on the server only.
 */

export function slugify(text: string): string {
  return (
    text
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '') // accents
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

/** Gives repeated slugs a number, in document order: intro, intro-2, intro-3. */
export function slugCounter(): (base: string) => string {
  const seen = new Map<string, number>();
  return (base) => {
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

/** A Markdown heading line's visible text: "## Using `fit()` [here](/x)" → "Using fit() here". */
export function markdownHeadingText(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/\s+#+\s*$/, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*]/g, '')
    .trim();
}
