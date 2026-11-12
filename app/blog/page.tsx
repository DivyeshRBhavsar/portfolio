import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

export const metadata = { title: 'Blog — Divyesh Bhavsar' };

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-sm text-red-deep mb-2">/ blog</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-3">Writing</h1>
      <p className="text-ink-muted mb-10">
        Notes on projects, pipelines, and the decisions behind them. Add a new{' '}
        <code className="text-red-deep">.mdx</code> file to{' '}
        <code className="text-red-deep">content/blog</code> to publish a new post.
      </p>

      {posts.length === 0 ? (
        <p className="text-ink-muted font-mono text-sm">No posts published yet.</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border-2 border-ink/10 bg-surface p-6 hover:border-ink hover:shadow-sticker transition-all"
            >
              <p className="font-mono text-xs text-ink-muted mb-2">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <h2 className="font-display text-xl font-semibold text-ink mb-2">
                {post.title}
              </h2>
              <p className="text-ink-muted text-sm">{post.summary}</p>
              <div className="mt-4 flex gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="pill bg-sun border-ink text-on-sun text-xs py-1">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
