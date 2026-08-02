import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function welcomeHtml(email: string): string {
  const unsub = `https://cvrdnews.com/unsubscribe?email=${encodeURIComponent(email)}`;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#1e2a3a;padding:28px 32px;text-align:center;">
    <div style="font-size:26px;font-weight:bold;color:#ffffff;letter-spacing:0.02em;">CVRD <span style="color:#daa520;">·</span> Daily Pick</div>
    <div style="font-size:12px;color:#7a8fa6;margin-top:6px;letter-spacing:0.08em;text-transform:uppercase;">The news, unfiltered</div>
  </div>
  <div style="padding:32px;color:#333;font-size:15px;line-height:1.7;">
    <p style="margin:0 0 16px;"><strong>You're in.</strong> Every morning you'll get the day's biggest stories built from 36+ outlets across the political spectrum: what the left is saying, what the right is saying, and what neither side is telling you.</p>
    <p style="margin:0 0 16px;">Each edition also brings fact-check verdicts, On Record truth scores for the politicians in the news, and the long-running story threads that moved.</p>
    <p style="margin:0 0 24px;">While you wait for tomorrow's edition:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 8px;"><tr><td style="background:#daa520;border-radius:6px;">
      <a href="https://cvrdnews.com" style="display:inline-block;padding:12px 28px;color:#1e2a3a;font-weight:bold;text-decoration:none;font-size:14px;">Read today's coverage →</a>
    </td></tr></table>
  </div>
  <div style="padding:20px 32px;border-top:1px solid #eee;text-align:center;font-size:12px;color:#999;">
    <a href="${unsub}" style="color:#999;">Unsubscribe</a> &nbsp;&middot;&nbsp; <a href="https://cvrdnews.com/how-we-work" style="color:#999;">How we work</a> &nbsp;&middot;&nbsp; <a href="https://cvrdnews.com" style="color:#999;">cvrdnews.com</a>
  </div>
</div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!audienceId) {
    console.error('RESEND_AUDIENCE_ID not set');
    return NextResponse.json({ error: 'Subscription unavailable' }, { status: 500 });
  }

  const { error } = await resend.contacts.create({
    email,
    audienceId,
    unsubscribed: false,
  });

  if (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }

  // Welcome email — a failure here shouldn't fail the signup
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CVRD Daily Pick <daily@cvrdnews.com>',
      to: email,
      subject: "You're in — the Daily Pick starts tomorrow",
      html: welcomeHtml(email),
    });
  } catch (e) {
    console.error('Welcome email failed:', e);
  }

  return NextResponse.json({ success: true });
}
