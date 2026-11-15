import { redact } from './config';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST/GET JSON with retries: on 429 (rate limit), 5xx and network errors, waits
 * 1 s, 2 s, 4 s, 8 s… (or the server's Retry-After) and tries again. Other errors throw
 * at once with the status and a short, redacted body.
 */
export async function fetchJson<T>(
  url: string,
  init: { method?: 'GET' | 'POST'; token: string; body?: unknown },
  { retries = 5, label = url }: { retries?: number; label?: string } = {}
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
        headers: {
          Authorization: `Bearer ${init.token}`,
          ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
    } catch (error) {
      if (attempt >= retries) throw new Error(redact(`${label}: network error (${(error as Error).message})`));
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (res.ok) return (await res.json()) as T;

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < retries) {
      const after = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(after) && after > 0 ? after * 1000 : 1000 * 2 ** attempt);
      continue;
    }
    const text = await res.text().catch(() => '');
    throw new HttpError(res.status, redact(`${label}: HTTP ${res.status} ${text.slice(0, 300)}`));
  }
}
