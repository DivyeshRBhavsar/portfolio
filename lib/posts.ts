import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { levelFor, topicFor, type Level, type TopicSlug } from './blogTopics';
import { markdownHeadingText, slugCounter, slugify } from './slug';

const POSTS_DIR = path.join(process.cwd(), 'content', 'blog');

/** Reading speed for "N min read". Code blocks aren't counted. */
const WORDS_PER_MINUTE = 220;

/**
 * Frontmatter fields: title, date (YYYY-MM-DD), summary, topic (one of lib/blogTopics,
 * else Other), level (Beginner, Intermediate, Deep dive), series ({ name, part },
 * optional) and tags (optional list). Reading time is worked out from the text.
 */
export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  topic: TopicSlug;
  level: Level | null;
  series: { name: string; part: number } | null;
  tags: string[];
  /** Whole minutes, at least 1. */
  readingMinutes: number;
};

/** An h2 or h3 in the post, for the table of contents. */
export type PostHeading = { id: string; text: string; depth: 2 | 3 };

/** Lines inside ``` or ~~~ fences are code. */
function withoutCode(content: string): string[] {
  const lines: string[] = [];
  let fence: string | null = null;
  for (const line of content.split(/\r?\n/)) {
    const marker = line.trim().match(/^(```|~~~)/)?.[1];
    if (marker && (fence === null || fence === marker)) {
      fence = fence === null ? marker : null;
      continue;
    }
    if (fence === null) lines.push(line);
  }
  return lines;
}

function readingMinutes(lines: string[]): number {
  const text = lines
    .join(' ')
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/<[^>]+>/g, ' ') // JSX/HTML tags
    .replace(/\]\([^)]*\)/g, ' ') // link targets
    .replace(/[#>*_|~\-[\]()]/g, ' ');
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

function headingsOf(lines: string[]): PostHeading[] {
  const nextId = slugCounter();
  const headings: PostHeading[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+\S/);
    if (!match) continue;
    const text = markdownHeadingText(line);
    headings.push({ id: nextId(slugify(text)), text, depth: match[1].length as 2 | 3 });
  }
  return headings;
}

function seriesOf(value: unknown): PostMeta['series'] {
  const s = value as { name?: unknown; part?: unknown } | null;
  if (!s || typeof s !== 'object' || typeof s.name !== 'string' || !s.name.trim()) return null;
  const part = Number(s.part);
  return { name: s.name.trim(), part: Number.isInteger(part) && part > 0 ? part : 1 };
}

function parse(slug: string, raw: string) {
  const { data, content } = matter(raw);
  const lines = withoutCode(content);
  const meta: PostMeta = {
    slug,
    title: typeof data.title === 'string' ? data.title : 'Untitled',
    date: typeof data.date === 'string' ? data.date : '',
    summary: typeof data.summary === 'string' ? data.summary : '',
    topic: topicFor(data.topic).slug,
    level: levelFor(data.level),
    series: seriesOf(data.series),
    tags: Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === 'string') : [],
    readingMinutes: readingMinutes(lines),
  };
  return { meta, content, headings: headingsOf(lines) };
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));

  const posts = files.map((filename) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
    return parse(filename.replace(/\.mdx$/, ''), raw).meta;
  });

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string) {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return parse(slug, fs.readFileSync(filePath, 'utf-8'));
}

