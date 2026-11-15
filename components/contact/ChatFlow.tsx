'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import {
  contactBack,
  contactChangeSomething,
  contactChatAsk,
  contactChatEmail,
  contactChatMessage,
  contactChatName,
  contactChatOptional,
  contactChatProgress,
  contactChatReview,
  contactEmailLabel,
  contactLinkedInLabel,
  contactLinkedInPlaceholder,
  contactMessageLabel,
  contactNameLabel,
  contactNext,
  contactSend,
  contactSending,
  contactSkip,
} from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';
import FieldControl from './FieldControl';
import LuffyBubble from './LuffyBubble';
import PlanBox from './PlanBox';
import PurposeCards, { type PickHow } from './PurposeCards';
import { SummaryInline } from './SummaryCard';
import { focusFirstError, type ContactForm } from './useContactForm';
import {
  LIMITS,
  checkCommon,
  checkField,
  domId,
  fieldKey,
  findPurpose,
  type ContactConfig,
  type ContactValues,
  type Field,
  type FieldErrors,
  type Purpose,
} from './rules';

type Step =
  | { kind: 'purpose' }
  | { kind: 'field'; field: Field }
  | { kind: 'common'; key: 'name' | 'email' | 'message' }
  | { kind: 'optional'; fields: Field[] }
  | { kind: 'review' };

/** Purpose, its required fields one by one, name, email, message, the optional extras together, review. */
function buildSteps(purpose: Purpose | undefined): Step[] {
  return [
    { kind: 'purpose' },
    ...(purpose?.fields.filter((f) => f.required).map((field): Step => ({ kind: 'field', field })) ?? []),
    { kind: 'common', key: 'name' },
    { kind: 'common', key: 'email' },
    { kind: 'common', key: 'message' },
    { kind: 'optional', fields: purpose?.fields.filter((f) => !f.required) ?? [] },
    { kind: 'review' },
  ];
}

/** Already answered (from a link, a draft or earlier): the chat skips it going forward. */
function answered(config: ContactConfig, step: Step, v: ContactValues): boolean {
  switch (step.kind) {
    case 'purpose':
      return !!findPurpose(config, v.purpose);
    case 'field':
      return !!v.fields[step.field.id] && !checkField(step.field, v.fields[step.field.id]);
    case 'common':
      return !checkCommon(step.key, v[step.key]);
    case 'optional':
      return step.fields.every((f) => !!v.fields[f.id]) && !!v.linkedin;
    case 'review':
      return false;
  }
}

/** The first unanswered step after `from` (or the review). */
function nextIndex(config: ContactConfig, from: number, v: ContactValues): number {
  const steps = buildSteps(findPurpose(config, v.purpose));
  for (let i = from + 1; i < steps.length; i++) if (!answered(config, steps[i], v)) return i;
  return steps.length - 1;
}

const navButton =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-ink px-4 py-2 text-sm font-medium transition-colors';

/**
 * "Chat with Luffy": one question at a time in his bubble (typed, with his talking head),
 * the answer below as cards, chips or an input, with Back and "2 of 6". Questions already
 * answered are skipped. Shares the form's state with the full form.
 */
