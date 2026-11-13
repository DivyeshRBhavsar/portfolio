'use client';

import { motion } from 'motion/react';
import type { Metric } from '@/lib/storyTypes';
import StoryText from '../StoryText';

/** Big-number cards; the numbers fade in one after another. */
export default function MetricCards({ metrics, animate }: { metrics: Metric[]; animate: boolean }) {
  return (
    <dl className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
      {metrics.map((metric, i) => (
        <div
          key={i}
          className="flex flex-col-reverse rounded-xl border-2 border-ink/15 bg-cream px-4 py-3"
        >
          <dt className="mt-1 text-sm leading-snug text-ink-muted">
            <StoryText text={metric.label} />
          </dt>
          <motion.dd
            initial={animate ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: animate ? 0.15 + i * 0.08 : 0, ease: 'easeOut' }}
            className="font-display text-3xl font-bold leading-tight text-red-deep"
          >
            <StoryText text={metric.value} />
          </motion.dd>
        </div>
      ))}
    </dl>
  );
}
