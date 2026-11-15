/**
 * The home page life story (content/life-story.json), as checked by lib/lifeStory.ts.
 * Plain module: types and small helpers, safe in the browser. Fields that were missing
 * or still "TODO" in the JSON are left out (undefined), so components just check them.
 */

/** A link to a project story: its title and where it opens. */
export type StoryRef = { slug: string; title: string; href: string };

export type Chapter = { title: string; luffy: string };

export type EducationStop = {
  degree: string;
  field?: string;
  school: string;
  place?: string;
  start?: string;
  end?: string;
  highlights: string[];
  /** From "project" ({label, name, story}); an old plain "story" slug becomes a project named after the story. */
  project?: EducationProject;
};

/** A stop's named project link: "Final project  Face Recognition Login System ▶". */
export type EducationProject = { label?: string; name: string; story: StoryRef };

export type Certification = { name: string; year?: string };

export type JobKind = 'software' | 'data';

export type Job = {
  role: string;
  company: string;
  place?: string;
  start?: string;
  /** "YYYY", "YYYY-MM" or "present". */
  end?: string;
  kind: JobKind;
  did?: string;
  learned?: string;
  stories: StoryRef[];
};

export type Track = {
  id: string;
  role: string;
  pitch?: string;
  evidence: StoryRef[];
  /** The jobs named in "experience", in that order. */
  experience: Job[];
  skills: string[];
  resume?: string;
};

export type Principle = { title: string; proof?: StoryRef };

export type NowItem = {
  icon: string;
  label: string;
  /** Absent for the "auto:" item (the GitHub currently-working-on data). */
  text?: string;
  auto: boolean;
  stories: StoryRef[];
};

/**
 * The address split so the full thing never appears in the HTML: each part reversed;
 * EmailButton puts it together in the browser, only when clicked.
 */
export type EmailParts = { user: string; domain: string };

export type LifeStory = {
  intro: Chapter;
  /** null: nothing left to show in that chapter. */
  education: (Chapter & { stops: EducationStop[]; certifications: Certification[] }) | null;
  experience: (Chapter & { jobs: Job[] }) | null;
  tracks: (Chapter & { items: Track[]; principles: Principle[] }) | null;
  now: (Chapter & { updated?: string; items: NowItem[] }) | null;
  contact: Chapter & {
    linkedin?: string;
    availability?: string;
    email?: EmailParts;
    resumeNote?: string;
  };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2017" → "2017", "2022-01" → "Jan 2022", "present" → "present". */
export function formatPoint(value: string): string {
  if (value === 'present') return 'present';
  const m = value.match(/^(\d{4})-(\d{2})$/);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : value;
}

/** "2017 – 2021", "Jan 2022 – Oct 2023", "May 2026 – present"; undefined without a start. */
export function formatRange(start?: string, end?: string): string | undefined {
  if (!start) return undefined;
  return end ? `${formatPoint(start)} – ${formatPoint(end)}` : formatPoint(start);
}

/** "2026-11" → "November 2026". */
export function formatMonthLong(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})$/);
  return m ? `${MONTHS_LONG[Number(m[2]) - 1]} ${m[1]}` : value;
}

/** Story slugs open story mode; "portfolio" is this site (the web development projects). */
export function storyHref(slug: string): string {
  return slug === 'portfolio' ? '/projects?category=web-development' : `/projects/${slug}`;
}
