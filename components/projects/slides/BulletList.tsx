import StoryText from '../StoryText';

export default function BulletList({ bullets }: { bullets: string[] }) {
  return (
    <ul className="space-y-2.5">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex gap-3 text-base leading-relaxed text-ink">
          <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-red" />
          <span>
            <StoryText text={bullet} />
          </span>
        </li>
      ))}
    </ul>
  );
}
