import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getBreakingData, saveBreakingData, deleteBreakingData } from '@/lib/breaking-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type BreakingStory = {
  topic: string;
  summary: string;
  severity: 'critical' | 'major';
  detected_at: string;
  last_updated: string;
  left_narrative: string;
  right_narrative: string;
  what_they_arent_telling_you: string;
  social_summary: string;
  image_prompt: string;
  image_file?: string;
  sources: { name: string; url: string; lean?: string; title?: string }[];
  clips: { platform: string; url: string; embed_id?: string; title?: string; author?: string; duration?: number }[];
  youtube_videos: { url: string; embed_id: string; channel?: string; duration?: number; title?: string }[];
  social_clips: { platform: string; url: string; embed_id?: string; title?: string; author?: string; duration?: number; thumbnail?: string }[];
};

import { put as blobPut } from '@vercel/blob';

// ── DETECTION ──

async function fetchRecentHeadlines(): Promise<{ title: string; url: string; source: string }[]> {
  const feeds = [
    { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
    { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'Reuters', url: 'https://www.yahoo.com/news/rss' },
    { name: 'Fox News', url: 'https://moxie.foxnews.com/google-publisher/latest.xml' },
    { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' },
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
    { name: 'AP News', url: 'https://news.google.com/rss/search?q=world+news&hl=en-US&gl=US&ceid=US:en' },
  ];

  const headlines: { title: string; url: string; source: string }[] = [];
  const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;

  await Promise.all(feeds.map(async (feed) => {
    try {
      const resp = await fetch(feed.url, { signal: AbortSignal.timeout(6000) });
      const text = await resp.text();
      const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 15)) {
        const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        const date = new Date(pubDate);
        if (date.getTime() < threeHoursAgo) continue;
        if (title && link) {
          headlines.push({ title, url: link, source: feed.name });
        }
      }
    } catch {}
  }));

  return headlines;
}

// ── ENRICHMENT ──

async function searchYouTube(topic: string, existingUrls: Set<string>): Promise<BreakingStory['youtube_videos']> {
  const videos: BreakingStory['youtube_videos'] = [];

  // Try YouTube Data API first
  try {
    const ytKey = process.env.YOUTUBE_SEARCH_API_KEY || process.env.YOUTUBE_API_KEY;
    if (ytKey) {
      const resp = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${ytKey}&q=${encodeURIComponent(topic)}&part=snippet&type=video&maxResults=8&order=relevance&publishedAfter=${new Date(Date.now() - 24 * 86400000).toISOString()}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await resp.json();
      if (data?.items?.length > 0) {
        for (const item of data.items) {
          const url = `https://www.youtube.com/watch?v=${item.id.videoId}`;
          if (existingUrls.has(url)) continue;
          videos.push({
            url, embed_id: item.id.videoId,
            title: item.snippet?.title || '', channel: item.snippet?.channelTitle || '',
          });
          existingUrls.add(url);
        }
        return videos; // API worked, skip fallback
      }
    }
  } catch {}

  // Apify YouTube fallback
  try {
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (apifyToken) {
      const resp = await fetch(
        'https://api.apify.com/v2/acts/streamers~youtube-scraper/run-sync-get-dataset-items?token=' + apifyToken,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchKeywords: topic, maxResults: 8, uploadDateFilter: 'today' }),
          signal: AbortSignal.timeout(30000),
        }
      );
      const data = await resp.json();
      for (const item of (Array.isArray(data) ? data : []).slice(0, 8)) {
        if (!item.id) continue;
        // Parse duration — skip videos > 30 min
        let dur = 0;
        if (typeof item.duration === 'number') dur = item.duration;
        else if (typeof item.duration === 'string') {
          const parts = item.duration.split(':').map(Number);
          if (parts.length === 3) dur = parts[0] * 3600 + parts[1] * 60 + parts[2];
          else if (parts.length === 2) dur = parts[0] * 60 + parts[1];
        }
        if (dur > 1800) continue;
        const url = `https://www.youtube.com/watch?v=${item.id}`;
        if (existingUrls.has(url)) continue;
        videos.push({
          url, embed_id: item.id,
          title: item.title || '', channel: item.channelName || item.channelTitle || '',
          duration: dur || undefined,
        });
        existingUrls.add(url);
      }
    }
  } catch {}

  return videos;
}

