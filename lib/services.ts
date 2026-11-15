import fs from 'fs';
import path from 'path';
import { getStory } from './stories';
import { isTodo } from './storyTypes';
import { storyHref, type StoryRef } from './lifeStoryTypes';
import { homeStoryPortfolioTitle } from '@/components/character/luffyLines';

/**
 * The Work with me page (content/services.json), read and checked at build time.
 * Client components import only the types from here (type imports are erased), never
 * getServices(). A mistake in the file fails the build naming the field, e.g.
 *   content/services.json: services[3].proof[0] "x" is not a project story
 *
 * Anything containing "TODO" counts as missing and is hidden: an optional field
 * disappears, a list item is dropped, a service without a name or promise is dropped
 * (with any problem card pointing at it), and a section with nothing left is hidden.
 * "_note" is ignored.
 */

// ── Types ──

export type Service = {
  /** Also the card's id on the page (#automation) and the contact page's ?service=. */
  id: string;
  emoji: string;
  name: string;
  promise: string;
  needIf: string[];
  youGet: string[];
  steps: string[];
  proof: StoryRef[];
  experience?: string;
  tech: string[];
};

export type Problem = { label: string; service: string };

export type ProcessStep = { name: string; what?: string; checkpoint?: string };

export type PlannerQuestion = {
  id: string;
  label: string;
  /** "service": the services are the options; "chips": the listed options. */
  type: 'service' | 'chips';
  options: string[];
};

export type Planner = {
  title: string;
  luffy: string;
  questions: PlannerQuestion[];
  /** Keyed "<question id>:<option>". */
  notes: Record<string, string>;
  /** Keyed by service id. */
  needFromYou: Record<string, string[]>;
};

export type Capacity = {
  available: boolean;
  /** The badge text: "label" when available, "fullLabel" when not. */
  text: string;
  detail?: string;
};

export type Services = {
  hero: { title: string; subtitle: string; luffy: string };
  /** null: the badge's text is missing (or TODO). */
  capacity: Capacity | null;
  where?: string;
  problems: { question: string; items: Problem[] } | null;
  services: Service[];
  process: { title: string; luffy?: string; steps: ProcessStep[] } | null;
  timeline: { title: string; text?: string; factors: string[] } | null;
  pricing: { title: string; text?: string } | null;
  promises: { title: string; items: string[] } | null;
  faq: { q: string; a: string }[];
  planner: Planner | null;
};

// ── Checks ──

const FILE = 'content/services.json';
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

class ServicesError extends Error {}
type Obj = Record<string, unknown>;

const fail = (where: string, problem: string): never => {
  throw new ServicesError(`${FILE}: ${where} ${problem}`);
};

function obj(value: unknown, where: string): Obj {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Obj)
    : fail(where, 'must be an object');
}

/** An optional section: undefined when missing. */
function optObj(o: Obj, key: string): Obj | undefined {
  return o[key] === undefined || o[key] === null ? undefined : obj(o[key], key);
}

function arr(o: Obj, key: string, where: string): unknown[] {
  const v = o[key];
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : fail(`${where}${key}`, 'must be a list');
}

/** Required text (a TODO here is a mistake). */
function text(o: Obj, key: string, where: string): string {
  const v = o[key];
  if (typeof v !== 'string' || v.trim() === '') return fail(`${where}${key}`, 'must be a non-empty string');
  if (isTodo(v)) return fail(`${where}${key}`, 'is still TODO (this one is required)');
  return v.trim();
}

/** Optional text: undefined when missing, null, empty or TODO. */
function opt(o: Obj, key: string, where: string): string | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') return fail(`${where}${key}`, 'must be a string');
  return v.trim() === '' || isTodo(v) ? undefined : v.trim();
}

/** A list of strings, TODO and empty items dropped. */
function strings(o: Obj, key: string, where: string): string[] {
  return arr(o, key, where)
    .map((v, i) => (typeof v === 'string' ? v : fail(`${where}${key}[${i}]`, 'must be a string')))
    .filter((v) => v.trim() !== '' && !isTodo(v))
    .map((v) => v.trim());
}

