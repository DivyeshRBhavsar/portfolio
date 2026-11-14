// Plain module (no 'use client'): the root layout imports the pre-paint script from here.

/**
 * Reader settings for blog posts ("Aa"), saved in localStorage['luffy-reader'] and
 * shown through attributes on <html>, which the CSS in app/globals.css reads:
 *
 *   data-reader-size   s | m | l | xl
 *   data-reader-width  narrow | medium | wide
 *   data-reader-font   sans | serif | dyslexic
 *   data-reader-theme  auto | paper | sepia | night   (auto = the site's theme)
 *
 * BLOG_READER_SCRIPT sets them before first paint on full page loads of /blog/<slug>;
 * ReadingRoom sets them itself on client-side navigation (before paint) and removes
 * them when the reader leaves the post. On /blog with ?topic= or ?q=, the script also
 * hides the post list until React has applied the filter (no flash of every post).
 */

export const READER_KEY = 'luffy-reader';
export const READER_TIP_KEY = 'luffy-reader-tip';

export const READER_SIZES = ['s', 'm', 'l', 'xl'] as const;
export const READER_WIDTHS = ['narrow', 'medium', 'wide'] as const;
export const READER_FONTS = ['sans', 'serif', 'dyslexic'] as const;
export const READER_THEMES = ['auto', 'paper', 'sepia', 'night'] as const;

export type ReaderSettings = {
  size: (typeof READER_SIZES)[number];
  width: (typeof READER_WIDTHS)[number];
  font: (typeof READER_FONTS)[number];
  theme: (typeof READER_THEMES)[number];
};

/**
 * The standard settings: the only place they're defined. The "Aa" dialog (its
 * "Default" labels and Reset), the store and the pre-paint script all read this.
 */
export const READER_DEFAULTS: Readonly<ReaderSettings> = {
  size: 'm',
  width: 'medium',
  font: 'sans',
  theme: 'auto',
};

const OPTIONS = {
  size: READER_SIZES,
  width: READER_WIDTHS,
  font: READER_FONTS,
  theme: READER_THEMES,
} as const;

export const READER_ATTRS = Object.keys(OPTIONS).map((key) => `data-reader-${key}`);
export const READER_FOCUS_ATTR = 'data-reader-focus';
export const BLOG_FILTER_PENDING_ATTR = 'data-blog-filter-pending';

/** Anything stored → valid settings (it's user-editable, so trust nothing). */
export function parseReaderSettings(raw: string | null): ReaderSettings {
  let data: Record<string, unknown> = {};
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') data = parsed;
  } catch {
    // Not JSON: defaults.
  }
  const pickValid = <K extends keyof ReaderSettings>(key: K): ReaderSettings[K] =>
    (OPTIONS[key] as readonly string[]).includes(data[key] as string)
      ? (data[key] as ReaderSettings[K])
      : READER_DEFAULTS[key];
  return {
    size: pickValid('size'),
    width: pickValid('width'),
    font: pickValid('font'),
    theme: pickValid('theme'),
  };
}

export function isDefaultReader(settings: ReaderSettings): boolean {
  return (Object.keys(READER_DEFAULTS) as (keyof ReaderSettings)[]).every(
    (key) => settings[key] === READER_DEFAULTS[key]
  );
}

export function applyReaderSettings(settings: ReaderSettings): void {
  const root = document.documentElement;
  (Object.keys(OPTIONS) as (keyof ReaderSettings)[]).forEach((key) =>
    root.setAttribute(`data-reader-${key}`, settings[key])
  );
}

/** Runs inline in app/layout.tsx with the other pre-paint scripts. Mirrors the above. */
export const BLOG_READER_SCRIPT = `(function(){var p=location.pathname,d=document.documentElement;if(p==='/blog'||p==='/blog/'){if(/[?&](topic|q)=/.test(location.search))d.setAttribute('${BLOG_FILTER_PENDING_ATTR}','');return}if(p.indexOf('/blog/')!==0)return;var s={};try{s=JSON.parse(localStorage.getItem('${READER_KEY}')||'{}')||{}}catch(e){}var o=${JSON.stringify(OPTIONS)},def=${JSON.stringify(READER_DEFAULTS)};for(var k in o){var v=s[k];d.setAttribute('data-reader-'+k,o[k].indexOf(v)>=0?v:def[k])}})()`;
