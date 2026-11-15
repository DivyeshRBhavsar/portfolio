'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import {
  contactAboutYouHeading,
  contactDetailsHeading,
  contactEmailLabel,
  contactFixErrors,
  contactLinkedInLabel,
  contactLinkedInPlaceholder,
  contactMessageLabel,
  contactNameLabel,
  contactPurposeHeading,
  contactSend,
  contactSending,
} from '@/components/character/luffyLines';
import FieldControl from './FieldControl';
import PlanBox from './PlanBox';
import PurposeCards from './PurposeCards';
import { SummaryToggle } from './SummaryCard';
import { focusFirstError, type ContactForm } from './useContactForm';
import { LIMITS, domId, fieldKey, findPurpose, type ContactConfig } from './rules';

const h2 = 'font-display text-xl font-bold text-ink';

/**
 * The classic form: purpose cards, that purpose's fields, then name, email, the plan (if
 * any), message and LinkedIn. On Send with problems, they're announced and focus moves
 * to the first. On phones the Send button stays in a bar at the bottom of the screen.
 */
export default function FullForm({ form, config }: { form: ContactForm; config: ContactConfig }) {
  const { values, errors } = form;
  const purpose = findPurpose(config, values.purpose);
  const [announce, setAnnounce] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnounce('');
    const problems = await form.submit();
    if (Object.keys(problems).length > 0) {
      setAnnounce(contactFixErrors);
      requestAnimationFrame(() => focusFirstError(problems));
    }
  };

  return (
    <form noValidate onSubmit={onSubmit} className="mt-8 space-y-10">
      <section aria-labelledby="purpose-heading">
        <h2 id="purpose-heading" className={`${h2} mb-4`}>
          {contactPurposeHeading}
        </h2>
        <PurposeCards
          purposes={config.purposes}
          value={values.purpose}
          onPick={(id) => form.setPurpose(id)}
          labelledBy="purpose-heading"
          error={errors.purpose}
        />
      </section>

      {purpose && purpose.fields.length > 0 && (
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className={`${h2} mb-4`}>
            {contactDetailsHeading}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {purpose.fields.map((f) => (
              <div key={f.id} className={f.type === 'chips' || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <FieldControl
                  errorKey={fieldKey(f.id)}
                  label={f.label}
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
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="about-you-heading">
        <h2 id="about-you-heading" className={`${h2} mb-4`}>
          {contactAboutYouHeading}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldControl
            errorKey="name"
            label={contactNameLabel}
            type="text"
            value={values.name}
            onChange={(v) => form.setCommon('name', v)}
            required
            error={errors.name}
            maxLength={LIMITS.name}
            autoComplete="name"
          />
          <FieldControl
            errorKey="email"
            label={contactEmailLabel}
            type="email"
            value={values.email}
            onChange={(v) => form.setCommon('email', v)}
            required
            error={errors.email}
            maxLength={LIMITS.email}
            autoComplete="email"
          />
          {values.plan && (
            <div className="sm:col-span-2">
              <PlanBox plan={values.plan} onRemove={form.removePlan} error={errors.plan} />
            </div>
          )}
          <div className="sm:col-span-2">
            <FieldControl
              errorKey="message"
              label={contactMessageLabel}
              type="textarea"
              value={values.message}
              onChange={(v) => form.setCommon('message', v)}
              required
              error={errors.message}
              placeholder={purpose?.messagePlaceholder}
              maxLength={LIMITS.messageMax}
              showCount
            />
          </div>
          <div className="sm:col-span-2">
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
            />
          </div>
        </div>
      </section>

      <div className="sr-only" aria-live="polite">
        {announce}
      </div>

      {/* Phones: preview and Send stay at the bottom of the screen. */}
      <div className="sticky bottom-0 z-10 -mx-6 space-y-3 border-t-2 border-ink/10 bg-cream/95 px-6 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="lg:hidden">
          <SummaryToggle config={config} values={values} />
        </div>
        {errors.form && (
          <p id={domId('form')} tabIndex={-1} role="alert" className="text-sm font-medium text-red-deep outline-none">
            {errors.form}
          </p>
        )}
        <button
          type="submit"
          disabled={form.status === 'sending'}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-red px-6 py-2.5 font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-sticker disabled:opacity-60 motion-reduce:hover:translate-y-0 sm:w-auto"
        >
          <Send size={17} aria-hidden="true" />
          {form.status === 'sending' ? contactSending : contactSend}
        </button>
      </div>
    </form>
  );
}
