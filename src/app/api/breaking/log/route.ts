import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const blobs = await list({ prefix: 'breaking-log.json' });
    if (blobs.blobs.length === 0) {
      return NextResponse.json({ entries: [], message: 'No log yet — will populate after next cron run' });
    }

    const resp = await fetch(blobs.blobs[0].url);
    const log = await resp.json();

    return NextResponse.json({ entries: log.length, log });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
