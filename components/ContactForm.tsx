'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const form = e.currentTarget;
    const payload = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong sending your message.');
      }

      setStatus('sent');
      form.reset();
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong sending your message.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl border-2 border-ink bg-sun p-6 text-on-sun shadow-sticker">
        <p className="font-display font-semibold mb-1">Message sent.</p>
        <p className="text-sm text-on-sun">Thanks for reaching out &mdash; I&apos;ll reply soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-mono text-ink mb-1.5">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg bg-surface border-2 border-ink-muted px-4 py-2.5 text-ink focus-visible:border-ink"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-mono text-ink mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg bg-surface border-2 border-ink-muted px-4 py-2.5 text-ink focus-visible:border-ink"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-mono text-ink mb-1.5">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded-lg bg-surface border-2 border-ink-muted px-4 py-2.5 text-ink focus-visible:border-ink"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-deep font-mono">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="px-5 py-2.5 rounded-full border-2 border-ink bg-red text-white font-medium hover:-translate-y-0.5 hover:shadow-sticker transition-all disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