export default function ChatFlow({
  form,
  config,
  firstQuestion,
  below,
  onSwitchToFull,
}: {
  form: ContactForm;
  config: ContactConfig;
  /** The first step's line (the band at the top already says hello). */
  firstQuestion: string;
  /** Under the bubble: the reply-time line and notes. */
  below: React.ReactNode;
  onSwitchToFull: () => void;
}) {
  const { values, errors } = form;
  const purpose = findPurpose(config, values.purpose);
  const steps = buildSteps(purpose);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [alert, setAlert] = useState('');
  const [focusPending, setFocusPending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const at = Math.min(index, steps.length - 1);
  const step = steps[at];

  // Once the draft and the link are applied: start at the first unanswered question.
  useEffect(() => {
    if (!form.ready || started) return;
    const frame = requestAnimationFrame(() => {
      setIndex(answered(config, { kind: 'purpose' }, values) ? nextIndex(config, 0, values) : 0);
      setStarted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [form.ready, started, config, values]);

  // After moving: focus the new question's answer control.
  useEffect(() => {
    if (!focusPending) return;
    const frame = requestAnimationFrame(() => {
      setFocusPending(false);
      const box = boxRef.current;
      const target =
        step.kind === 'review'
          ? box?.querySelector<HTMLElement>('[data-send]')
          : box?.querySelector<HTMLElement>('[role=radio][tabindex="0"], fieldset button[tabindex="0"], input, select, textarea');
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusPending, at, step.kind]);

  const goTo = (i: number) => {
    setFocusPending(true);
    setAlert('');
    setIndex(i);
  };
  const forward = (v: ContactValues) => goTo(nextIndex(config, at, v));

  const showError = (key: string, message: string) => {
    form.setErrors((prev) => ({ ...prev, [key]: message }));
    setAlert(message);
    document.getElementById(domId(key))?.focus();
  };

  const pickPurpose = (id: string, how: PickHow) => {
    form.setPurpose(id);
    if (how === 'arrow') return;
    const v = { ...values, purpose: id, fields: id === values.purpose ? values.fields : {} };
    forward(v);
  };

  const next = () => {
    if (step.kind === 'purpose') {
      if (purpose) forward(values);
      return;
    }
    if (step.kind === 'field') {
      const problem = checkField(step.field, values.fields[step.field.id] ?? '');
      if (problem) return showError(fieldKey(step.field.id), problem);
    }
    if (step.kind === 'common') {
      const problem = checkCommon(step.key, values[step.key]);
      if (problem) return showError(step.key, problem);
    }
    if (step.kind === 'optional') {
      for (const f of step.fields) {
        const problem = checkField(f, values.fields[f.id] ?? '');
        if (problem) return showError(fieldKey(f.id), problem);
      }
      const problem = checkCommon('linkedin', values.linkedin);
      if (problem) return showError('linkedin', problem);
    }
    forward(values);
  };

  const send = async () => {
    const problems: FieldErrors = await form.submit();
    if (Object.keys(problems).length > 0) {
      // Something to fix: show everything at once in the full form, focused on the first.
      onSwitchToFull();
      requestAnimationFrame(() => requestAnimationFrame(() => focusFirstError(problems)));
    }
  };

  const question =
    step.kind === 'purpose'
      ? firstQuestion
      : step.kind === 'field'
        ? fill(contactChatAsk, { title: step.field.label.replace(/\?$/, '') })
        : step.kind === 'common'
          ? { name: contactChatName, email: contactChatEmail, message: contactChatMessage }[step.key]
          : step.kind === 'optional'
            ? contactChatOptional
            : contactChatReview;

  const total = steps.length - 1;
  const fieldControl = (f: Field, hidden: boolean, advanceOnPick = false) => (
    <FieldControl
      key={f.id}
      errorKey={fieldKey(f.id)}
      label={f.label}
      labelHidden={hidden}
      type={f.type}
      value={values.fields[f.id] ?? ''}
      onChange={(v) => form.setField(f.id, v)}
      required={f.required}
      error={errors[fieldKey(f.id)]}
      placeholder={f.placeholder}
      maxLength={f.maxLength}
      showCount={f.type === 'textarea'}
      options={f.options}
      groups={f.groups}
      onPick={advanceOnPick ? (v) => forward({ ...values, fields: { ...values.fields, [f.id]: v } }) : undefined}
      onEnter={f.type === 'text' || f.type === 'url' ? next : undefined}
    />
  );

  const showNext = step.kind !== 'review' && !(step.kind === 'field' && step.field.type === 'chips') && (step.kind !== 'purpose' || !!purpose);

  return (
    <div ref={boxRef}>
      <LuffyBubble text={question} live />
      <p id="chat-question" className="sr-only">
        {question}
      </p>
      <div className="sr-only" aria-live="assertive">
        {alert}
      </div>
      {below}

      <div className="mt-6 rounded-2xl border-2 border-ink bg-peach p-5 shadow-sticker sm:p-6">
        {step.kind !== 'review' && (
          <div className="mb-4 flex items-center gap-3">
            <p className="font-mono text-sm text-ink">
              {fill(contactChatProgress, { n: String(at + 1), total: String(total) })}
            </p>
            <span aria-hidden="true" className="h-1.5 max-w-40 flex-1 overflow-hidden rounded-full bg-ink/15">
              <span
                className="block h-full rounded-full bg-red transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${((at + 1) / total) * 100}%` }}
              />
            </span>
          </div>
        )}

        {step.kind === 'purpose' && (
          <PurposeCards
            purposes={config.purposes}
            value={values.purpose}
            onPick={pickPurpose}
            labelledBy="chat-question"
            error={errors.purpose}
          />
        )}

        {step.kind === 'field' && fieldControl(step.field, true, step.field.type === 'chips')}

        {step.kind === 'common' && (
          <div className="space-y-4">
            {step.key === 'message' && values.plan && (
              <PlanBox plan={values.plan} onRemove={form.removePlan} error={errors.plan} />
            )}
            <FieldControl
              errorKey={step.key}
              label={{ name: contactNameLabel, email: contactEmailLabel, message: contactMessageLabel }[step.key]}
              labelHidden
              type={step.key === 'email' ? 'email' : step.key === 'message' ? 'textarea' : 'text'}
              value={values[step.key]}
              onChange={(v) => form.setCommon(step.key, v)}
              required
              error={errors[step.key]}
              placeholder={step.key === 'message' ? purpose?.messagePlaceholder : undefined}
              maxLength={step.key === 'name' ? LIMITS.name : step.key === 'email' ? LIMITS.email : LIMITS.messageMax}
              showCount={step.key === 'message'}
              autoComplete={step.key === 'name' ? 'name' : step.key === 'email' ? 'email' : undefined}
              onEnter={step.key === 'message' ? undefined : next}
            />
          </div>
        )}

        {step.kind === 'optional' && (
          <div className="space-y-4">
            {step.fields.map((f) => fieldControl(f, false))}
            <FieldControl
              errorKey="linkedin"
              label={contactLinkedInLabel}
              type="url"
              value={values.linkedin}
              onChange={(v) => form.setCommon('linkedin', v)}
              required={false}
              error={errors.linkedin}
              placeholder={contactLinkedInPlaceholder}
              maxLength={LIMITS.linkedin}
              autoComplete="url"
              onEnter={next}
            />
          </div>
        )}

        {step.kind === 'review' && (
          <div className="space-y-4">
            <SummaryInline config={config} values={values} />
            {values.plan && <PlanBox plan={values.plan} onRemove={form.removePlan} error={errors.plan} />}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                data-send
                onClick={send}
                disabled={form.status === 'sending'}
                className={`${navButton} bg-red px-5 text-white hover:shadow-sticker disabled:opacity-60`}
              >
                <Send size={16} aria-hidden="true" />
                {form.status === 'sending' ? contactSending : contactSend}
              </button>
              <button type="button" onClick={onSwitchToFull} className={`${navButton} bg-surface text-ink hover:bg-sun hover:text-on-sun`}>
                {contactChangeSomething}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {at > 0 && (
            <button type="button" onClick={() => goTo(at - 1)} className={`${navButton} bg-surface text-ink hover:bg-sun hover:text-on-sun`}>
              <ArrowLeft size={16} aria-hidden="true" />
              {contactBack}
            </button>
          )}
          {step.kind === 'optional' && (
            <button type="button" onClick={() => forward(values)} className={`${navButton} bg-surface text-ink hover:bg-sun hover:text-on-sun`}>
              {contactSkip}
            </button>
          )}
          {showNext && (
            <button type="button" onClick={next} className={`${navButton} bg-ink text-cream hover:shadow-sticker`}>
              {contactNext}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
