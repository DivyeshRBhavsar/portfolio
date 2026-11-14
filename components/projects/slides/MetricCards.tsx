'use client';

import { motion } from 'motion/react';
import type { Metric } from '@/lib/storyTypes';
import { useCanvas } from '../SlideCanvas';
import StoryText from '../StoryText';

/**
 * Big-number cards; the numbers fade in one after another. Up to 4 in a row on the
 * landscape canvases, 2 per row on the portrait one. `focusIndex`: the card Luffy is
 * talking about (highlighted while his narration types).
 */
export default function MetricCards({
  metrics,
  animate,
  focusIndex = null,
  maxColumns,
}: {
  metrics: Metric[];
  animate: boolean;
  focusIndex?: number | null;
  /** In a narrow column (beside a chart). */
  maxColumns?: number;
}) {
  const canvas = useCanvas();
  const columns = Math.min(metrics.length, maxColumns ?? (canvas === 'portrait' ? 2 : 4));

  return (
    <dl
      className="grid gap-[0.6em]"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {metrics.map((metric, i) => (
        <div
          key={i}
          className={`flex flex-col-reverse justify-end rounded-[0.6em] border-[3px] bg-cream px-[0.8em] py-[0.6em] ${
            focusIndex === i ? 'story-focus border-red-deep' : 'border-ink/15'
          }`}
        >
          <dt className="mt-[0.2em] text-[length:var(--s-small)] leading-snug text-ink-muted">
            <StoryText text={metric.label} />
          </dt>
          <motion.dd
            initial={animate ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: animate ? 0.15 + i * 0.08 : 0, ease: 'easeOut' }}
            className="font-display text-[length:var(--s-metric)] font-bold leading-[1.1] text-red-deep"
          >
            <StoryText text={metric.value} />
          </motion.dd>
        </div>
      ))}
    </dl>
  );
}
