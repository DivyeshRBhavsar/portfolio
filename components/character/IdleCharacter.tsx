'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { CHARACTER, IDLE, MEDIA_CLASS } from './introAssets';

const ALT = 'Luffy, a cartoon guide in a red hoodie and backwards black cap, smiling';

const LOOP = { repeat: Infinity, ease: 'easeInOut' } as const;

/**
 * neutral-pose.png with a slow float, breathing scale and slight tilt.
 * animate=false eases him back to rest (used before the waiting clip and for reduced motion);
 * hidden=true hides him instantly while a clip is showing in the same spot.
 */
export default function IdleCharacter({
  animate,
  hidden = false,
}: {
  animate: boolean;
  hidden?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  // Always the same element, so switching between still and idle never remounts it.
  return (
    <motion.img
      src={CHARACTER.neutral}
      alt={ALT}
      draggable={false}
      className={MEDIA_CLASS}
      onError={() => setFailed(true)}
      // Pivot near the feet so the tilt reads as a sway, not a spin. Opacity is set
      // directly (not animated) so the swap with a clip happens in a single frame.
      style={{ transformOrigin: '50% 88%', opacity: hidden ? 0 : 1 }}
      initial={false}
      // Every track starts at rest, so the loop begins exactly where the glide ended.
      animate={
        animate
          ? { y: [0, -IDLE.floatPx, 0], scale: [1, 1.02, 1], rotate: [0, -1.5, 0, 1.5, 0] }
          : { y: 0, scale: 1, rotate: 0 }
      }
      transition={
        animate
          ? {
              y: { duration: IDLE.floatS, ...LOOP },
              scale: { duration: IDLE.breatheS, ...LOOP },
              rotate: { duration: IDLE.tiltS, ...LOOP },
            }
          : { duration: IDLE.settleS, ease: 'easeOut' }
      }
    />
  );
}
