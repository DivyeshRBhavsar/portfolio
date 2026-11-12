'use client';

import { motion } from 'motion/react';

export type Chip = { key: string; label: string; onSelect: () => void };

/**
 * "What brings you here?" answers. Real buttons, so Tab moves between them and
 * Enter/Space picks the focused one. Stacked full width on mobile.
 */
export default function IntentChips({ chips, animate }: { chips: Chip[]; animate: boolean }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-center">
      {chips.map((chip, i) => (
        <motion.button
          key={chip.key}
          type="button"
          onClick={chip.onSelect}
          initial={animate ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: animate ? i * 0.06 : 0 }}
          className="w-full rounded-full border-2 border-ink bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sun hover:text-on-sun hover:shadow-sticker sm:w-auto"
        >
          {chip.label}
        </motion.button>
      ))}
    </div>
  );
}
