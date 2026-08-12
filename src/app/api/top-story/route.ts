import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDailyGaps } from '@/lib/data';
import type { NarrativeGap } from '@/lib/data';

// Vercel sets x-vercel-ip-country on every edge request; Cloudflare sets
// cf-ipcountry. Locally neither exists, so country comes back null and the
// ad rotation falls back to its own default market.
function visitorCountry(request: NextRequest): string | null {
  const h = request.headers;
  return h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || null;
}

export async function GET(request: NextRequest) {
  const data = await getDailyGaps();
  const stories = data?.top_narratives || [];
  const top = stories.find((s: NarrativeGap) => s.is_top_story) || stories[0];

  // Every category on the page today, not just the top story's. Ad slots on
  // mixed-content pages (home, dashboard, video rails) sit next to all of it,
  // and targeting them on the single top story meant targeting them on
  // `world` — that has been the top-story category on 103 of the last 104
  // days, so every advertiser that did not buy `world` served zero
  // impressions. `categories` is what those slots should target.
  const categories = [...new Set(
    stories.map((s: NarrativeGap) => s.category).filter(Boolean)
  )];

  return NextResponse.json({
    topic: top?.topic ?? null,
    category: top?.category ?? null,
    categories,
    country: visitorCountry(request),
  });
}
