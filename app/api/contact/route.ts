import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const TO_EMAIL = 'divyeshbhavsar567@gmail.com';

const LIMITS = { name: 100, email: 254, message: 5000 } as const;

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const name = asTrimmedString(body?.name);
    const email = asTrimmedString(body?.email);
    const message = asTrimmedString(body?.message);

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (
      name.length > LIMITS.name ||
      email.length > LIMITS.email ||
      message.length > LIMITS.message
    ) {
      return NextResponse.json(
        {
          error: `Please keep name under ${LIMITS.name} characters, email under ${LIMITS.email}, and message under ${LIMITS.message}.`,
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // This is expected until you add your own Resend API key locally / on Vercel.
      // See the README for the two-minute setup.
      return NextResponse.json(
        { error: 'Email sending is not configured yet on this deployment.' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: 'Portfolio Contact Form <onboarding@resend.dev>',
      to: TO_EMAIL,
      reply_to: email,
      subject: `New portfolio message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}
