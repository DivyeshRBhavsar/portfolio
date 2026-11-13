'use client';

import type { Slide, Story } from '@/lib/storyTypes';
import StoryText from '../StoryText';
import BarChart from './BarChart';
import BulletList from './BulletList';
import LinkButtons from './LinkButtons';
import MetricCards from './MetricCards';
import Steps from './StepsSlide';

/** One slide's content: its main part, then any extra metric cards and bullets. */
export default function SlideBody({
  slide,
  story,
  animate,
}: {
  slide: Slide;
  story: Story;
  animate: boolean;
}) {
  if (slide.type === 'title') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 py-6 text-center">
        <h3 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          <StoryText text={slide.title} />
        </h3>
        {slide.subtitle && (
          <p className="max-w-xl text-lg text-ink-muted">
            <StoryText text={slide.subtitle} />
          </p>
        )}
        <Extras slide={slide} animate={animate} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-display text-2xl font-bold leading-tight text-ink">
        <StoryText text={slide.title} />
      </h3>
      {slide.type === 'bullets' && <BulletList bullets={slide.bullets} />}
      {slide.type === 'steps' && <Steps steps={slide.steps} />}
      {slide.type === 'metrics' && <MetricCards metrics={slide.metrics} animate={animate} />}
      {slide.type === 'bars' && <BarChart bars={slide.bars} unit={slide.unit} animate={animate} />}
      <Extras slide={slide} animate={animate} />
      {slide.type === 'links' && <LinkButtons repo={story.repo} links={story.links} />}
    </div>
  );
}

/** Metric cards and/or bullets carried alongside a slide's main content. */
function Extras({ slide, animate }: { slide: Slide; animate: boolean }) {
  const metrics = slide.type !== 'metrics' ? slide.metrics : undefined;
  const bullets = slide.type !== 'bullets' ? slide.bullets : undefined;
  return (
    <>
      {metrics && metrics.length > 0 && <MetricCards metrics={metrics} animate={animate} />}
      {bullets && bullets.length > 0 && (
        <div className="w-full text-left">
          <BulletList bullets={bullets} />
        </div>
      )}
    </>
  );
}
