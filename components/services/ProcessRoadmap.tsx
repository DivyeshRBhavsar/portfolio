'use client';

import { useEffect, useRef, useState } from 'react';
import { workCheckpointLabel } from '@/components/character/luffyLines';
import type { ProcessStep } from '@/lib/services';
import { REDUCED_MOTION } from './planEvents';

const HEAD = 28;
const STEP_MS = 650;
const WIDE = '(min-width: 768px)';

/**
 * How a project works: an ordered list of steps, a vertical road on phones and a
 * horizontal one from md up. When it scrolls into view, a small Luffy head walks from
 * step to step once (it stays on the first step with reduced motion). The head is
 * placed on each step's dot by measuring the step, so it lines up in both layouts.
 */
export default function ProcessRoadmap({ steps }: { steps: ProcessStep[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [current, setCurrent] = useState(0);
  const [walking, setWalking] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  // Start walking the first time the road is in view.
  useEffect(() => {
    const list = listRef.current;
    if (!list || window.matchMedia(REDUCED_MOTION).matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setAnimate(true);
        setWalking(true);
      },
      // Once the road's top passes 70% of the screen height (on phones the whole road is
      // taller than the screen, so a share-of-the-road threshold might never be met).
      { rootMargin: '0px 0px -30% 0px' }
    );
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!walking) return;
    if (current >= steps.length - 1) {
      const frame = requestAnimationFrame(() => setWalking(false));
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => setCurrent((c) => c + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [walking, current, steps.length]);

  // Put the head on the current step's dot (again on resize, as the layout changes).
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const place = () => {
      frame = 0;
      const li = list.children[current] as HTMLElement | undefined;
      if (!li) return;
      const wide = window.matchMedia(WIDE).matches;
      // Dot centre: (8, 8) inside the step when wide; (-34, 10) on phones (see the dot's classes).
      setPos(
        wide
          ? { left: li.offsetLeft + 8 - HEAD / 2, top: 8 - HEAD / 2 }
          : { left: li.offsetLeft - 34 - HEAD / 2, top: li.offsetTop + 10 - HEAD / 2 }
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    schedule();
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
    };
  }, [current]);

  return (
    <div className="relative">
      <ol
        ref={listRef}
        className="relative space-y-8 pl-12 md:grid md:gap-5 md:space-y-0 md:pl-0"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => (
          <li key={step.name} className="relative md:pt-10">
            {/* The road: from this dot to the next one. */}
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute -left-[36px] top-[10px] h-[calc(100%+2rem)] w-1 rounded-full bg-ink/15 md:left-2 md:top-[6px] md:h-1 md:w-[calc(100%+1.25rem)]"
              />
            )}
            <span
              aria-hidden="true"
              className={`absolute -left-[42px] top-[2px] h-4 w-4 rounded-full border-2 border-ink md:left-0 md:top-0 ${
                i <= current ? 'bg-sun' : 'bg-surface'
              }`}
            />
            <h3 className="font-display text-base font-semibold text-ink">
              <span className="mr-1.5 font-mono text-sm text-red-deep">{i + 1}.</span>
              {step.name}
            </h3>
            {step.what && <p className="mt-1.5 text-sm text-ink-muted">{step.what}</p>}
            {step.checkpoint && (
              <p className="mt-2 flex gap-1.5 text-sm font-medium text-ink">
                <span aria-hidden="true" className="text-red-deep">
                  ✓
                </span>
                <span>
                  <span className="sr-only">{workCheckpointLabel}: </span>
                  {step.checkpoint}
                </span>
              </p>
            )}
          </li>
        ))}
      </ol>
      {/* eslint-disable-next-line @next/next/no-img-element -- small decoration */}
      <img
        src="/character/luffy-head.png"
        alt=""
        width={HEAD}
        height={HEAD}
        className={`pointer-events-none absolute z-10 rounded-full border-2 border-ink bg-sun object-cover ${
          animate ? 'transition-[left,top] duration-500 ease-in-out motion-reduce:transition-none' : ''
        } ${pos ? '' : 'invisible'}`}
        style={pos ?? { left: 0, top: 0 }}
      />
    </div>
  );
}
