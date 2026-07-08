import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import TerminalHero from '@/components/TerminalHero';
import Reveal from '@/components/Reveal';
import { getAllPosts } from '@/lib/posts';

const competencies = [
  { title: 'Data Analysis', items: ['SQL & Snowflake', 'Power BI & Tableau', 'Data quality automation'] },
  { title: 'Machine Learning', items: ['CatBoost & scikit-learn', 'Classification pipelines', 'Feature engineering'] },
  { title: 'Engineering', items: ['Python, Docker', 'CI/CD, GitHub Actions', 'AWS Cloud Practitioner'] },
];

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-6">
      <section className="pt-16 sm:pt-24 pb-16 grid gap-10 sm:grid-cols-2 items-center">
        <div>
          <p className="font-mono text-sm text-teal-400 mb-3">Data Analyst · AI Resident @ Apziva</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-ink-100">
            Divyesh Bhavsar
          </h1>
          <p className="mt-5 text-ink-300 leading-relaxed">
            I build data pipelines, dashboards, and machine learning systems that hold up in
            production &mdash; not just in a notebook. Currently an AI Resident at Apziva, with a
            background spanning credit union analytics, financial data validation, and applied ML.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/projects"
              className="px-5 py-2.5 rounded-md bg-teal-500 text-navy-950 font-medium hover:bg-teal-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/20 transition-all"
            >
              View Projects
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-md border border-navy-700 text-ink-100 hover:border-teal-500 hover:-translate-y-0.5 transition-all"
            >
              Get in Touch
            </Link>
          </div>
        </div>
        <TerminalHero />
      </section>

      <Reveal>
        <section className="pb-24">
          <h2 className="font-display text-xl font-semibold text-ink-100 mb-6">Core Competencies</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {competencies.map((group, i) => (
              <div
                key={group.title}
                style={{ transitionDelay: `${i * 75}ms` }}
                className="group rounded-lg border border-navy-700 bg-navy-800/40 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-teal-600 hover:bg-navy-800/70 hover:shadow-lg hover:shadow-black/20"
              >
                <h3 className="font-mono text-sm text-teal-400 mb-3 group-hover:text-teal-300 transition-colors">
                  {group.title}
                </h3>
                <ul className="space-y-2 text-sm text-ink-300">
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
              <h2 className="font-display text-xl font-semibold text-ink-100">From the Blog</h2>
              <Link
                href="/blog"
                className="flex items-center gap-1.5 font-mono text-sm text-teal-400 hover:text-teal-300 hover:gap-2.5 transition-all"
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
                  className="group rounded-lg border border-navy-700 bg-navy-800/40 p-5 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:border-teal-600 hover:bg-navy-800/70 hover:shadow-lg hover:shadow-black/20"
                >
                  <p className="font-mono text-xs text-ink-500 mb-2">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <h3 className="font-display font-semibold text-ink-100 flex items-start justify-between gap-2">
                    <span>{post.title}</span>
                    <ArrowUpRight
                      size={16}
                      className="shrink-0 mt-1 text-ink-500 group-hover:text-teal-400 transition-colors"
                    />
                  </h3>
                  <p className="mt-2 text-sm text-ink-300 flex-1">{post.summary}</p>
                  {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="pill border-navy-700 text-ink-500 text-xs py-1">
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
  );
}
