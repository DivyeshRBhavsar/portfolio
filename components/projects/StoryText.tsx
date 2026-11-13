import { comingSoonLabel } from '@/components/character/luffyLines';
import { isTodo } from '@/lib/storyTypes';

/** A subtle "Coming soon" badge, shown wherever story content is still a TODO. */
export function ComingSoon() {
  return (
    <span className="inline-flex items-center rounded-full border border-ink/20 bg-cream px-2.5 py-0.5 align-middle font-mono text-xs font-normal text-ink-muted">
      {comingSoonLabel}
    </span>
  );
}

/** Story content as text, or "Coming soon" if it contains "TODO" (never the raw TODO). */
export default function StoryText({ text }: { text: string | number }) {
  return isTodo(text) ? <ComingSoon /> : <>{text}</>;
}
