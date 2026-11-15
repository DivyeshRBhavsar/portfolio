import fs from 'fs';
import path from 'path';
import { getStory } from './stories';
import { isTodo } from './storyTypes';
import { homeStoryPortfolioTitle } from '@/components/character/luffyLines';
import {
  storyHref,
  type Certification,
  type Chapter,
  type EducationProject,
  type EducationStop,
  type EmailParts,
  type Job,
  type JobKind,
  type LifeStory,
  type NowItem,
  type Principle,
  type StoryRef,
  type Track,
} from './lifeStoryTypes';

/**
 * The home page life story, read and checked at build time (server only). A mistake in
 * the file fails the build naming the field, e.g.
 *   content/life-story.json: experience.jobs[2].kind must be "software" or "data"
 *
 * Anything containing "TODO" counts as missing: that field is hidden; a job without
 * role/company or a stop without degree/school is hidden; a chapter with nothing left
 * is hidden. "_note" is ignored.
 */

const FILE = 'content/life-story.json';
const DATE = /^\d{4}(-(0[1-9]|1[0-2]))?$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

class LifeStoryError extends Error {}
type Obj = Record<string, unknown>;

const fail = (where: string, problem: string): never => {
  throw new LifeStoryError(`${FILE}: ${where} ${problem}`);
};

function obj(value: unknown, where: string): Obj {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Obj)
    : fail(where, 'must be an object');
}

function arr(o: Obj, key: string, where: string): unknown[] {
  const v = o[key];
  if (v === undefined) return [];
  return Array.isArray(v) ? v : fail(`${where}${key}`, 'must be a list');
}

/** Required text (a TODO here is a mistake: chapter titles and Luffy's lines). */
function text(o: Obj, key: string, where: string): string {
  const v = o[key];
  if (typeof v !== 'string' || v.trim() === '') return fail(`${where}${key}`, 'must be a non-empty string');
  if (isTodo(v)) return fail(`${where}${key}`, 'is still TODO (this one is required)');
  return v.trim();
}

/** Optional text: undefined when missing, empty or TODO. */
function opt(o: Obj, key: string, where: string): string | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') return fail(`${where}${key}`, 'must be a string');
  return v.trim() === '' || isTodo(v) ? undefined : v.trim();
}

function date(o: Obj, key: string, where: string, allowPresent = false): string | undefined {
  const v = opt(o, key, where);
  if (v === undefined) return undefined;
  if (allowPresent && v === 'present') return v;
  return DATE.test(v)
    ? v
    : fail(`${where}${key}`, `must be "YYYY" or "YYYY-MM"${allowPresent ? ' or "present"' : ''} (got "${v}")`);
}

function strings(o: Obj, key: string, where: string): string[] {
  return arr(o, key, where)
    .map((v, i) => (typeof v === 'string' ? v : fail(`${where}${key}[${i}]`, 'must be a string')))
    .filter((v) => v.trim() !== '' && !isTodo(v))
    .map((v) => v.trim());
}

function storyRef(slug: string, where: string): StoryRef {
  if (slug === 'portfolio') {
    return { slug, title: homeStoryPortfolioTitle, href: storyHref(slug) };
  }
  const story = getStory(slug);
  if (!story) return fail(where, `"${slug}" is not a project story (content/project_stories/${slug}.json)`);
  return { slug, title: story.title, href: storyHref(slug) };
}

function storyRefs(o: Obj, key: string, where: string): StoryRef[] {
  return arr(o, key, where).flatMap((v, i) => {
    const at = `${where}${key}[${i}]`;
    if (typeof v !== 'string') return fail(at, 'must be a story slug');
    return isTodo(v) || v.trim() === '' ? [] : [storyRef(v.trim(), at)];
  });
}

function chapter(o: Obj, where: string): Chapter {
  return { title: text(o, 'title', where), luffy: text(o, 'luffy', where) };
}

/**
 * An education stop's project: "project" {label, name, story} (preferred; all three
 * required, the story must exist; a TODO hides the link), or else the older plain
 * "story" slug, shown under the story's own title.
 */
function educationProject(s: Obj, where: string): EducationProject | undefined {
  if (s.project !== undefined) {
    const w = `${where}project.`;
    const p = obj(s.project, w.slice(0, -1));
    const raw = [p.label, p.name, p.story];
    if (raw.some((v) => typeof v === 'string' && isTodo(v))) return undefined;
    const label = text(p, 'label', w);
    const name = text(p, 'name', w);
    return { label, name, story: storyRef(text(p, 'story', w), `${w}story`) };
  }
  const slug = opt(s, 'story', where);
  if (!slug) return undefined;
  const story = storyRef(slug, `${where}story`);
  return { name: story.title, story };
}

/** Newest first by start; no start: newest if it runs to "present", else last. */
function byStartDesc(a: Job, b: Job): number {
  const key = (j: Job) => j.start ?? (j.end === 'present' ? '9999' : '0000');
  return key(b).localeCompare(key(a));
}

function emailParts(value: string | undefined, where: string): EmailParts | undefined {
  if (!value) return undefined;
  const m = value.match(/^([^\s@]+)@([^\s@]+\.[^\s@]+)$/);
  if (!m) return fail(where, `must be an email address (got "${value}")`);
  const reverse = (s: string) => [...s].reverse().join('');
  return { user: reverse(m[1]), domain: reverse(m[2]) };
}

let cached: LifeStory | null = null;

