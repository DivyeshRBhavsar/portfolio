import StoryText from '../StoryText';

/** Sizes are canvas units (em of --s-body), so they scale with the slide. */
export default function BulletList({ bullets }: { bullets: string[] }) {
  return (
    <ul className="space-y-[0.55em]">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex gap-[0.6em] leading-[1.45] text-ink">
          <span
            aria-hidden="true"
            className="mt-[0.55em] h-[0.4em] w-[0.4em] shrink-0 rounded-full bg-red"
          />
          <span>
            <StoryText text={bullet} />
          </span>
        </li>
      ))}
    </ul>
  );
}
