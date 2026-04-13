"use client";

import { useEffect, useState } from "react";
import { HeroStory } from "@/components/HeroStory";
import { Dashboard } from "@/components/Dashboard";
import { LiveBanner } from "@/components/LiveBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SiteNav } from "@/components/SiteNav";
import type { NarrativeGap } from "@/lib/data";

function toNarrativeGap(b: any): NarrativeGap {
  const ytVideos = (b.youtube_videos || []).length > 0
    ? b.youtube_videos
    : (b.clips || [])
        .filter((c: any) => c.platform === 'youtube' && c.embed_id)
        .map((c: any) => ({ url: c.url || '', embed_id: c.embed_id, channel: c.title || 'Breaking', duration: c.duration, title: c.title }));

  const socialClips = (b.social_clips || []).length > 0
    ? b.social_clips
    : (b.clips || [])
        .filter((c: any) => c.platform !== 'youtube' && c.embed_id)
        .map((c: any) => ({ platform: c.platform, url: c.url || '', embed_id: c.embed_id, title: c.title, author: c.author, thumbnail: c.thumbnail, duration: c.duration }));

  return {
    topic: b.topic || 'Breaking News',
    summary: b.summary || '',
    left_narrative: b.left_narrative || '',
    right_narrative: b.right_narrative || '',
    what_they_arent_telling_you: b.what_they_arent_telling_you || '',
    social_summary: b.social_summary || '',
    image_file: undefined,
    image_prompt: b.image_prompt || '',
    sources: (b.sources || []).map((s: any) => ({
      name: s.name, url: s.url, lean: s.lean, title: s.title,
    })),
    youtube_videos: ytVideos,
    social_clips: socialClips,
  };
}

function timeAgo(dateStr: string): string {
  const mins = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  return mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
}

export default function BreakingClient({ initialData }: { initialData: any[] }) {
  const [breakingItems, setBreakingItems] = useState<any[]>(initialData);

  useEffect(() => {
    // Re-fetch every 2 minutes for new clips/stories
    const interval = setInterval(() => {
      fetch('/api/breaking/data')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || (Array.isArray(data) && data.length === 0)) return;
          const items = Array.isArray(data) ? data : [data];
          items.sort((a: any, b: any) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
          setBreakingItems(items);
        })
        .catch(() => {});
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const allStories = breakingItems.map(toNarrativeGap).filter(s => {
    const videoClips = (s.youtube_videos || []).length + (s.social_clips || []).filter(c => c.duration).length;
    return videoClips >= 3;
  });

  if (allStories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e2a3a' }}>
        <div className="text-center">
          <p className="text-white/50 mb-2">Breaking news is being verified...</p>
          <p className="text-white/30 text-[12px]">Stories appear once we have enough video sources.</p>
          <a href="/brief" className="text-[13px] text-[#3b82f6] mt-4 inline-block">← Back to Daily Cover</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      <SiteNav isBreaking={true} />
      <LiveBanner stories={allStories} />

      {/* ALL BREAKING STORIES */}
      {allStories.map((story, i) => {
        const b = breakingItems.find((bi: any) => bi.topic === story.topic) || breakingItems[i];
        return (
          <div key={i}>
            <div className="px-6 md:px-12 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(to right, #7f1d1d, #991b1b, #7f1d1d)' }}>
              <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded animate-pulse uppercase tracking-[0.05em]">
                {i === 0 ? 'LIVE' : 'BREAKING'}
              </span>
              <span className="text-[15px] text-white font-bold flex-1 truncate" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                {b.topic}
              </span>
              <span className="text-[10px] text-white/60 shrink-0">{timeAgo(b.detected_at)}</span>
            </div>
            <ErrorBoundary>
              <Dashboard stories={[story]} videoUrl={b.breaking_short_url || undefined} />
            </ErrorBoundary>
            <HeroStory story={story} hideBanner />
          </div>
        );
      })}

      {/* FOOTER */}
      <footer className="py-10 text-center" style={{ borderTop: '1px solid #2a3a4a' }}>
        <img src="/logo3.png" alt="CVRD News" className="h-36 mx-auto mb-4 opacity-30" />
        <span className="text-[11px] text-[#666] block mb-3">Your streaming platform to cover the news</span>
        <div className="flex items-center justify-center gap-4">
          <a href="/about" className="text-[11px] text-[#888] hover:text-white transition-colors">About</a>
          <span className="text-[#555]">·</span>
          <a href="/contact" className="text-[11px] text-[#888] hover:text-white transition-colors">Contact</a>
          <span className="text-[#555]">·</span>
          <a href="/terms" className="text-[11px] text-[#888] hover:text-white transition-colors">Terms of Service</a>
          <span className="text-[#555]">·</span>
          <a href="/privacy" className="text-[11px] text-[#888] hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
