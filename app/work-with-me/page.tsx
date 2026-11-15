import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, MapPin } from 'lucide-react';
import Reveal from '@/components/Reveal';
import LuffyHead from '@/components/character/LuffyHead';
import ChapterHeader from '@/components/home/ChapterHeader';
import {
  workClosingButton,
  workClosingLuffy,
  workClosingTitle,
  workFactorsHeading,
  workFaqHeading,
  workMetaTitle,
} from '@/components/character/luffyLines';
import CapacityBadge from '@/components/services/CapacityBadge';
import FaqAccordion from '@/components/services/FaqAccordion';
import ProcessRoadmap from '@/components/services/ProcessRoadmap';
import ProjectPlanner from '@/components/services/ProjectPlanner';
import ServicesExplorer from '@/components/services/ServicesExplorer';
import PageHero from '@/components/PageHero';
import { contactHref } from '@/components/services/planEvents';
import { getServices } from '@/lib/services';

export function generateMetadata(): Metadata {
  return { title: workMetaTitle, description: getServices().hero.subtitle };
}

const h2 = 'font-display text-2xl font-bold text-ink sm:text-3xl';

/** A section labelled by its h2, fading in gently on scroll. */
function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section aria-labelledby={`${id}-title`} className="py-14 sm:py-16">
        {children}
      </section>
    </Reveal>
  );
}

/** Work with me: everything from content/services.json (lib/services.ts). */
export default function WorkWithMePage() {
  const { hero, capacity, where, problems, services, process, timeline, pricing, promises, faq, planner } =
    getServices();

  return (
    <div>
      {/* 1. Hero */}
      <PageHero
        title={hero.title}
        subtitle={hero.subtitle}
        luffy={hero.luffy}
        extras={
          capacity || where ? (
            <>
              {capacity && <CapacityBadge capacity={capacity} />}
              {where && (
                <p className="mt-2 flex max-w-2xl basis-full items-start gap-2">
                  <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-red-deep" />
                  {where}
                </p>
              )}
            </>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-5xl px-6">
        {/* 2–3. What would you like to fix? + the services */}
        <ServicesExplorer question={problems?.question} problems={problems?.items ?? []} services={services} />

        {/* 4. How a project works */}
        {process && (
          <Section id="process">
            {process.luffy ? (
              <ChapterHeader id="process-title" title={process.title} luffy={process.luffy} />
            ) : (
              <h2 id="process-title" className={`${h2} mb-8`}>
                {process.title}
              </h2>
            )}
            <ProcessRoadmap steps={process.steps} />
          </Section>
        )}

        {/* 5. When will it be done? / What will it cost? */}
        {(timeline || pricing) && (
          <div className="grid gap-6 py-14 sm:py-16 md:grid-cols-2">
            {timeline && (
              <section aria-labelledby="timeline-title" className="rounded-2xl border-2 border-ink bg-surface p-6 shadow-sticker">
                <h2 id="timeline-title" className="font-display text-xl font-bold text-ink sm:text-2xl">
                  {timeline.title}
                </h2>
                {timeline.text && <p className="mt-3 text-ink">{timeline.text}</p>}
                {timeline.factors.length > 0 && (
                  <>
                    <h3 className="mt-5 font-mono text-xs uppercase tracking-wide text-ink-muted">{workFactorsHeading}</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink marker:text-red-deep">
                      {timeline.factors.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            )}
            {pricing && (
              <section aria-labelledby="pricing-title" className="rounded-2xl border-2 border-ink bg-surface p-6 shadow-sticker">
                <h2 id="pricing-title" className="font-display text-xl font-bold text-ink sm:text-2xl">
                  {pricing.title}
                </h2>
                <p className="mt-3 text-ink">{pricing.text}</p>
              </section>
            )}
          </div>
        )}

        {/* 6. My promises */}
        {promises && (
          <Section id="promises">
            <h2 id="promises-title" className={h2}>
              {promises.title}
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {promises.items.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-xl border-2 border-ink/10 bg-surface p-4 text-ink">
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun text-on-sun"
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* 7. FAQ */}
        {faq.length > 0 && (
          <Section id="faq">
            <h2 id="faq-title" className={`${h2} mb-6`}>
              {workFaqHeading}
            </h2>
            <FaqAccordion items={faq} />
          </Section>
        )}

        {/* 8. Plan my project (not inside Reveal: cards scroll to it) */}
        {planner && <ProjectPlanner planner={planner} services={services} />}

        {/* 9. Closing call to action */}
        <Section id="closing">
          <div className="rounded-2xl border-2 border-ink bg-peach p-6 shadow-sticker sm:p-10">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <LuffyHead talking={false} className="h-20 w-20" />
              <div>
                <h2 id="closing-title" className={h2}>
                  {workClosingTitle}
                </h2>
                <p className="mt-2 text-ink">{workClosingLuffy}</p>
              </div>
            </div>
            <Link
              href={contactHref()}
              className="mt-6 inline-flex min-h-11 items-center rounded-full border-2 border-ink bg-red px-5 py-2.5 font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-sticker motion-reduce:hover:translate-y-0"
            >
              {workClosingButton}
            </Link>
            {capacity && <CapacityBadge capacity={capacity} className="mt-6" />}
          </div>
        </Section>
      </div>
    </div>
  );
}
