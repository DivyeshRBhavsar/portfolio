'use client';

/* eslint-disable @next/next/no-img-element -- hand-timed animated WebP; next/image's
   lazy loading and wrappers would break the timing. */

import { useEffect, useRef, useState } from 'react';
import { CLIPS, MEDIA_CLASS, clipSrc } from './introAssets';
import { useBlobUrl, useClipBlobs } from './clipBlobs';
import type { MediaFormat } from './useStageSetup';

export type WelcomeVariant = 'welcome' | 'welcomeShort';

type Props = {
  format: MediaFormat;
  variant: WelcomeVariant;
  /** False while the loading screen waits; true to start the clip. */
  play: boolean;
  /** Downloaded and ready to play smoothly (false: it failed, skip the welcome). */
  onReady: (ok: boolean) => void;
  /** Really playing: the still can hide, and the safety net restarts. */
  onStarted: () => void;
  onEnded: (reason: string) => void;
};

/**
 * The welcome clip (full or short), preloaded hidden behind the loading screen and
 * started on cue. Ends via the video's "ended" event, the WebP's measured length, or
 * the parent's safety net.
 */
export default function WelcomeClip(props: Props) {
  return props.format === 'webm' ? <WelcomeVideo {...props} /> : <WelcomeWebp {...props} />;
}

function WelcomeVideo({ variant, play, onReady, onStarted, onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readyRef = useRef(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!play) return;
    // Autoplay can be refused (e.g. power saving): carry on without the clip.
    videoRef.current?.play().catch(() => onEnded('autoplay refused'));
  }, [play, onEnded]);

  const ready = (ok: boolean) => {
    if (readyRef.current) return;
    readyRef.current = true;
    onReady(ok);
  };

  return (
    <video
      ref={videoRef}
      src={clipSrc(variant, 'webm')}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      className={MEDIA_CLASS}
      style={{ opacity: play && started ? 1 : 0 }}
      onCanPlayThrough={() => ready(true)}
      onPlaying={() => {
        setStarted(true);
        onStarted();
      }}
      // No loop: the last frame (the neutral pose) holds until the still swaps in.
      onEnded={() => onEnded('video ended')}
      onError={() => (readyRef.current ? onEnded('load error') : ready(false))}
    />
  );
}

function WelcomeWebp({ variant, play, onReady, onStarted, onEnded }: Props) {
  const src = clipSrc(variant, 'webp');
  const reported = useRef(false);
  const blobs = useClipBlobs([src], () => {
    if (!reported.current) {
      reported.current = true;
      onReady(false);
    }
  });
  const blob = blobs.get(src);
  const url = useBlobUrl(blob, play ? 'welcome' : null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!blob || reported.current) return;
    reported.current = true;
    onReady(true);
  }, [blob, onReady]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={MEDIA_CLASS}
      onLoad={() => {
        onStarted();
        // Plays once and holds its last frame (the neutral pose).
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onEnded('webp timer'), CLIPS[variant].ms.webp);
      }}
      onError={() => onEnded('load error')}
    />
  );
}
