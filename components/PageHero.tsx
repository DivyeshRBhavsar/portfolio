import LuffyHead from './character/LuffyHead';
import PageHeroLuffy from './PageHeroLuffy';

/**
 * The band at the top of Work with me, Projects, Blog and Contact. One style and one set
 * of sizes for every page, defined here only:
 *   colours  Work with me's peach band, ink text, muted extras, faint ink border (they
 *            follow the four time-of-day themes through the colour variables);
 *   sizes    padding, title/subtitle sizes, Luffy's head, the bubble's width and the
 *            spacing, per breakpoint; text is capped at one width;
 *   height   a minimum per breakpoint that fits the tallest band (Work with me's), so
 *            every band is the same height and the title sits in the same place
 *            (phones: 246px, with Luffy's line at its 2-line maximum).
 * Extras (badges, counts, a time line) sit in one row that wraps neatly.
 *
 * Phones (< 640px): one compact band, identical on every page: a small Luffy head beside
 * the title, the subtitle (max 2 lines), his line in a bubble (max 2 lines; screen
 * readers get it all), and the extras on one line that scrolls sideways. Unprefixed
 * classes below are the phone values (each has an sm: value for larger screens); max-sm:
 * classes are phone-only additions. Tablet and desktop are unchanged.
 */
const SIZE = {
  band: 'min-h-[15.375rem] sm:min-h-[32.625rem]',
  inner: 'mx-auto max-w-5xl px-6 py-4 sm:py-20',
  titleRow: 'flex items-center gap-3 sm:block',
  phoneHead: 'h-10 w-10 sm:hidden',
  title: 'font-display text-2xl font-bold leading-tight sm:text-5xl',
  subtitle: 'mt-2 max-w-2xl text-sm sm:mt-4 sm:text-lg max-sm:line-clamp-2',
  luffy: 'mt-3 sm:mt-8',
  head: 'h-10 w-10 max-sm:hidden sm:h-12 sm:w-12',
  bubble: 'max-w-xl px-4 py-2.5 text-sm sm:text-base max-sm:px-3 max-sm:py-1.5',
  bubbleText: 'max-sm:max-h-10 max-sm:overflow-hidden',
  extras:
    'mt-3 flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-3 text-sm text-ink-muted sm:mt-8 chip-row max-sm:relative max-sm:min-h-10 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:whitespace-nowrap max-sm:text-xs max-sm:[&>*]:shrink-0 max-sm:[&_p[id]]:whitespace-normal',
};

export default function PageHero({
  title,
  subtitle,
  luffy,
  extras,
}: {
  title: string;
  subtitle: string;
  /** One line, or several (he picks one at random). May use {nameComma}. */
  luffy: string | string[];
  extras?: React.ReactNode;
}) {
  return (
    <section className={`border-b-2 border-ink/10 bg-peach ${SIZE.band}`}>
      <div className={SIZE.inner}>
        <div className={SIZE.titleRow}>
          {/* Phones: Luffy's head sits beside the title (the bubble's own head is hidden). */}
          <LuffyHead talking={false} className={SIZE.phoneHead} />
          <h1 className={`text-ink ${SIZE.title}`}>{title}</h1>
        </div>
        <p className={`text-ink ${SIZE.subtitle}`}>{subtitle}</p>
        <div className={SIZE.luffy}>
          <PageHeroLuffy
            lines={typeof luffy === 'string' ? [luffy] : luffy}
            headClass={SIZE.head}
            bubbleClass={SIZE.bubble}
            textClass={SIZE.bubbleText}
          />
        </div>
        {extras && <div className={SIZE.extras}>{extras}</div>}
      </div>
    </section>
  );
}
