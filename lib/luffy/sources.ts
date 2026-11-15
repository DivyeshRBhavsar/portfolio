import fs from 'fs';
import path from 'path';
import { TOPICS } from '@/lib/blogTopics';
import { getLifeStory } from '@/lib/lifeStory';
import { formatRange } from '@/lib/lifeStoryTypes';
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { getServices } from '@/lib/services';
import { isTodo, type Slide, type Story } from '@/lib/storyTypes';
import { SITE_PATHS } from './config';

/**
 * Everything Luffy may know, gathered from the site's public content (read only):
 * project stories, blog posts, the home page life story and the Work with me page.
 * Nothing private: the email address is never read, and anything containing "TODO" is
 * left out (lifeStory/services loaders already drop it; stories are filtered here).
 */

export type SourceType = 'story' | 'blog' | 'life' | 'services';

export type Section = {
  heading: string;
  text: string;
  /**
   * May be joined with neighbouring short sections into one chunk (story slides, blog
   * paragraphs). Off for things that should stay findable on their own (one job, one
   * degree, one service).
   */
  merge: boolean;
};

export type SourceDoc = {
  /** Stable key, e.g. "story:candidate-ranking"; chunk ids add ":<n>". */
  key: string;
  sourceType: SourceType;
  title: string;
  url: string;
  sections: Section[];
};

export type Skipped = { file: string; reason: string };

const clean = (s: string | undefined | null) => (s && !isTodo(s) ? s.trim() : '');
const lines = (...parts: (string | undefined | null | false)[]) => parts.filter(Boolean).join('\n');
const list = (items: (string | undefined)[]) => items.map((i) => clean(i)).filter(Boolean).map((i) => `- ${i}`).join('\n');

// ── Project stories ──

function slideText(slide: Slide): string {
  const parts: string[] = [];
  if (slide.type === 'title' && clean(slide.subtitle)) parts.push(clean(slide.subtitle));
  if (slide.type === 'steps') parts.push(list(slide.steps.map((s) => `${clean(s.label)}: ${clean(s.detail)}`)));
  if (slide.type === 'bars') {
    const best = slide.lowerIsBetter ? ' (lower is better)' : '';
    parts.push(`${clean(slide.unit)}${best}:`);
    parts.push(list(slide.bars.map((b) => `${clean(b.label)}: ${b.value}${b.highlight ? ' (highlighted)' : ''}`)));
  }
  if (slide.metrics?.length) parts.push(list(slide.metrics.map((m) => `${clean(m.label)}: ${clean(m.value)}`)));
  if (slide.bullets?.length) parts.push(list(slide.bullets));
  if (clean(slide.narration)) parts.push(`Luffy's summary: ${clean(slide.narration)}`);
  return lines(...parts);
}

function storyDocs(skipped: Skipped[]): SourceDoc[] {
  const dir = path.join(process.cwd(), 'content', 'project_stories');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((file): SourceDoc[] => {
      let story: Story;
      try {
        story = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')) as Story;
      } catch (error) {
        skipped.push({ file: `content/project_stories/${file}`, reason: `not valid JSON (${(error as Error).message})` });
        return [];
      }
      if (!clean(story.slug) || !clean(story.title) || !Array.isArray(story.slides)) {
        skipped.push({ file: `content/project_stories/${file}`, reason: 'missing slug, title or slides' });
        return [];
      }
      const overview = lines(
        clean(story.hook),
        story.tags?.length ? `Tags: ${story.tags.map(clean).filter(Boolean).join(', ')}` : '',
        clean(story.repo) ? `Code: ${clean(story.repo)}` : ''
      );
      return [
        {
          key: `story:${story.slug}`,
          sourceType: 'story',
          title: clean(story.title),
          url: SITE_PATHS.story(story.slug),
          sections: [
            { heading: 'Overview', text: overview, merge: true },
            ...story.slides.map((slide) => ({ heading: clean(slide.title) || 'Slide', text: slideText(slide), merge: true })),
          ].filter((s) => s.text),
        },
      ];
    });
}