async function searchX(topic: string, existingUrls: Set<string>): Promise<BreakingStory['social_clips']> {
  const clips: BreakingStory['social_clips'] = [];
  const xKey = process.env.TWITTERAPI_IO_KEY;
  if (!xKey) return clips;

  try {
    // Video tweets
    const videoResp = await fetch(
      `https://api.twitterapi.io/twitter/tweet/advanced_search?query=${encodeURIComponent(topic + ' min_faves:100 has:video -is:retweet lang:en')}&queryType=Latest`,
      { headers: { 'x-api-key': xKey }, signal: AbortSignal.timeout(8000) }
    );
    const videoData = await videoResp.json();
    for (const tweet of (videoData?.tweets || []).slice(0, 5)) {
      const hasVideo = (tweet.extendedEntities?.media || []).some((m: any) => m.type === 'video');
      if (!hasVideo) continue;
      const author = tweet.author?.userName || 'unknown';
      const url = `https://x.com/${author}/status/${tweet.id}`;
      if (existingUrls.has(url)) continue;
      clips.push({ platform: 'x', url, embed_id: tweet.id, title: (tweet.text || '').substring(0, 150), author, duration: 60 });
      existingUrls.add(url);
    }
  } catch {}

  try {
    // Text tweets (no duration — shows as embedded tweets in expanded section)
    const textResp = await fetch(
      `https://api.twitterapi.io/twitter/tweet/advanced_search?query=${encodeURIComponent(topic + ' min_faves:200 -is:retweet lang:en')}&queryType=Latest`,
      { headers: { 'x-api-key': xKey }, signal: AbortSignal.timeout(8000) }
    );
    const textData = await textResp.json();
    for (const tweet of (textData?.tweets || []).slice(0, 8)) {
      const author = tweet.author?.userName || 'unknown';
      const url = `https://x.com/${author}/status/${tweet.id}`;
      if (existingUrls.has(url)) continue;
      clips.push({ platform: 'x', url, embed_id: tweet.id, title: (tweet.text || '').substring(0, 150), author });
      existingUrls.add(url);
    }
  } catch {}

  return clips;
}

async function searchReddit(topic: string, existingUrls: Set<string>): Promise<BreakingStory['social_clips']> {
  const clips: BreakingStory['social_clips'] = [];
  try {
    const resp = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(topic)}&sort=relevance&t=day&limit=8`,
      { headers: { 'User-Agent': 'CVRD/1.0' }, signal: AbortSignal.timeout(6000) }
    );
    const data = await resp.json();
    for (const post of (data?.data?.children || [])) {
      const d = post.data;
      if (!d || d.score < 20) continue;
      const url = `https://reddit.com${d.permalink}`;
      if (existingUrls.has(url)) continue;
      clips.push({ platform: 'reddit', url, embed_id: d.id || d.name?.replace('t3_', ''), title: (d.title || '').substring(0, 150) });
      existingUrls.add(url);
    }
  } catch {}
  return clips;
}

async function searchTikTok(topic: string, existingUrls: Set<string>): Promise<BreakingStory['social_clips']> {
  const clips: BreakingStory['social_clips'] = [];
  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) return clips;

  try {
    const resp = await fetch(
      'https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=' + apifyToken,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQueries: [topic], resultsPerPage: 5, searchSection: '/video', shouldDownloadVideos: false }),
        signal: AbortSignal.timeout(30000), // 30s — tight but doable
      }
    );
    const data = await resp.json();
    for (const item of (Array.isArray(data) ? data : []).slice(0, 5)) {
      if (!item.id) continue;
      const url = item.webVideoUrl || `https://www.tiktok.com/@${item.authorMeta?.name || 'unknown'}/video/${item.id}`;
      if (existingUrls.has(url)) continue;
      clips.push({
        platform: 'tiktok', url, embed_id: item.id,
        title: (item.text || item.desc || '').substring(0, 150),
        author: item.authorMeta?.name || 'unknown',
        thumbnail: item.covers?.default || item.videoMeta?.coverUrl || '',
        duration: item.videoMeta?.duration || item.duration || undefined,
      });
      existingUrls.add(url);
    }
  } catch {}
  return clips;
}

