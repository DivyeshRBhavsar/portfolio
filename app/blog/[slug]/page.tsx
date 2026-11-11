import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPostBySlug } from '@/lib/posts';

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-sm text-red-deep mb-2">/ blog</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-3">{post.meta.title}</h1>
      <p className="font-mono text-xs text-ink-muted mb-10">
        {new Date(post.meta.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:text-ink prose-p:text-ink prose-li:text-ink prose-strong:text-ink prose-a:text-red-deep prose-th:text-ink prose-td:text-ink">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
