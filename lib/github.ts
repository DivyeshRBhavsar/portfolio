export type Repo = {
  id: number;
  name: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  updatedAt: string;
};

const GITHUB_USERNAME = 'DivyeshRBhavsar';

// Manual overrides let you feature specific projects with cleaner titles/descriptions
// than what's in the raw GitHub metadata, without hiding the "live" nature of the list.
const FEATURED_ORDER = [
  'Customer-Unhappiness-Prediction',
  'Term-Deposit-Subscription-Prediction',
  'Secure-Portal-PDF-Extraction',
  'Spaceship-Titanic',
  'Restaurant-Performance-Analysis',
];

export async function getRepos(): Promise<Repo[]> {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
    {
      headers: { Accept: 'application/vnd.github+json' },
      // Revalidate periodically instead of on every request so the page stays fast
      // and stays under GitHub's unauthenticated rate limit.
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    // Fail soft: an empty list is better than a broken projects page if GitHub
    // is rate-limiting or temporarily unavailable.
    return [];
  }

  const data = await res.json();

  const repos: Repo[] = data
    .filter((r: any) => !r.fork)
    .map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      htmlUrl: r.html_url,
      homepage: r.homepage || null,
      language: r.language,
      topics: r.topics || [],
      stars: r.stargazers_count,
      updatedAt: r.updated_at,
    }));

  repos.sort((a, b) => {
    const ai = FEATURED_ORDER.indexOf(a.name);
    const bi = FEATURED_ORDER.indexOf(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return repos;
}

export function getLanguages(repos: Repo[]): string[] {
  const set = new Set<string>();
  repos.forEach((r) => r.language && set.add(r.language));
  return Array.from(set).sort();
}
