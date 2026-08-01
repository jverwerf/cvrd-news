import { revalidateTag, revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * On-demand cache flush, called by the intelligence engine right after it
 * publishes new daily_gaps data to Blob. Busts the tagged blob fetches and the
 * story/home routes so updates (fact-checks, tweet curation, refreshes) show
 * immediately instead of waiting out the revalidate window.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const tag = req.nextUrl.searchParams.get('tag') || 'daily-gaps';
  revalidateTag(tag, 'max');
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, tag, at: new Date().toISOString() });
}
