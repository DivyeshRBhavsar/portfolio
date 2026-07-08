import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const TO_EMAIL = 'divyeshbhavsar567@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
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
