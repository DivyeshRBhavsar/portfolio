'use client';

import { motion } from 'motion/react';
import type { Bar } from '@/lib/storyTypes';
import { useCanvas } from '../SlideCanvas';
import StoryText from '../StoryText';

/** Room kept at the end of each bar for its value label. */
const VALUE_SPACE = '4.2em';

function decimals(value: number): number {
  const text = String(value);
  return text.includes('.') ? text.split('.')[1].length : 0;
}

/**
 * A plain horizontal bar chart: bars grow from zero when the slide appears, each value is
 * written just past its bar's end, and the highlighted bar is in the accent colour
 * (red-deep: the strongest bar in every theme; the others are ink-muted at 65%, all at
 * least 3:1 against the card). Labels sit beside the bars on the landscape canvases and
 * above them on the portrait one. `focusIndex`: the bar Luffy is talking about. The
 * values are also listed as text for screen readers.
 */
export default function BarChart({
  bars,
  unit,
  animate,
  focusIndex = null,
}: {
  bars: Bar[];
  unit: string;
  animate: boolean;
  focusIndex?: number | null;
}) {
  const stacked = useCanvas() === 'portrait';
  const max = Math.max(...bars.map((b) => b.value), 0) || 1;
  // Same number of decimals on every bar (0.8 shows as 0.80 next to 7.32).
  const places = Math.min(Math.max(...bars.map((b) => decimals(b.value))), 3);
  const format = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places });

  return (
    <figure>
      <div aria-hidden="true" className="space-y-[0.45em]">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`rounded-[0.5em] px-[0.35em] py-[0.2em] ${
              stacked ? '' : 'grid grid-cols-[minmax(0,32%)_minmax(0,1fr)] items-center gap-[0.6em]'
            } ${focusIndex === i ? 'story-focus' : ''}`}
          >
            <p
              className={`text-[length:var(--s-small)] leading-snug text-ink ${
                bar.highlight ? 'font-semibold' : ''
              } ${stacked ? 'mb-[0.2em]' : ''}`}
            >
              <StoryText text={bar.label} />
            </p>
            <div className="flex items-center gap-[0.4em]">
              <motion.div
                initial={animate ? { scaleX: 0 } : false}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: 0.7,
                  delay: animate ? 0.15 + i * 0.08 : 0,
                  ease: 'easeOut',
                }}
                style={{
                  width: `max(0.25em, calc((100% - ${VALUE_SPACE}) * ${bar.value / max}))`,
                  originX: 0,
                }}
                className={`h-[var(--s-bar)] shrink-0 rounded-[0.3em] ${
                  bar.highlight ? 'bg-red-deep' : 'bg-ink-muted/65'
                }`}
              />
              <span
                className={`font-mono text-[length:var(--s-small)] text-ink ${
                  bar.highlight ? 'font-semibold' : 'font-medium'
                }`}
              >
                {format(bar.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {bars.map((bar, i) => (
          <li key={i}>
            {bar.label}: {format(bar.value)}
          </li>
        ))}
      </ul>
      <figcaption className="mt-[0.6em] text-[length:var(--s-small)] text-ink-muted">
        <StoryText text={unit} />
      </figcaption>
    </figure>
  );
}
