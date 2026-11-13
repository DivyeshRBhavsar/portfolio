import { storyControls } from '@/components/character/luffyLines';
import { isTodo, usableUrl, type StoryLink } from '@/lib/storyTypes';

/** The story's repo and links as buttons (opening in a new tab). TODO URLs are hidden. */
export default function LinkButtons({ repo, links }: { repo: string; links: StoryLink[] }) {
  const buttons: StoryLink[] = [
    ...(usableUrl(repo) ? [{ label: storyControls.openRepo, url: repo }] : []),
    ...links.filter((link) => usableUrl(link.url) && !isTodo(link.label)),
  ];
  if (buttons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {buttons.map((link, i) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex min-h-11 items-center rounded-full border-2 border-ink px-5 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-sticker ${
            i === 0 ? 'bg-red text-white' : 'bg-surface text-ink hover:bg-sun hover:text-on-sun'
          }`}
        >
          {link.label}
          {i > 0 && <span aria-hidden="true">&nbsp;↗</span>}
        </a>
      ))}
    </div>
  );
}
