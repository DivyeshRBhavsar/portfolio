import fs from 'fs';
import path from 'path';
import { getStories } from './stories';
import { getAllPosts } from './posts';
import { getLifeStory } from './lifeStory';
import { isTodo } from './storyTypes';
import { contactAboutGroups } from '@/components/character/luffyLines';
import { LIMITS, type ContactConfig, type Field, type FieldType, type Option, type Purpose } from '@/components/contact/rules';

/**
 * The contact form (content/contact.json), read and checked on the server: at build time
 * for the page, and by /api/contact for every message. A mistake fails the build naming
 * the field, e.g.
 *   content/contact.json: purposes[1].fields[0].options[1].service "dashbords" doesn't match any content/services.json service
 *
 * Also checked: freelance project types point at real services (content/services.json)
 * and job role ids match the role cards (content/life-story.json tracks), except "other".
 * The "about" select ("source": "stories-and-posts") is filled with every project story
 * and blog post. "_note" is ignored; replyTime and bookingLink are hidden when empty.
 */

const FILE = 'content/contact.json';
const TYPES: FieldType[] = ['text', 'select', 'url', 'textarea', 'chips'];
const ID = /^[a-zA-Z0-9]+([-_][a-zA-Z0-9]+)*$/;

class ContactConfigError extends Error {}
type Obj = Record<string, unknown>;

const fail = (where: string, problem: string): never => {
  throw new ContactConfigError(`${FILE}: ${where} ${problem}`);
};

function obj(value: unknown, where: string): Obj {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Obj)
    : fail(where, 'must be an object');
}

function arr(o: Obj, key: string, where: string): unknown[] {
  const v = o[key];
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : fail(`${where}${key}`, 'must be a list');
}

function text(o: Obj, key: string, where: string): string {
  const v = o[key];
  if (typeof v !== 'string' || v.trim() === '') return fail(`${where}${key}`, 'must be a non-empty string');
  if (isTodo(v)) return fail(`${where}${key}`, 'is still TODO');
  return v.trim();
}

function opt(o: Obj, key: string, where: string): string | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') return fail(`${where}${key}`, 'must be a string');
  return v.trim() === '' || isTodo(v) ? undefined : v.trim();
}

function id(o: Obj, key: string, where: string): string {
  const v = text(o, key, where);
  return ID.test(v) ? v : fail(`${where}${key}`, `must be letters/numbers joined by "-" (got "${v}")`);
}

/** Ids from another content file, read raw (so a TODO-hidden entry still counts). */
function idsIn(file: string, pick: (data: Obj) => unknown[]): Set<string> {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf-8')) as Obj;
  return new Set(
    pick(data)
      .map((item) => (item && typeof item === 'object' ? (item as Obj).id : undefined))
      .filter((v): v is string => typeof v === 'string')
  );
}

/** Every project story and blog post, for the "about" select. */
function storiesAndPosts(): { options: Option[]; groups: { label: string; options: Option[] }[] } {
  const projects = getStories().map((s) => ({ value: s.slug, label: s.title }));
  const posts = getAllPosts().map((p) => ({ value: p.slug, label: p.title }));
  const groups = [
    { label: contactAboutGroups.projects, options: projects },
    { label: contactAboutGroups.posts, options: posts },
  ].filter((g) => g.options.length > 0);
  return { options: [...projects, ...posts], groups };
}

function options(f: Obj, where: string, services: Set<string>, roles: Set<string> | null): Option[] {
  const seen = new Set<string>();
  return arr(f, 'options', where).map((v, i) => {
    const at = `${where}options[${i}]`;
    let option: Option;
    if (typeof v === 'string') {
      if (!v.trim()) fail(at, 'must not be empty');
      option = { value: v.trim(), label: v.trim() };
    } else {
      const o = obj(v, at);
      option = { value: id(o, 'id', `${at}.`), label: text(o, 'label', `${at}.`) };
      if ('service' in o) {
        const service = o.service;
        if (service !== null && typeof service !== 'string') fail(`${at}.service`, 'must be a service id or null');
        if (typeof service === 'string' && !services.has(service)) {
          fail(`${at}.service`, `"${service}" doesn't match any content/services.json service (${[...services].join(', ')})`);
        }
        option.service = (service as string | null) ?? null;
      }
    }
    if (roles && option.value !== 'other' && !roles.has(option.value)) {
      fail(`${at}.id`, `"${option.value}" doesn't match any role card id in content/life-story.json (${[...roles].join(', ')})`);
    }
    if (seen.has(option.value)) fail(at, `"${option.value}" is listed twice`);
    seen.add(option.value);
    return option;
  });
}

