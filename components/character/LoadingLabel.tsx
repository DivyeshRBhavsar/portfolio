'use client';

import { motion } from 'motion/react';
import { LOADING_LABEL } from './introAssets';

/** "Loading page…" with the dots pulsing in turn (static under reduced motion). */
export default function LoadingLabel({ animate }: { animate: boolean }) {
  return (
    <p role="status" className="font-body text-base text-ink text-center">
      {LOADING_LABEL}
      <span aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={false}
            animate={animate ? { opacity: [0.2, 1, 0.2] } : { opacity: 1 }}
            transition={
              animate
                ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }
                : { duration: 0 }
            }
          >
            .
          </motion.span>
        ))}
      </span>
      {/* Screen readers get the ellipsis as text rather than three animated dots. */}
      <span className="sr-only">…</span>
    </p>
  );
}
