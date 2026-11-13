import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import TerminalHero from '@/components/TerminalHero';
import Reveal from '@/components/Reveal';
import HomeStage from '@/components/character/HomeStage';
import { getAllPosts } from '@/lib/posts';
import { getCurrentRepo } from '@/lib/github';

const competencies = [
  { title: 'Data Analysis', items: ['SQL & Snowflake', 'Power BI & Tableau', 'Data quality automation'] },
  { title: 'Machine Learning', items: ['CatBoost & scikit-learn', 'Classification pipelines', 'Feature engineering'] },
  { title: 'Engineering', items: ['Python, Docker', 'CI/CD, GitHub Actions', 'AWS Cloud Practitioner'] },
];

export default async function HomePage() {
  const latestPosts = getAllPosts().slice(0, 3);
  const latestPostHref = latestPosts[0] ? `/blog/${latestPosts[0].slug}` : '/blog';
  // "Currently working on" badge; null (badge hidden) if GitHub fails. Cached for an hour.
  const currentRepo = await getCurrentRepo();

  return (
    <div>
      {/* Luffy's stage: welcome, lights up, conversation. */}
      <HomeStage latestPostHref={latestPostHref} currentRepo={currentRepo} />

      {/* First section below the stage: Tour and "Skip to portfolio" scroll here. */}
      <section
        id="about"
        tabIndex={-1}
        className="scroll-mt-20 max-w-5xl mx-auto px-6 pt-16 sm:pt-20 outline-none"
      >
        <p className="font-mono text-sm text-red-deep mb-3">Data Analyst · AI Resident @ Apziva</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-ink">
          Divyesh Bhavsar
        </h1>
        <p className="mt-6 max-w-2xl text-ink-muted leading-relaxed">
          I build data pipelines, dashboards, and machine learning systems that hold up in
          production &mdash; not just in a notebook. Currently an AI Resident at Apziva, with a
          background spanning credit union analytics, financial data validation, and applied ML.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/projects"
            className="px-5 py-2.5 rounded-full border-2 border-ink bg-red text-white font-medium hover:-translate-y-0.5 hover:shadow-sticker transition-all"
          >
            View Projects
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-full border-2 border-ink bg-surface text-ink font-medium hover:bg-sun hover:text-on-sun hover:-translate-y-0.5 hover:shadow-sticker transition-all"
          >
            Get in Touch
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6">
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <TerminalHero />
          </div>
        </section>

        <Reveal>
          <section className="pb-24">
            <h2 className="font-display text-xl font-semibold text-ink mb-6">Core Competencies</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {competencies.map((group, i) => (
                <div
                  key={group.title}
                  style={{ transitionDelay: `${i * 75}ms` }}
                  className="group rounded-xl border-2 border-ink/10 bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-ink hover:shadow-sticker"
                >
                  <h3 className="font-mono text-sm text-red-deep mb-3">
                    {group.title}
                  </h3>
                  <ul className="space-y-2 text-sm text-ink-muted">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {latestPosts.length > 0 && (
          <Reveal>
            <section className="pb-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold text-ink">From the Blog</h2>
                <Link
                  href="/blog"
                  className="flex items-center gap-1.5 font-mono text-sm text-red-deep hover:underline underline-offset-4 hover:gap-2.5 transition-all"
                >
                  All posts <ArrowRight size={15} />
                </Link>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                {latestPosts.map((post, i) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    style={{ transitionDelay: `${i * 75}ms` }}
                    className="group rounded-xl border-2 border-ink/10 bg-surface p-5 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:border-ink hover:shadow-sticker"
                  >
                    <p className="font-mono text-xs text-ink-muted mb-2">
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <h3 className="font-display font-semibold text-ink flex items-start justify-between gap-2">
                      <span>{post.title}</span>
                      <ArrowUpRight
                        size={16}
                        className="shrink-0 mt-1 text-ink-muted group-hover:text-red-deep transition-colors"
                      />
                    </h3>
                    <p className="mt-2 text-sm text-ink-muted flex-1">{post.summary}</p>
                    {post.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="pill bg-sun border-ink text-on-sun text-xs py-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        )}
      </div>
    </div>
  );
}
