import fs from 'fs';
import path from 'path';

export type NarrativeGap = {
  topic: string;
  category?: 'world' | 'politics' | 'markets-crypto' | 'tech-ai' | 'culture' | 'unfiltered';
  is_top_story?: boolean;
  summary: string;
  left_narrative: string;
  right_narrative: string;
  what_they_arent_telling_you: string;
  social_summary?: string;
  evidence_url?: string;
  image_prompt?: string;
  image_file?: string;
  social_clips?: { platform: 'x' | 'tiktok' | 'reels' | 'reddit' | 'telegram'; url: string; embed_id?: string; title?: string; author?: string; duration?: number }[];
  youtube_videos?: { url: string; embed_id: string; channel?: string; duration?: number }[];
  people?: { name: string; role?: string; image_url?: string }[];
  sources?: { name: string; url: string; lean?: 'left' | 'right' | 'center'; title?: string }[];
};

export type LiveItem = {
  type: 'stock' | 'crypto' | 'commodity' | 'trend' | 'quake' | 'wiki' | 'fear';
  label: string;
  value: string;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  url?: string;
};

export type DailyBrief = {
  summary: string;
  left_narrative: string;
  right_narrative: string;
  what_they_arent_telling_you: string;
  social_summary: string;
  image_prompt?: string;
};

export interface DailyReport {
  date: string;
  generated_at: string;
  top_narratives: NarrativeGap[];
  top_10_topics?: string[];
  video_url?: string;
  live_data?: LiveItem[];
  daily_brief?: DailyBrief;
  category_briefs?: Record<string, DailyBrief>;
}

export async function getDailyGaps(): Promise<DailyReport | null> {
  const dateStr = new Date().toISOString().split('T')[0];

  // Try engine output first (local dev), then public/data fallback (Vercel)
  const enginePath = path.resolve(process.cwd(), `../intelligence-engine/output/daily_gaps_${dateStr}.json`);
  const publicPath = path.resolve(process.cwd(), `public/data/daily_gaps_${dateStr}.json`);
  // Also try latest file in public/data if today's doesn't exist
  const publicDataDir = path.resolve(process.cwd(), 'public/data');

  let dataPath: string | null = null;
  if (fs.existsSync(enginePath)) {
    dataPath = enginePath;
  } else if (fs.existsSync(publicPath)) {
    dataPath = publicPath;
  } else if (fs.existsSync(publicDataDir)) {
    // Find the most recent file
    const files = fs.readdirSync(publicDataDir).filter(f => f.startsWith('daily_gaps_')).sort().reverse();
    if (files.length > 0) dataPath = path.join(publicDataDir, files[0]);
  }

  if (!dataPath) {
    console.error("No data file found");
    return null;
  }

  try {
    const fileContents = fs.readFileSync(dataPath, 'utf8');
    const report = JSON.parse(fileContents) as DailyReport;

    // Filter out clips that failed to download in the video pipeline
    for (const story of report.top_narratives) {
      if (story.youtube_videos) {
        story.youtube_videos = story.youtube_videos.filter(v => !(v as any).download_failed);
      }
      if (story.social_clips) {
        story.social_clips = story.social_clips.filter(c => !(c as any).download_failed);
      }
    }

    // Use YouTube embed for the daily briefing (too large for Vercel static hosting)
    const ytDailyPath = path.resolve(process.cwd(), 'public/data/youtube_daily.txt');
    if (fs.existsSync(ytDailyPath)) {
      const ytId = fs.readFileSync(ytDailyPath, 'utf8').trim();
      if (ytId) report.video_url = `https://www.youtube.com/embed/${ytId}`;
    }

    // Fetch live data (markets, crypto, earthquakes, wiki trending)
    try {
      const liveItems: LiveItem[] = [];

      // Markets from Yahoo Finance
      const symbols = [
        { symbol: '^GSPC', label: 'S&P 500' },
        { symbol: '^IXIC', label: 'Nasdaq' },
        { symbol: 'CL=F', label: 'Oil' },
        { symbol: 'GC=F', label: 'Gold' },
      ];
      for (const s of symbols) {
        try {
          const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s.symbol}?interval=1d&range=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000),
          });
          const d = await r.json();
          const meta = d?.chart?.result?.[0]?.meta;
          if (meta?.regularMarketPrice) {
            const price = meta.regularMarketPrice;
            const prev = meta.chartPreviousClose || meta.previousClose;
            const chg = prev ? ((price - prev) / prev * 100).toFixed(2) : null;
            liveItems.push({
              type: ['CL=F', 'GC=F'].includes(s.symbol) ? 'commodity' : 'stock',
              label: s.label,
              value: `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              change: chg ? `${parseFloat(chg) >= 0 ? '+' : ''}${chg}%` : undefined,
              changeDirection: chg ? (parseFloat(chg) >= 0 ? 'up' : 'down') : 'neutral',
            });
          }
        } catch {}
      }

      // Crypto from CoinGecko
      try {
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true', {
          signal: AbortSignal.timeout(5000),
        });
        const d = await r.json();
        if (d.bitcoin) {
          const chg = d.bitcoin.usd_24h_change?.toFixed(2);
          liveItems.push({ type: 'crypto', label: 'BTC', value: `$${d.bitcoin.usd.toLocaleString()}`, change: chg ? `${parseFloat(chg) >= 0 ? '+' : ''}${chg}%` : undefined, changeDirection: chg ? (parseFloat(chg) >= 0 ? 'up' : 'down') : 'neutral' });
        }
        if (d.ethereum) {
          const chg = d.ethereum.usd_24h_change?.toFixed(2);
          liveItems.push({ type: 'crypto', label: 'ETH', value: `$${d.ethereum.usd.toLocaleString()}`, change: chg ? `${parseFloat(chg) >= 0 ? '+' : ''}${chg}%` : undefined, changeDirection: chg ? (parseFloat(chg) >= 0 ? 'up' : 'down') : 'neutral' });
        }
      } catch {}

      // Earthquakes from USGS
      try {
        const r = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', { signal: AbortSignal.timeout(5000) });
        const d = await r.json();
        for (const f of (d?.features || []).slice(0, 2)) {
          liveItems.push({ type: 'quake', label: `M${f.properties.mag}`, value: f.properties.place || '', url: f.properties.url });
        }
      } catch {}

      // Wikipedia trending
      try {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate() - 1).padStart(2, '0');
        const r = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${y}/${m}/${dd}`, {
          headers: { 'User-Agent': 'CVRD/1.0' }, signal: AbortSignal.timeout(5000),
        });
        const d = await r.json();
        const skip = ['Main_Page', 'Special:', 'Wikipedia:', 'Portal:', 'File:'];
        const articles = (d?.items?.[0]?.articles || [])
          .filter((a: any) => !skip.some(s => a.article.startsWith(s)) && a.views > 100000)
          .slice(0, 4);
        for (const a of articles) {
          liveItems.push({ type: 'wiki', label: 'Wiki', value: a.article.replace(/_/g, ' '), change: `${(a.views / 1000).toFixed(0)}K views`, url: `https://en.wikipedia.org/wiki/${a.article}` });
        }
      } catch {}

      report.live_data = liveItems;
    } catch {}

    return report;
  } catch (error) {
    console.error("Error reading mock data:", error);
    return null;
  }
}
