'use client';

/* eslint-disable @next/next/no-img-element -- hand-timed animated WebP; next/image's
   lazy loading and wrappers would break the timing. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTER, CLIP_MS, MEDIA_CLASS, SAFETY_MARGIN_MS } from './introAssets';
import { logStep } from './introDebug';
import type { MediaFormat } from './useIntroSetup';

/**
 * Plays the welcome clip once, then calls onDone exactly once:
 * - WebM: on the video's "ended" event.
 * - WebP: after the length measured from the file (images fire no "ended").
 * - Either: on a load error or refused autoplay (parent falls back to the still),
 *   or via the safety net if nothing has finished by clip length + 1 s.
 */
export default function IntroClip({
  format,
  onDone,
}: {
  format: MediaFormat;
  onDone: () => void;
}) {
  const lengthMs = CLIP_MS.welcome[format];
  const doneRef = useRef(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const finish = useCallback(
    (reason: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      logStep('ended', reason);
      onDone();
    },
    [onDone]
  );

  // Reset on every mount. The previous version only ever set this to true in the
  // cleanup, so React Strict Mode's dev-only unmount/remount left it stuck at true
  // and every later finish() was ignored: the intro never advanced without Skip.
  useEffect(() => {
    doneRef.current = false;
    return () => {
      doneRef.current = true; // really unmounted (e.g. Skip): ignore late events
    };
  }, []);

  // Safety net: clip length + 1 s, counted from mount, and restarted once playback
  // actually begins (so a slow download doesn't cut a playing clip short).
  useEffect(() => {
    const safety = setTimeout(() => finish('safety net'), lengthMs + SAFETY_MARGIN_MS);
    return () => clearTimeout(safety);
  }, [finish, lengthMs, startedAt]);

  const handleStarted = () => {
    logStep('playing', format);
    setStartedAt(Date.now());
  };

  return format === 'webm' ? (
    <WelcomeVideo onStarted={handleStarted} onFinish={finish} />
  ) : (
    <WelcomeWebp lengthMs={lengthMs} onStarted={handleStarted} onFinish={finish} />
  );
}

function WelcomeVideo({
  onStarted,
  onFinish,
}: {
  onStarted: () => void;
  onFinish: (reason: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // autoplay can be refused (e.g. power saving); treat that as a failure.
    videoRef.current?.play().catch(() => onFinish('autoplay refused'));
  }, [onFinish]);

  return (
    <video
      ref={videoRef}
      src={CHARACTER.welcome.webm}
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      className={MEDIA_CLASS}
      onPlaying={onStarted}
      // No loop attribute: the last frame holds while the glide starts.
      onEnded={() => onFinish('video ended')}
      onError={() => onFinish('load error')}
    />
  );
}

function WelcomeWebp({
  lengthMs,
  onStarted,
  onFinish,
}: {
  lengthMs: number;
  onStarted: () => void;
  onFinish: (reason: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <img
      src={CHARACTER.welcome.webp}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={MEDIA_CLASS}
      onLoad={() => {
        onStarted();
        // The file plays once and holds its last frame, so no early swap is needed.
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onFinish('webp timer'), lengthMs);
      }}
      onError={() => onFinish('load error')}
    />
  );
}
