import Link from 'next/link';
import { Linkedin, Mail } from 'lucide-react';
import Reveal from '@/components/Reveal';
import LuffyHead from '@/components/character/LuffyHead';
import {
  homeContactPageLabel,
  homeEmailLabel,
  homeLinkedInLabel,
} from '@/components/character/luffyLines';
import type { CurrentRepo } from '@/lib/github';
import type { LifeStory as Story } from '@/lib/lifeStoryTypes';
import type { StorySummary } from '@/lib/storyTypes';
import ChapterHeader from './ChapterHeader';
import EducationRoadmap from './EducationRoadmap';
import EmailButton from './EmailButton';
import ExperienceChapter from './ExperienceChapter';
import NowChapter from './NowChapter';
import TracksChapter from './TracksChapter';
import { buildTables } from './sqlEngine';

const button =
  'inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-medium transition-all hover:-translate-y-0.5 hover:shadow-sticker';

/** A chapter: a section labelled by its h2, fading in gently on scroll. */
function Chapter({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section aria-labelledby={`${id}-title`} className="py-14 sm:py-20">
        {children}
      </section>
    </Reveal>
  );
}

/**
 * The home page below the stage: the life story in chapters (content/life-story.json).
 * A chapter with nothing left to show (all TODO) is left out.
 */
export default function LifeStory({
  story,
  currentRepo,
  currentStory,
}: {
  story: Story;
  currentRepo: CurrentRepo | null;
  currentStory: StorySummary | null;
}) {
  const { intro, education, experience, tracks, now, contact } = story;
  const showNow = now && now.items.some((item) => !item.auto || currentRepo);

  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* The intro ("My story so far") opens Chapter 1: its kicker, and Luffy's first line. */}
      {education ? (
        <Chapter id="story-education">
          <ChapterHeader
            id="story-education-title"
            kicker={intro.title}
            title={education.title}
            luffy={[intro.luffy, education.luffy]}
          />
          <EducationRoadmap stops={education.stops} certifications={education.certifications} />
        </Chapter>
      ) : (
        <Chapter id="story-intro">
          <ChapterHeader id="story-intro-title" title={intro.title} luffy={intro.luffy} />
        </Chapter>
      )}

      {experience && (
        <Chapter id="story-experience">
          <ChapterHeader id="story-experience-title" title={experience.title} luffy={experience.luffy} />
          <ExperienceChapter jobs={experience.jobs} tables={buildTables(story)} />
        </Chapter>
      )}

      {tracks && (
        <Chapter id="story-tracks">
          <ChapterHeader id="story-tracks-title" title={tracks.title} luffy={tracks.luffy} />
          <TracksChapter items={tracks.items} principles={tracks.principles} />
        </Chapter>
      )}

      {now && showNow && (
        <Chapter id="story-now">
          <ChapterHeader id="story-now-title" title={now.title} luffy={now.luffy} />
          <NowChapter
            items={now.items}
            updated={now.updated}
            currentRepo={currentRepo}
            currentStory={currentStory}
          />
        </Chapter>
      )}

      <Chapter id="story-contact">
        <div className="rounded-2xl border-2 border-ink bg-peach p-6 shadow-sticker sm:p-10">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <LuffyHead talking className="h-20 w-20" />
            <div>
              <h2 id="story-contact-title" className="font-display text-2xl font-bold text-ink sm:text-3xl">
                {contact.title}
              </h2>
              <p className="mt-2 text-ink">{contact.luffy}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {contact.linkedin && (
              <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className={`${button} bg-red text-white`}>
                <Linkedin size={17} aria-hidden="true" />
                {homeLinkedInLabel}
              </a>
            )}
            {contact.email && (
              <EmailButton parts={contact.email} className={`${button} bg-surface text-ink hover:bg-sun hover:text-on-sun`}>
                <Mail size={17} aria-hidden="true" />
                {homeEmailLabel}
              </EmailButton>
            )}
            <Link href="/contact" className={`${button} bg-surface text-ink hover:bg-sun hover:text-on-sun`}>
              {homeContactPageLabel}
            </Link>
          </div>
          {contact.availability && <p className="mt-6 text-ink">{contact.availability}</p>}
          {contact.resumeNote && <p className="mt-2 text-sm text-ink-muted">{contact.resumeNote}</p>}
        </div>
      </Chapter>
    </div>
  );
}
