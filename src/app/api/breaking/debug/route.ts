import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = {
    ytKey: !!process.env.YOUTUBE_SEARCH_API_KEY,
    ytKeyLen: (process.env.YOUTUBE_SEARCH_API_KEY || '').length,
    apifyKey: !!process.env.APIFY_API_TOKEN,
    apifyKeyLen: (process.env.APIFY_API_TOKEN || '').length,
  };

  // Test YouTube API
  try {
    const ytKey = process.env.YOUTUBE_SEARCH_API_KEY || process.env.YOUTUBE_API_KEY;
    const resp = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${ytKey}&q=Robert+Mueller&part=snippet&type=video&maxResults=3&order=relevance`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await resp.json();
    results.ytStatus = resp.status;
    results.ytItems = data?.items?.length || 0;
    results.ytError = data?.error?.message?.substring(0, 100) || null;
  } catch (e: any) {
    results.ytError = e.message?.substring(0, 100);
  }

  // Test Apify
  try {
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (apifyToken) {
      const resp = await fetch(
        'https://api.apify.com/v2/acts/streamers~youtube-scraper/run-sync-get-dataset-items?token=' + apifyToken,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchKeywords: 'Robert Mueller', maxResults: 2, uploadDateFilter: 'today' }),
          signal: AbortSignal.timeout(35000),
        }
      );
      const data = await resp.json();
      results.apifyStatus = resp.status;
      results.apifyResults = Array.isArray(data) ? data.length : 'not array';
      if (Array.isArray(data) && data.length > 0) {
        results.apifySample = { id: data[0].id, title: data[0].title?.substring(0, 60) };
      }
    }
  } catch (e: any) {
    results.apifyError = e.message?.substring(0, 100);
  }

  return NextResponse.json(results);
}
