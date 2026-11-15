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
  // For the higher rate limit (5,000/hour instead of 60). Server-only: no NEXT_PUBLIC_
  // prefix, so it's never sent to the browser, and this module only runs on the server
  // (components import its types only).
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Revalidate periodically instead of on every request so pages stay fast and stay
// under GitHub's rate limit. Next.js only caches successful (200) responses.
const CACHE = { revalidate: 3600 };

/** A GitHub request that failed: status 0 = network error. */
export class GitHubError extends Error {
  constructor(
    public status: number,
    public endpoint: string
  ) {
    super(`GitHub ${endpoint} failed (${status || 'network error'})`);
  }
}

/** True while `next build` generates pages (no earlier good version exists to keep). */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

/**
 * GET from GitHub's API. A failure throws (it's never treated as "no repos"), so a
 * revalidation that fails keeps the last good page. Logs the endpoint, status and whether
 * a token is configured; never the token. `allow404`: a missing repo returns null.
 */
async function githubJson<T>(endpoint: string, { allow404 = false } = {}): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`https://api.github.com${endpoint}`, { headers: githubHeaders(), next: CACHE, redirect: 'follow' });
  } catch {
    console.error(`[github] ${endpoint}: network error`);
    throw new GitHubError(0, endpoint);
  }
  if (res.status === 404 && allow404) return null;
  if (!res.ok) {
    const limited = res.headers.get('x-ratelimit-remaining') === '0';
    const token = process.env.GITHUB_TOKEN?.trim() ? 'token set' : 'no GITHUB_TOKEN';
    console.error(`[github] ${endpoint}: HTTP ${res.status}${limited ? ' (rate limit reached)' : ''} [${token}]`);
    throw new GitHubError(res.status, endpoint);
  }
  return (await res.json()) as T;
}

function featuredIndex(name: string): number {
  return FEATURED_ORDER.findIndex((featured) => sameRepoName(featured, name));
}

/**
 * Every repo that may appear: public, not a fork, not archived, not hidden. Ordered by
 * FEATURED_ORDER, then most recently updated.
 */
export async function getRepos(): Promise<Repo[]> {
  // Throws if GitHub fails (see githubJson): an empty list would be cached as the page.
  const data = (await githubJson<GitHubRepo[]>(`/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`)) ?? [];

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
 * name to the new one, so a story written before a rename still finds its repo. Callers
 * look in the repo list first and only ask GitHub for names that aren't in it.
 * null if the repo doesn't exist; throws if GitHub fails.
 */
export async function resolveRepoId(owner: string, name: string): Promise<number | null> {
  const data = await githubJson<{ id?: unknown }>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
    allow404: true,
  });
  return data && typeof data.id === 'number' ? data.id : null;
}

/**
 * The repo for the "Currently working on" badge (same rules as /projects). Shares the
 * hourly-cached request. If GitHub fails: during the build, null (the badge is hidden
 * and the page still builds); afterwards, it throws so the last good page is kept.
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
  } catch (error) {
    if (isBuildPhase()) return null;
    throw error;
  }
}
