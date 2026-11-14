'use client';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { StoryLayout } from './useStoryLayout';

/**
 * Slides are designed on a fixed canvas, like a presentation, then scaled as a whole to
 * fit the slide area (aspect ratio kept, centred, the theme's colour around it):
 *   landscape 1280×720 · portrait 720×1100
 *   short     ×520 tall, as wide as the area's shape (900–1300): on a phone on its side
 *             the area is very wide and short, so the canvas matches it and the scale is
 *             set by the height alone, keeping body text at ~14 px on screen.
 * Type and spacing come from CSS variables per canvas (.story-canvas in app/globals.css).
 * Content taller than the canvas first shrinks to fit (CanvasFit, down to 80%); past
 * that, it scrolls inside the canvas, never the page.
 */

const SHORT_HEIGHT = 520;

function canvasSize(layout: StoryLayout, area: { w: number; h: number } | null) {
  if (layout === 'portrait') return { w: 720, h: 1100 };
  if (layout === 'short') {
    const aspect = area && area.h > 0 ? area.w / area.h : 1280 / 720;
    return { w: Math.round(Math.min(Math.max(SHORT_HEIGHT * aspect, 900), 1300)), h: SHORT_HEIGHT };
  }
  return { w: 1280, h: 720 };
}

/** Smallest autofit: below this a slide scrolls inside its canvas instead. */
const MIN_FIT = 0.8;

type CanvasInfo = {
  layout: StoryLayout;
  canvasRef: RefObject<HTMLDivElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Changes when the canvas is resized (re-fit). */
  sizeKey: string;
};

const CanvasContext = createContext<CanvasInfo | null>(null);

/** Which canvas the slide is on (slide parts adjust columns and direction to it). */
export function useCanvas(): StoryLayout {
  return useContext(CanvasContext)?.layout ?? 'landscape';
}

/**
 * Autofit, like a presentation app: if a slide's content is taller than the canvas, all
 * of its type and spacing (the --s-* variables, through --fit) shrink together until it
 * fits, down to MIN_FIT. Worked out before paint, on each new slide and canvas size.
 */
export function CanvasFit({ children }: { children: ReactNode }) {
  const info = useContext(CanvasContext);
  const sizeKey = info?.sizeKey;

  useLayoutEffect(() => {
    const canvas = info?.canvasRef.current;
    const scroller = info?.scrollRef.current;
    if (!canvas || !scroller) return;
    let fit = 1;
    canvas.style.setProperty('--fit', '1');
    for (let i = 0; i < 4; i++) {
      const need = scroller.scrollHeight;
      const have = scroller.clientHeight;
      if (have === 0 || need <= have || fit <= MIN_FIT) break;
      fit = Math.max(MIN_FIT, (fit * have) / need);
      canvas.style.setProperty('--fit', fit.toFixed(3));
    }
  }, [info, sizeKey]);

  return <>{children}</>;
}

export default function SlideCanvas({
  layout,
  children,
}: {
  layout: StoryLayout;
  children: ReactNode;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const node = areaRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // 0×0 while the overlay is hidden: keep waiting.
      setArea(width > 0 && height > 0 ? { w: width, h: height } : null);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const size = canvasSize(layout, area);
  const scale = area ? Math.min(area.w / size.w, area.h / size.h) : 0;
  const sizeKey = `${layout}:${size.w}x${size.h}`;
  const info = useMemo(() => ({ layout, canvasRef, scrollRef, sizeKey }), [layout, sizeKey]);

  return (
    <div ref={areaRef} className="relative h-full w-full overflow-hidden">
      <div
        ref={canvasRef}
        data-canvas={layout}
        className="story-canvas absolute left-1/2 top-1/2 origin-center rounded-[28px] border-[3px] border-ink bg-surface text-ink shadow-sticker"
        style={{
          width: size.w,
          height: size.h,
          transform: `translate(-50%, -50%) scale(${scale})`,
          // Hidden until measured, so it never flashes at full size.
          visibility: area ? 'visible' : 'hidden',
        }}
      >
        <div
          ref={scrollRef}
          className="story-canvas-scroll h-full w-full overflow-y-auto overscroll-contain"
        >
          <CanvasContext.Provider value={info}>{children}</CanvasContext.Provider>
        </div>
      </div>
    </div>
  );
}
