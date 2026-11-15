'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Send } from 'lucide-react';
import LuffyHead from '@/components/character/LuffyHead';
import { fill } from '@/components/character/speech';
import {
  workPlannerAgreed,
  workPlannerBack,
  workPlannerChosen,
  workPlannerNeedHeading,
  workPlannerNotesHeading,
  workPlannerProgress,
  workPlannerResultLine,
  workPlannerResultTitle,
  workPlannerSend,
  workPlannerStartOver,
  workPlannerStepsHeading,
  workPlannerSummaryService,
} from '@/components/character/luffyLines';
import type { Planner, Service } from '@/lib/services';
import { PLANNER_ID, contactHref, onPlanRequest, scrollBehavior } from './planEvents';

const TALK_MS = 1400;
const sub = 'font-mono text-xs uppercase tracking-wide text-ink-muted';
const chip =
  'min-h-11 rounded-full border-2 border-ink px-4 py-2 text-sm font-medium transition-colors hover:bg-sun hover:text-on-sun hover:shadow-sticker';

/**
 * Plan my project: Luffy asks one question at a time (chips, Back, "2 of 4"), then shows
 * the plan: the chosen service's steps, what Divyesh would need, any notes matching the
 * answers, and that timeline and price are agreed in the proposal. "Send this plan"
 * opens the contact page with the plan as a short text summary.
 * "Plan this project" on a service card starts here with that service chosen (question 2).
 */
