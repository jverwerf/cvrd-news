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

// Trusted YouTube channels for breaking news
// Whitelist-only — only these channels are allowed in breaking news videos
const TRUSTED_CHANNELS = new Set([
  // ── US BROADCAST NETWORKS ──
  'cnn', 'msnbc', 'fox news', 'abc news', 'cbs news', 'nbc news',
  'pbs newshour', 'pbs', 'c-span', 'newsnation',
  'livenow from fox', 'fox news live',

  // ── US PRINT / DIGITAL ──
  'the guardian', 'washington post', 'new york times', 'wall street journal',
  'new york post', 'usa today', 'la times', 'chicago tribune',
  'politico', 'the hill', 'axios', 'huffpost', 'vox', 'vice news',
  'the atlantic', 'the new yorker', 'time', 'newsweek', 'slate',
  'the intercept', 'propublica', 'insider', 'business insider',

  // ── US RIGHT-LEANING ──
  'daily wire', 'prageru', 'the blaze', 'national review',
  'daily caller', 'breitbart', 'washington times', 'nowthis',
  'real clear politics', 'free beacon', 'townhall',

  // ── US LEFT-LEANING ──
  'mother jones', 'the nation', 'salon', 'democracy now', 'jacobin',

  // ── WIRE SERVICES ──
  'reuters', 'associated press', 'ap news', 'ap archive', 'afp news agency',

  // ── INTERNATIONAL — UK ──
  'bbc news', 'bbc world', 'sky news', 'channel 4 news', 'itv news',
  'the telegraph', 'the independent', 'the times', 'times radio',
  'lbc', 'talk', 'gb news',

  // ── INTERNATIONAL — EUROPE ──
  'france 24 english', 'france 24', 'dw news', 'euronews',

  // ── INTERNATIONAL — MIDDLE EAST ──
  'al jazeera english', 'al jazeera', 'i24 news',
  'times of israel', 'jerusalem post', 'haaretz',

  // ── INTERNATIONAL — OTHER ──
  'abc news (australia)', 'sky news australia', 'abc australia',
  'global news', 'ctv news', 'cbc news', 'globe and mail',

  // ── BUSINESS / FINANCE ──
  'cnbc', 'cnbc television', 'bloomberg', 'bloomberg television',
  'fox business', 'yahoo finance', 'financial times',
  'forbes', 'forbes breaking news', 'marketwatch',
  'the economist', 'foreign affairs',

  // ── CRYPTO ──
  'coindesk', 'cointelegraph', 'the block', 'decrypt', 'coin bureau',

  // ── TECH ──
  'wired', 'the verge', 'techcrunch', 'ars technica',

  // ── SCIENCE / SPACE ──
  'spacex', 'nasa', 'nature', 'national geographic', 'science news',

  // ── INVESTIGATIVE / INDEPENDENT ──
  'bellingcat', 'breaking points', 'philip defranco',
  'joe rogan clips', 'disclose.tv', 'bno news',

  // ── CULTURE / ENTERTAINMENT ──
  'variety', 'billboard', 'complex', 'espn',
  'hollywood reporter', 'deadline', 'rolling stone',
  'entertainment weekly', 'tmz', 'page six',
]);

function isJunkChannel(channel: string): boolean {
  const lower = channel.toLowerCase().trim();
  // Whitelist-only: if not on the list, it's junk
  return !TRUSTED_CHANNELS.has(lower);
}

