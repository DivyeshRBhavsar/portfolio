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
  /** Last push to any branch (updatedAt also changes on stars and description edits). */
  pushedAt: string;
};

/** The home page's "Currently working on" badge. */
export type CurrentRepo = Pick<Repo, 'name' | 'htmlUrl' | 'pushedAt'>;

const GITHUB_USERNAME = 'DivyeshRBhavsar';

// "Currently working on" badge: the public, non-fork repo with the most recent push,
// skipping these (case doesn't matter). Set PINNED_CURRENT_REPO to a repo name to
// always show that one instead (falls back to the rule above if it isn't found).
const EXCLUDE_REPOS: string[] = ['portfolio'];
const PINNED_CURRENT_REPO: string | null = null;

// Manual overrides let you feature specific projects with cleaner titles/descriptions
// than what's in the raw GitHub metadata, without hiding the "live" nature of the list.
const FEATURED_ORDER = [
  'Customer-Unhappiness-Prediction',
  'Term-Deposit-Subscription-Prediction',
  'Secure-Portal-PDF-Extraction',
  'Spaceship-Titanic',
  'Restaurant-Performance-Analysis',
];

/** The fields we read from GitHub's REST API. */
type GitHubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  updated_at: string;
  pushed_at: string | null;
  fork: boolean;
  private?: boolean;
};

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  // Optional, for a higher rate limit. Server-only: no NEXT_PUBLIC_ prefix, so it's
  // never sent to the browser.
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function getRepos(): Promise<Repo[]> {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
    {
      headers: githubHeaders(),
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

  const data: GitHubRepo[] = await res.json();

  const repos: Repo[] = data
    .filter((r) => !r.fork && !r.private)
    .map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      htmlUrl: r.html_url,
      homepage: r.homepage || null,
      language: r.language,
      topics: r.topics || [],
      stars: r.stargazers_count,
      updatedAt: r.updated_at,
      pushedAt: r.pushed_at || r.updated_at,
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

/**
 * The repo for the "Currently working on" badge, or null if GitHub fails (the badge
 * is then hidden). Shares getRepos' hourly-cached request with /projects.
 */
export async function getCurrentRepo(): Promise<CurrentRepo | null> {
  try {
    const repos = await getRepos();
    const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

    const pinned = PINNED_CURRENT_REPO
      ? repos.find((r) => same(r.name, PINNED_CURRENT_REPO))
      : undefined;
    const latest = repos
      .filter((r) => !EXCLUDE_REPOS.some((name) => same(name, r.name)))
      .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime())[0];

    const repo = pinned ?? latest;
    return repo ? { name: repo.name, htmlUrl: repo.htmlUrl, pushedAt: repo.pushedAt } : null;
  } catch {
    return null;
  }
}

export function getLanguages(repos: Repo[]): string[] {
  const set = new Set<string>();
  repos.forEach((r) => r.language && set.add(r.language));
  return Array.from(set).sort();
}
