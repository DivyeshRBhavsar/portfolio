import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Atkinson_Hyperlegible, Literata } from 'next/font/google';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import PostMetaLine from '@/components/blog/PostMetaLine';
import ReadingRoom from '@/components/blog/ReadingRoom';
import { headingComponents } from '@/components/blog/mdxHeadings';

// Reader fonts ("Aa"), for post pages only. preload: false, so a font file is fetched
// only when the reader picks it (the CSS that uses it is in app/globals.css).
const serif = Literata({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-reader-serif',
  display: 'swap',
  preload: false,
});

const dyslexic = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-reader-dyslexic',
  display: 'swap',
  preload: false,
});

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.meta.title} — Divyesh Bhavsar`,
    description: post.meta.summary,
    openGraph: {
      type: 'article',
      title: post.meta.title,
      description: post.meta.summary,
      publishedTime: post.meta.date || undefined,
      tags: post.meta.tags,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <ReadingRoom
      slug={slug}
      minutes={post.meta.readingMinutes}
      headings={post.headings}
      fontClassName={`${serif.variable} ${dyslexic.variable}`}
    >
      {/* data-visit-label: VisitTracker remembers the post by its title (home "Continue"). */}
      <article data-visit-label={post.meta.title}>
        <header className="mb-10">
          <Link href="/blog" className="font-mono text-sm text-red-deep hover:underline">
            / blog
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
            {post.meta.title}
          </h1>
          <PostMetaLine post={post.meta} className="mt-4 text-sm" />
        </header>
        <div className="reader-body prose prose-neutral max-w-none prose-headings:font-display prose-headings:text-ink prose-p:text-ink prose-li:text-ink prose-strong:text-ink prose-a:text-red-deep prose-th:text-ink prose-td:text-ink">
          <MDXRemote source={post.content} components={headingComponents()} />
        </div>
      </article>
    </ReadingRoom>
  );
}
