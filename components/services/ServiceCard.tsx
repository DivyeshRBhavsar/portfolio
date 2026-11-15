'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import {
  workNeedIfHeading,
  workPlanButton,
  workProofLabel,
  workStepsHeading,
  workTalkButton,
  workTechToggle,
  workYouGetHeading,
} from '@/components/character/luffyLines';
import { NamedStoryLink } from '@/components/home/StoryLinks';
import type { Service } from '@/lib/services';
import { contactHref, requestPlan } from './planEvents';

const sub = 'font-mono text-xs uppercase tracking-wide text-ink-muted';

/**
 * One service: promise, who it's for, what you get, the steps as a numbered mini-roadmap,
 * proof stories, optional experience line, the tech (collapsed), and two actions. Its id
 * is the service id, so #automation lands here. A highlighted card gets a red ring.
 */
export default function ServiceCard({ service, highlighted }: { service: Service; highlighted: boolean }) {
  const [techOpen, setTechOpen] = useState(false);
  const techId = useId();
  const titleId = `${service.id}-title`;

  return (
    <article
      id={service.id}
      tabIndex={-1}
      aria-labelledby={titleId}
      className={`flex scroll-mt-24 flex-col rounded-2xl border-2 bg-surface p-5 outline-none transition-[box-shadow,border-color] duration-300 motion-reduce:transition-none sm:p-6 ${
        highlighted ? 'border-red shadow-sticker-red ring-4 ring-red/30' : 'border-ink shadow-sticker'
      }`}
    >
      <span aria-hidden="true" className="text-3xl">
        {service.emoji}
      </span>
      <h3 id={titleId} className="mt-2 font-display text-xl font-bold text-ink">
        {service.name}
      </h3>
      <p className="mt-2 text-ink">{service.promise}</p>

      {service.needIf.length > 0 && (
        <div className="mt-5">
          <h4 className={sub}>{workNeedIfHeading}</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink marker:text-red-deep">
            {service.needIf.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {service.youGet.length > 0 && (
        <div className="mt-5">
          <h4 className={sub}>{workYouGetHeading}</h4>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {service.youGet.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="text-red-deep">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {service.steps.length > 0 && (
        <div className="mt-5">
          <h4 className={sub}>{workStepsHeading}</h4>
          <ol className="relative mt-3 space-y-3">
            <span aria-hidden="true" className="absolute bottom-3 left-[11px] top-3 w-0.5 bg-ink/15" />
            {service.steps.map((step, i) => (
              <li key={step} className="relative flex items-start gap-3 text-sm text-ink">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun font-mono text-xs font-medium text-on-sun"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {service.proof.length > 0 && (
        <div className="mt-5">
          <p className="text-sm text-ink-muted">{workProofLabel}</p>
          <ul className="flex flex-wrap gap-x-5">
            {service.proof.map((story) => (
              <li key={story.slug}>
                <NamedStoryLink href={story.href} name={story.title} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {service.experience && (
        <p className="mt-4 rounded-xl bg-peach px-4 py-3 text-sm text-ink">{service.experience}</p>
      )}

      {service.tech.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            aria-expanded={techOpen}
            aria-controls={techId}
            onClick={() => setTechOpen((o) => !o)}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink hover:text-red-deep"
          >
            {workTechToggle}
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`transition-transform motion-reduce:transition-none ${techOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <ul id={techId} hidden={!techOpen} className={techOpen ? 'mt-1 flex flex-wrap gap-2' : undefined}>
            {service.tech.map((t) => (
              <li key={t} className="pill border-ink/20 py-1 text-xs text-ink">
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <button
          type="button"
          onClick={() => requestPlan(service.id)}
          className="inline-flex min-h-11 items-center rounded-full border-2 border-ink bg-red px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-sticker motion-reduce:hover:translate-y-0"
        >
          {workPlanButton}
          <span className="sr-only">: {service.name}</span>
        </button>
        <Link
          href={contactHref(service.id)}
          className="inline-flex min-h-11 items-center rounded-full border-2 border-ink bg-surface px-4 py-2 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:bg-sun hover:text-on-sun hover:shadow-sticker motion-reduce:hover:translate-y-0"
        >
          {workTalkButton}
          <span className="sr-only">: {service.name}</span>
        </Link>
      </div>
    </article>
  );
}
