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
export type CurrentRepo = Pick<Repo, 'id' | 'name' | 'htmlUrl' | 'pushedAt'>;

export const GITHUB_USERNAME = 'DivyeshRBhavsar';

// Which repos appear on /projects and in the home page's "Currently working on" badge:
//   - public, not a fork, not archived, and not in HIDDEN_REPOS (never shown, even if tagged)
//   - with the GitHub topic SHOWCASE_TOPIC
//   - if no repo has that topic yet, all the others, so the page is never empty
// Names here match ignoring case, hyphens and underscores.
const HIDDEN_REPOS: string[] = ['DivyeshRBhavsar'];
const SHOWCASE_TOPIC = 'showcase';

// "Currently working on": the showcase repo with the most recent push, never one of
// BADGE_EXCLUDE (this site's own repo would always win). Set PINNED_CURRENT_REPO to a
// repo name to always show that one instead (falls back to the rule if it isn't found).
const BADGE_EXCLUDE: string[] = ['portfolio'];
const PINNED_CURRENT_REPO: string | null = null;

// Shown first, in this order (the rest follow, most recently updated first).
const FEATURED_ORDER = [
  'Customer-Unhappiness-Prediction',
  'Term-Deposit-Subscription-Prediction',
  'Secure-Portal-PDF-Extraction',
  'Spaceship-Titanic',
  'Restaurant-Performance-Analysis',
];

/** "Spaceship-Titanic", "spaceship_titanic" and "SpaceshipTitanic" are the same name. */
export function sameRepoName(a: string, b: string): boolean {
  const key = (name: string) => name.toLowerCase().replace(/[-_]/g, '');
  return key(a) === key(b);
}

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
  archived?: boolean;
};

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  // Optional, for a higher rate limit. Server-only: no NEXT_PUBLIC_ prefix, so it's
  // never sent to the browser.
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Revalidate periodically instead of on every request so pages stay fast and stay
// under GitHub's unauthenticated rate limit.
const CACHE = { revalidate: 3600 };

function featuredIndex(name: string): number {
  return FEATURED_ORDER.findIndex((featured) => sameRepoName(featured, name));
}

/**
 * Every repo that may appear: public, not a fork, not archived, not hidden. Ordered by
 * FEATURED_ORDER, then most recently updated.
 */
export async function getRepos(): Promise<Repo[]> {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
    { headers: githubHeaders(), next: CACHE }
  );

  if (!res.ok) {
    // Fail soft: an empty list is better than a broken projects page if GitHub
    // is rate-limiting or temporarily unavailable.
    return [];
  }

  const data: GitHubRepo[] = await res.json();

  const repos: Repo[] = data
    .filter((r) => !r.fork && !r.private && !r.archived)
    .filter((r) => !HIDDEN_REPOS.some((hidden) => sameRepoName(hidden, r.name)))
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
    const ai = featuredIndex(a.name);
    const bi = featuredIndex(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return repos;
}

/** The repos shown on /projects: tagged "showcase", or all of getRepos() if none are. */
export async function getShowcaseRepos(): Promise<Repo[]> {
  const repos = await getRepos();
  const showcase = repos.filter((r) => r.topics.includes(SHOWCASE_TOPIC));
  return showcase.length > 0 ? showcase : repos;
}

/**
 * A repo's current id from its URL's owner/name. GitHub redirects a renamed repo's old
 * name to the new one, so a story written before a rename still finds its repo.
 * null if GitHub can't be reached or the repo doesn't exist.
 */
export async function resolveRepoId(owner: string, name: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
      { headers: githubHeaders(), next: CACHE, redirect: 'follow' }
    );
    if (!res.ok) return null;
    const data: { id?: unknown } = await res.json();
    return typeof data.id === 'number' ? data.id : null;
  } catch {
    return null;
  }
}

/**
 * The repo for the "Currently working on" badge (same rules as /projects), or null if
 * GitHub fails (the badge is then hidden). Shares the hourly-cached request.
 */
export async function getCurrentRepo(): Promise<CurrentRepo | null> {
  try {
    const repos = (await getShowcaseRepos()).filter(
      (r) => !BADGE_EXCLUDE.some((name) => sameRepoName(name, r.name))
    );
    const pinned = PINNED_CURRENT_REPO
      ? repos.find((r) => sameRepoName(r.name, PINNED_CURRENT_REPO))
      : undefined;
    const latest = [...repos].sort(
      (a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()
    )[0];

    const repo = pinned ?? latest;
    return repo
      ? { id: repo.id, name: repo.name, htmlUrl: repo.htmlUrl, pushedAt: repo.pushedAt }
      : null;
  } catch {
    return null;
  }
}
