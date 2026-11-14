/**
 * Blog topics and levels (the `topic` and `level` frontmatter fields). Each topic's
 * colour is a CSS variable, --c-topic-<slug> in app/globals.css, tuned per site theme
 * and reading theme. Colours are used for dots and stripes only; the topic's name is
 * always written in ink beside them. The slug is also the URL: /blog?topic=<slug>.
 */

export const TOPICS = [
  { slug: 'nlp-llms', name: 'NLP & LLMs' },
  { slug: 'machine-learning', name: 'Machine Learning' },
  { slug: 'data-engineering', name: 'Data Engineering' },
  { slug: 'career-learning', name: 'Career & Learning' },
  { slug: 'web-development', name: 'Web Development' },
  { slug: 'other', name: 'Other' },
] as const;

export type Topic = (typeof TOPICS)[number];
export type TopicSlug = Topic['slug'];
export type TopicName = Topic['name'];

export const LEVELS = ['Beginner', 'Intermediate', 'Deep dive'] as const;
export type Level = (typeof LEVELS)[number];

const OTHER = TOPICS[TOPICS.length - 1];

/** A frontmatter topic (matched ignoring case) → its topic; anything unknown is Other. */
export function topicFor(value: unknown): Topic {
  const name = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return TOPICS.find((t) => t.name.toLowerCase() === name) ?? OTHER;
}

export function levelFor(value: unknown): Level | null {
  const name = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return LEVELS.find((l) => l.toLowerCase() === name) ?? null;
}

/** For inline styles: the topic's colour, e.g. as a dot's background. */
export function topicColor(slug: TopicSlug): string {
  return `rgb(var(--c-topic-${slug}))`;
}

/** "May 3, 2026". Dates are calendar days, so UTC keeps server and browser in step. */
export function formatPostDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
