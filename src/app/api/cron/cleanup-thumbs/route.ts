import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Vercel cron sets Authorization: Bearer {CRON_SECRET}
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let deleted = 0;
  let cursor: string | undefined;

  do {
    const { blobs, cursor: nextCursor } = await list({ prefix: 'thumbnails/', limit: 1000, cursor });
    const toDelete = blobs.filter(b => !b.pathname.includes(today) && !b.pathname.includes(yesterday));
    if (toDelete.length > 0) {
      await del(toDelete.map(b => b.url));
      deleted += toDelete.length;
    }
    cursor = nextCursor;
  } while (cursor);

  return NextResponse.json({ ok: true, deleted, kept: [today, yesterday] });
}
