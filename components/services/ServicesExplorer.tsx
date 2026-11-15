'use client';

import { useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { workServicesHeading, workShowEverything } from '@/components/character/luffyLines';
import type { Problem, Service } from '@/lib/services';
import ServiceCard from './ServiceCard';
import { scrollBehavior } from './planEvents';

const SERVICES_HEADING_ID = 'services-title';

/**
 * "What would you like to fix?" and the service cards. Picking a problem scrolls to its
 * service, highlights it, puts #<service id> in the URL and moves focus to the card.
 * "Show me everything" clears that and goes to the top of the grid. Opening the page
 * with #<service id> highlights that card too.
 */
export default function ServicesExplorer({
  question,
  problems,
  services,
}: {
  question?: string;
  problems: Problem[];
  services: Service[];
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    const ids = new Set(services.map((s) => s.id));
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      setHighlighted(ids.has(id) ? id : null);
    };
    const frame = requestAnimationFrame(fromHash);
    window.addEventListener('hashchange', fromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', fromHash);
    };
  }, [services]);

  const pick = (id: string) => {
    setHighlighted(id);
    window.history.replaceState(null, '', `#${id}`);
    const card = document.getElementById(id);
    card?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    card?.focus({ preventScroll: true });
  };

  const showAll = () => {
    setHighlighted(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    const heading = document.getElementById(SERVICES_HEADING_ID);
    heading?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    heading?.focus({ preventScroll: true });
  };

  return (
    <>
      {question && problems.length > 0 && (
        <section aria-labelledby="problems-title" className="py-14 sm:py-16">
          <h2 id="problems-title" className="font-display text-2xl font-bold text-ink sm:text-3xl">
            {question}
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {problems.map((p) => {
              const active = highlighted === p.service;
              const emoji = services.find((s) => s.id === p.service)?.emoji;
              return (
                <li key={p.label}>
                  <button
                    type="button"
                    onClick={() => pick(p.service)}
                    className={`flex h-full min-h-16 w-full items-start gap-3 rounded-xl border-2 border-ink p-4 text-left font-medium transition-all hover:-translate-y-0.5 hover:shadow-sticker motion-reduce:hover:translate-y-0 ${
                      active ? 'bg-sun text-on-sun shadow-sticker' : 'bg-surface text-ink'
                    }`}
                  >
                    {emoji && <span aria-hidden="true" className="text-xl leading-6">{emoji}</span>}
                    <span>{p.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={showAll}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun"
          >
            {workShowEverything}
            <ArrowDown size={16} aria-hidden="true" />
          </button>
        </section>
      )}

      {services.length > 0 && (
        <section aria-labelledby={SERVICES_HEADING_ID} className="py-14 sm:py-16">
          <h2
            id={SERVICES_HEADING_ID}
            tabIndex={-1}
            className="scroll-mt-24 font-display text-2xl font-bold text-ink outline-none sm:text-3xl"
          >
            {workServicesHeading}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} highlighted={highlighted === s.id} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
