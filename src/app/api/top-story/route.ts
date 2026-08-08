import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDailyGaps } from '@/lib/data';
import type { NarrativeGap } from '@/lib/data';

// Vercel sets x-vercel-ip-country on every edge request; Cloudflare sets
// cf-ipcountry. Locally neither exists, so country comes back null and
// geo-restricted sponsors simply stay out of the rotation.
function visitorCountry(request: NextRequest): string | null {
  const h = request.headers;
  return h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || null;
}

export async function GET(request: NextRequest) {
  const data = await getDailyGaps();
  const stories = data?.top_narratives || [];
  const top = stories.find((s: NarrativeGap) => s.is_top_story) || stories[0];
  return NextResponse.json({
    topic: top?.topic ?? null,
    category: top?.category ?? null,
    country: visitorCountry(request),
  });
}