// YouTube RSS channels for breaking news (free, no API key needed)
const YT_RSS_CHANNELS = [
  { name: 'CNN', id: 'UCupvZG-5ko_eiXAupbDfxWw' },
  { name: 'Fox News', id: 'UCXIJgqnII2ZOINSValj1DRg' },
  { name: 'MSNBC', id: 'UCaXkIU1QidjPwiAYu6GcHjg' },
  { name: 'CBS News', id: 'UC8p1vwvWtl6T73JiExfWs1g' },
  { name: 'NBC News', id: 'UCeY0bbntWzzVIaj2z3QigXg' },
  { name: 'ABC News', id: 'UCBi2mrWuNuyYy4gbM6fU18Q' },
  { name: 'PBS NewsHour', id: 'UC6ZFN9Tx6xh-skXCuRHCDpQ' },
  { name: 'BBC News', id: 'UC16niRr50-MSBwiO3YDb3RA' },
  { name: 'Sky News', id: 'UCoMdktPbSTixAyNGwb-UYkQ' },
  { name: 'Al Jazeera English', id: 'UCNye-wNBqNL5ZzHSJj3l8Bg' },
  { name: 'Reuters', id: 'UCSrZ3UV4jOidv8RnTTNSNSw' },
  { name: 'Associated Press', id: 'UC52X5wxOL_s5yw0dQk7NtgA' },
  { name: 'DW News', id: 'UCknLrEdhRCp1aegoMqRaCZg' },
  { name: 'France 24 English', id: 'UCQfwfsi5VrQ8yKZ-UWmAEFg' },
  { name: 'CNBC Television', id: 'UCrp_UI8XtuYfpBXq9HIoMbg' },
  { name: 'Bloomberg Television', id: 'UCIALMKvObZNtJ68-rmLjb5A' },
  { name: 'Financial Times', id: 'UCoUxsWakJucWg46KW5RsvPw' },
  { name: 'The Economist', id: 'UC0p5jTq6Xx_DosDFxVXnWaQ' },
  { name: 'The Guardian', id: 'UCIRYBXDze5krPDzAEOxFGVA' },
  { name: 'The Hill', id: 'UCPsfnMOoVKPmbCIOsxb3qlA' },
];

async function fetchYouTubeRSS(hoursBack = 6): Promise<{ id: string; title: string; channel: string; url: string }[]> {
  const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;
  const results = await Promise.allSettled(
    YT_RSS_CHANNELS.map(async (ch) => {
      const resp = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`,
        { signal: AbortSignal.timeout(6000) }
      );
      const xml = await resp.text();
      const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
      const videos: { id: string; title: string; channel: string; url: string }[] = [];
      for (const entry of entries) {
        const id = entry.match(/<yt:videoId>([^<]+)/)?.[1] || '';
        const title = entry.match(/<title>([^<]+)/)?.[1] || '';
        const published = entry.match(/<published>([^<]+)/)?.[1] || '';
        if (!id || !title) continue;
        if (new Date(published).getTime() < cutoff) continue;
        videos.push({
          id, url: `https://www.youtube.com/watch?v=${id}`,
          title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
          channel: ch.name,
        });
      }
      return videos;
    })
  );
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
}

function searchRSSForTopic(videos: { id: string; title: string; channel: string; url: string }[], topic: string, maxResults = 8) {
  const stopWords = new Set(['this', 'that', 'with', 'from', 'they', 'their', 'have', 'been', 'will', 'about', 'after', 'before', 'under', 'over', 'faces', 'amid', 'says', 'news', 'just', 'more', 'than']);
  const keywords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 4 && !stopWords.has(w));
  return videos.filter(v => {
    const text = v.title.toLowerCase();
    const matchCount = keywords.filter(k => text.includes(k)).length;
    return matchCount >= Math.min(2, keywords.length);
  }).slice(0, maxResults);
}

// Cached RSS videos — fetched once per request, shared across stories
let cachedRSSVideos: { id: string; title: string; channel: string; url: string }[] | null = null;

