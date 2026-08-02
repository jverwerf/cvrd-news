import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!audienceId) {
    console.error('RESEND_AUDIENCE_ID not set');
    return NextResponse.json({ error: 'Unsubscribe unavailable' }, { status: 500 });
  }

  const { error } = await resend.contacts.update({
    email,
    audienceId,
    unsubscribed: true,
  });

  if (error) {
    console.error('Resend unsubscribe error:', error);
    return NextResponse.json({ error: 'Unsubscribe failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
