import fs from 'fs';
import path from 'path';
import { GITHUB_USERNAME, resolveRepoId, sameRepoName, type Repo } from './github';
import type {
  Bar,
  Metric,
  Slide,
  SlideFocus,
  SlideType,
  Step,
  Story,
  StoryLink,
  StorySummary,
} from './storyTypes';

/**
 * Project stories: one JSON file per story in content/project_stories/. Read and checked
 * at build time (server only). Adding a story = adding one file; a mistake in a file
 * fails the build with the file name and the field, e.g.
 *   content/project_stories/candidate-ranking.json: slides[5].bars[2].value must be a number
 */

const STORIES_DIR = path.join(process.cwd(), 'content', 'project_stories');
const SLIDE_TYPES: SlideType[] = ['title', 'bullets', 'steps', 'metrics', 'bars', 'links'];

/**
 * Content limits: more than this and a slide gets crowded on a phone. Over a limit is a
 * build warning (not an error), naming the file and slide.
 */
const LIMITS = { bullets: 4, metrics: 4, bars: 6, steps: 4, bulletLength: 140 };

class StoryFileError extends Error {}

type Obj = Record<string, unknown>;

/** Field readers that throw a clear error naming the file and field. */
function reader(file: string) {
  const fail = (where: string, problem: string): never => {
    throw new StoryFileError(`content/project_stories/${file}: ${where} ${problem}`);
  };
  const obj = (value: unknown, where: string): Obj =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Obj)
      : fail(where, 'must be an object');
  const str = (o: Obj, key: string, where: string): string => {
    const v = o[key];
    return typeof v === 'string' && v.trim() !== ''
      ? v
      : fail(`${where}${key}`, 'must be a non-empty string');
  };
  const optStr = (o: Obj, key: string, where: string): string | undefined =>
    o[key] === undefined ? undefined : str(o, key, where);
  const num = (o: Obj, key: string, where: string): number => {
    const v = o[key];
    return typeof v === 'number' && Number.isFinite(v)
      ? v
      : fail(`${where}${key}`, 'must be a number');
  };
  const optBool = (o: Obj, key: string, where: string): boolean | undefined => {
    const v = o[key];
    if (v === undefined) return undefined;
    return typeof v === 'boolean' ? v : fail(`${where}${key}`, 'must be true or false');
  };
  const list = <T>(
    o: Obj,
    key: string,
    where: string,
    item: (value: unknown, itemWhere: string) => T,
    { optional = false, nonEmpty = true } = {}
  ): T[] | undefined => {
    const v = o[key];
    if (v === undefined && optional) return undefined;
    if (!Array.isArray(v)) return fail(`${where}${key}`, 'must be a list');
    if (nonEmpty && v.length === 0) return fail(`${where}${key}`, 'must not be empty');
    return v.map((entry, i) => item(entry, `${where}${key}[${i}]`));
  };
  const text = (value: unknown, where: string): string =>
    typeof value === 'string' && value.trim() !== ''
      ? value
      : fail(where, 'must be a non-empty string');
  return { fail, obj, str, optStr, num, optBool, list, text };
}

function parseStory(file: string, raw: unknown): Story {
  const r = reader(file);
  const story = r.obj(raw, '(top level)');

  const link = (value: unknown, where: string): StoryLink => {
    const o = r.obj(value, where);
    return { label: r.str(o, 'label', `${where}.`), url: r.str(o, 'url', `${where}.`) };
  };
  const metric = (value: unknown, where: string): Metric => {
    const o = r.obj(value, where);
    const v = o.value;
    const metricValue =
      typeof v === 'number' ? String(v) : typeof v === 'string' && v.trim() !== '' ? v : null;
    return {
      label: r.str(o, 'label', `${where}.`),
      value: metricValue ?? r.fail(`${where}.value`, 'must be a string or a number'),
    };
  };
  const bar = (value: unknown, where: string): Bar => {
    const o = r.obj(value, where);
    return {
      label: r.str(o, 'label', `${where}.`),
      value: r.num(o, 'value', `${where}.`),
      highlight: r.optBool(o, 'highlight', `${where}.`),
    };
  };
  const step = (value: unknown, where: string): Step => {
    const o = r.obj(value, where);
    return { label: r.str(o, 'label', `${where}.`), detail: r.str(o, 'detail', `${where}.`) };
  };

  const slide = (value: unknown, where: string): Slide => {
    const o = r.obj(value, where);
    const at = `${where}.`;
    const type = o.type as SlideType;
    if (!SLIDE_TYPES.includes(type)) {
      r.fail(`${at}type`, `must be one of: ${SLIDE_TYPES.join(', ')}`);
    }
    const base = {
      title: r.str(o, 'title', at),
      narration: r.str(o, 'narration', at),
      metrics: r.list(o, 'metrics', at, metric, { optional: true }),
      bullets: r.list(o, 'bullets', at, r.text, { optional: true }),
    };
    const parsed = ((): Slide => {
      switch (type) {
        case 'title':
          return { ...base, type, subtitle: r.optStr(o, 'subtitle', at) };
        case 'bullets':
          return { ...base, type, bullets: r.list(o, 'bullets', at, r.text)! };
        case 'steps':
          return { ...base, type, steps: r.list(o, 'steps', at, step)! };
        case 'metrics':
          return { ...base, type, metrics: r.list(o, 'metrics', at, metric)! };
        case 'bars':
          return {
            ...base,
            type,
            unit: r.str(o, 'unit', at),
            bars: r.list(o, 'bars', at, bar)!,
            lowerIsBetter: r.optBool(o, 'lowerIsBetter', at),
          };
        default:
          return { ...base, type: 'links' };
      }
    })();
    const focus = slideFocus(o.focus, parsed, `${at}focus`);
    return focus ? { ...parsed, focus } : parsed;
  };

  /** { "metric": i } or { "bar": i }: a 0-based index into this slide's metrics or bars. */
  const slideFocus = (value: unknown, parsed: Slide, where: string): SlideFocus | undefined => {
    if (value === undefined) return undefined;
    const o = r.obj(value, where);
    const keys = Object.keys(o);
    if (keys.length !== 1 || (keys[0] !== 'metric' && keys[0] !== 'bar')) {
      r.fail(where, 'must be { "metric": index } or { "bar": index }');
    }
    const key = keys[0] as 'metric' | 'bar';
    const index = o[key];
    const count =
      key === 'metric'
        ? (parsed.metrics?.length ?? 0)
        : parsed.type === 'bars'
          ? parsed.bars.length
          : 0;
    if (count === 0) r.fail(`${where}.${key}`, `points at a ${key}, but this slide has no ${key}s`);
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= count) {
      r.fail(
        `${where}.${key}`,
        `must be a whole number from 0 to ${count - 1} (0-based; this slide has ${count} ${key}s)`
      );
    }
    return key === 'metric' ? { metric: index as number } : { bar: index as number };
  };

  const slug = r.str(story, 'slug', '');
  const expected = file.replace(/\.json$/, '');
  if (slug !== expected) r.fail('slug', `must match the file name ("${expected}")`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    r.fail('slug', 'must be lowercase letters, numbers and hyphens');
  }

  const repo = r.str(story, 'repo', '');
  if (!repo.includes('TODO') && !parseRepoUrl(repo)) {
    r.fail('repo', 'must be a GitHub URL like https://github.com/owner/name');
  }

  const featured = r.optBool(story, 'featured', '');
  if (featured === undefined) r.fail('featured', 'must be true or false');

  return {
    slug,
    title: r.str(story, 'title', ''),
    hook: r.str(story, 'hook', ''),
    repo,
    links: r.list(story, 'links', '', link, { nonEmpty: false })!,
    tags: r.list(story, 'tags', '', r.text, { nonEmpty: false })!,
    featured: featured!,
    order: r.num(story, 'order', ''),
    slides: r.list(story, 'slides', '', slide)!,
  };
}

