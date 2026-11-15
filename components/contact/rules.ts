/**
 * The contact form's shape and rules, shared by the form (components/contact/) and the
 * API (app/api/contact/route.ts) so both check exactly the same things. Plain module: no
 * Node or browser APIs. The config itself comes from content/contact.json via
 * lib/contact.ts (server only), and is passed to the form as props.
 */
import { contactErrors } from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';

// ── Config types ──

export type FieldType = 'text' | 'select' | 'url' | 'textarea' | 'chips';

/** value: what's stored and sent (an id, or the label for plain options). */
export type Option = { value: string; label: string; service?: string | null };
export type OptionGroup = { label: string; options: Option[] };

export type Field = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  maxLength: number;
  options: Option[];
  /** Grouped options (the "about" select): options is then all of them, flattened. */
  groups?: OptionGroup[];
};

export type Purpose = {
  id: string;
  emoji: string;
  label: string;
  /** The email subject's purpose name (defaults to label). */
  subjectLabel: string;
  /** Field ids whose values follow the purpose in the subject. */
  subjectFields: string[];
  description: string;
  messagePlaceholder?: string;
  fields: Field[];
};

export type ContactConfig = {
  purposes: Purpose[];
  replyTime?: string;
  bookingLink?: string;
  privacyNote: string;
};

// ── Values ──

export type CommonKey = 'name' | 'email' | 'message' | 'linkedin' | 'plan';

export type ContactValues = {
  purpose: string;
  /** The purpose's own fields, by field id. */
  fields: Record<string, string>;
  name: string;
  email: string;
  message: string;
  linkedin: string;
  /** The Work with me planner's summary (read-only in the form). */
  plan: string;
};

/** What the form posts to /api/contact. */
export type ContactPayload = ContactValues & {
  /** When the form was first shown (ms since epoch): sends within 3 s are rejected. */
  startedAt: number;
  /** The honeypot: hidden from people, so anything here means a bot. */
  website: string;
};

/**
 * Error keys: "purpose", a common key, "fields.<id>" for a purpose's field, or "form"
 * for problems that aren't about one field (too fast, cooldown, sending failed).
 */
export type FieldErrors = Record<string, string>;

export const LIMITS = {
  name: 80,
  email: 254,
  messageMin: 20,
  messageMax: 2000,
  linkedin: 300,
  plan: 2000,
  /** Defaults when a field doesn't set maxLength. */
  text: 200,
  url: 500,
  textarea: 1000,
} as const;


export const EMPTY_VALUES: ContactValues = {
  purpose: '',
  fields: {},
  name: '',
  email: '',
  message: '',
  linkedin: '',
  plan: '',
};

export const fieldKey = (id: string) => `fields.${id}`;

/** The DOM id for an error key's control (the thing focus moves to). */
export const domId = (key: string) => `contact-${key.replace('.', '-')}`;
export const errorId = (key: string) => `${domId(key)}-error`;

// ── Checks ──

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

export function findPurpose(config: ContactConfig, id: string): Purpose | undefined {
  return config.purposes.find((p) => p.id === id);
}

/** An option's label for display (falls back to the raw value). */
export function displayValue(field: Field, value: string): string {
  return field.options.find((o) => o.value === value)?.label ?? value;
}

/** One purpose field's problem, or undefined. */
export function checkField(field: Field, raw: string): string | undefined {
  const value = raw.trim();
  const title = field.label.replace(/\?$/, '');
  if (!value) return field.required ? fill(contactErrors.required, { title }) : undefined;
  if (value.length > field.maxLength) return fill(contactErrors.tooLong, { title, n: String(field.maxLength) });
  if (field.type === 'url' && !isUrl(value)) return contactErrors.url;
  if ((field.type === 'chips' || field.type === 'select') && !field.options.some((o) => o.value === value)) {
    return fill(contactErrors.option, { title });
  }
  return undefined;
}

