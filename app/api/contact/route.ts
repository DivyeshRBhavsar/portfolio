import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { contactErrors } from '@/components/character/luffyLines';
import {
  clean,
  displayValue,
  findPurpose,
  subjectLine,
  validate,
  type ContactConfig,
  type ContactValues,
  type FieldErrors,
} from '@/components/contact/rules';
import { getContactConfig, getContactEmail } from '@/lib/contact';

/**
 * The contact form's endpoint. Everything is checked again here against content/contact.json
 * (the same rules the form uses), then sent with Resend to the address in
 * content/life-story.json. Message contents are never logged.
 *
 * Errors: 400/429 with { errors: { <field>: message } } ("form" for the whole form), which
 * the form shows next to the right field; 500 when sending isn't possible.
 */

export const runtime = 'nodejs';

/** A send within this long of the form appearing is a bot (or a mistake). */
const MIN_FORM_MS = 3000;
const COOLDOWN_MS = 60_000;

/**
 * Best-effort cooldown: one message per IP per minute, kept in this server instance's
 * memory. Serverless platforms run several instances and restart them often, so this only
 * slows down casual repeats; strict limits would need a shared store (e.g. Redis/KV).
 */
const lastSent = new Map<string, number>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

function fail(errors: FieldErrors, status = 400) {
  return NextResponse.json({ errors }, { status });
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** The fields as [label, value] rows, in form order. */
function rows(config: ContactConfig, v: ContactValues): [string, string][] {
  const purpose = findPurpose(config, v.purpose)!;
  return [
    ['Purpose', `${purpose.emoji} ${purpose.label}`],
    ...purpose.fields
      .filter((f) => v.fields[f.id])
      .map((f): [string, string] => [f.label.replace(/\?$/, ''), displayValue(f, v.fields[f.id])]),
    ['Name', v.name],
    ['Email', v.email],
    ...(v.linkedin ? [['LinkedIn', v.linkedin] as [string, string]] : []),
  ];
}

function htmlBody(config: ContactConfig, v: ContactValues): string {
  const cell = 'padding:6px 12px;border-bottom:1px solid #eee;vertical-align:top;text-align:left';
  const table = rows(config, v)
    .map(([label, value]) => `<tr><th style="${cell};color:#555;font-weight:600;white-space:nowrap">${escapeHtml(label)}</th><td style="${cell}">${escapeHtml(value)}</td></tr>`)
    .join('');
  const section = (title: string, body: string) =>
    `<h3 style="margin:24px 0 8px;font-size:15px">${escapeHtml(title)}</h3><div style="white-space:pre-wrap;line-height:1.5">${escapeHtml(body)}</div>`;
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;color:#1a1a1a">
<table style="border-collapse:collapse">${table}</table>
${v.plan ? section('Project plan', v.plan) : ''}
${section('Message', v.message)}
</div>`;
}

function textBody(config: ContactConfig, v: ContactValues): string {
  const table = rows(config, v)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
  return [table, v.plan ? `\nProject plan\n${v.plan}` : '', `\nMessage\n${v.message}`].join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') return fail({ form: contactErrors.invalid });

    // Honeypot: a bot filled the hidden field. Pretend it worked, send nothing.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return NextResponse.json({ ok: true });
    }

    const startedAt = Number(body.startedAt);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FORM_MS) {
      return fail({ form: contactErrors.tooFast });
    }

    const config = getContactConfig();
    const values = clean(config, body);
    const errors = validate(config, values);
    if (Object.keys(errors).length > 0) return fail(errors);

    const ip = clientIp(req);
    const now = Date.now();
    const last = lastSent.get(ip);
    if (last && now - last < COOLDOWN_MS) return fail({ form: contactErrors.cooldown }, 429);

    const apiKey = process.env.RESEND_API_KEY;
    const to = getContactEmail();
    if (!apiKey || !to) {
      // Expected until RESEND_API_KEY is set locally / on Vercel (see the README).
      return fail({ form: contactErrors.notConfigured }, 500);
    }

    lastSent.set(ip, now);
    // Keep the map small: forget entries older than the cooldown.
    if (lastSent.size > 1000) {
      for (const [key, time] of lastSent) if (now - time > COOLDOWN_MS) lastSent.delete(key);
    }

    const purpose = findPurpose(config, values.purpose)!;
    const { error } = await new Resend(apiKey).emails.send({
      from: 'Portfolio Contact Form <onboarding@resend.dev>',
      to,
      reply_to: values.email,
      subject: subjectLine(purpose, values),
      html: htmlBody(config, values),
      text: textBody(config, values),
    });
    if (error) {
      lastSent.delete(ip);
      // The provider's error name only: never the message or the visitor's details.
      console.error('Contact form: sending failed', error.name);
      return fail({ form: contactErrors.failed }, 500);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact form: unexpected error', err instanceof Error ? err.name : 'unknown');
    return fail({ form: contactErrors.failed }, 500);
  }
}
