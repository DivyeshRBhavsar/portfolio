import { getRepos, getLanguages } from '@/lib/github';
import ProjectGallery from '@/components/ProjectGallery';

export const metadata = { title: 'Projects — Divyesh Bhavsar' };

export default async function ProjectsPage() {
  const repos = await getRepos();
  const languages = getLanguages(repos);

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <p className="font-mono text-sm text-teal-400 mb-2">/ projects</p>
      <h1 className="font-display text-3xl font-bold text-ink-100 mb-3">Projects</h1>
      <p className="text-ink-300 mb-10 max-w-2xl">
        Pulled live from{' '}
        <a
          href="https://github.com/DivyeshRBhavsar"
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-400 hover:underline"
        >
          github.com/DivyeshRBhavsar
        </a>
        , refreshed hourly &mdash; this list updates itself as new repos are pushed.
      </p>
      <ProjectGallery repos={repos} languages={languages} />
    </div>
  );
}
