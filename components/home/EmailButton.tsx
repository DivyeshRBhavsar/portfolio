'use client';

import type { ReactNode } from 'react';
import type { EmailParts } from '@/lib/lifeStoryTypes';

const reverse = (s: string) => [...s].reverse().join('');

/**
 * Opens the visitor's mail app. The address arrives split and reversed (see
 * lib/lifeStory.ts) and is put together here only on click, so the full address never
 * appears in the page's HTML.
 */
export default function EmailButton({
  parts,
  className,
  children,
}: {
  parts: EmailParts;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.location.href = `mailto:${reverse(parts.user)}@${reverse(parts.domain)}`;
      }}
    >
      {children}
    </button>
  );
}