// ── Blog posts ──

/** MDX → plain text: code blocks become "[code example]"; JSX, links and markup are stripped. */
export function mdxToText(mdx: string): string {
  return (
    mdx
      .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, '[code example]')
      .replace(/^(import|export)\s.*$/gm, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/<[A-Za-z][^>]*\/>/g, '')
      .replace(/<\/?[A-Za-z][^>]*>/g, '')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/(\*\*|__)(.+?)\1/g, '$2')
      .replace(/(^|\W)[*_]([^*_\n]+)[*_](?=\W|$)/g, '$1$2')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/gm, '')
      .replace(/^\s*\|(.*)\|\s*$/gm, (_, row: string) => row.split('|').map((c) => c.trim()).join(' | '))
      .replace(/^\s*>\s?/gm, '')
      .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '- ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function blogDocs(skipped: Skipped[]): SourceDoc[] {
  return getAllPosts().flatMap((meta): SourceDoc[] => {
    const post = getPostBySlug(meta.slug);
    if (!post) {
      skipped.push({ file: `content/blog/${meta.slug}.mdx`, reason: 'could not be read' });
      return [];
    }
    // Code first (a "## " inside a code block isn't a heading), then split at ## / ###.
    const body = post.content.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, '[code example]');
    const sections: Section[] = [];
    let heading = 'Introduction';
    let buffer: string[] = [];
    const flush = () => {
      const text = mdxToText(buffer.join('\n'));
      if (text && text !== '[code example]') sections.push({ heading, text, merge: true });
      buffer = [];
    };
    for (const line of body.split('\n')) {
      const m = line.match(/^#{2,3}\s+(.+?)\s*#*\s*$/);
      if (m) {
        flush();
        heading = mdxToText(m[1]);
      } else {
        buffer.push(line);
      }
    }
    flush();
    const topic = TOPICS.find((t) => t.slug === meta.topic)?.name ?? meta.topic;
    const overview = lines(
      clean(meta.summary),
      `Topic: ${topic}`,
      meta.level ? `Level: ${meta.level}` : '',
      meta.tags.length ? `Tags: ${meta.tags.join(', ')}` : ''
    );
    return [
      {
        key: `blog:${meta.slug}`,
        sourceType: 'blog',
        title: clean(meta.title),
        url: SITE_PATHS.blog(meta.slug),
        sections: [{ heading: 'Overview', text: overview, merge: true }, ...sections],
      },
    ];
  });
}

// ── Life story (home page) ──

