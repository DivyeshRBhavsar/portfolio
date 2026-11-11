'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { CHARACTER_DROP_SHADOW, GLIDE, IDLE } from './introAssets';

const LOOP = { repeat: Infinity, ease: 'easeInOut' } as const;

/**
 * The 5:6 box Luffy lives in, with his ground shadow and outline shadow. Used both in
 * the intro overlay and in the hero so the shared-element glide (layoutId) matches.
 */
export default function CharacterFigure({
  layoutId,
  floating,
  raised = false,
  onLayoutAnimationComplete,
  children,
}: {
  layoutId?: string;
  /** Idle loop running: the ground shadow shrinks and fades as he floats up. */
  floating: boolean;
  /** Lift above the fading overlay while gliding. */
  raised?: boolean;
  onLayoutAnimationComplete?: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={{ layout: GLIDE }}
      onLayoutAnimationComplete={onLayoutAnimationComplete}
      className={`relative aspect-[5/6] w-full ${raised ? 'z-[61]' : ''}`}
    >
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
      <div className="absolute inset-0" style={{ filter: CHARACTER_DROP_SHADOW }}>
        {children}
      </div>
    </motion.div>
  );
}
