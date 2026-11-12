/**
 * What Luffy remembers about a visitor. Browser only (no database): localStorage for
 * across visits, sessionStorage for this visit. Every access is wrapped in try/catch;
 * with storage blocked, every visit simply counts as new.
 *
 * localStorage   luffy-visitor   { name?, firstVisit, lastVisit, pages[], quiet? }
 *                luffy-theme     header toggle (components/theme)
 * sessionStorage luffy-session   { type, lastPage }  fixed at the first page of the visit
 *                luffy-home-seen '1' once the home stage has run this visit
 */

export const VISITOR_KEY = 'luffy-visitor';
export const SESSION_KEY = 'luffy-session';
export const HOME_SEEN_KEY = 'luffy-home-seen';
const STORAGE_PREFIX = 'luffy-';

export const NAME_MAX_LENGTH = 30;
const MAX_PAGES = 3;

export type VisitedPage = { path: string; label: string };

export type VisitorRecord = {
  name?: string;
  /** Local dates, YYYY-MM-DD. */
  firstVisit: string;
  lastVisit: string;
  /** Most recent first. */
  pages: VisitedPage[];
  /** Set by "Skip to portfolio" (Part C). */
  quiet?: boolean;
};

export type VisitorType = 'new' | 'returning';

export type SessionInfo = {
  type: VisitorType;
  /** The last page from an earlier visit, for "Continue: …". */
  lastPage: VisitedPage | null;
};

function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function readJson(storage: () => Storage, key: string): unknown {
  try {
    const raw = storage().getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(storage: () => Storage, key: string, value: unknown): void {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: Luffy just won't remember.
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

function isPage(value: unknown): value is VisitedPage {
  const page = value as VisitedPage;
  return !!page && typeof page.path === 'string' && typeof page.label === 'string';
}

/** Read and sanity-check the stored record (it's user-editable, so trust nothing). */
export function readVisitor(): VisitorRecord | null {
  const data = readJson(local, VISITOR_KEY) as Partial<VisitorRecord> | null;
  if (!data || typeof data !== 'object' || typeof data.firstVisit !== 'string') return null;
  const name = typeof data.name === 'string' ? cleanName(data.name) : '';
  return {
    name: name || undefined,
    firstVisit: data.firstVisit,
    lastVisit: typeof data.lastVisit === 'string' ? data.lastVisit : data.firstVisit,
    pages: Array.isArray(data.pages) ? data.pages.filter(isPage).slice(0, MAX_PAGES) : [],
    quiet: data.quiet === true,
  };
}

function writeVisitor(record: VisitorRecord): void {
  writeJson(local, VISITOR_KEY, record);
}

/**
 * Called on the first page of every visit (VisitTracker and the home stage; whichever
 * runs first). Fixes this visit's type: returning if anything was stored before it.
 */
export function beginSession(): SessionInfo {
  const existing = readJson(session, SESSION_KEY) as SessionInfo | null;
  if (existing && (existing.type === 'new' || existing.type === 'returning')) {
    return { type: existing.type, lastPage: isPage(existing.lastPage) ? existing.lastPage : null };
  }

  const record = readVisitor();
  const info: SessionInfo = {
    type: record ? 'returning' : 'new',
    lastPage: record?.pages[0] ?? null,
  };
  writeVisitor(
    record
      ? { ...record, lastVisit: today() }
      : { firstVisit: today(), lastVisit: today(), pages: [] }
  );
  writeJson(session, SESSION_KEY, info);
  return info;
}

/** Trim, collapse spaces, drop control characters, max 30 characters. Plain text only. */
export function cleanName(raw: string): string {
  const printable = Array.from(raw).filter((ch) => {
    const code = ch.codePointAt(0) ?? 0;
    return code > 0x1f && (code < 0x7f || code > 0x9f);
  });
  const cleaned = printable.join('').replace(/\s+/g, ' ').trim();
  return Array.from(cleaned).slice(0, NAME_MAX_LENGTH).join('').trim();
}

/** Returns the cleaned name that was saved, or '' if nothing usable was given. */
export function saveName(raw: string): string {
  const name = cleanName(raw);
  const record = readVisitor();
  if (name && record) writeVisitor({ ...record, name });
  return name;
}

export function recordPage(page: VisitedPage): void {
  const record = readVisitor();
  if (!record) return;
  const pages = [page, ...record.pages.filter((p) => p.path !== page.path)].slice(0, MAX_PAGES);
  writeVisitor({ ...record, pages });
}

export function readHomeSeen(): boolean {
  try {
    return session().getItem(HOME_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHomeSeen(): void {
  try {
    session().setItem(HOME_SEEN_KEY, '1');
  } catch {
    // Storage blocked: a reload replays the welcome.
  }
}

/** "Not you? Forget me": remove everything Luffy stored, in both storages. */
export function forgetEverything(): void {
  for (const storage of [local, session]) {
    try {
      const store = storage();
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
      }
      keys.forEach((key) => store.removeItem(key));
    } catch {
      // Nothing we can do; nothing was stored either.
    }
  }
}
