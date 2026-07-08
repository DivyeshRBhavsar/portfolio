import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

export const metadata = { title: 'Blog — Divyesh Bhavsar' };

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-sm text-teal-400 mb-2">/ blog</p>
      <h1 className="font-display text-3xl font-bold text-ink-100 mb-3">Writing</h1>
      <p className="text-ink-300 mb-10">
        Notes on projects, pipelines, and the decisions behind them. Add a new{' '}
        <code className="text-teal-400">.mdx</code> file to{' '}
        <code className="text-teal-400">content/blog</code> to publish a new post.
      </p>

      {posts.length === 0 ? (
        <p className="text-ink-500 font-mono text-sm">No posts published yet.</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-lg border border-navy-700 bg-navy-800/40 p-6 hover:border-teal-600 transition-colors"
            >
              <p className="font-mono text-xs text-ink-500 mb-2">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <h2 className="font-display text-xl font-semibold text-ink-100 mb-2">
                {post.title}
              </h2>
              <p className="text-ink-300 text-sm">{post.summary}</p>
              <div className="mt-4 flex gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="pill border-navy-700 text-ink-500 text-xs py-1">
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
