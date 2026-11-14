'use client';

import { TOPICS, topicColor, type TopicSlug } from '@/lib/blogTopics';
import {
  blogPostCountLabels,
  blogTopicAllLabel,
  blogTopicChipsLabel,
} from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';

/** [All n] then each topic with posts, with its count. Buttons with aria-pressed. */
export default function TopicChips({
  counts,
  total,
  selected,
  onSelect,
}: {
  counts: Partial<Record<TopicSlug, number>>;
  total: number;
  selected: TopicSlug | null;
  onSelect: (slug: TopicSlug | null) => void;
}) {
  const chips = [
    { slug: null, name: blogTopicAllLabel, count: total },
    ...TOPICS.filter((t) => (counts[t.slug] ?? 0) > 0).map((t) => ({
      slug: t.slug as TopicSlug,
      name: t.name as string,
      count: counts[t.slug] ?? 0,
    })),
  ];

  return (
    <div role="group" aria-label={blogTopicChipsLabel} className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const pressed = chip.slug === selected;
        return (
          <button
            key={chip.slug ?? 'all'}
            type="button"
            aria-pressed={pressed}
            onClick={() => onSelect(chip.slug)}
            className={`pill inline-flex min-h-11 items-center gap-2 ${
              pressed
                ? 'border-ink bg-sun text-on-sun'
                : 'border-ink-muted bg-surface text-ink hover:border-ink hover:bg-sun/40'
            }`}
          >
            {chip.slug && (
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/30"
                style={{ backgroundColor: topicColor(chip.slug) }}
              />
            )}
            <span>{chip.name}</span>
            <span
              aria-hidden="true"
              className={`rounded-full px-1.5 font-mono text-xs ${pressed ? 'bg-on-sun/10' : 'bg-ink/10'}`}
            >
              {chip.count}
            </span>
            <span className="sr-only">
              (
              {chip.count === 1
                ? blogPostCountLabels.one
                : fill(blogPostCountLabels.other, { n: String(chip.count) })}
              )
            </span>
          </button>
        );
      })}
    </div>
  );
}
