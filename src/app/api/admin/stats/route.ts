import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Vercel auth
function getVercelToken(): string | null {
  try {
    const authPath = path.join(process.env.HOME || '', 'Library/Application Support/com.vercel.cli/auth.json');
    if (fs.existsSync(authPath)) {
      return JSON.parse(fs.readFileSync(authPath, 'utf8')).token;
    }
  } catch {}
  return process.env.VERCEL_TOKEN || null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug') === '1';

  const YT_KEY = process.env.YOUTUBE_API_KEY;
  const IG_TOKEN = process.env.INSTAGRAM_PAGE_TOKEN;
  const IG_ID = process.env.INSTAGRAM_BUSINESS_ID;

  // === YouTube ===
  let youtube = { videos: [] as any[], totalViews: 0, subscribers: 0 };
  try {
    if (YT_KEY) {
      const channelId = 'UCVC76fWloXGO85HJCgcNYFA'; // CVRD News

      if (channelId) {
        // Channel stats
        const chResp = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?key=${YT_KEY}&id=${channelId}&part=statistics,contentDetails`,
          { signal: AbortSignal.timeout(10000) }
        );
        const chData = await chResp.json();
        const stats = chData.items?.[0]?.statistics;
        youtube.subscribers = parseInt(stats?.subscriberCount || '0');

        // Get uploads playlist
        const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (uploadsId) {
          const plResp = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?key=${YT_KEY}&playlistId=${uploadsId}&part=contentDetails&maxResults=50`,
            { signal: AbortSignal.timeout(10000) }
          );
          const plData = await plResp.json();
          const videoIds = (plData.items || []).map((item: any) => item.contentDetails.videoId).join(',');

          if (videoIds) {
            const vResp = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?key=${YT_KEY}&id=${videoIds}&part=snippet,statistics`,
              { signal: AbortSignal.timeout(10000) }
            );
            const vData = await vResp.json();
            for (const v of (vData.items || [])) {
              const views = parseInt(v.statistics?.viewCount || '0');
              youtube.totalViews += views;
              youtube.videos.push({
                platform: 'youtube',
                title: v.snippet.title,
                views,
                likes: parseInt(v.statistics?.likeCount || '0'),
                comments: parseInt(v.statistics?.commentCount || '0'),
                date: v.snippet.publishedAt?.slice(0, 10),
                url: `https://www.youtube.com/watch?v=${v.id}`,
              });
            }
          }
        }
      }
    }
  } catch (e: any) {
    console.error('YouTube stats error:', e.message?.substring(0, 60));
  }

  // === Instagram ===
  let instagram = { reels: [] as any[], totalViews: 0, followers: 0 };
  try {
    if (IG_TOKEN && IG_ID) {
      // Account info
      const acctResp = await fetch(
        `https://graph.facebook.com/v25.0/${IG_ID}?fields=followers_count,media_count&access_token=${IG_TOKEN}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const acctData = await acctResp.json();
      instagram.followers = acctData.followers_count || 0;

      // Get media
      const mediaResp = await fetch(
        `https://graph.facebook.com/v25.0/${IG_ID}/media?fields=id,caption,like_count,comments_count,timestamp,media_type,permalink&limit=50&access_token=${IG_TOKEN}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const mediaData = await mediaResp.json();
      for (const m of (mediaData.data || [])) {
        // Get insights for views
        let views = 0;
        try {
          const insResp = await fetch(
            `https://graph.facebook.com/v25.0/${m.id}/insights?metric=plays&access_token=${IG_TOKEN}`,
            { signal: AbortSignal.timeout(5000) }
          );
          const insData = await insResp.json();
          views = insData.data?.[0]?.values?.[0]?.value || 0;
        } catch {}

        instagram.totalViews += views;
        instagram.reels.push({
          platform: 'instagram',
          title: (m.caption || '').substring(0, 80),
          views,
          likes: m.like_count || 0,
          comments: m.comments_count || 0,
          date: m.timestamp?.slice(0, 10),
          url: m.permalink,
        });
      }
    }
  } catch (e: any) {
    console.error('Instagram stats error:', e.message?.substring(0, 60));
  }

  // === Website (Vercel Web Analytics — Pro) ===
  let website = { pageViews: 0, visitors: 0, daily: [] as any[] };
  try {
    const vercelToken = getVercelToken() || process.env.VERCEL_ANALYTICS_TOKEN;
    if (vercelToken) {
      const teamId = 'team_waN5IFxiVeUZaRIVuxeVxdxH';
      const projectId = 'prj_DqiYabkDWKn0ij0U97j2oHVK6bbt';
      const from = new Date(Date.now() - 7 * 86400000).toISOString();
      const to = new Date().toISOString();

      // Try the Pro analytics endpoint
      const resp = await fetch(
        `https://vercel.com/api/web/insights/stats?projectId=${projectId}&teamId=${teamId}&from=${from}&to=${to}&environment=production`,
        { headers: { Authorization: `Bearer ${vercelToken}` }, signal: AbortSignal.timeout(10000) }
      );
      const data = await resp.json();

      if (data.pageViews !== undefined) {
        website.pageViews = data.pageViews || 0;
        website.visitors = data.visitors || data.uniques || 0;
      }

      // Daily timeseries
      const tsResp = await fetch(
        `https://vercel.com/api/web/insights/timeseries?projectId=${projectId}&teamId=${teamId}&from=${from}&to=${to}&environment=production`,
        { headers: { Authorization: `Bearer ${vercelToken}` }, signal: AbortSignal.timeout(10000) }
      );
      const tsData = await tsResp.json();

      for (const entry of (tsData.data || tsData || [])) {
        const date = (entry.key || entry.date || entry.timestamp || '').slice(0, 10);
        if (date) {
          website.daily.push({ date, views: entry.pageViews || entry.total || entry.views || 0, devices: entry.visitors || entry.uniques || entry.devices || 0 });
        }
      }

      // If timeseries didn't populate totals, sum from daily
      if (website.pageViews === 0 && website.daily.length > 0) {
        website.pageViews = website.daily.reduce((a: number, d: any) => a + d.views, 0);
        website.visitors = website.daily.reduce((a: number, d: any) => a + d.devices, 0);
      }
    }
  } catch (e: any) {
    console.error('Vercel stats error:', e.message?.substring(0, 60));
  }

  // === Revenue ===
  // AdSense: requires Google AdSense Management API + service account
  // YouTube Partner: not eligible yet (need 1000 subs + 4000 watch hours)
  // Instagram Reels: bonus program not active
  const revenue = {
    youtube: 0,
    instagram: 0,
    website: 0,    // Will be populated when AdSense API is connected
    app: 0,
  };

  // === Costs (estimated daily) ===
  const costs = {
    openai: 4.50,    // GPT-4o verification + GPT-4o-mini + TTS
    apify: 0.50,     // YouTube/TikTok fallback
    twitterApi: 0.75, // X search
    vercel: 0.67,    // Pro plan ($20/month)
    domain: 0.03,    // ~$12/year
    total: 6.45,
  };

  const result: any = { youtube, instagram, website, revenue, costs };
  if (debug) {
    result._debug = {
      hasYTKey: !!YT_KEY,
      ytKeyPrefix: YT_KEY?.substring(0, 10),
      hasIGToken: !!IG_TOKEN,
      igTokenPrefix: IG_TOKEN?.substring(0, 10),
      hasIGId: !!IG_ID,
      igId: IG_ID,
      hasVercelToken: !!getVercelToken(),
    };
  }
  return NextResponse.json(result);
}