/** One common field's problem, or undefined. */
export function checkCommon(key: CommonKey, raw: string): string | undefined {
  const value = raw.trim();
  switch (key) {
    case 'name':
      if (!value) return contactErrors.nameRequired;
      return value.length > LIMITS.name ? fill(contactErrors.tooLong, { title: 'Name', n: String(LIMITS.name) }) : undefined;
    case 'email':
      if (!value) return contactErrors.emailRequired;
      return value.length > LIMITS.email || !EMAIL.test(value) ? contactErrors.email : undefined;
    case 'message':
      if (!value) return contactErrors.messageRequired;
      if (value.length < LIMITS.messageMin) return fill(contactErrors.tooShort, { title: 'Your message', n: String(LIMITS.messageMin) });
      return value.length > LIMITS.messageMax
        ? fill(contactErrors.tooLong, { title: 'Your message', n: String(LIMITS.messageMax) })
        : undefined;
    case 'linkedin':
      if (!value) return undefined;
      return value.length > LIMITS.linkedin || !isUrl(value) ? contactErrors.url : undefined;
    case 'plan':
      return value.length > LIMITS.plan ? fill(contactErrors.tooLong, { title: 'The project plan', n: String(LIMITS.plan) }) : undefined;
  }
}

/** Everything wrong with a whole submission, in form order (empty = fine). */
export function validate(config: ContactConfig, values: ContactValues): FieldErrors {
  const errors: FieldErrors = {};
  const purpose = findPurpose(config, values.purpose);
  if (!purpose) {
    errors.purpose = contactErrors.purpose;
  } else {
    for (const field of purpose.fields) {
      const problem = checkField(field, values.fields[field.id] ?? '');
      if (problem) errors[fieldKey(field.id)] = problem;
    }
  }
  for (const key of ['name', 'email', 'message', 'linkedin', 'plan'] as CommonKey[]) {
    const problem = checkCommon(key, values[key]);
    if (problem) errors[key] = problem;
  }
  return errors;
}

/**
 * The values reduced to what the chosen purpose allows (unknown fields dropped, all
 * strings trimmed). Used by the server on whatever arrives, and by the form before sending.
 */
export function clean(config: ContactConfig, input: unknown): ContactValues {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const purposeId = str(o.purpose);
  const purpose = findPurpose(config, purposeId);
  const rawFields = (o.fields && typeof o.fields === 'object' ? o.fields : {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  for (const field of purpose?.fields ?? []) {
    const v = str(rawFields[field.id]);
    if (v) fields[field.id] = v;
  }
  return {
    purpose: purposeId,
    fields,
    name: str(o.name),
    email: str(o.email),
    message: str(o.message),
    linkedin: str(o.linkedin),
    plan: str(o.plan),
  };
}

/**
 * The one-line summary: "💼 Job opportunity · AI Engineer · Acme · Remote · Full-time".
 * Chips, selects and short text in field order; links and long text are left out.
 */
export function summaryLine(purpose: Purpose, fields: Record<string, string>): string {
  const parts = purpose.fields
    .filter((f) => f.type !== 'url' && f.type !== 'textarea' && fields[f.id])
    .map((f) => displayValue(f, fields[f.id]));
  return [`${purpose.emoji} ${purpose.label}`, ...parts].join(' · ');
}

/** The email subject: "💼 Job opportunity · AI Engineer · Acme" (or the visitor's name). */
export function subjectLine(purpose: Purpose, values: ContactValues): string {
  const details = purpose.subjectFields
    .map((id) => {
      const field = purpose.fields.find((f) => f.id === id);
      const value = values.fields[id];
      return field && value ? displayValue(field, value) : '';
    })
    .filter(Boolean);
  const tail = details.length > 0 ? details : [values.name];
  return [`${purpose.emoji} ${purpose.subjectLabel}`, ...tail].join(' · ').slice(0, 200);
}
