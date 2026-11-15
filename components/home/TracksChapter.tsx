'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { formatRange, type Principle, type Track } from '@/lib/lifeStoryTypes';
import {
  homeDownloadResume,
  homeEvidenceHeading,
  homePrinciplesHeading,
  homeProofLink,
  homeRolePickerLabel,
  homeSkillsHeading,
  homeTrackExperienceHeading,
  homeWatchStoryPrefix,
} from '@/components/character/luffyLines';
import { KindTag } from './ExperienceChapter';
import { NamedStoryLink } from './StoryLinks';

/**
 * Chapter 3: one button per role (the first chosen); the chosen role's pitch, skills,
 * evidence stories, experience and résumé below. Then the principles, each linking to
 * the story that proves it. On phones the role buttons scroll sideways in their row.
 */
export default function TracksChapter({ items, principles }: { items: Track[]; principles: Principle[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const track = items.find((t) => t.id === selectedId) ?? items[0];
  const panelId = useId();
  const sub = 'font-mono text-xs uppercase tracking-wide text-ink-muted';

  return (
    <div>
      {items.length > 0 && track && (
        <>
          <div
            role="group"
            aria-label={homeRolePickerLabel}
            className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4"
          >
            {items.map((t) => {
              const pressed = t.id === track.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={pressed}
                  aria-controls={panelId}
                  onClick={() => setSelectedId(t.id)}
                  className={`min-h-14 shrink-0 rounded-xl border-2 px-4 py-3 text-left font-display font-semibold transition-all ${
                    pressed
                      ? 'border-ink bg-sun text-on-sun shadow-sticker'
                      : 'border-ink/20 bg-surface text-ink hover:border-ink'
                  }`}
                >
                  {t.role}
                </button>
              );
            })}
          </div>

          <div id={panelId} className="mt-6 rounded-2xl border-2 border-ink bg-surface p-5 sm:p-6">
            <h3 className="font-display text-xl font-bold text-ink">{track.role}</h3>
            {track.pitch && <p className="mt-2 max-w-2xl text-ink">{track.pitch}</p>}

            {track.skills.length > 0 && (
              <div className="mt-5">
                <h4 className={sub}>{homeSkillsHeading}</h4>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {track.skills.map((s) => (
                    <li key={s} className="pill border-ink/20 py-1 text-xs text-ink">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {track.evidence.length > 0 && (
              <div className="mt-5">
                <h4 className={sub}>{homeEvidenceHeading}</h4>
                <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                  {track.evidence.map((story) => (
                    <li key={story.slug}>
                      <Link
                        href={story.href}
                        aria-label={`${homeWatchStoryPrefix}: ${story.title}`}
                        className="flex h-full min-h-11 items-center gap-1.5 rounded-xl border-2 border-ink/10 bg-cream p-4 font-display font-semibold text-red-deep transition-all hover:border-ink hover:shadow-sticker"
                      >
                        {story.title}
                        <span aria-hidden="true" className="text-xs">▶</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {track.experience.length > 0 && (
              <div className="mt-5">
                <h4 className={sub}>{homeTrackExperienceHeading}</h4>
                <ul className="mt-2 space-y-2">
                  {track.experience.map((job) => {
                    const dates = formatRange(job.start, job.end);
                    return (
                      <li key={`${job.role}-${job.company}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <KindTag kind={job.kind} />
                        <span className="font-medium text-ink">{job.role}</span>
                        <span className="text-ink-muted">· {job.company}</span>
                        {dates && <span className="font-mono text-xs text-ink-muted">· {dates}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {track.resume && (
              <a
                href={track.resume}
                download
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-red px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-sticker"
              >
                <Download size={16} aria-hidden="true" />
                {homeDownloadResume}
                <span className="sr-only"> ({track.role})</span>
              </a>
            )}
          </div>
        </>
      )}

      {principles.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-xl font-bold text-ink">{homePrinciplesHeading}</h3>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {principles.map((p, i) => (
              <li key={p.title}>
                <div className="flex h-full flex-col rounded-xl border-2 border-ink/10 bg-surface p-5">
                  <span aria-hidden="true" className="font-mono text-sm text-red-deep">
                    0{i + 1}
                  </span>
                  <span className="mt-1 flex-1 font-display text-lg font-semibold text-ink">{p.title}</span>
                  {p.proof && (
                    <NamedStoryLink href={p.proof.href} name={p.proof.title} label={homeProofLink} className="mt-3" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
