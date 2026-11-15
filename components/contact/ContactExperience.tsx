'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Clapperboard, RotateCcw, X } from 'lucide-react';
import {
  contactChatPurpose,
  contactDismiss,
  contactDraftClear,
  contactDraftRestored,
  contactErrorLine,
  contactModeChat,
  contactModeFull,
  contactNextBlog,
  contactNextStory,
  contactPurposeCleared,
  contactSuccessLine,
  contactTryAgain,
  contactUndo,
} from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';
import type { EmailParts } from '@/lib/lifeStoryTypes';
import ChatFlow from './ChatFlow';
import ContactLinks from './ContactLinks';
import FullForm from './FullForm';
import LuffyClip from './LuffyClip';
import { SummaryPanel } from './SummaryCard';
import { useContactForm } from './useContactForm';
import type { ContactConfig } from './rules';

type Props = { config: ContactConfig; linkedin?: string; email?: EmailParts };

const smallButton = 'font-medium text-red-deep underline underline-offset-4 hover:no-underline';
const pillButton =
  'inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-sm font-medium transition-colors';

function Experience({ config, linkedin, email, params }: Props & { params: URLSearchParams | null }) {
  const form = useContactForm(config, params);
  const doneRef = useRef<HTMLHeadingElement>(null);

  // Sent or failed: move focus to what happened.
  useEffect(() => {
    if (form.status === 'sent' || form.status === 'error') doneRef.current?.focus();
  }, [form.status]);

  const switchMode = () => form.setMode(form.mode === 'chat' ? 'full' : 'chat');

  const below = (
    <div className="mt-4 space-y-2 text-sm">
      {form.draftRestored && (
        <p role="status" className="text-ink">
          {contactDraftRestored} ·{' '}
          <button type="button" onClick={form.clearDraft} className={smallButton}>
            {contactDraftClear}
          </button>
        </p>
      )}
      {form.undo && (
        <p role="status" className="flex flex-wrap items-center gap-x-2 text-ink">
          {fill(contactPurposeCleared, { title: form.undo.label })}
          <button type="button" onClick={form.undoPurpose} className={smallButton}>
            {contactUndo}
          </button>
          <button type="button" onClick={form.dismissUndo} aria-label={contactDismiss} className="p-1 text-ink-muted hover:text-ink">
            <X size={14} aria-hidden="true" />
          </button>
        </p>
      )}
      <button type="button" onClick={switchMode} className={`${smallButton} inline-flex min-h-11 items-center`}>
        {form.mode === 'chat' ? contactModeFull : contactModeChat}
      </button>
    </div>
  );

  let main: React.ReactNode;
  if (form.status === 'sent') {
    main = (
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <LuffyClip clip="celebrate" className="w-32 sm:w-40" />
        <div>
          <h2 ref={doneRef} tabIndex={-1} role="status" className="font-display text-2xl font-bold text-ink outline-none">
            {contactSuccessLine}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/projects" className={`${pillButton} bg-red text-white hover:shadow-sticker`}>
              <Clapperboard size={16} aria-hidden="true" />
              {contactNextStory}
            </Link>
            <Link href="/blog" className={`${pillButton} bg-surface text-ink hover:bg-sun hover:text-on-sun`}>
              <BookOpen size={16} aria-hidden="true" />
              {contactNextBlog}
            </Link>
          </div>
        </div>
      </div>
    );
  } else if (form.status === 'error') {
    main = (
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <LuffyClip clip="thinking" className="w-32 sm:w-40" />
        <div>
          <h2 ref={doneRef} tabIndex={-1} role="alert" className="font-display text-xl font-bold text-ink outline-none">
            {contactErrorLine}
          </h2>
          {form.errors.form && <p className="mt-2 text-sm text-ink-muted">{form.errors.form}</p>}
          <button type="button" onClick={form.retry} className={`${pillButton} mt-5 bg-surface text-ink hover:bg-sun hover:text-on-sun`}>
            <RotateCcw size={16} aria-hidden="true" />
            {contactTryAgain}
          </button>
        </div>
      </div>
    );
  } else if (form.mode === 'chat') {
    main = <ChatFlow form={form} config={config} firstQuestion={contactChatPurpose} below={below} onSwitchToFull={() => form.setMode('full')} />;
  } else {
    main = (
      <>
        {below}
        <FullForm form={form} config={config} />
      </>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        {/* Hidden from people; a bot filling it in gets a quiet "success" with nothing sent. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            onChange={(e) => form.setHoneypot(e.target.value)}
          />
        </div>

        {/* Until the draft and link are applied, keep the form still (no flash of the wrong mode). */}
        <div className={form.ready ? '' : 'opacity-0'}>{main}</div>

        <div className="mt-12 border-t-2 border-ink/10 pt-6">
          <ContactLinks linkedin={linkedin} email={email} bookingLink={config.bookingLink} />
          <p className="mt-4 text-sm text-ink-muted">{config.privacyNote}</p>
        </div>
      </div>

      {form.status !== 'sent' && (
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <SummaryPanel config={config} values={form.values} />
          </div>
        </aside>
      )}
    </div>
  );
}

/** Reads the link's ?purpose= etc. (inside Suspense, so the page stays static). */
function WithParams(props: Props) {
  const params = useSearchParams();
  return <Experience {...props} params={params} />;
}

/**
 * The contact page's form (Luffy greets in the band above): the chat or the full form (one shared state),
 * the live summary, LinkedIn / Copy email / booking, and the privacy note.
 */
export default function ContactExperience(props: Props) {
  return (
    <Suspense fallback={<Experience {...props} params={null} />}>
      <WithParams {...props} />
    </Suspense>
  );
}
