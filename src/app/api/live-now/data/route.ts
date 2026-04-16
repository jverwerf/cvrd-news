import { NextResponse } from 'next/server';
import { getLiveNowData } from '@/lib/live-now-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getLiveNowData();
  if (!data || data.length === 0) {
    return NextResponse.json(null, { status: 404, headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } });
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } });
}
