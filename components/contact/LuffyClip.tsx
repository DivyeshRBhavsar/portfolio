'use client';

import { useState, useSyncExternalStore } from 'react';
import { NEUTRAL_POSE, clipSrc, type ClipName } from '@/components/character/introAssets';
import { useMediaFormat } from '@/components/character/mediaFormat';

const REDUCED = '(prefers-reduced-motion: reduce)';

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * A small full-body Luffy playing one clip once (celebrate after sending, thinking when
 * it failed), then his still pose. Still pose straight away with reduced motion, or if
 * the clip can't play. Decorative: the text beside it says what happened.
 */
export default function LuffyClip({ clip, className = 'w-32' }: { clip: ClipName; className?: string }) {
  const format = useMediaFormat();
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => true);
  const [ended, setEnded] = useState(false);
  const still = reduced || ended || format === null;
  const media = 'h-full w-full select-none object-contain';

  return (
    <span aria-hidden="true" className={`relative block aspect-[5/6] shrink-0 ${className}`}>
      {still ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={NEUTRAL_POSE} alt="" draggable={false} className={media} />
      ) : format === 'webm' ? (
        <video
          src={clipSrc(clip, 'webm')}
          autoPlay
          muted
          playsInline
          className={media}
          onEnded={() => setEnded(true)}
          onError={() => setEnded(true)}
        />
      ) : (
        // WebP clips play once on their own.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={clipSrc(clip, 'webp')} alt="" draggable={false} className={media} onError={() => setEnded(true)} />
      )}
    </span>
  );
}