async function generateImage(story: BreakingStory): Promise<void> {
  if (!story.image_prompt || story.image_file) return;

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) return;

  try {
    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: replicateToken });
    const output = await replicate.run('black-forest-labs/flux-schnell', {
      input: {
        prompt: `${story.image_prompt}. Wide cinematic composition, landscape format, dramatic lighting, editorial news photography style, no text or watermarks`,
        aspect_ratio: '16:9',
      }
    });
    const item = (output as any)[0];
    const replicateUrl = item.url ? item.url() : String(item);
    const res = await fetch(String(replicateUrl));
    const imageBuffer = Buffer.from(await res.arrayBuffer());

    // Store image in Vercel Blob
    const filename = `breaking_${Date.now()}.png`;
    const blob = await blobPut(filename, imageBuffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/png',
    });
    story.image_file = blob.url;
  } catch {}
}

function enrichSources(story: BreakingStory, candidates: { title: string; url: string; source: string }[]): void {
  const leanMap: Record<string, string> = {
    'BBC': 'center', 'CNN': 'left', 'Fox News': 'right', 'Al Jazeera': 'center',
    'Reuters': 'center', 'NPR': 'left', 'AP News': 'center',
    'The Guardian': 'left', 'NY Post': 'right', 'Daily Wire': 'right',
  };
  const existingUrls = new Set(story.sources.map(s => s.url));
  for (const c of candidates) {
    if (existingUrls.has(c.url)) continue;
    story.sources.push({ name: c.source, url: c.url, lean: leanMap[c.source] || 'center', title: c.title });
    existingUrls.add(c.url);
  }
}

function mergeClips(story: BreakingStory): void {
  const seen = new Set<string>();
  story.clips = [];
  for (const v of story.youtube_videos) {
    if (seen.has(v.url)) continue;
    seen.add(v.url);
    story.clips.push({ platform: 'youtube', url: v.url, embed_id: v.embed_id, title: v.title || v.channel });
  }
  for (const c of story.social_clips) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    story.clips.push({ platform: c.platform, url: c.url, embed_id: c.embed_id, title: c.title, author: c.author, duration: c.duration });
  }
}

// ── HELPERS ──

// Wrap any promise with a hard timeout — returns fallback on timeout instead of crashing
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// Collect settled results — takes whatever succeeded, ignores failures
function collectSettled<T>(results: PromiseSettledResult<T>[]): T[] {
  return results
    .filter((r): r is PromiseFulfilledResult<T> => r.status === 'fulfilled')
    .map(r => r.value);
}

// Enrich a single story with all platforms in parallel — never throws
async function enrichStory(story: BreakingStory, opts: { includeTikTok: boolean; timeoutMs: number }): Promise<boolean> {
  const existingUrls = new Set([
    ...story.youtube_videos.map(v => v.url),
    ...story.social_clips.map(c => c.url),
  ]);
  const beforeCount = existingUrls.size;

  const searches: Promise<{ yt: BreakingStory['youtube_videos']; social: BreakingStory['social_clips'] }>[] = [];

  // All searches run in parallel with individual timeouts
  searches.push(
    withTimeout(searchYouTube(story.topic, existingUrls), 10000, []).then(yt => ({ yt, social: [] as BreakingStory['social_clips'] })),
    withTimeout(searchX(story.topic, existingUrls), 12000, []).then(social => ({ yt: [] as BreakingStory['youtube_videos'], social })),
    withTimeout(searchReddit(story.topic, existingUrls), 8000, []).then(social => ({ yt: [] as BreakingStory['youtube_videos'], social })),
  );

  if (opts.includeTikTok) {
    searches.push(
      withTimeout(searchTikTok(story.topic, existingUrls), 35000, []).then(social => ({ yt: [] as BreakingStory['youtube_videos'], social })),
    );
  }

  // Run all with a hard ceiling
  const settled = await withTimeout(
    Promise.allSettled(searches),
    opts.timeoutMs,
    [] as PromiseSettledResult<{ yt: BreakingStory['youtube_videos']; social: BreakingStory['social_clips'] }>[]
  );

  for (const result of collectSettled(settled)) {
    story.youtube_videos.unshift(...result.yt);
    story.social_clips.unshift(...result.social);
  }

  // Image — only if missing, with tight timeout
  if (!story.image_file && story.image_prompt) {
    await withTimeout(generateImage(story), 12000, undefined);
  }

  const updated = existingUrls.size > beforeCount || !!story.image_file;
  if (updated) {
    story.last_updated = new Date().toISOString();
    mergeClips(story);
  }
  return updated;
}

// ── MAIN ──