function loadStories(): Story[] {
  if (!fs.existsSync(STORIES_DIR)) return [];
  const files = fs
    .readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const stories = files.map((file) => {
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(STORIES_DIR, file), 'utf8'));
    } catch (error) {
      throw new StoryFileError(
        `content/project_stories/${file}: not valid JSON (${(error as Error).message})`
      );
    }
    const story = parseStory(file, raw);
    contentWarnings(file, story).forEach((warning) => console.warn(warning));
    return story;
  });
  return stories.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/** Slides over the content limits (warnings: the story still builds). */
export function contentWarnings(file: string, story: Story): string[] {
  const warnings: string[] = [];
  story.slides.forEach((slide, i) => {
    const where = `[stories] content/project_stories/${file} slide ${i + 1}`;
    const over = (count: number, limit: number, what: string) => {
      if (count > limit) warnings.push(`${where}: ${count} ${what} (max ${limit})`);
    };
    over(slide.bullets?.length ?? 0, LIMITS.bullets, 'bullets');
    over(slide.metrics?.length ?? 0, LIMITS.metrics, 'metrics');
    if (slide.type === 'bars') over(slide.bars.length, LIMITS.bars, 'bars');
    if (slide.type === 'steps') over(slide.steps.length, LIMITS.steps, 'steps');
    slide.bullets?.forEach((bullet, b) => {
      if (bullet.length > LIMITS.bulletLength) {
        warnings.push(
          `${where}: bullet ${b + 1} is ${bullet.length} characters (max ${LIMITS.bulletLength})`
        );
      }
    });
  });
  return warnings;
}

let cache: Story[] | null = null;

/** Every story, sorted by "order". Throws (failing the build) if a file is invalid. */
export function getStories(): Story[] {
  cache ??= loadStories();
  return cache;
}

export function getStory(slug: string): Story | undefined {
  return getStories().find((s) => s.slug === slug);
}

export function summarize(story: Story): StorySummary {
  return { slug: story.slug, title: story.title, hook: story.hook };
}

/** owner/name from https://github.com/<owner>/<name>(.git)(/...), or null. */
export function parseRepoUrl(url: string): { owner: string; name: string } | null {
  const match = url.trim().match(/^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!match) return null;
  return { owner: match[1], name: match[2].replace(/\.git$/i, '') };
}

/**
 * Which repo each story belongs to, as { repoId: story }. Matched by the repo's id
 * (GitHub resolves an old name to the renamed repo); if GitHub can't be reached, by
 * owner/name ignoring case.
 */
export async function storiesByRepoId(
  stories: Story[],
  repos: Pick<Repo, 'id' | 'name'>[]
): Promise<Record<number, StorySummary>> {
  const result: Record<number, StorySummary> = {};
  await Promise.all(
    stories.map(async (story) => {
      const parsed = parseRepoUrl(story.repo);
      if (!parsed) return;
      const id = await resolveRepoId(parsed.owner, parsed.name);
      const byId = id !== null ? repos.find((r) => r.id === id) : undefined;
      const byName =
        parsed.owner.toLowerCase() === GITHUB_USERNAME.toLowerCase()
          ? repos.find((r) => sameRepoName(r.name, parsed.name))
          : undefined;
      const repo = byId ?? byName;
      if (repo && !result[repo.id]) result[repo.id] = summarize(story);
    })
  );
  return result;
}
