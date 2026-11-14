import Link from 'next/link';
import { topicColor } from '@/lib/blogTopics';
import type { PostMeta } from '@/lib/posts';
import { blogTagsLabel } from '@/components/character/luffyLines';
import PostMetaLine from './PostMetaLine';

/** A post in the library: the whole card is the link. The stripe is the topic's colour. */
export default function PostCard({ post, headingLevel = 3 }: { post: PostMeta; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border-2 border-ink/10 bg-surface p-5 pl-6 transition-all hover:border-ink hover:shadow-sticker"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: topicColor(post.topic) }}
      />
      <PostMetaLine post={post} />
      <Heading className="mt-3 font-display text-lg font-semibold leading-snug text-ink group-hover:text-red-deep">
        {post.title}
      </Heading>
      <p className="mt-2 flex-1 text-sm text-ink-muted">{post.summary}</p>
      {post.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={blogTagsLabel}>
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-ink/20 px-2 py-0.5 font-mono text-[11px] text-ink-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
