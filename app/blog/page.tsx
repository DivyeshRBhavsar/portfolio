import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/posts';
import BlogLibrary from '@/components/blog/BlogLibrary';

export const metadata: Metadata = {
  title: 'Blog — Divyesh Bhavsar',
  description:
    'Notes on machine learning, LLMs and data engineering projects, and the decisions behind them.',
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <p className="font-mono text-sm text-red-deep mb-2">/ blog</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-3">Writing</h1>
      <p className="text-ink-muted mb-10 max-w-2xl">
        Notes on projects, pipelines, and the decisions behind them.
      </p>

      {posts.length === 0 ? (
        <p className="text-ink-muted font-mono text-sm">No posts published yet.</p>
      ) : (
        <BlogLibrary posts={posts} />
      )}
    </div>
  );
}