async function searchYouTube(topic: string, existingUrls: Set<string>, detectedAt?: string): Promise<BreakingStory['youtube_videos']> {
  const videos: BreakingStory['youtube_videos'] = [];

  // 1. YouTube RSS first (free, fast, no API key)
  try {
    if (!cachedRSSVideos) {
      cachedRSSVideos = await fetchYouTubeRSS(6);
    }
    const matches = searchRSSForTopic(cachedRSSVideos, topic);
    for (const m of matches) {
      if (existingUrls.has(m.url)) continue;
      videos.push({ url: m.url, embed_id: m.id, title: m.title, channel: m.channel });
      existingUrls.add(m.url);
    }
    if (videos.length >= 5) return videos; // RSS found enough
  } catch {}

  // 2. YouTube Data API fallback (if RSS didn't find enough)
  try {
    const ytKey = process.env.YOUTUBE_SEARCH_API_KEY || process.env.YOUTUBE_API_KEY;
    if (ytKey) {
      const publishedAfter = detectedAt
        ? new Date(new Date(detectedAt).getTime() - 2 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const resp = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${ytKey}&q=${encodeURIComponent(topic)}&part=snippet&type=video&maxResults=8&order=date&publishedAfter=${publishedAfter}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await resp.json();
      for (const item of (data?.items || [])) {
        const url = `https://www.youtube.com/watch?v=${item.id.videoId}`;
        const channel = item.snippet?.channelTitle || '';
        if (existingUrls.has(url)) continue;
        if (isJunkChannel(channel)) continue;
        const title = item.snippet?.title || '';
        if (/[\u0900-\u097F\u0600-\u06FF]/.test(title)) continue;
        videos.push({ url, embed_id: item.id.videoId, title, channel });
        existingUrls.add(url);
      }
    }
  } catch {}

  return videos;
}

// Trusted X accounts — same as main pipeline (x-whitelist.ts)
const TRUSTED_X_HANDLES = new Set([
  // Wire services
  'ap', 'reuters', 'afp',
  // US Broadcast
  'cnn', 'msnbc', 'foxnews', 'abc', 'cbsnews', 'nbcnews', 'pbs', 'npr', 'newsnation',
  // US Print / Digital
  'nytimes', 'washingtonpost', 'wsj', 'usatoday', 'nypost', 'latimes',
  'politico', 'thehill', 'axios', 'huffpost', 'vox', 'theatlantic', 'time', 'newsweek',
  'theintercept', 'slate', 'newyorker', 'buzzfeednews',
  // US Right
  'dailywire', 'breitbartnews', 'dailycaller', 'theblaze', 'nro', 'washtimes',
  'realclearnews', 'freebeacon', 'epochtimes', 'townhallcom',
  // US Left
  'motherjones', 'thenation', 'salon', 'democracynow', 'jacobin',
  // International
  'bbcworld', 'bbcbreaking', 'skynews', 'skynewsbreak', 'guardian', 'telegraph',
  'independent', 'ajenglish', 'ajbreaking', 'france24_en', 'dwnews', 'euronews',
  'cbcnews', 'theeconomist', 'ft',
  // Business
  'cnbc', 'bloomberg', 'foxbusiness', 'marketwatch', 'forbes', 'yahoofinance',
  // Crypto
  'coindesk', 'cointelegraph', 'theblock__', 'decryptmedia',
  // Tech
  'wired', 'theverge', 'techcrunch', 'arstechnica',
  // Aggregators / Breaking
  'disclosetv', 'bnonews', 'spectatorindex', 'unusual_whales', 'watcherguru',
  'collinrugg', 'rawsalerts', 'endwokeness', 'dropsitenews', 'marionawfal', 'breaking911',
  // Journalists
  'tuckercarlson', 'benshapiro', 'realcandaceo', 'mattwalshblog',
  'rachel_maddow', 'chrislhayes', 'maggienyt',
  // Politicians / Institutions
  'potus', 'realdonaldtrump', 'vp', 'aoc', 'berniesanders', 'tedcruz', 'randpaul',
  'elonmusk', 'joerogan',
  'zelenskyyua', 'emmanuelmacron', 'netanyahu', 'israelipm', 'idf', 'nato', 'un', 'who',
  'secblinken', 'secdef', 'statedept', 'pentagonpressec',
  // OSINT
  'intelcrab', 'liveuamap', 'sentdefender', 'elintnews', 'war_mapper', 'warmonitors',
  // Science
  'nasa', 'spacex', 'natgeo',
]);

async function searchX(topic: string, existingUrls: Set<string>, detectedAt?: string): Promise<BreakingStory['social_clips']> {
  const clips: BreakingStory['social_clips'] = [];
  const xKey = process.env.TWITTERAPI_IO_KEY;
  if (!xKey) return clips;

  // Filter: only tweets from 2h before detection onwards
  const sinceDate = detectedAt
    ? new Date(new Date(detectedAt).getTime() - 2 * 60 * 60 * 1000)
    : new Date(Date.now() - 6 * 60 * 60 * 1000);
  const sinceStr = sinceDate.toISOString().split('T')[0];
  const sinceFilter = ` since:${sinceStr}`;

  function parseTweet(tweet: any, requireVideo: boolean): void {
    const tweetDate = new Date(tweet.createdAt || tweet.created_at || 0);
    if (tweetDate.getTime() < sinceDate.getTime()) return;
    const author = tweet.author?.userName || 'unknown';
    // Only allow trusted accounts
    if (!TRUSTED_X_HANDLES.has(author.toLowerCase())) return;
    if (requireVideo) {
      const hasVideo = (tweet.extendedEntities?.media || []).some((m: any) => m.type === 'video');
      if (!hasVideo) return;
    }
    const url = `https://x.com/${author}/status/${tweet.id}`;
    if (existingUrls.has(url)) return;
    clips.push({
      platform: 'x', url, embed_id: tweet.id,
      title: (tweet.text || '').substring(0, 150), author,
      ...(requireVideo ? { duration: 60 } : {}),
    });
    existingUrls.add(url);
  }

  try {
    // Video tweets — high engagement from trusted accounts
    const videoResp = await fetch(
      `https://api.twitterapi.io/twitter/tweet/advanced_search?query=${encodeURIComponent(topic + ' min_faves:500 has:video -is:retweet lang:en' + sinceFilter)}&queryType=Latest`,
      { headers: { 'x-api-key': xKey }, signal: AbortSignal.timeout(8000) }
    );
    const videoData = await videoResp.json();
    for (const tweet of (videoData?.tweets || []).slice(0, 10)) parseTweet(tweet, true);
  } catch {}

  try {
    // Text tweets — institutional + journalist takes
    const textResp = await fetch(
      `https://api.twitterapi.io/twitter/tweet/advanced_search?query=${encodeURIComponent(topic + ' min_faves:500 -is:retweet lang:en' + sinceFilter)}&queryType=Latest`,
      { headers: { 'x-api-key': xKey }, signal: AbortSignal.timeout(8000) }
    );
    const textData = await textResp.json();
    for (const tweet of (textData?.tweets || []).slice(0, 10)) parseTweet(tweet, false);
  } catch {}

  return clips;
}

// Whitelisted subreddits — same as main pipeline (social.ts)
const TRUSTED_SUBREDDITS = [
  'news', 'worldnews', 'politics', 'geopolitics',
  'wallstreetbets', 'stocks', 'economics',
  'cryptocurrency', 'Bitcoin', 'technology',
  'PublicFreakout', 'videos', 'interestingasfuck',
];

async function searchReddit(topic: string, existingUrls: Set<string>): Promise<BreakingStory['social_clips']> {
  const clips: BreakingStory['social_clips'] = [];
  const keywords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // Search within whitelisted subreddits only
  const results = await Promise.allSettled(
    TRUSTED_SUBREDDITS.map(async (sub) => {
      const resp = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=10`,
        { headers: { 'User-Agent': 'Node:CVRD:1.0 (by /u/gap-engine)' }, signal: AbortSignal.timeout(6000) }
      );
      const data = await resp.json();
      return (data?.data?.children || []).map((c: any) => ({ ...c.data, subreddit: sub }));
    })
  );

  const allPosts = results
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // Filter by topic relevance + engagement
  for (const d of allPosts) {
    if (!d || d.stickied || d.score < 50) continue;
    const titleLower = (d.title || '').toLowerCase();
    const matches = keywords.filter(k => titleLower.includes(k)).length;
    if (matches < 1) continue;
    const url = `https://reddit.com${d.permalink}`;
    if (existingUrls.has(url)) continue;
    clips.push({ platform: 'reddit', url, embed_id: d.id || d.name?.replace('t3_', ''), title: (d.title || '').substring(0, 150) });
    existingUrls.add(url);
  }

  // Sort by score, take top 8
  clips.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
  return clips.slice(0, 8);
}

async function searchTelegram(topic: string, existingUrls: Set<string>, detectedAt?: string): Promise<BreakingStory['social_clips']> {
  const clips: BreakingStory['social_clips'] = [];
  const hoursBack = detectedAt
    ? Math.max(2, (Date.now() - new Date(detectedAt).getTime()) / (60 * 60 * 1000) + 2)
    : 6;

  const NEWS_CHANNELS = [
    'bbcworld', 'france24_en', 'france24english', 'guardian', 'nytimes',
    'washingtonpost', 'foxnews', 'skynews', 'euronews', 'euronews_en',
    'aljazeera', 'aljazeera_eng', 'apnews', 'bloomberg',
    'cbsnews', 'nbcnews', 'abcnews', 'politico', 'pbs_news', 'cnbcnews',
    'newsmax', 'usatoday', 'breakingmash', 'bbcbreaking', 'breakingnews_global',
    'spectatorindex', 'independent', 'dw_world', 'theintercept', 'bellingcat',
    'insider', 'businessinsider', 'scmp_news', 'timesofisrael',
    'kyivindependent', 'pravda_eng', 'geopolitics_news',
    'news24_sa',
  ];

  const keywords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const cutoffTime = Date.now() - hoursBack * 60 * 60 * 1000;

  try {
    // Scrape channels in parallel
    const results = await Promise.allSettled(
      NEWS_CHANNELS.map(async (ch) => {
        const resp = await fetch(`https://t.me/s/${ch}`, {
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)' },
        });
        const html = await resp.text();
        const texts = html.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g) || [];
        const views = html.match(/class="tgme_widget_message_views">([^<]+)</g) || [];
        const dates = html.match(/datetime="([^"]+)"/g) || [];
        const links = html.match(/data-post="([^"]+)"/g) || [];

        const posts: { text: string; views: number; date: string; url: string; channel: string }[] = [];
        for (let i = 0; i < texts.length; i++) {
          let text = texts[i].replace(/class="tgme_widget_message_text[^"]*"[^>]*>/, '').replace(/<\/div>$/, '');
          text = text.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
          const viewStr = views[i]?.match(/>([^<]+)/)?.[1]?.trim() || '0';
          let v = 0;
          if (viewStr.endsWith('K')) v = parseFloat(viewStr) * 1000;
          else if (viewStr.endsWith('M')) v = parseFloat(viewStr) * 1000000;
          else v = parseInt(viewStr) || 0;
          const date = dates[i]?.match(/datetime="([^"]+)"/)?.[1] || '';
          const postId = links[i]?.match(/data-post="([^"]+)"/)?.[1] || '';
          posts.push({ text, views: v, date, url: postId ? `https://t.me/${postId}` : `https://t.me/${ch}`, channel: ch });
        }
        return posts;
      })
    );

    const allPosts = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

    // Filter by relevance + recency
    const relevant = allPosts.filter(post => {
      if (post.date) {
        const postTime = new Date(post.date).getTime();
        if (postTime < cutoffTime) return false;
      }
      const textLower = post.text.toLowerCase();
      return keywords.filter(k => textLower.includes(k)).length >= 1;
    });

    relevant.sort((a, b) => b.views - a.views);

    for (const post of relevant.slice(0, 8)) {
      if (existingUrls.has(post.url)) continue;
      clips.push({
        platform: 'telegram' as any, url: post.url,
        embed_id: post.url.replace('https://t.me/', '') || '',
        title: post.text.substring(0, 150),
        author: post.channel,
      });
      existingUrls.add(post.url);
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
      allowOverwrite: true,
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

// ── LOGGING ──

async function appendBreakingLog(entry: {
  timestamp: string;
  candidates: number;
  headlines: string[];
  result: 'BREAKING' | 'none' | 'tracking' | 'error';
  topic?: string;
  gptReason?: string;
  ms: number;
}) {
  try {
    // Load existing log
    let log: typeof entry[] = [];
    try {
      const { list } = await import('@vercel/blob');
      const blobs = await list({ prefix: 'breaking-log.json' });
      if (blobs.blobs.length > 0) {
        const resp = await fetch(blobs.blobs[0].url, { signal: AbortSignal.timeout(3000) });
        log = await resp.json();
      }
    } catch {}

    log.unshift(entry);
    // Keep last 7 days (672 entries at 15-min intervals)
    log = log.slice(0, 672);

    await blobPut('breaking-log.json', JSON.stringify(log), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
  } catch {}
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

// Full story refresh — re-fetch headlines, regenerate narratives, update sources
async function refreshStoryFull(story: BreakingStory, timeoutMs: number): Promise<boolean> {
  try {
    // Fetch fresh headlines
    const headlines = await withTimeout(fetchRecentHeadlines(), 8000, []);
    const relevant = headlines.filter(h => {
      const keywords = story.topic.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const text = h.title.toLowerCase();
      return keywords.filter(k => text.includes(k)).length >= 2;
    });

    // Update sources with new articles
    enrichSources(story, relevant);

    // Regenerate narratives with GPT using fresh headlines + existing clips
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const clipSummary = story.social_clips.slice(0, 10).map(c => `[${c.platform}] ${c.title || ''} by ${c.author || '?'}`).join('\n');
    const sourceSummary = story.sources.slice(0, 15).map(s => `[${s.lean || 'center'}] ${s.name}: ${s.title || ''}`).join('\n');

    const refreshResult = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are updating a breaking news story for CVRD News. The story has been developing. Based on the LATEST sources and social reactions, rewrite the narratives to reflect the CURRENT state of the story. Be definitive — summarize what IS being said, not what might be said.` },
          { role: 'user', content: `Topic: ${story.topic}\n\nOriginal summary: ${story.summary}\n\nLATEST SOURCES:\n${sourceSummary}\n\nSOCIAL REACTIONS:\n${clipSummary}\n\nRewrite these fields based on the latest information:\n1. summary: Updated 3-5 sentence overview of where the story stands NOW\n2. left_narrative: How left-leaning media is covering this NOW (2-3 sentences, no outlet names)\n3. right_narrative: How right-leaning media is covering this NOW (2-3 sentences, no outlet names)\n4. what_they_arent_telling_you: What's being missed or underreported NOW (2-3 sentences, cite social posts)\n5. social_summary: How social media is reacting NOW (2-3 sentences)\n\nOutput JSON with these 5 fields.` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }).then(r => JSON.parse(r.choices[0].message.content || '{}')),
      15000,
      null
    );

    if (refreshResult) {
      if (refreshResult.summary) story.summary = refreshResult.summary;
      if (refreshResult.left_narrative) story.left_narrative = refreshResult.left_narrative;
      if (refreshResult.right_narrative) story.right_narrative = refreshResult.right_narrative;
      if (refreshResult.what_they_arent_telling_you) story.what_they_arent_telling_you = refreshResult.what_they_arent_telling_you;
      if (refreshResult.social_summary) story.social_summary = refreshResult.social_summary;
      story.last_updated = new Date().toISOString();
      return true;
    }
  } catch {}
  return false;
}

// Enrich a single story with all platforms in parallel — never throws
async function enrichStory(story: BreakingStory, opts: { includeTelegram: boolean; timeoutMs: number }): Promise<boolean> {
  const existingUrls = new Set([
    ...story.youtube_videos.map(v => v.url),
    ...story.social_clips.map(c => c.url),
  ]);
  const beforeCount = existingUrls.size;

  const searches: Promise<{ yt: BreakingStory['youtube_videos']; social: BreakingStory['social_clips'] }>[] = [];

  // All searches run in parallel with individual timeouts — pass detected_at for time filtering
  const detectedAt = story.detected_at;
  searches.push(
    withTimeout(searchYouTube(story.topic, existingUrls, detectedAt), 40000, []).then(yt => ({ yt, social: [] as BreakingStory['social_clips'] })),
    withTimeout(searchX(story.topic, existingUrls, detectedAt), 12000, []).then(social => ({ yt: [] as BreakingStory['youtube_videos'], social })),
    withTimeout(searchReddit(story.topic, existingUrls), 8000, []).then(social => ({ yt: [] as BreakingStory['youtube_videos'], social })),
  );

  if (opts.includeTelegram) {
    searches.push(
      withTimeout(searchTelegram(story.topic, existingUrls, detectedAt), 15000, []).then(social => ({ yt: [] as BreakingStory['youtube_videos'], social })),
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

// ── MAIN ──

export async function GET() {
  const startTime = Date.now();
  const safeTimeLeft = () => 55000 - (Date.now() - startTime);
  let allStories: BreakingStory[] = [];
  cachedRSSVideos = null; // Reset RSS cache each request

  try {
    // Load current breaking stories from Vercel Blob
    const rawData = (await withTimeout(getBreakingData(), 5000, null)) || [];

    // Check if detection is paused
    const pauseEntry = rawData.find((s: any) => s._paused_until);
    if (pauseEntry) {
      const pausedUntil = new Date((pauseEntry as any)._paused_until).getTime();
      if (Date.now() < pausedUntil) {
        // Still paused — return empty
        return NextResponse.json([]);
      }
      // Pause expired — clear it and continue
      await deleteBreakingData();
    }

    allStories = rawData.filter((s: any) => !s._paused_until);

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

        // Full enrichment with Telegram — use remaining time
        await enrichStory(story, { includeTelegram: true, timeoutMs: safeTimeLeft() });

        allStories.unshift(story);
        allStories = allStories.slice(0, 5);
        await saveBreakingData(allStories);

        await appendBreakingLog({
          timestamp: new Date().toISOString(),
          candidates: candidates.length,
          headlines: candidates.slice(0, 10).map(c => `[${c.source}] ${c.title}`),
          result: 'BREAKING',
          topic: story.topic,
          ms: Date.now() - startTime,
        });

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

    // ── UPDATE EXISTING STORIES ──
    if (allStories.length > 0 && safeTimeLeft() > 10000) {
      let anyUpdated = false;

      for (const story of allStories) {
        if (safeTimeLeft() < 10000) break;

        // Check if story needs a full refresh (every 2 hours)
        const hoursSinceUpdate = (Date.now() - new Date(story.last_updated).getTime()) / (1000 * 60 * 60);
        const needsFullRefresh = hoursSinceUpdate >= 2;

        if (needsFullRefresh && safeTimeLeft() > 25000) {
          // Full refresh: new narratives + sources + all clips including Telegram
          const refreshed = await refreshStoryFull(story, Math.min(safeTimeLeft() - 5000, 20000));
          const enriched = await withTimeout(
            enrichStory(story, { includeTelegram: true, timeoutMs: Math.min(safeTimeLeft() - 2000, 30000) }),
            Math.min(safeTimeLeft() - 2000, 30000),
            false
          );
          if (refreshed || enriched) anyUpdated = true;
        } else {
          // Light update: just add new clips (YouTube, X, Reddit, Telegram)
          const result = await withTimeout(
            enrichStory(story, { includeTelegram: true, timeoutMs: Math.min(safeTimeLeft() - 2000, 45000) }),
            Math.min(safeTimeLeft() - 2000, 45000),
            false
          );
          if (result) anyUpdated = true;
        }
      }

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

    await appendBreakingLog({
      timestamp: new Date().toISOString(),
      candidates: candidates.length,
      headlines: candidates.slice(0, 10).map(c => `[${c.source}] ${c.title}`),
      result: 'none',
      ms: Date.now() - startTime,
    });

    return NextResponse.json({ status: 'none', candidates: candidates.length, ms: Date.now() - startTime });
  } catch (e: any) {
    // Save whatever we have even on crash
    if (allStories.length > 0) {
      try { await saveBreakingData(allStories); } catch {}
    }
    return NextResponse.json({ status: 'error', message: e.message?.substring(0, 80), ms: Date.now() - startTime });
  }
}
