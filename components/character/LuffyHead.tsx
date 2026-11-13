'use client';

import { useState } from 'react';
import { LUFFY_HEAD } from './introAssets';
import { useMediaFormat } from './mediaFormat';

/**
 * Luffy's head in a round badge: the looping clip (WebM, or WebP on Safari/iOS) while
 * he's talking, luffy-head.png otherwise. Decorative (alt=""): the text beside it says
 * who's talking.
 */
export default function LuffyHead({
  talking,
  className = 'h-10 w-10',
}: {
  talking: boolean;
  /** Size (and any extra classes) for the round frame. */
  className?: string;
}) {
  const format = useMediaFormat();
  const [broken, setBroken] = useState(false);
  const animated = talking && !broken && format !== null;
  const media = 'h-full w-full select-none object-cover';

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full border-2 border-ink bg-sun ${className}`}
    >
      {animated && format === 'webm' ? (
        <video
          src={LUFFY_HEAD.webm}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className={media}
          onError={() => setBroken(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={animated ? LUFFY_HEAD.webp : LUFFY_HEAD.png}
          alt=""
          draggable={false}
          className={media}
          onError={() => setBroken(true)}
        />
      )}
    </span>
  );
}
