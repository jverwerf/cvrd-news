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
  evidence_url?: string;
  image_prompt?: string;
  image_file?: string;
  social_clips?: { platform: 'x' | 'tiktok' | 'reels' | 'reddit'; url: string; embed_id?: string; title?: string; author?: string }[];
  youtube_videos?: { url: string; embed_id: string; channel?: string }[];
  people?: { name: string; role?: string; image_url?: string }[];
  sources?: { name: string; url: string; lean?: 'left' | 'right' | 'center' }[];
};

export type LiveItem = {
  type: 'stock' | 'crypto' | 'commodity' | 'trend' | 'quake' | 'wiki' | 'fear';
  label: string;
  value: string;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  url?: string;
};

export interface DailyReport {
  date: string;
  generated_at: string;
  top_narratives: NarrativeGap[];
  top_10_topics?: string[];
  video_url?: string;
  live_data?: LiveItem[];
}

export async function getDailyGaps(): Promise<DailyReport | null> {
  // Read from the real engine output
  const dateStr = new Date().toISOString().split('T')[0];
  const mockPath = path.resolve(process.cwd(), `../intelligence-engine/output/daily_gaps_${dateStr}.json`);
  
  try {
    if (!fs.existsSync(mockPath)) {
      console.error("Mock V4 JSON file does not exist at:", mockPath);
      return null;
    }
    const fileContents = fs.readFileSync(mockPath, 'utf8');
    const report = JSON.parse(fileContents) as DailyReport;

    // Check if today's video exists (try produced version first, then raw)
    const producedPath = path.resolve(process.cwd(), `../intelligence-engine/output/videos/news_produced_${dateStr}.mp4`);
    const rawPath = path.resolve(process.cwd(), `../intelligence-engine/output/videos/news_${dateStr}.mp4`);
    const videoPath = fs.existsSync(producedPath) ? producedPath : (fs.existsSync(rawPath) ? rawPath : null);

    if (videoPath) {
      const publicVideoDir = path.resolve(process.cwd(), 'public/videos');
      if (!fs.existsSync(publicVideoDir)) {
        fs.mkdirSync(publicVideoDir, { recursive: true });
      }
      const destPath = path.join(publicVideoDir, `news_${dateStr}.mp4`);
      // Always copy latest version
      fs.copyFileSync(videoPath, destPath);
      report.video_url = `/videos/news_${dateStr}.mp4`;
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
