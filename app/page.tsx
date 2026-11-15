import HomeStage from '@/components/character/HomeStage';
import { homeRoleLine } from '@/components/character/luffyLines';
import LifeStory from '@/components/home/LifeStory';
import { getAllPosts } from '@/lib/posts';
import { getCurrentRepo } from '@/lib/github';
import { getLifeStory } from '@/lib/lifeStory';
import { getStories, storiesByRepoId } from '@/lib/stories';

export default async function HomePage() {
  // The stage's "What's new" chip opens the latest post.
  const latestPost = getAllPosts()[0];
  const latestPostHref = latestPost ? `/blog/${latestPost.slug}` : '/blog';
  // "Currently working on" (stage badge and Chapter 4); null if GitHub fails. Cached for an hour.
  const currentRepo = await getCurrentRepo();
  const currentStory = currentRepo
    ? ((await storiesByRepoId(getStories(), [currentRepo]))[currentRepo.id] ?? null)
    : null;
  const story = getLifeStory();

  return (
    <div>
      {/* Luffy's stage: welcome, lights up, conversation. */}
      <HomeStage latestPostHref={latestPostHref} currentRepo={currentRepo} currentStory={currentStory} />

      {/* First section below the stage: Tour and "Skip to portfolio" scroll here. */}
      <section
        id="about"
        tabIndex={-1}
        className="mx-auto max-w-5xl scroll-mt-20 px-6 pt-16 outline-none sm:pt-20"
      >
        <p className="mb-3 font-mono text-sm text-red-deep">{homeRoleLine}</p>
        <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
          Divyesh Bhavsar
        </h1>
      </section>

      <LifeStory story={story} currentRepo={currentRepo} currentStory={currentStory} />
    </div>
  );
}