function lifeDoc(): SourceDoc {
  const story = getLifeStory(); // TODOs already removed; contact.email is never read here.
  const sections: Section[] = [];
  const add = (heading: string, text: string, merge = false) => text.trim() && sections.push({ heading, text: text.trim(), merge });

  for (const stop of story.education?.stops ?? []) {
    add(
      `Education: ${stop.degree}`,
      lines(
        `Divyesh studied ${stop.degree}${stop.field ? `, ${stop.field}` : ''} at ${stop.school}${stop.place ? ` (${stop.place})` : ''}.`,
        formatRange(stop.start, stop.end) ? `Dates: ${formatRange(stop.start, stop.end)}` : '',
        list(stop.highlights),
        stop.project ? `${stop.project.label ?? 'Project'}: ${stop.project.name}` : ''
      )
    );
  }
  if (story.education?.certifications.length) {
    add('Certifications', list(story.education.certifications.map((c) => `${c.name}${c.year ? ` (${c.year})` : ''}`)));
  }
  for (const job of story.experience?.jobs ?? []) {
    const dates = formatRange(job.start, job.end);
    add(
      `Experience: ${job.role} at ${job.company}`,
      lines(
        `Divyesh worked as ${job.role} at ${job.company}${job.place ? ` (${job.place})` : ''}${dates ? `, ${dates}` : ''}.`,
        `Kind of work: ${job.kind === 'data' ? 'data' : 'software'}`,
        job.did ? `What he did: ${job.did}` : '',
        job.learned ? `What he learned: ${job.learned}` : '',
        job.stories.length ? `Related project stories: ${job.stories.map((s) => s.title).join(', ')}` : ''
      )
    );
  }
  for (const track of story.tracks?.items ?? []) {
    add(
      `Role: ${track.role}`,
      lines(
        `What Divyesh offers as ${track.role}.`,
        track.pitch ?? '',
        track.skills.length ? `Skills: ${track.skills.join(', ')}` : '',
        track.experience.length ? `Experience: ${track.experience.map((j) => `${j.role} at ${j.company}`).join('; ')}` : '',
        track.evidence.length ? `Proof: ${track.evidence.map((s) => s.title).join(', ')}` : ''
      )
    );
  }
  if (story.tracks?.principles.length) {
    add('How Divyesh works', list(story.tracks.principles.map((p) => `${p.title}${p.proof ? ` (see ${p.proof.title})` : ''}`)));
  }
  const now = (story.now?.items ?? []).filter((item) => !item.auto && item.text);
  if (now.length) {
    add(`What Divyesh is doing now${story.now?.updated ? ` (updated ${story.now.updated})` : ''}`, list(now.map((i) => `${i.label}: ${i.text}`)));
  }
  if (story.contact.availability) add('Availability', story.contact.availability);

  return { key: 'life:home', sourceType: 'life', title: 'About Divyesh Bhavsar', url: SITE_PATHS.life(), sections };
}

// ── Work with me (services) ──

function servicesDoc(): SourceDoc {
  const s = getServices(); // TODOs already removed.
  const sections: Section[] = [];
  const add = (heading: string, text: string, merge = false) => text.trim() && sections.push({ heading, text: text.trim(), merge });

  add('Overview', lines(s.hero.subtitle, s.where ?? '', s.capacity ? `Availability: ${s.capacity.text}. ${s.capacity.detail ?? ''}` : ''));
  for (const service of s.services) {
    add(
      `Service: ${service.name}`,
      lines(
        service.promise,
        service.needIf.length ? `You might need this if:\n${list(service.needIf)}` : '',
        service.youGet.length ? `What you get:\n${list(service.youGet)}` : '',
        service.steps.length ? `Steps:\n${list(service.steps)}` : '',
        service.proof.length ? `Similar work: ${service.proof.map((p) => p.title).join(', ')}` : '',
        service.experience ?? '',
        service.tech.length ? `Tools: ${service.tech.join(', ')}` : ''
      )
    );
  }
  if (s.process) {
    add(
      s.process.title,
      lines(
        s.process.luffy ?? '',
        list(s.process.steps.map((st) => `${st.name}: ${st.what ?? ''}${st.checkpoint ? ` Checkpoint: ${st.checkpoint}.` : ''}`))
      )
    );
  }
  if (s.timeline) add(s.timeline.title, lines(s.timeline.text ?? '', s.timeline.factors.length ? `What affects the timeline:\n${list(s.timeline.factors)}` : ''));
  if (s.pricing) add(s.pricing.title, s.pricing.text ?? '');
  if (s.promises) add(s.promises.title, list(s.promises.items));
  if (s.faq.length) add('Questions people ask', s.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n'), true);

  return { key: 'services:work-with-me', sourceType: 'services', title: 'Work with Divyesh', url: SITE_PATHS.services(), sections };
}

/** All sources, plus any files that couldn't be used (and why). */
export function gatherSources(): { docs: SourceDoc[]; skipped: Skipped[] } {
  const skipped: Skipped[] = [];
  const docs = [...storyDocs(skipped), ...blogDocs(skipped), lifeDoc(), servicesDoc()];
  return { docs, skipped };
}
