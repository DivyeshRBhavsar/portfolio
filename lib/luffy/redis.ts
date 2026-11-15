import { upstashRedis } from './config';
import { fetchJson } from './http';

/**
 * Upstash Redis over its REST API (plain fetch, no SDK). Commands go through /pipeline,
 * so several run in one request. Values are never logged.
 */

type Command = (string | number)[];
type Reply = { result?: unknown; error?: string };

export async function pipeline(commands: Command[]): Promise<unknown[]> {
  const { url, token } = upstashRedis();
  const replies = await fetchJson<Reply[]>(`${url}/pipeline`, { token, body: commands }, { label: 'Upstash Redis', retries: 2 });
  return replies.map((r, i) => {
    if (r.error) throw new Error(`Upstash Redis command ${String(commands[i][0])} failed`);
    return r.result;
  });
}

export async function get(key: string): Promise<string | null> {
  const [value] = await pipeline([['GET', key]]);
  return typeof value === 'string' ? value : null;
}

export async function setEx(key: string, value: string, seconds: number): Promise<void> {
  await pipeline([['SET', key, value, 'EX', seconds]]);
}

/** SET if not there yet, with an expiry: true when this call took it. */
export async function setNx(key: string, value: string, seconds: number): Promise<boolean> {
  const [result] = await pipeline([['SET', key, value, 'NX', 'EX', seconds]]);
  return result === 'OK';
}

export async function del(key: string): Promise<void> {
  await pipeline([['DEL', key]]);
}

/** INCR and set the key to expire at a Unix time; returns the new count. */
export async function incrUntil(key: string, expireAtUnix: number): Promise<number> {
  const [count] = await pipeline([
    ['INCR', key],
    ['EXPIREAT', key, expireAtUnix],
  ]);
  return Number(count);
}
