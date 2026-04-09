import { NextResponse } from 'next/server';
import { getBreakingData, saveBreakingData, deleteBreakingData } from '@/lib/breaking-store';

export const dynamic = 'force-dynamic';

// ── DELETE — clear all breaking data (detection continues fresh) ──
export async function DELETE(req: Request) {
  const pin = new URL(req.url).searchParams.get('pin');
  if (pin !== '2026') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const pause = new URL(req.url).searchParams.get('pause') === '1';
  if (pause) {
    await saveBreakingData([{ _paused_until: new Date(Date.now() + 60 * 60 * 1000).toISOString() } as any]);
    return NextResponse.json({ ok: true, message: 'Breaking data cleared, detection paused for 1 hour' });
  }
  await deleteBreakingData();
  return NextResponse.json({ ok: true, message: 'Breaking data cleared, detection will restart fresh' });
}

// ── MAIN — read from Blob (detection runs on intelligence engine) ──
export async function GET() {
  try {
    const rawData = await getBreakingData() || [];

    // Check if detection is paused
    const pauseEntry = rawData.find((s: any) => s._paused_until);
    if (pauseEntry) {
      const pausedUntil = new Date((pauseEntry as any)._paused_until).getTime();
      if (Date.now() < pausedUntil) {
        return NextResponse.json([]);
      }
      // Pause expired — clear it
      await deleteBreakingData();
    }

    const stories = rawData.filter((s: any) => !s._paused_until);

    // Filter out expired stories (>12h)
    const active = stories.filter((s: any) =>
      Date.now() - new Date(s.detected_at).getTime() < 12 * 60 * 60 * 1000
    );

    return NextResponse.json(active);
  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: e.message?.substring(0, 80) });
  }
}
