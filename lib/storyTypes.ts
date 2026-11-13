/**
 * The shape of a project story (content/project_stories/<slug>.json). No Node imports,
 * so client components can use these types and helpers; the loader is lib/stories.ts.
 */

export type StoryLink = { label: string; url: string };
export type Metric = { label: string; value: string };
export type Bar = { label: string; value: number; highlight?: boolean };
export type Step = { label: string; detail: string };

/** Any slide can also carry metric cards and/or bullets below its main content. */
type SlideBase = {
  /** Luffy's line for this slide. */
  narration: string;
  metrics?: Metric[];
  bullets?: string[];
};

export type TitleSlide = SlideBase & { type: 'title'; title: string; subtitle?: string };
export type BulletsSlide = SlideBase & { type: 'bullets'; title: string; bullets: string[] };
export type StepsSlide = SlideBase & { type: 'steps'; title: string; steps: Step[] };
export type MetricsSlide = SlideBase & { type: 'metrics'; title: string; metrics: Metric[] };
export type BarsSlide = SlideBase & {
  type: 'bars';
  title: string;
  unit: string;
  bars: Bar[];
  lowerIsBetter?: boolean;
};
/** Bullets, then the story's repo and links as buttons. */
export type LinksSlide = SlideBase & { type: 'links'; title: string };

export type Slide = TitleSlide | BulletsSlide | StepsSlide | MetricsSlide | BarsSlide | LinksSlide;
export type SlideType = Slide['type'];

export type Story = {
  slug: string;
  title: string;
  hook: string;
  /** https://github.com/<owner>/<name> (an old name still works after a rename). */
  repo: string;
  links: StoryLink[];
  tags: string[];
  /** Shown in story mode's picker. */
  featured: boolean;
  /** Sort order (lowest first). */
  order: number;
  slides: Slide[];
};

/** What a project card and the home badge need to know about a story. */
export type StorySummary = Pick<Story, 'slug' | 'title' | 'hook'>;

/** Placeholder content: shown as "Coming soon", never as raw "TODO". */
export function isTodo(value: string | number | undefined | null): boolean {
  return typeof value === 'string' && value.includes('TODO');
}

/** Links worth showing as buttons (a TODO or empty URL hides the button). */
export function usableUrl(url: string | undefined | null): url is string {
  return typeof url === 'string' && url.trim() !== '' && !isTodo(url);
}

export function storyPath(slug: string, slide?: number): string {
  return `/projects/${slug}${slide && slide > 1 ? `#${slide}` : ''}`;
}
