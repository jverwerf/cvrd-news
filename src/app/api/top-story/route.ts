import { NextResponse } from 'next/server';
import { getDailyGaps } from '@/lib/data';

export async function GET() {
  const data = await getDailyGaps();
  const stories = data?.top_narratives || [];
  const top = stories.find((s: any) => s.is_top_story) || stories[0];
  return NextResponse.json({ topic: top?.topic ?? null, category: top?.category ?? null });
}