function storyRef(slug: string, where: string): StoryRef {
  if (slug === 'portfolio') return { slug, title: homeStoryPortfolioTitle, href: storyHref(slug) };
  const story = getStory(slug);
  if (!story) return fail(where, `"${slug}" is not a project story (content/project_stories/${slug}.json)`);
  return { slug, title: story.title, href: storyHref(slug) };
}

// ── Loader ──

let cached: Services | null = null;

export function getServices(): Services {
  if (cached) return cached;
  const raw = fs.readFileSync(path.join(process.cwd(), FILE), 'utf-8');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new ServicesError(`${FILE}: not valid JSON (${(error as Error).message})`);
  }
  const root = obj(data, '(the file)');

  // Hero, capacity, where
  const h = obj(root.hero, 'hero');
  const hero = { title: text(h, 'title', 'hero.'), subtitle: text(h, 'subtitle', 'hero.'), luffy: text(h, 'luffy', 'hero.') };

  let capacity: Capacity | null = null;
  const c = optObj(root, 'capacity');
  if (c) {
    if (typeof c.available !== 'boolean') fail('capacity.available', 'must be true or false');
    const available = c.available as boolean;
    const label = opt(c, 'label', 'capacity.');
    const fullLabel = opt(c, 'fullLabel', 'capacity.');
    const badge = available ? label : fullLabel;
    capacity = badge ? { available, text: badge, detail: opt(c, 'detail', 'capacity.') } : null;
  }
  const w = optObj(root, 'where');
  const where = w ? opt(w, 'text', 'where.') : undefined;

  // Services (first: the other sections point at their ids)
  const allIds = new Set<string>();
  const services: Service[] = arr(root, 'services', '').flatMap((v, i) => {
    const at = `services[${i}].`;
    const s = obj(v, at.slice(0, -1));
    const id = text(s, 'id', at);
    if (!ID.test(id)) fail(`${at}id`, `must be lowercase words joined by "-" (got "${id}")`);
    if (allIds.has(id)) fail(`${at}id`, `"${id}" is used by another service`);
    allIds.add(id);
    const proof = arr(s, 'proof', at).flatMap((p, k) => {
      if (typeof p !== 'string') return fail(`${at}proof[${k}]`, 'must be a story slug');
      return isTodo(p) || p.trim() === '' ? [] : [storyRef(p.trim(), `${at}proof[${k}]`)];
    });
    const service: Service = {
      id,
      emoji: opt(s, 'emoji', at) ?? '•',
      name: opt(s, 'name', at) ?? '',
      promise: opt(s, 'promise', at) ?? '',
      needIf: strings(s, 'needIf', at),
      youGet: strings(s, 'youGet', at),
      steps: strings(s, 'steps', at),
      proof,
      experience: opt(s, 'experience', at),
      tech: strings(s, 'tech', at),
    };
    return service.name && service.promise ? [service] : [];
  });
  const shown = new Set(services.map((s) => s.id));
  /** A known service id (or fail); false when that service is hidden by a TODO. */
  const knownService = (id: string, at: string): boolean => {
    if (!allIds.has(id)) fail(at, `"${id}" doesn't match any services[].id`);
    return shown.has(id);
  };

  // Problems
  let problems: Services['problems'] = null;
  const pr = optObj(root, 'problems');
  if (pr) {
    const items = arr(pr, 'items', 'problems.').flatMap((v, i) => {
      const at = `problems.items[${i}].`;
      const p = obj(v, at.slice(0, -1));
      const label = opt(p, 'label', at);
      const service = text(p, 'service', at);
      return knownService(service, `${at}service`) && label ? [{ label, service }] : [];
    });
    if (items.length > 0) problems = { question: text(pr, 'question', 'problems.'), items };
  }

  // Process
  let howItWorks: Services['process'] = null;
  const ps = optObj(root, 'process');
  if (ps) {
    const steps = arr(ps, 'steps', 'process.').flatMap((v, i) => {
      const at = `process.steps[${i}].`;
      const st = obj(v, at.slice(0, -1));
      const name = opt(st, 'name', at);
      return name ? [{ name, what: opt(st, 'what', at), checkpoint: opt(st, 'checkpoint', at) }] : [];
    });
    if (steps.length > 0) howItWorks = { title: text(ps, 'title', 'process.'), luffy: opt(ps, 'luffy', 'process.'), steps };
  }

  // Timeline, pricing, promises
  const tl = optObj(root, 'timeline');
  const tlText = tl ? opt(tl, 'text', 'timeline.') : undefined;
  const factors = tl ? strings(tl, 'factors', 'timeline.') : [];
  const timeline = tl && (tlText || factors.length) ? { title: text(tl, 'title', 'timeline.'), text: tlText, factors } : null;

  const pc = optObj(root, 'pricing');
  const pcText = pc ? opt(pc, 'text', 'pricing.') : undefined;
  const pricing = pc && pcText ? { title: text(pc, 'title', 'pricing.'), text: pcText } : null;

  const pm = optObj(root, 'promises');
  const promiseItems = pm ? strings(pm, 'items', 'promises.') : [];
  const promises = pm && promiseItems.length ? { title: text(pm, 'title', 'promises.'), items: promiseItems } : null;

  // FAQ
  const faq = arr(root, 'faq', '').flatMap((v, i) => {
    const at = `faq[${i}].`;
    const f = obj(v, at.slice(0, -1));
    const q = opt(f, 'q', at);
    const a = opt(f, 'a', at);
    return q && a ? [{ q, a }] : [];
  });

  // Planner
  let planner: Planner | null = null;
  const pl = optObj(root, 'planner');
  if (pl && services.length > 0) {
    const ids = new Set<string>();
    const questions: PlannerQuestion[] = arr(pl, 'questions', 'planner.').map((v, i) => {
      const at = `planner.questions[${i}].`;
      const q = obj(v, at.slice(0, -1));
      const id = text(q, 'id', at);
      if (ids.has(id)) fail(`${at}id`, `"${id}" is used by another question`);
      ids.add(id);
      const type = q.type;
      if (type !== 'service' && type !== 'chips') fail(`${at}type`, 'must be "service" or "chips"');
      const options = type === 'chips' ? strings(q, 'options', at) : [];
      if (type === 'chips' && options.length < 2) fail(`${at}options`, 'needs at least 2 options');
      return { id, label: text(q, 'label', at), type: type as PlannerQuestion['type'], options };
    });
    if (questions.filter((q) => q.type === 'service').length !== 1) {
      fail('planner.questions', 'needs exactly one question with "type": "service"');
    }

    const notes: Record<string, string> = {};
    const n = optObj(pl, 'notes') ?? {};
    for (const key of Object.keys(n)) {
      const at = `planner.notes["${key}"]`;
      const [qid, ...rest] = key.split(':');
      const option = rest.join(':');
      const question = questions.find((q) => q.id === qid);
      if (!question || question.type !== 'chips') fail(at, `must start with a chips question id and ":" (questions: ${questions.filter((q) => q.type === 'chips').map((q) => q.id).join(', ')})`);
      if (!question!.options.includes(option)) fail(at, `"${option}" isn't one of ${qid}'s options (${question!.options.join(', ')})`);
      const note = opt(n, key, 'planner.notes.');
      if (note) notes[key] = note;
    }

    const needFromYou: Record<string, string[]> = {};
    const nf = optObj(pl, 'needFromYou') ?? {};
    for (const key of Object.keys(nf)) {
      if (knownService(key, `planner.needFromYou["${key}"]`)) {
        needFromYou[key] = strings(nf, key, 'planner.needFromYou.');
      }
    }

    planner = { title: text(pl, 'title', 'planner.'), luffy: text(pl, 'luffy', 'planner.'), questions, notes, needFromYou };
  }

  cached = { hero, capacity, where, problems, services, process: howItWorks, timeline, pricing, promises, faq, planner };
  return cached;
}
