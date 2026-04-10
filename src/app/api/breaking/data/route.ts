import { NextResponse } from 'next/server';
import { getBreakingData } from '@/lib/breaking-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getBreakingData();
  if (!data || data.length === 0) {
    return NextResponse.json(null, { status: 404, headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } });
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } });
}
