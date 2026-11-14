import { GITHUB_USERNAME, resolveRepoId, sameRepoName, type Repo } from './github';

/*
 * Expertise categories on /projects. Edit freely.
 *
 * A repo's categories come from its GitHub topics matching these slugs (alongside
 * "showcase"). Its MAIN category (the section it's listed under in the "All" view) is
 * PRIMARY_CATEGORY's entry for it if there is one, otherwise its first matching
 * category in display order. A repo with no category topic goes under OTHER_CATEGORY.
 * Stories inherit their repo's categories. The slug is also the URL:
 * /projects?category=<slug>.
 */

export type CategorySlug =
  'ai-llm' | 'data-science' | 'data-engineering' | 'software-development' | 'web-development';

export type Category = {
  slug: string;
  name: string;
  description: string;
  /** Display order (lowest first). */
  order: number;
  skills: string[];
};

export const CATEGORIES: (Category & { slug: CategorySlug })[] = [
  {
    slug: 'ai-llm',
    name: '🧠 AI: LLMs & Computer Vision',
    description: 'Language models, retrieval-augmented generation and computer vision.',
    order: 1,
    skills: [
      'QLoRA fine-tuning',
      'RAG (FAISS, ChromaDB)',
      'Hugging Face',
      'Prompt engineering',
      'OpenCV',
    ],
  },
  {
    slug: 'data-science',
    name: '📊 Data Science & ML',
    description: 'Analysis, statistics and predictive models that answer real questions.',
    order: 2,
    skills: [
      'XGBoost',
      'CatBoost',
      'Optuna',
      'Feature engineering',
      'Statistical testing',
      'scikit-learn',
    ],
  },
  {
    slug: 'data-engineering',
    name: '🔧 Data Engineering & Automation',
    description: 'Turning messy, locked-away data into clean, reliable pipelines.',
    order: 3,
    skills: ['Playwright', 'pdfplumber', 'Data pipelines', 'pytest & CI', 'Streamlit'],
  },
  {
    slug: 'software-development',
    name: '💻 Software Development',
    description: 'Complete applications with interfaces, databases and tests.',
    order: 4,
    skills: ['Python applications', 'Tkinter', 'MySQL', 'Streamlit', 'Testing & CI'],
  },
  {
    slug: 'web-development',
    name: '🌐 Web Development',
    description: 'Interactive, animated websites built with modern web tools.',
    order: 5,
    skills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Motion', 'Vercel'],
  },
];

/** For repos with no category topic. Only shown when it has projects. */
export const OTHER_CATEGORY: Category = {
  slug: 'other',
  name: 'Other projects',
  description: 'Experiments, coursework and smaller builds.',
  order: 99,
  skills: [],
};

/**
 * Main category overrides, by repo name (matched ignoring case, hyphens and
 * underscores). Each name is also looked up on GitHub, so an override keeps working
 * after the repo is renamed.
 */
export const PRIMARY_CATEGORY: Record<string, CategorySlug> = {
  'Secure-Portal-PDF-Data-Extraction-System': 'data-engineering',
  'Facial-Recognition-master': 'software-development',
  '120J1xTr0fpjvfEI': 'ai-llm',
  portfolio: 'web-development',
};

/** Every category in display order, "Other projects" last. */
export function allCategories(): Category[] {
  return [...CATEGORIES, OTHER_CATEGORY].sort((a, b) => a.order - b.order);
}

export type ProjectCategories = {
  /** Every category it belongs to, in display order (main included). */
  categories: string[];
  /** The section it's listed under in the "All" view. */
  main: string;
};

const ORDERED = [...CATEGORIES].sort((a, b) => a.order - b.order);

/** Each repo's categories and main category, by repo id (server side, cached hourly). */
export async function categorizeRepos(
  repos: Pick<Repo, 'id' | 'name' | 'topics'>[]
): Promise<Record<number, ProjectCategories>> {
  // Overrides by repo id too: GitHub resolves an old name to the renamed repo.
  const overrideById = new Map<number, CategorySlug>();
  await Promise.all(
    Object.entries(PRIMARY_CATEGORY).map(async ([name, slug]) => {
      const id = await resolveRepoId(GITHUB_USERNAME, name);
      if (id !== null) overrideById.set(id, slug);
    })
  );

  const result: Record<number, ProjectCategories> = {};
  for (const repo of repos) {
    const fromTopics: string[] = ORDERED.filter((c) => repo.topics.includes(c.slug)).map(
      (c) => c.slug
    );
    const override =
      overrideById.get(repo.id) ??
      Object.entries(PRIMARY_CATEGORY).find(([name]) => sameRepoName(name, repo.name))?.[1];
    const main = override ?? fromTopics[0] ?? OTHER_CATEGORY.slug;
    // An override counts even without its topic; keep display order.
    const categories =
      main === OTHER_CATEGORY.slug
        ? [OTHER_CATEGORY.slug]
        : ORDERED.map((c) => c.slug).filter((slug) => slug === main || fromTopics.includes(slug));
    result[repo.id] = { categories, main };
  }
  return result;
}
