'use client';

import { useState, type FormEvent } from 'react';
import {
  nameInputLabel,
  nameInputPlaceholder,
  nameSkipLabel,
  nameSubmitLabel,
} from './luffyLines';
import { NAME_MAX_LENGTH, cleanName } from './visitorMemory';

/** Inline "what's your name?" answer. Enter submits; the name is only ever plain text. */
export default function NameForm({
  onSubmit,
  onSkip,
}: {
  onSubmit: (name: string) => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState('');
  const usable = cleanName(value) !== '';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (usable) onSubmit(value);
  };

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <label htmlFor="luffy-name" className="sr-only">
        {nameInputLabel}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="luffy-name"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={NAME_MAX_LENGTH}
          placeholder={nameInputPlaceholder}
          autoComplete="given-name"
          enterKeyHint="go"
          className="min-w-0 flex-1 rounded-full border-2 border-ink-muted bg-surface px-4 py-2 text-ink placeholder:text-ink-muted focus-visible:border-ink"
        />
        <button
          type="submit"
          disabled={!usable}
          className="rounded-full border-2 border-ink bg-red px-4 py-2 text-sm font-medium text-white transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-sticker disabled:opacity-60"
        >
          {nameSubmitLabel}
        </button>
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="self-center text-sm text-ink-muted underline underline-offset-4 hover:text-red-deep"
      >
        {nameSkipLabel}
      </button>
    </form>
  );
}