let cached: ContactConfig | null = null;

export function getContactConfig(): ContactConfig {
  if (cached) return cached;
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(path.join(process.cwd(), FILE), 'utf-8'));
  } catch (error) {
    throw new ContactConfigError(`${FILE}: not valid JSON (${(error as Error).message})`);
  }
  const root = obj(data, '(the file)');
  const services = idsIn('content/services.json', (d) => (Array.isArray(d.services) ? d.services : []));
  const roles = idsIn('content/life-story.json', (d) => {
    const tracks = d.tracks as Obj | undefined;
    return tracks && Array.isArray(tracks.items) ? tracks.items : [];
  });

  const purposeIds = new Set<string>();
  const purposes: Purpose[] = arr(root, 'purposes', '').map((v, i) => {
    const at = `purposes[${i}].`;
    const p = obj(v, at.slice(0, -1));
    const pid = id(p, 'id', at);
    if (purposeIds.has(pid)) fail(`${at}id`, `"${pid}" is used by another purpose`);
    purposeIds.add(pid);

    const fieldIds = new Set<string>();
    const fields: Field[] = arr(p, 'fields', at).map((fv, k) => {
      const w = `${at}fields[${k}].`;
      const f = obj(fv, w.slice(0, -1));
      const fid = id(f, 'id', w);
      if (['name', 'email', 'message', 'linkedin', 'plan', 'purpose'].includes(fid)) {
        fail(`${w}id`, `"${fid}" is one of the form's own fields; pick another id`);
      }
      if (fieldIds.has(fid)) fail(`${w}id`, `"${fid}" is used by another field of this purpose`);
      fieldIds.add(fid);
      const type = f.type as FieldType;
      if (!TYPES.includes(type)) fail(`${w}type`, `must be one of ${TYPES.join(', ')}`);
      if (typeof f.required !== 'boolean') fail(`${w}required`, 'must be true or false');
      const max = f.maxLength;
      if (max !== undefined && (typeof max !== 'number' || !Number.isInteger(max) || max < 1 || max > 5000)) {
        fail(`${w}maxLength`, 'must be a whole number from 1 to 5000');
      }
      const defaultMax = type === 'url' ? LIMITS.url : type === 'textarea' ? LIMITS.textarea : LIMITS.text;

      const field: Field = {
        id: fid,
        label: text(f, 'label', w),
        type,
        required: f.required as boolean,
        placeholder: opt(f, 'placeholder', w),
        maxLength: (max as number | undefined) ?? defaultMax,
        options: [],
      };
      if (type === 'chips' || type === 'select') {
        if (f.source !== undefined) {
          if (f.source !== 'stories-and-posts') fail(`${w}source`, 'must be "stories-and-posts"');
          const filled = storiesAndPosts();
          field.options = filled.options;
          field.groups = filled.groups;
        } else {
          field.options = options(f, w, services, pid === 'job' && fid === 'role' ? roles : null);
        }
        if (field.options.length < 2) fail(`${w}options`, 'needs at least 2 options');
      } else if (f.options !== undefined || f.source !== undefined) {
        fail(`${w}options`, `only chips and select fields have options (this one is "${type}")`);
      }
      return field;
    });

    const subjectFields = arr(p, 'subjectFields', at).map((s, k) => {
      if (typeof s !== 'string' || !fieldIds.has(s)) {
        return fail(`${at}subjectFields[${k}]`, `must be one of this purpose's field ids (${[...fieldIds].join(', ') || 'none'})`);
      }
      return s;
    });

    const label = text(p, 'label', at);
    return {
      id: pid,
      emoji: text(p, 'emoji', at),
      label,
      subjectLabel: opt(p, 'subjectLabel', at) ?? label,
      subjectFields,
      description: text(p, 'description', at),
      messagePlaceholder: opt(p, 'messagePlaceholder', at),
      fields,
    };
  });
  if (purposes.length === 0) fail('purposes', 'needs at least one purpose');

  const bookingLink = opt(root, 'bookingLink', '');
  if (bookingLink && !/^https:\/\//.test(bookingLink)) fail('bookingLink', 'must start with https://');

  cached = {
    purposes,
    replyTime: opt(root, 'replyTime', ''),
    bookingLink,
    privacyNote: text(root, 'privacyNote', ''),
  };
  return cached;
}

/** Where messages go: the address in content/life-story.json (server only). */
export function getContactEmail(): string | undefined {
  const parts = getLifeStory().contact.email;
  if (!parts) return undefined;
  const reverse = (s: string) => [...s].reverse().join('');
  return `${reverse(parts.user)}@${reverse(parts.domain)}`;
}
