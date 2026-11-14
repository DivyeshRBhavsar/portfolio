'use client';

import type { Slide, Story } from '@/lib/storyTypes';
import { useCanvas } from '../SlideCanvas';
import StoryText from '../StoryText';
import BarChart from './BarChart';
import BulletList from './BulletList';
import LinkButtons from './LinkButtons';
import MetricCards from './MetricCards';
import Steps from './StepsSlide';

/**
 * One slide's content on the canvas: its main part, then any extra metric cards and
 * bullets. `focusing`: Luffy's narration is typing, so the slide's "focus" item (a metric
 * card or a bar) is highlighted.
 */
export default function SlideBody({
  slide,
  story,
  animate,
  focusing,
}: {
  slide: Slide;
  story: Story;
  animate: boolean;
  focusing: boolean;
}) {
  const focusMetric =
    focusing && slide.focus && 'metric' in slide.focus ? slide.focus.metric : null;
  const focusBar = focusing && slide.focus && 'bar' in slide.focus ? slide.focus.bar : null;
  const canvas = useCanvas();

  if (slide.type === 'title') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-[var(--s-gap)] p-[var(--s-pad)] text-center">
        <h3 className="font-display text-[length:var(--s-hero)] font-bold leading-[1.1] text-ink">
          <StoryText text={slide.title} />
        </h3>
        {slide.subtitle && (
          <p className="max-w-[85%] text-[length:var(--s-sub)] leading-snug text-ink-muted">
            <StoryText text={slide.subtitle} />
          </p>
        )}
        <Extras slide={slide} animate={animate} focusMetric={focusMetric} />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-center gap-[var(--s-gap)] p-[var(--s-pad)]">
      <h3 className="font-display text-[length:var(--s-title)] font-bold leading-[1.15] text-ink">
        <StoryText text={slide.title} />
      </h3>
      {slide.type === 'bullets' && <BulletList bullets={slide.bullets} />}
      {slide.type === 'steps' && <Steps steps={slide.steps} />}
      {slide.type === 'metrics' && (
        <MetricCards metrics={slide.metrics} animate={animate} focusIndex={focusMetric} />
      )}
      {slide.type === 'bars' &&
        (canvas === 'short' && (slide.metrics?.length || slide.bullets?.length) ? (
          // Phones on their side: the canvas is wide and short, so the extras go beside
          // the chart instead of under it.
          <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-[var(--s-gap)]">
            <BarChart bars={slide.bars} unit={slide.unit} animate={animate} focusIndex={focusBar} />
            <div className="flex flex-col gap-[var(--s-gap)]">
              <Extras slide={slide} animate={animate} focusMetric={focusMetric} metricColumns={2} />
            </div>
          </div>
        ) : (
          <>
            <BarChart bars={slide.bars} unit={slide.unit} animate={animate} focusIndex={focusBar} />
            <Extras slide={slide} animate={animate} focusMetric={focusMetric} />
          </>
        ))}
      {slide.type !== 'bars' && (
        <Extras slide={slide} animate={animate} focusMetric={focusMetric} />
      )}
      {slide.type === 'links' && <LinkButtons repo={story.repo} links={story.links} />}
    </div>
  );
}

/** Metric cards and/or bullets carried alongside a slide's main content. */
function Extras({
  slide,
  animate,
  focusMetric,
  metricColumns,
}: {
  slide: Slide;
  animate: boolean;
  focusMetric: number | null;
  metricColumns?: number;
}) {
  const metrics = slide.type !== 'metrics' ? slide.metrics : undefined;
  const bullets = slide.type !== 'bullets' ? slide.bullets : undefined;
  return (
    <>
      {metrics && metrics.length > 0 && (
        <div className="w-full text-left">
          <MetricCards
            metrics={metrics}
            animate={animate}
            focusIndex={focusMetric}
            maxColumns={metricColumns}
          />
        </div>
      )}
      {bullets && bullets.length > 0 && (
        <div className="w-full text-left">
          <BulletList bullets={bullets} />
        </div>
      )}
    </>
  );
}
