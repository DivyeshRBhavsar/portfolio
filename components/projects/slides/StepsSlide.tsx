import type { Step } from '@/lib/storyTypes';
import StoryText from '../StoryText';

/** A left-to-right pipeline of boxes with arrows; stacked top to bottom on mobile. */
export default function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col items-stretch gap-2 md:flex-row">
      {steps.map((step, i) => (
        <li key={i} className="flex flex-1 flex-col items-center gap-2 md:flex-row">
          <div className="w-full flex-1 self-stretch rounded-xl border-2 border-ink bg-cream p-4">
            <p className="font-mono text-xs text-red-deep">{String(i + 1).padStart(2, '0')}</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">
              <StoryText text={step.label} />
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              <StoryText text={step.detail} />
            </p>
          </div>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="shrink-0 font-display text-xl text-ink-muted">
              <span className="md:hidden">↓</span>
              <span className="hidden md:inline">→</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
