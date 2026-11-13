import type { Metadata } from 'next';
import ProjectsPage from '@/components/projects/ProjectsPage';
import { getStories, getStory } from '@/lib/stories';

// One static page per story file; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getStories().map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) return {};
  return { title: `${story.title} — Divyesh Bhavsar`, description: story.hook };
}

/** Same page as /projects, opened in story mode on this story (the hash picks the slide). */
export default function StoryPage() {
  return <ProjectsPage />;
}
