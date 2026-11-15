'use client';

import { useState } from 'react';
import { CalendarDays, Copy, Linkedin } from 'lucide-react';
import {
  contactBookCall,
  contactCopied,
  contactCopyEmail,
  contactCopyFallback,
  contactLinkedInButton,
} from '@/components/character/luffyLines';
import type { EmailParts } from '@/lib/lifeStoryTypes';

const button =
  'inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun';

/**
 * LinkedIn, "Copy email" and (when set) "Book a 15-minute call". The address arrives split
 * and reversed, and is only put together in the browser when the button is pressed, so
 * the full address is never in the page's HTML.
 */
export default function ContactLinks({
  linkedin,
  email,
  bookingLink,
}: {
  linkedin?: string;
  email?: EmailParts;
  bookingLink?: string;
}) {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  const [shown, setShown] = useState('');

  const copy = async () => {
    if (!email) return;
    const reverse = (s: string) => [...s].reverse().join('');
    const address = `${reverse(email.user)}@${reverse(email.domain)}`;
    try {
      await navigator.clipboard.writeText(address);
      setCopied('done');
      setShown('');
    } catch {
      setCopied('failed');
      setShown(address);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noopener noreferrer" className={button}>
            <Linkedin size={16} aria-hidden="true" />
            {contactLinkedInButton}
          </a>
        )}
        {email && (
          <button type="button" onClick={copy} className={button}>
            <Copy size={16} aria-hidden="true" />
            {contactCopyEmail}
          </button>
        )}
        {bookingLink && (
          <a href={bookingLink} target="_blank" rel="noopener noreferrer" className={button}>
            <CalendarDays size={16} aria-hidden="true" />
            {contactBookCall}
          </a>
        )}
      </div>
      <div aria-live="polite" className="mt-2 min-h-5 text-sm">
        {copied === 'done' && <p className="font-medium text-ink">{contactCopied}</p>}
        {copied === 'failed' && (
          <p className="text-ink-muted">
            {contactCopyFallback} <span className="select-all break-all font-mono text-ink">{shown}</span>
          </p>
        )}
      </div>
    </div>
  );
}