export function getLifeStory(): LifeStory {
  if (cached) return cached;
  const raw = fs.readFileSync(path.join(process.cwd(), FILE), 'utf-8');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new LifeStoryError(`${FILE}: not valid JSON (${(error as Error).message})`);
  }
  const root = obj(data, '(the file)');

  // ── Intro ──
  const intro = chapter(obj(root.intro, 'intro'), 'intro.');

  // ── Chapter 1: education ──
  const edu = obj(root.education, 'education');
  const stops: EducationStop[] = arr(edu, 'stops', 'education.').flatMap((v, i) => {
    const w = `education.stops[${i}].`;
    const s = obj(v, w.slice(0, -1));
    const degree = opt(s, 'degree', w);
    const school = opt(s, 'school', w);
    const stop: EducationStop = {
      degree: degree ?? '',
      field: opt(s, 'field', w),
      school: school ?? '',
      place: opt(s, 'place', w),
      start: date(s, 'start', w),
      end: date(s, 'end', w, true),
      highlights: strings(s, 'highlights', w),
      project: educationProject(s, w),
    };
    return degree && school ? [stop] : [];
  });
  const certifications: Certification[] = arr(edu, 'certifications', 'education.').flatMap((v, i) => {
    const w = `education.certifications[${i}].`;
    const c = obj(v, w.slice(0, -1));
    const name = opt(c, 'name', w);
    const year = opt(c, 'year', w);
    if (year && !/^\d{4}$/.test(year)) fail(`${w}year`, `must be "YYYY" (got "${year}")`);
    return name ? [{ name, year }] : [];
  });

  // ── Chapter 2: experience ──
  const exp = obj(root.experience, 'experience');
  const allCompanies = new Set<string>();
  const jobs: Job[] = arr(exp, 'jobs', 'experience.')
    .flatMap((v, i) => {
      const w = `experience.jobs[${i}].`;
      const j = obj(v, w.slice(0, -1));
      const kind = j.kind;
      if (kind !== 'software' && kind !== 'data') fail(`${w}kind`, 'must be "software" or "data"');
      const role = opt(j, 'role', w);
      const company = opt(j, 'company', w);
      if (company) allCompanies.add(company);
      const job: Job = {
        role: role ?? '',
        company: company ?? '',
        place: opt(j, 'place', w),
        start: date(j, 'start', w),
        end: date(j, 'end', w, true),
        kind: kind as JobKind,
        did: opt(j, 'did', w),
        learned: opt(j, 'learned', w),
        stories: storyRefs(j, 'stories', w),
      };
      return role && company ? [job] : [];
    })
    .sort(byStartDesc);

  // ── Chapter 3: tracks ──
  const tr = obj(root.tracks, 'tracks');
  const items: Track[] = arr(tr, 'items', 'tracks.').flatMap((v, i) => {
    const w = `tracks.items[${i}].`;
    const t = obj(v, w.slice(0, -1));
    const role = opt(t, 'role', w);
    const experience = strings(t, 'experience', w).flatMap((company, k) => {
      if (!allCompanies.has(company)) {
        return fail(`${w}experience[${k}]`, `"${company}" doesn't match any experience.jobs company`);
      }
      return jobs.filter((job) => job.company === company);
    });
    const track: Track = {
      id: text(t, 'id', w),
      role: role ?? '',
      pitch: opt(t, 'pitch', w),
      evidence: storyRefs(t, 'evidence', w),
      experience,
      skills: strings(t, 'skills', w),
      resume: opt(t, 'resume', w),
    };
    return role ? [track] : [];
  });
  const principles: Principle[] = arr(tr, 'principles', 'tracks.').flatMap((v, i) => {
    const w = `tracks.principles[${i}].`;
    const p = obj(v, w.slice(0, -1));
    const title = opt(p, 'title', w);
    const proof = opt(p, 'proof', w);
    return title ? [{ title, proof: proof ? storyRef(proof, `${w}proof`) : undefined }] : [];
  });

  // ── Chapter 4: now ──
  const nw = obj(root.now, 'now');
  const updated = opt(nw, 'updated', 'now.');
  if (updated && !MONTH.test(updated)) fail('now.updated', `must be "YYYY-MM" (got "${updated}")`);
  const nowItems: NowItem[] = arr(nw, 'items', 'now.').flatMap((v, i) => {
    const w = `now.items[${i}].`;
    const n = obj(v, w.slice(0, -1));
    const label = opt(n, 'label', w);
    const raw = opt(n, 'text', w);
    const auto = !!raw && raw.toLowerCase().startsWith('auto:');
    if (!label || !raw) return [];
    return [{ icon: opt(n, 'icon', w) ?? '•', label, text: auto ? undefined : raw, auto, stories: storyRefs(n, 'stories', w) }];
  });

  // ── Let's talk ──
  const ct = obj(root.contact, 'contact');
  const linkedin = opt(ct, 'linkedin', 'contact.');
  if (linkedin && !/^https:\/\//.test(linkedin)) fail('contact.linkedin', 'must start with https://');

  cached = {
    intro,
    education:
      stops.length + certifications.length > 0
        ? { ...chapter(edu, 'education.'), stops, certifications }
        : null,
    experience: jobs.length > 0 ? { ...chapter(exp, 'experience.'), jobs } : null,
    tracks:
      items.length + principles.length > 0 ? { ...chapter(tr, 'tracks.'), items, principles } : null,
    now: nowItems.length > 0 ? { ...chapter(nw, 'now.'), updated, items: nowItems } : null,
    contact: {
      ...chapter(ct, 'contact.'),
      linkedin,
      availability: opt(ct, 'availability', 'contact.'),
      email: emailParts(opt(ct, 'email', 'contact.'), 'contact.email'),
      // Pointing at résumé buttons that don't exist yet would be confusing.
      resumeNote: items.some((t) => t.resume) ? opt(ct, 'resumeNote', 'contact.') : undefined,
    },
  };
  return cached;
}
