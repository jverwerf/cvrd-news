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
      // Get channel from our known video
      const channelResp = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?key=${YT_KEY}&id=5QaAAr5TxKA&part=snippet`,
        { signal: AbortSignal.timeout(10000) }
      );
      const channelData = await channelResp.json();
      const channelId = channelData.items?.[0]?.snippet?.channelId;

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

  // === Website (Vercel Analytics) ===
  let website = { pageViews: 0, visitors: 0, daily: [] as any[] };
  try {
    const vercelToken = getVercelToken() || process.env.VERCEL_ANALYTICS_TOKEN;
    if (vercelToken) {
      const teamId = 'team_waN5IFxiVeUZaRIVuxeVxdxH';
      const projectId = 'prj_DqiYabkDWKn0ij0U97j2oHVK6bbt';
      const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const to = new Date().toISOString().slice(0, 10);

      const resp = await fetch(
        `https://vercel.com/api/web-analytics/timeseries?projectId=${projectId}&teamId=${teamId}&from=${from}&to=${to}&environment=production`,
        { headers: { Authorization: `Bearer ${vercelToken}` }, signal: AbortSignal.timeout(10000) }
      );
      const data = await resp.json();
      const dailyMap: Record<string, { views: number; devices: number }> = {};

      for (const entry of (data.data?.groups?.all || [])) {
        const date = entry.key?.slice(0, 10);
        if (!dailyMap[date]) dailyMap[date] = { views: 0, devices: 0 };
        dailyMap[date].views += entry.total || 0;
        dailyMap[date].devices = Math.max(dailyMap[date].devices, entry.devices || 0);
      }

      for (const [date, vals] of Object.entries(dailyMap).sort()) {
        website.pageViews += vals.views;
        website.visitors += vals.devices;
        website.daily.push({ date, views: vals.views, devices: vals.devices });
      }
    }
  } catch (e: any) {
    console.error('Vercel stats error:', e.message?.substring(0, 60));
  }

  // === Revenue (placeholders — needs AdSense/YPP integration) ===
  const revenue = {
    youtube: 0,    // YouTube Partner Program not active yet
    instagram: 0,  // Reels bonus not active yet
    website: 0,    // AdSense just added, no data yet
    app: 0,        // App not built yet
  };

  const result: any = { youtube, instagram, website, revenue };
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
