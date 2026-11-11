'use client';

/* eslint-disable @next/next/no-img-element -- hand-timed animated WebP; next/image's
   lazy loading and wrappers would break the timing. */

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react';
import { CHARACTER, MEDIA_CLASS } from './introAssets';
import { logStep } from './introDebug';
import type { MediaFormat } from './useIntroSetup';
import type { WaitingMode } from './useWaitingClip';

/**
 * The waiting-watch clip, layered over the still. Only mounted once the intro is over,
 * so nothing is downloaded before then.
 *
 * WebM: one preloaded <video>, replayed by rewinding (handled in useWaitingClip).
 * WebP: browsers share one animation per image URL, so a finished play-once WebP won't
 * restart under the same URL. The file is fetched once into a Blob, and each play gets
 * a fresh blob: URL, so it replays from memory with no further network requests.
 */
export default function WaitingClip(props: {
  format: MediaFormat;
  mode: WaitingMode;
  plays: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  onPlaying: () => void;
  onEnded: () => void;
  onError: () => void;
}) {
  return props.format === 'webm' ? <WaitingVideo {...props} /> : <WaitingWebp {...props} />;
}

function WaitingVideo({
  mode,
  videoRef,
  onPlaying,
  onEnded,
  onError,
}: Parameters<typeof WaitingClip>[0]) {
  return (
    <video
      ref={videoRef}
      src={CHARACTER.waiting.webm}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      // Hidden until it's really playing; after "ended" it stays paused on its last
      // frame until the parent swaps the still back in the same render.
      className={MEDIA_CLASS}
      style={{ opacity: mode === 'playing' ? 1 : 0 }}
      onPlaying={onPlaying}
      onEnded={onEnded}
      onError={onError}
    />
  );
}

function WaitingWebp({ mode, plays, onPlaying, onError }: Parameters<typeof WaitingClip>[0]) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const urlRef = useRef<string | null>(null);
  const reportError = useEffectEvent(onError);

  // Fetch once. On failure, disable the waiting clip on this device (idle float stays).
  useEffect(() => {
    const controller = new AbortController();
    fetch(CHARACTER.waiting.webp, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then((loaded) => {
        logStep('waiting: webp blob loaded', `${loaded.size} bytes, one network request`);
        setBlob(loaded);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return; // unmounted
        logStep('waiting: webp fetch failed, waiting clip disabled', String(error));
        reportError();
      });
    return () => controller.abort();
  }, []);

  // Each play: a fresh blob: URL on a fresh <img>, revoking the previous one.
  useEffect(() => {
    if (mode !== 'starting' || !blob || !imgRef.current) return;
    const url = URL.createObjectURL(blob);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    imgRef.current.src = url;
    logStep('waiting: replay from memory', `play #${plays + 1}`);
  }, [mode, blob, plays]);

  // Revoke the last URL on unmount.
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    },
    []
  );

  // Not ready yet: useWaitingClip's safety net returns to the still and tries later.
  if (!blob || (mode !== 'starting' && mode !== 'playing')) return null;
  return (
    <img
      key={plays}
      ref={imgRef}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={MEDIA_CLASS}
      style={{ opacity: mode === 'playing' ? 1 : 0 }}
      onLoad={onPlaying}
      onError={onError}
    />
  );
}
