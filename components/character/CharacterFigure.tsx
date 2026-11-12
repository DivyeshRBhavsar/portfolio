'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { CHARACTER_DROP_SHADOW, IDLE } from './introAssets';

const LOOP = { repeat: Infinity, ease: 'easeInOut' } as const;

/**
 * The 5:6 box Luffy lives in, with his ground shadow, night glow, time-of-day tint and
 * outline shadow. Every clip and the still go inside, so they all get the same light.
 */
export default function CharacterFigure({
  floating,
  children,
}: {
  /** Idle loop running: the ground shadow shrinks and fades as he floats up. */
  floating: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative aspect-[5/6] w-full">
      {/* Ground shadow under his feet (feet sit at ~88% of the frame height). */}
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-[84%] h-[6%] w-[40%] rounded-full bg-ink blur-[6px]"
        style={{ x: '-50%', opacity: 0.18 }}
        animate={
          floating
            ? { scale: [1, 0.86, 1], opacity: [0.18, 0.12, 0.18] }
            : { scale: 1, opacity: 0.18 }
        }
        transition={floating ? { duration: IDLE.floatS, ...LOOP } : { duration: 0.3 }}
      />
      {/* Night only (--luffy-glow is 0 otherwise): a soft warm glow behind him. */}
      <div
        aria-hidden="true"
        className="absolute inset-[8%] rounded-full transition-opacity duration-1000"
        style={{
          opacity: 'var(--luffy-glow)',
          background: 'radial-gradient(closest-side, rgba(255, 196, 140, 0.32), transparent)',
        }}
      />
      {/* --luffy-tint matches him to the time-of-day light, for every clip and the still. */}
      <div
        className="absolute inset-0"
        style={{ filter: `var(--luffy-tint) ${CHARACTER_DROP_SHADOW}` }}
      >
        {children}
      </div>
    </div>
  );
}
