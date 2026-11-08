'use client';

/* eslint-disable @next/next/no-img-element -- hand-sequenced animated WebPs; next/image's
   lazy loading and wrappers would break the gapless timing. */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CHARACTER,
  MEDIA_CLASS,
  SEQUENCE_TIMEOUT_MS,
  WEBP_DURATION_MS,
  WEBP_SWAP_LEAD_MS,
} from './introAssets';
import type { MediaFormat } from './useIntroSetup';

/**
 * Plays hello-wave then namaste back to back, then calls onDone exactly once.
 * Any failure (load error, autoplay refused, stall) also calls onDone, so the
 * parent falls back to the still image.
 */
export default function CharacterSequence({
  format,
  onDone,
}: {
  format: MediaFormat;
  onDone: () => void;
}) {
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const timeout = setTimeout(finish, SEQUENCE_TIMEOUT_MS);
    return () => {
      clearTimeout(timeout);
      // Unmounted (e.g. skipped): ignore late ended/error/play() rejections.
      doneRef.current = true;
    };
  }, [finish]);

  return format === 'webm' ? <VideoSequence onFinish={finish} /> : <WebpSequence onFinish={finish} />;
}

function VideoSequence({ onFinish }: { onFinish: () => void }) {
  const helloRef = useRef<HTMLVideoElement>(null);
  const namasteRef = useRef<HTMLVideoElement>(null);
  const [showNamaste, setShowNamaste] = useState(false);

  useEffect(() => {
    // autoplay can be refused (e.g. power saving); treat that as a failure.
    helloRef.current?.play().catch(onFinish);
  }, [onFinish]);

  // When hello ends its last frame stays on screen; it is only hidden once namaste
  // reports "playing", so there's never a blank frame between clips.
  const startNamaste = () => {
    namasteRef.current?.play().catch(onFinish);
  };

  return (
    <>
      <video
        ref={namasteRef}
        src={CHARACTER.namaste.webm}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className={`${MEDIA_CLASS} ${showNamaste ? 'opacity-100' : 'opacity-0'}`}
        onPlaying={() => setShowNamaste(true)}
        onEnded={onFinish}
        onError={onFinish}
      />
      <video
        ref={helloRef}
        src={CHARACTER.hello.webm}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className={`${MEDIA_CLASS} ${showNamaste ? 'opacity-0' : 'opacity-100'}`}
        onEnded={startNamaste}
        onError={onFinish}
      />
    </>
  );
}

function WebpSequence({ onFinish }: { onFinish: () => void }) {
  const [namasteMounted, setNamasteMounted] = useState(false);
  const [namasteVisible, setNamasteVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Warm the cache so namaste paints the moment it's mounted.
    const preload = new Image();
    preload.src = CHARACTER.namaste.webp;
    return () => clearTimeout(timerRef.current);
  }, []);

  const after = (durationMs: number, fn: () => void) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, Math.max(0, durationMs - WEBP_SWAP_LEAD_MS));
  };

  return (
    <>
      {namasteMounted && (
        <img
          src={CHARACTER.namaste.webp}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={MEDIA_CLASS}
          onLoad={() => {
            setNamasteVisible(true);
            after(WEBP_DURATION_MS.namaste, onFinish);
          }}
          onError={onFinish}
        />
      )}
      {/* Rendered last so it sits on top until namaste has painted underneath. */}
      {!namasteVisible && (
        <img
          src={CHARACTER.hello.webp}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={MEDIA_CLASS}
          onLoad={() => after(WEBP_DURATION_MS.hello, () => setNamasteMounted(true))}
          onError={onFinish}
        />
      )}
    </>
  );
}
