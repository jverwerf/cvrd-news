"use client";

import { useState, useEffect } from "react";
import type { NarrativeGap, LiveItem } from "../lib/data";

type BannerEntry = {
  category: string;
  color: string;
  text: string;
  detail?: string;
  detailColor?: string;
  url?: string;
};

export function LiveBanner({ stories, liveData: initialLiveData }: { stories: NarrativeGap[]; liveData?: LiveItem[] }) {
  const [liveData, setLiveData] = useState(initialLiveData);

  // Poll for fresh market data every 60 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/live');
        if (res.ok) {
          const fresh = await res.json();
          setLiveData(fresh);
        }
      } catch {}
    };
    const interval = setInterval(poll, 60000);
    return () => clearInterval(interval);
  }, []);

  const entries: BannerEntry[] = [];

  // Market data — with Yahoo Finance links
  const tickerMap: Record<string, string> = { 'S&P 500': '^GSPC', 'Nasdaq': '^IXIC', 'Oil': 'CL=F', 'Gold': 'GC=F', 'BTC': 'BTC-USD', 'ETH': 'ETH-USD' };
  for (const item of (liveData || []).filter(i => i.type === 'stock' || i.type === 'commodity' || i.type === 'crypto')) {
    const ticker = tickerMap[item.label] || item.label;
    entries.push({
      category: item.label,
      color: item.type === 'crypto' ? '#f59e0b' : '#737373',
      text: item.value,
      detail: item.change || undefined,
      detailColor: item.changeDirection === 'up' ? '#16a34a' : item.changeDirection === 'down' ? '#dc2626' : '#737373',
      url: `https://finance.yahoo.com/quote/${ticker}`,
    });
  }

  // Social clips from stories
  for (const story of stories) {
    for (const clip of (story.social_clips || []).slice(0, 2)) {
      const platformLabel = clip.platform === 'x' ? '𝕏' : clip.platform === 'tiktok' ? 'TikTok' : clip.platform === 'reels' ? 'Reels' : 'Reddit';
      const platformColor = clip.platform === 'x' ? '#a3a3a3' : clip.platform === 'tiktok' ? '#fe2c55' : clip.platform === 'reels' ? '#e1306c' : '#ff4500';
      entries.push({
        category: platformLabel,
        color: platformColor,
        text: clip.title || story.topic,
        url: clip.url,
      });
    }
    for (const yt of (story.youtube_videos || []).slice(0, 1)) {
      entries.push({
        category: 'YouTube',
        color: '#ff0000',
        text: yt.channel ? `${yt.channel}: ${story.topic}` : story.topic,
        url: yt.url,
      });
    }
  }

  // Wikipedia trending
  for (const item of (liveData || []).filter(i => i.type === 'wiki')) {
    entries.push({
      category: 'Wiki',
      color: '#737373',
      text: item.value,
      detail: item.change,
      detailColor: '#f59e0b',
      url: item.url,
    });
  }

  // Earthquakes
  for (const item of (liveData || []).filter(i => i.type === 'quake')) {
    entries.push({
      category: item.label,
      color: '#ef4444',
      text: item.value,
      url: item.url,
    });
  }

  if (entries.length === 0) return null;

  const doubled = [...entries, ...entries];

  return (
    <div className="overflow-hidden h-12 flex items-center"
      style={{ background: '#ffffff', boxShadow: '0 1px 0 0 #e5e5e5' }}>

      <div className="flex items-center gap-6 animate-[ticker_90s_linear_infinite] whitespace-nowrap pl-4">
        {doubled.map((entry, i) => (
          <span key={i} className="flex items-center gap-1.5 shrink-0">
            {entry.url ? (
              <a href={entry.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: entry.color }}>
                  {entry.category}
                </span>
                <span className="text-[10px] text-[#555] max-w-[200px] truncate">{entry.text}</span>
                {entry.detail && (
                  <span className="text-[9px] font-medium" style={{ color: entry.detailColor }}>{entry.detail}</span>
                )}
              </a>
            ) : (
              <>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: entry.color }}>
                  {entry.category}
                </span>
                <span className="text-[10px] text-[#555]">{entry.text}</span>
                {entry.detail && (
                  <span className="text-[9px] font-medium" style={{ color: entry.detailColor }}>{entry.detail}</span>
                )}
              </>
            )}
            <span className="text-[#ddd] ml-2">·</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
