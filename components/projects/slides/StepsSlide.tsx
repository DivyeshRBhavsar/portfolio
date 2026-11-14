'use client';

import type { Step } from '@/lib/storyTypes';
import { useCanvas } from '../SlideCanvas';
import StoryText from '../StoryText';

/**
 * A left-to-right pipeline of boxes with arrows. On the portrait canvas it runs top to
 * bottom as compact rows (number beside the text), so four steps fit the slide.
 */
export default function Steps({ steps }: { steps: Step[] }) {
  const vertical = useCanvas() === 'portrait';

  if (vertical) {
    return (
      <ol className="flex flex-col">
        {steps.map((step, i) => (
          <li key={i} className="flex flex-col items-center">
            <div className="flex w-full gap-[0.6em] rounded-[0.6em] border-[3px] border-ink bg-cream px-[0.7em] py-[0.5em]">
              <span className="pt-[0.15em] font-mono text-[length:var(--s-small)] text-red-deep">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="font-display text-[1.05em] font-semibold leading-tight text-ink">
                  <StoryText text={step.label} />
                </p>
                <p className="mt-[0.2em] text-[length:var(--s-small)] leading-snug text-ink-muted">
                  <StoryText text={step.detail} />
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className="font-display leading-[1.1] text-ink-muted">
                ↓
              </span>
            )}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="flex flex-row items-stretch gap-[0.4em]">
      {steps.map((step, i) => (
        <li key={i} className="flex flex-1 flex-row items-center gap-[0.4em]">
          <div className="w-full flex-1 self-stretch rounded-[0.6em] border-[3px] border-ink bg-cream p-[0.7em]">
            <p className="font-mono text-[length:var(--s-small)] text-red-deep">
              {String(i + 1).padStart(2, '0')}
            </p>
            <p className="mt-[0.1em] font-display text-[1.1em] font-semibold leading-tight text-ink">
              <StoryText text={step.label} />
            </p>
            <p className="mt-[0.3em] text-[length:var(--s-small)] leading-snug text-ink-muted">
              <StoryText text={step.detail} />
            </p>
          </div>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="shrink-0 font-display text-[1.3em] text-ink-muted">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
