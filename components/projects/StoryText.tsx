import { comingSoonLabel } from '@/components/character/luffyLines';
import { isTodo } from '@/lib/storyTypes';

/** A subtle "Coming soon" badge, shown wherever story content is still a TODO (sized in em, so it scales with the text around it, also on the slide canvas). */
export function ComingSoon() {
  return (
    <span className="inline-flex items-center rounded-full border border-ink/20 bg-cream px-[0.7em] py-[0.15em] align-middle font-mono text-[0.72em] leading-normal font-normal text-ink-muted">
      {comingSoonLabel}
    </span>
  );
}

/** Story content as text, or "Coming soon" if it contains "TODO" (never the raw TODO). */
export default function StoryText({ text }: { text: string | number }) {
  return isTodo(text) ? <ComingSoon /> : <>{text}</>;
}
