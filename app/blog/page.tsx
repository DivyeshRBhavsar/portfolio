import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/posts';
import BlogLibrary from '@/components/blog/BlogLibrary';
import PageHero from '@/components/PageHero';
import {
  blogHeroCounts,
  blogHeroLines,
  blogHeroSubtitle,
  blogHeroTitle,
} from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';

export const metadata: Metadata = {
  title: 'Blog — Divyesh Bhavsar',
  description:
    'Notes on machine learning, LLMs and data engineering projects, and the decisions behind them.',
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const minutes = posts.reduce((sum, p) => sum + p.readingMinutes, 0);
  const counts = [
    fill(posts.length === 1 ? blogHeroCounts.posts.one : blogHeroCounts.posts.other, { n: String(posts.length) }),
    ...(minutes > 0 ? [fill(blogHeroCounts.minutes, { n: String(minutes) })] : []),
  ].join(' · ');

  return (
    <div>
      <PageHero
        title={blogHeroTitle}
        subtitle={blogHeroSubtitle}
        luffy={blogHeroLines}
        extras={<span className="font-mono">{counts}</span>}
      />
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 sm:pt-10">
        {posts.length === 0 ? (
          <p className="text-ink-muted font-mono text-sm">No posts published yet.</p>
        ) : (
          <BlogLibrary posts={posts} />
        )}
      </div>
    </div>
  );
}