export async function GET() {
  const startTime = Date.now();
  const safeTimeLeft = () => 55000 - (Date.now() - startTime);
  let allStories: BreakingStory[] = [];

  try {
    // Load current breaking stories from Vercel Blob
    allStories = (await withTimeout(getBreakingData(), 5000, null)) || [];

    const existingTopics = allStories.map(s => s.topic);
    const candidates = await withTimeout(fetchRecentHeadlines(), 10000, []);

    // ── DETECT NEW BREAKING ──
    if (candidates.length > 0 && safeTimeLeft() > 20000) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const trackingContext = existingTopics.length > 0
        ? `\n\nCurrently tracking these breaking stories — do NOT flag anything that is the same event, an update, or closely related to any of these:\n${existingTopics.map(t => `- "${t}"`).join('\n')}\n\nOnly flag a genuinely DIFFERENT major event.`
        : '';
      const gptResult = await withTimeout(
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You determine if news is genuinely BREAKING and if so, provide full analysis.

STRICT CRITERIA — only return breaking for:
- War escalations (new strikes, invasions, declarations of war)
- Major terror attacks
- Assassination or death of a world leader
- Natural disasters with mass casualties
- Major economic crashes (>5% market drop)
- Unprecedented political events (coup, impeachment, resignation)

NOT breaking: gradual developments, market fluctuations <5%, crypto <10%, celebrity news, sports, policy announcements.
${trackingContext}

If breaking, output JSON:
{
  "is_breaking": true,
  "topic": "short title",
  "summary": "3-5 sentence neutral overview",
  "severity": "critical" or "major",
  "left_narrative": "How left media frames this (2-3 sentences)",
  "right_narrative": "How right media frames this (2-3 sentences)",
  "what_they_arent_telling_you": "The angle neither side covers (2-3 sentences)",
  "social_summary": "How social media is reacting (2-3 sentences)",
  "image_prompt": "Cinematic editorial photo prompt (no real names, no violence)"
}

If NOT breaking: { "is_breaking": false }` },
            { role: 'user', content: JSON.stringify(candidates.slice(0, 15)) }
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
        }).then(r => JSON.parse(r.choices[0].message.content || '{}')),
        10000,
        { is_breaking: false }
      );

      if (gptResult.is_breaking) {
        const story: BreakingStory = {
          topic: gptResult.topic,
          summary: gptResult.summary,
          severity: gptResult.severity || 'major',
          detected_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          left_narrative: gptResult.left_narrative || '',
          right_narrative: gptResult.right_narrative || '',
          what_they_arent_telling_you: gptResult.what_they_arent_telling_you || '',
          social_summary: gptResult.social_summary || '',
          image_prompt: gptResult.image_prompt || '',
          sources: [],
          clips: [],
          youtube_videos: [],
          social_clips: [],
        };

        enrichSources(story, candidates);

        // Full enrichment with TikTok — use remaining time
        await enrichStory(story, { includeTikTok: true, timeoutMs: safeTimeLeft() });

        allStories.unshift(story);
        allStories = allStories.slice(0, 5);
        await saveBreakingData(allStories);

        return NextResponse.json({
          status: 'BREAKING',
          stories: allStories.length,
          topic: story.topic,
          youtube: story.youtube_videos.length,
          social: story.social_clips.length,
          sources: story.sources.length,
          image: story.image_file || 'none',
          ms: Date.now() - startTime,
        });
      }
    }

    // ── UPDATE EXISTING STORIES (all in parallel) ──
    if (allStories.length > 0 && safeTimeLeft() > 10000) {
      const timePerStory = Math.floor(safeTimeLeft() / allStories.length);

      const updateResults = await Promise.allSettled(
        allStories.map(story => enrichStory(story, { includeTikTok: false, timeoutMs: timePerStory }))
      );

      const anyUpdated = collectSettled(updateResults).some(Boolean);
      await saveBreakingData(allStories);

      return NextResponse.json({
        status: 'tracking',
        stories: allStories.length,
        updated: anyUpdated,
        ms: Date.now() - startTime,
      });
    }

    // Clean up if no stories left
    if (allStories.length === 0) {
      await deleteBreakingData();
    }

    return NextResponse.json({ status: 'none', candidates: candidates.length, ms: Date.now() - startTime });
  } catch (e: any) {
    // Save whatever we have even on crash
    if (allStories.length > 0) {
      try { await saveBreakingData(allStories); } catch {}
    }
    return NextResponse.json({ status: 'error', message: e.message?.substring(0, 80), ms: Date.now() - startTime });
  }
}
