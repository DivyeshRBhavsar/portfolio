'use client';

import { useEffect, useRef, useState } from 'react';
import { formatRange, type Certification, type EducationStop } from '@/lib/lifeStoryTypes';
import { homeCertificationsLabel } from '@/components/character/luffyLines';
import { NamedStoryLink } from './StoryLinks';

const HEAD_PX = 28;
const REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * Chapter 1: the stops as an ordered list along a vertical line. A small Luffy head
 * travels down the line as the reader scrolls through it (stays at the top with
 * reduced motion). Certifications follow as small badges.
 */
export default function EducationRoadmap({
  stops,
  certifications,
}: {
  stops: EducationStop[];
  certifications: Certification[];
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list || window.matchMedia(REDUCED).matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = list.getBoundingClientRect();
      // 0 when the list's top reaches the middle of the screen, 1 when its bottom does.
      const mid = window.innerHeight / 2;
      const p = rect.height > 0 ? (mid - rect.top) / rect.height : 0;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div>
      {stops.length > 0 && (
        <div className="relative">
          {/* The road, and Luffy on it. */}
          <span aria-hidden="true" className="absolute bottom-2 left-[13px] top-2 w-1 rounded-full bg-ink/15" />
          {/* eslint-disable-next-line @next/next/no-img-element -- small decoration */}
          <img
            src="/character/luffy-head.png"
            alt=""
            width={HEAD_PX}
            height={HEAD_PX}
            className="pointer-events-none absolute left-0 z-10 rounded-full border-2 border-ink bg-sun object-cover"
            style={{ top: `calc(${progress} * (100% - ${HEAD_PX}px))` }}
          />
          <ol ref={listRef} className="space-y-10 pl-12">
            {stops.map((stop) => {
              const dates = formatRange(stop.start, stop.end);
              return (
                <li key={`${stop.degree}-${stop.school}`} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[42px] top-1.5 h-4 w-4 rounded-full border-2 border-ink bg-surface"
                  />
                  <h3 className="font-display text-lg font-semibold text-ink sm:text-xl">
                    {stop.degree}
                    {stop.field && <span className="font-normal text-ink-muted">, {stop.field}</span>}
                  </h3>
                  <p className="mt-1 text-ink">
                    {stop.school}
                    {stop.place && <span className="text-ink-muted"> · {stop.place}</span>}
                  </p>
                  {dates && <p className="mt-1 font-mono text-sm text-ink-muted">{dates}</p>}
                  {stop.highlights.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted marker:text-red-deep sm:text-base">
                      {stop.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  )}
                  {stop.project && (
                    <NamedStoryLink
                      href={stop.project.story.href}
                      name={stop.project.name}
                      label={stop.project.label}
                      className="mt-2"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {certifications.length > 0 && (
        <div className="mt-10">
          <h3 className="font-mono text-xs uppercase tracking-wide text-ink-muted">{homeCertificationsLabel}</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {certifications.map((c) => (
              <li
                key={c.name}
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink/20 bg-surface px-3 py-1.5 text-sm text-ink"
              >
                <span aria-hidden="true">🎓</span>
                {c.name}
                {c.year && <span className="rounded-full bg-ink/10 px-1.5 font-mono text-xs">{c.year}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