export default function ProjectPlanner({ planner, services }: { planner: Planner; services: Service[] }) {
  const { questions } = planner;
  const total = questions.length;
  const serviceQ = questions.find((q) => q.type === 'service')!;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [talking, setTalking] = useState(false);
  const focusNext = useRef(false);
  const focusRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const service = services.find((s) => s.id === answers[serviceQ.id]);
  const done = step >= total;
  const question = done ? undefined : questions[step];

  const go = (next: number, nextAnswers: Record<string, string>) => {
    setAnswers(nextAnswers);
    setStep(next);
    setTalking(true);
    focusNext.current = true;
  };

  // A card's "Plan this project": choose that service and ask the next question.
  const planService = useEffectEvent((id: string) => {
    go(questions.indexOf(serviceQ) + 1, { [serviceQ.id]: id });
    sectionRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  });
  useEffect(() => onPlanRequest(planService), []);

  // After a user's step: focus the new question (or the plan), without scrolling.
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    focusRef.current?.focus({ preventScroll: true });
  }, [step, answers]);

  useEffect(() => {
    if (!talking) return;
    const timer = setTimeout(() => setTalking(false), TALK_MS);
    return () => clearTimeout(timer);
  }, [talking, step]);

  const answer = (value: string) => go(step + 1, { ...answers, [question!.id]: value });
  const back = () => go(Math.max(0, step - 1), answers);
  const startOver = () => go(0, {});

  const line = done
    ? workPlannerResultLine
    : service && step > questions.indexOf(serviceQ)
      ? fill(workPlannerChosen, { title: service.name })
      : planner.luffy;

  const notes = questions.flatMap((q) => {
    const note = planner.notes[`${q.id}:${answers[q.id]}`];
    return note ? [note] : [];
  });
  const summary = service
    ? [
        `${workPlannerSummaryService}: ${service.name}`,
        ...questions.filter((q) => q.type === 'chips' && answers[q.id]).map((q) => `${q.label} ${answers[q.id]}`),
      ].join('\n')
    : '';

  return (
    <section
      ref={sectionRef}
      id={PLANNER_ID}
      aria-labelledby="planner-title"
      className="scroll-mt-20 py-14 sm:py-16"
    >
      <h2 id="planner-title" className="font-display text-2xl font-bold text-ink sm:text-3xl">
        {planner.title}
      </h2>

      <div className="mt-6 rounded-2xl border-2 border-ink bg-peach p-5 shadow-sticker sm:p-8">
        <div className="flex items-start gap-3">
          <LuffyHead talking={talking} className="h-12 w-12" />
          <p
            aria-live="polite"
            className="max-w-xl rounded-2xl rounded-tl-sm border-2 border-ink bg-surface px-4 py-2.5 text-sm text-ink sm:text-base"
          >
            {line}
          </p>
        </div>

        {question && (
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <p className="font-mono text-sm text-ink">
                {fill(workPlannerProgress, { n: String(step + 1), total: String(total) })}
              </p>
              <span aria-hidden="true" className="h-1.5 max-w-40 flex-1 overflow-hidden rounded-full bg-ink/15">
                <span
                  className="block h-full rounded-full bg-red transition-[width] duration-300 motion-reduce:transition-none"
                  style={{ width: `${((step + 1) / total) * 100}%` }}
                />
              </span>
            </div>
            <h3
              ref={focusRef}
              id={`planner-q-${question.id}`}
              tabIndex={-1}
              className="mt-3 font-display text-xl font-semibold text-ink outline-none"
            >
              {question.label}
            </h3>
            <div role="group" aria-labelledby={`planner-q-${question.id}`} className="mt-4 flex flex-wrap gap-2">
              {question.type === 'service'
                ? services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={answers[question.id] === s.id}
                      onClick={() => answer(s.id)}
                      className={`${chip} ${answers[question.id] === s.id ? 'bg-sun text-on-sun' : 'bg-surface text-ink'}`}
                    >
                      <span aria-hidden="true" className="mr-1.5">
                        {s.emoji}
                      </span>
                      {s.name}
                    </button>
                  ))
                : question.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={answers[question.id] === option}
                      onClick={() => answer(option)}
                      className={`${chip} ${answers[question.id] === option ? 'bg-sun text-on-sun' : 'bg-surface text-ink'}`}
                    >
                      {option}
                    </button>
                  ))}
            </div>
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink hover:text-red-deep"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                {workPlannerBack}
              </button>
            )}
          </div>
        )}

        {done && service && (
          <div className="mt-6 rounded-2xl border-2 border-ink bg-surface p-5 sm:p-6">
            <h3 ref={focusRef} tabIndex={-1} className="font-display text-xl font-bold text-ink outline-none">
              {workPlannerResultTitle}
            </h3>
            <p className="mt-1 text-ink">
              <span aria-hidden="true" className="mr-1.5">
                {service.emoji}
              </span>
              {service.name}
            </p>
            <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
              {questions
                .filter((q) => q.type === 'chips' && answers[q.id])
                .map((q) => (
                  <div key={q.id} className="contents">
                    <dt className="text-ink-muted">{q.label}</dt>
                    <dd className="font-medium text-ink">{answers[q.id]}</dd>
                  </div>
                ))}
            </dl>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h4 className={sub}>{workPlannerStepsHeading}</h4>
                <ol className="mt-3 space-y-2">
                  {service.steps.map((s, i) => (
                    <li key={s} className="flex items-start gap-3 text-sm text-ink">
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun font-mono text-xs text-on-sun"
                      >
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-6">
                {(planner.needFromYou[service.id] ?? []).length > 0 && (
                  <div>
                    <h4 className={sub}>{workPlannerNeedHeading}</h4>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink marker:text-red-deep">
                      {planner.needFromYou[service.id].map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {notes.length > 0 && (
                  <div>
                    <h4 className={sub}>{workPlannerNotesHeading}</h4>
                    <ul className="mt-3 space-y-2 text-sm text-ink">
                      {notes.map((n) => (
                        <li key={n} className="rounded-lg bg-peach px-3 py-2">
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-6 text-sm text-ink-muted">{workPlannerAgreed}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={contactHref(service.id, summary)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-red px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-sticker motion-reduce:hover:translate-y-0"
              >
                <Send size={16} aria-hidden="true" />
                {workPlannerSend}
              </Link>
              <button
                type="button"
                onClick={startOver}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun"
              >
                <RotateCcw size={16} aria-hidden="true" />
                {workPlannerStartOver}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
