import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { answerStream } from '@/lib/luffy/answer';
import { LIMITS, REQUEST, SESSION_COOKIE } from '@/lib/luffy/config';
import type { Turn } from '@/lib/luffy/prompt';
import { acquireLock, hashIp } from '@/lib/luffy/session';

/**
 * Luffy's answering API. POST { message, sessionId?, history? } → Server-Sent Events
 * (see lib/luffy/answer.ts). Same-origin only (localhost allowed in development). The
 * session id lives in an httpOnly cookie (luffy_sid, 24 h); a body sessionId is only
 * used when there's no cookie (test scripts). History is conversation context only,
 * never trusted for limits. Nothing about the message is logged.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const error = (status: number, message: string) => NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });

function originAllowed(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (host && url.host === host) return true;
  return process.env.NODE_ENV !== 'production' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
}

/** The last few turns, roles checked, each trimmed (context only). */
function cleanHistory(value: unknown): Turn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is { role: string; content: string } => !!t && typeof t === 'object' && typeof (t as Turn).content === 'string')
    .filter((t) => t.role === 'user' || t.role === 'assistant')
    .slice(-REQUEST.historyTurns * 2)
    .map((t) => ({ role: t.role as Turn['role'], content: t.content.trim().slice(0, REQUEST.historyChars) }))
    .filter((t) => t.content);
}

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return error(403, 'Not allowed.');

  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > REQUEST.maxBodyBytes) return error(413, 'Too long.');
  const raw = await req.text();
  if (Buffer.byteLength(raw) > REQUEST.maxBodyBytes) return error(413, 'Too long.');

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return error(400, 'Invalid request.');
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return error(400, 'Please type a question.');
  if (message.length > REQUEST.maxMessageChars) return error(400, `Please keep it under ${REQUEST.maxMessageChars} characters.`);

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const fromBody = typeof body.sessionId === 'string' ? body.sessionId : undefined;
  const sessionId = cookie && UUID.test(cookie) ? cookie : fromBody && UUID.test(fromBody) ? fromBody : randomUUID();

  let ipHash: string;
  try {
    ipHash = hashIp(clientIp(req));
    if (!(await acquireLock(sessionId))) return error(429, 'One question at a time, please.');
  } catch (e) {
    console.error(`[luffy] chat setup failed: ${(e as Error).name}`);
    return error(503, 'Luffy is taking a break. Please try again soon.');
  }

  const res = new NextResponse(answerStream({ sessionId, ipHash, message, history: cleanHistory(body.history) }), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Luffy-Session': sessionId,
    },
  });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: LIMITS.sessionTtlSeconds,
  });
  return res;
}
