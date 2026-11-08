'use client';

/* eslint-disable @next/next/no-img-element -- must match the clips' box exactly for a seamless swap. */

import { useState } from 'react';
import { motion } from 'motion/react';
import { CHARACTER, MEDIA_CLASS } from './introAssets';

const ALT = 'Luffy, a cartoon guide in a red hoodie and backwards black cap, smiling';

const LOOP = { repeat: Infinity, ease: 'easeInOut' } as const;

/** neutral-pose.png with a slow float, breathing scale and slight tilt (or a still when animate is false). */
export default function IdleCharacter({ animate }: { animate: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  const props = {
    src: CHARACTER.neutral,
    draggable: false,
    className: MEDIA_CLASS,
    onError: () => setFailed(true),
  };

  if (!animate) return <img alt={ALT} {...props} />;

  return (
    <motion.img
      alt={ALT}
      {...props}
      // Pivot near the feet so the tilt reads as a sway, not a spin.
      style={{ transformOrigin: '50% 90%' }}
      // Every keyframe track starts at rest, matching namaste's last frame.
      animate={{ y: [0, -8, 0], scale: [1, 1.02, 1], rotate: [0, -1.5, 0, 1.5, 0] }}
      transition={{
        y: { duration: 4, ...LOOP },
        scale: { duration: 3.2, ...LOOP },
        rotate: { duration: 6.5, ...LOOP },
      }}
    />
  );
}
