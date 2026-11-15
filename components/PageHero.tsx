import PageHeroLuffy from './PageHeroLuffy';

/**
 * The band at the top of Work with me, Projects, Blog and Contact. One style and one set
 * of sizes for every page, defined here only:
 *   colours  Work with me's peach band, ink text, muted extras, faint ink border (they
 *            follow the four time-of-day themes through the colour variables);
 *   sizes    padding, title/subtitle sizes, Luffy's head, the bubble's width and the
 *            spacing, per breakpoint; text is capped at one width;
 *   height   a minimum per breakpoint that fits the tallest band (Work with me's), so
 *            every band is the same height and the title sits in the same place.
 * Extras (badges, counts, a time line) sit in one row that wraps neatly.
 */
const SIZE = {
  band: 'min-h-[31.5rem] sm:min-h-[32.625rem]',
  inner: 'mx-auto max-w-5xl px-6 py-10 sm:py-20',
  title: 'font-display text-3xl font-bold leading-tight sm:text-5xl',
  subtitle: 'mt-3 max-w-2xl text-base sm:mt-4 sm:text-lg',
  luffy: 'mt-6 sm:mt-8',
  head: 'h-10 w-10 sm:h-12 sm:w-12',
  bubble: 'max-w-xl px-4 py-2.5 text-sm sm:text-base',
  extras: 'mt-6 flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-3 text-sm text-ink-muted sm:mt-8',
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
        <h1 className={`text-ink ${SIZE.title}`}>{title}</h1>
        <p className={`text-ink ${SIZE.subtitle}`}>{subtitle}</p>
        <div className={SIZE.luffy}>
          <PageHeroLuffy lines={typeof luffy === 'string' ? [luffy] : luffy} headClass={SIZE.head} bubbleClass={SIZE.bubble} />
        </div>
        {extras && <div className={SIZE.extras}>{extras}</div>}
      </div>
    </section>
  );
}
