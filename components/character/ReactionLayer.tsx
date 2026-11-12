'use client';

/* eslint-disable @next/next/no-img-element -- hand-timed animated WebP; next/image's
   lazy loading and wrappers would break the timing. */

import { useEffect, useRef } from 'react';
import { CLIPS, MEDIA_CLASS, WIDE_MEDIA_CLASS, clipSrc, type ClipName } from './introAssets';
import { useBlobUrl, useClipBlobs } from './clipBlobs';
import type { CurrentClip } from './useReactionClips';
import type { MediaFormat } from './useStageSetup';

type Props = {
  format: MediaFormat;
  /** Clips to have ready (downloaded once, then replayed from memory). */
  preload: readonly ClipName[];
  current: CurrentClip | null;
  onPlaying: (id: number) => void;
  onEnded: (id: number, reason: string) => void;
  onError: (clip: ClipName) => void;
};

function mediaClass(clip: ClipName): string {
  return 'wide' in CLIPS[clip] ? WIDE_MEDIA_CLASS : MEDIA_CLASS;
}

/** Layered over the still in Luffy's box; shows a clip only while it's really playing. */
export default function ReactionLayer(props: Props) {
  return props.format === 'webm' ? <ReactionVideos {...props} /> : <ReactionWebp {...props} />;
}

/** WebM: one preloaded <video> per clip, rewound and played on demand. */
function ReactionVideos({ preload, current, onPlaying, onEnded, onError }: Props) {
  const videos = useRef(new Map<ClipName, HTMLVideoElement>());
  const clips = current && !preload.includes(current.clip) ? [...preload, current.clip] : preload;

  useEffect(() => {
    if (current?.mode !== 'starting') return;
    const video = videos.current.get(current.clip);
    if (!video) return; // just mounted; the safety net covers a clip that never starts
    video.currentTime = 0;
    video.play().catch(() => onError(current.clip));
  }, [current, onError]);

  return clips.map((clip) => {
    const isCurrent = current?.clip === clip;
    return (
      <video
        key={clip}
        ref={(node) => {
          if (node) videos.current.set(clip, node);
          else videos.current.delete(clip);
        }}
        src={clipSrc(clip, 'webm')}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className={mediaClass(clip)}
        // After "ended" it holds its last frame until the still swaps back in the same render.
        style={{ opacity: isCurrent && current.mode === 'playing' ? 1 : 0 }}
        onPlaying={() => isCurrent && onPlaying(current.id)}
        onEnded={() => isCurrent && onEnded(current.id, 'video ended')}
        onError={() => onError(clip)}
      />
    );
  });
}

/** WebP: each clip fetched once into a Blob; each play is a fresh blob: URL on a fresh <img>. */
function ReactionWebp({ preload, current, onPlaying, onError }: Props) {
  const wanted =
    current && !preload.includes(current.clip) ? [...preload, current.clip] : preload;
  const urls = wanted.map((clip) => clipSrc(clip, 'webp'));
  const blobs = useClipBlobs(urls, (url) => {
    const clip = wanted.find((c) => clipSrc(c, 'webp') === url);
    if (clip) onError(clip);
  });

  const active = current && current.mode !== 'settling' ? current : null;
  const blob = active ? blobs.get(clipSrc(active.clip, 'webp')) : undefined;
  const url = useBlobUrl(blob, active?.id ?? null);

  // Not loaded yet: useReactionClips' safety net returns to the still.
  if (!active || !url) return null;
  return (
    <img
      key={active.id}
      src={url}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={mediaClass(active.clip)}
      style={{ opacity: active.mode === 'playing' ? 1 : 0 }}
      onLoad={() => onPlaying(active.id)}
      onError={() => onError(active.clip)}
    />
  );
}
