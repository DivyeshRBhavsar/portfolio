'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { logStep } from './introDebug';

/**
 * Browsers share one animation per image URL, so a finished play-once WebP won't restart
 * under the same URL. Each WebP is fetched once into a Blob; every play gets a fresh
 * blob: URL, so it replays from memory with no further network requests.
 */
export function useClipBlobs(urls: readonly string[], onError: (url: string) => void) {
  const [blobs, setBlobs] = useState<ReadonlyMap<string, Blob>>(() => new Map());
  const loaded = useRef(new Set<string>());
  const reportError = useEffectEvent(onError);
  const key = urls.join('|');

  useEffect(() => {
    const controller = new AbortController();
    const wanted = key ? key.split('|') : [];
    for (const url of wanted.filter((u) => !loaded.current.has(u))) {
      fetch(url, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          loaded.current.add(url);
          logStep('webp blob loaded', `${url}, ${blob.size} bytes`);
          setBlobs((previous) => new Map(previous).set(url, blob));
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return; // unmounted, or the list grew (refetched)
          logStep('webp fetch failed', `${url}: ${String(error)}`);
          reportError(url);
        });
    }
    return () => controller.abort();
  }, [key]);

  return blobs;
}

/** A fresh blob: URL for each play (playKey), revoked when that play is over. */
export function useBlobUrl(blob: Blob | undefined, playKey: string | number | null) {
  const [entry, setEntry] = useState<{ key: string | number; url: string } | null>(null);

  useEffect(() => {
    if (!blob || playKey === null) return;
    const url = URL.createObjectURL(blob);
    // Set from a frame callback rather than synchronously in the effect.
    const frame = requestAnimationFrame(() => setEntry({ key: playKey, url }));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(url);
    };
  }, [blob, playKey]);

  return entry && entry.key === playKey && blob ? entry.url : null;
}
