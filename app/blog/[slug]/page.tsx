import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPostBySlug } from '@/lib/posts';

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-sm text-teal-400 mb-2">/ blog</p>
      <h1 className="font-display text-3xl font-bold text-ink-100 mb-3">{post.meta.title}</h1>
      <p className="font-mono text-xs text-ink-500 mb-10">
        {new Date(post.meta.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <div className="prose prose-invert prose-teal max-w-none prose-headings:font-display prose-a:text-teal-400">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
