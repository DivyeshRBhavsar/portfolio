import { TOPICS, formatPostDate, topicColor } from '@/lib/blogTopics';
import type { PostMeta } from '@/lib/posts';
import {
  blogLevelLabel,
  blogReadingTimeLabel,
  blogSeriesLabel,
  blogTopicLabel,
} from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';

/** The topic's colour dot and its name (the name is in ink; the colour is decoration). */
export function TopicTag({ topic }: { topic: PostMeta['topic'] }) {
  const name = TOPICS.find((t) => t.slug === topic)?.name ?? topic;
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-ink">
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-ink/30"
        style={{ backgroundColor: topicColor(topic) }}
      />
      <span className="sr-only">{blogTopicLabel}: </span>
      {name}
    </span>
  );
}

/** Topic · level · N min read · date · series, as one wrapping line. */
export default function PostMetaLine({
  post,
  showDate = true,
  className = '',
}: {
  post: PostMeta;
  showDate?: boolean;
  className?: string;
}) {
  const date = formatPostDate(post.date);
  const items = [
    <TopicTag key="topic" topic={post.topic} />,
    post.level && (
      <span key="level">
        <span className="sr-only">{blogLevelLabel}: </span>
        {post.level}
      </span>
    ),
    <span key="time">{fill(blogReadingTimeLabel, { n: String(post.readingMinutes) })}</span>,
    showDate && date && (
      <time key="date" dateTime={post.date}>
        {date}
      </time>
    ),
    post.series && (
      <span key="series" className="italic">
        {fill(blogSeriesLabel, { name: post.series.name, n: String(post.series.part) })}
      </span>
    ),
  ].filter(Boolean);

  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted ${className}`}>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && <span aria-hidden="true">·</span>}
          {item}
        </span>
      ))}
    </p>
  );
}
