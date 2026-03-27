"use client";

import { useEffect, useState } from "react";
import { HeroStory } from "@/components/HeroStory";
import { Dashboard } from "@/components/Dashboard";
import { LiveBanner } from "@/components/LiveBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { NarrativeGap } from "@/lib/data";

const ALL_CATS = [
  { label: 'On Record', slug: '/onrecord' },
  { label: 'Daily Pick', slug: '/' },
  { label: 'World', slug: '/world' },
  { label: 'Politics', slug: '/politics' },
  { label: 'Markets', slug: '/markets' },
  { label: 'Sports', slug: '/sports' },
  { label: 'Trending', slug: '/trending' },
];

function toNarrativeGap(b: any): NarrativeGap {
  // Prefer youtube_videos/social_clips arrays; fall back to legacy clips array
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
    image_file: b.image_file || undefined,
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

export default function BreakingPage() {
  const [breakingItems, setBreakingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreaking = () => {
      fetch('/api/breaking/data')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || (Array.isArray(data) && data.length === 0)) {
            if (loading) window.location.href = '/';
            return;
          }
          const items = Array.isArray(data) ? data : [data];
          items.sort((a: any, b: any) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
          setBreakingItems(items);
          setLoading(false);
        })
        .catch(() => { if (loading) window.location.href = '/'; });
    };

    fetchBreaking();
    // Re-fetch every 2 minutes for new clips/stories
    const interval = setInterval(fetchBreaking, 120000);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e2a3a' }}><p className="text-white/50 animate-pulse">Loading...</p></div>;
  if (breakingItems.length === 0) return null;

  // Convert all breaking items to NarrativeGap format
  // Show stories with at least 3 clips (YouTube + social)
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
          <a href="/" className="text-[13px] text-[#3b82f6] mt-4 inline-block">← Back to Daily Pick</a>
        </div>
      </div>
    );
  }

  const firstStory = allStories[0];

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      {/* NAV + BANNER — same as homepage */}
      <div className="sticky top-0" style={{ zIndex: 100 }}>
        {/* 1. CATEGORY NAV */}
        <div className="relative" style={{ background: '#1e2a3a' }}>
          <div className="h-12 flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-2 px-3 md:gap-3 md:px-4 md:mx-auto">
              <a href="/breaking"
                className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors"
                style={{ background: 'rgba(220,38,38,0.25)', color: '#fff', border: '1px solid rgba(220,38,38,0.5)' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 animate-pulse" style={{ background: '#ef4444' }} />
                Breaking
              </a>
              {ALL_CATS.map((cat) => (
                <a key={cat.slug} href={cat.slug}
                  className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors whitespace-nowrap"
                  style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {cat.label}
                </a>
              ))}
              {/* Icons pill — inline after categories */}
              <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <a href="/tv" className="flex items-center" style={{ color: 'rgba(255,255,255,0.5)', transform: 'translateY(-1px)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
                  </svg>
                </a>
                <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.25)', display: 'block' }} />
                <a href="https://www.youtube.com/@cvrdnews" target="_blank" rel="noreferrer" className="flex items-center transition-opacity hover:opacity-80"
                  title="CVRD on YouTube" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 2. LIVE BANNER */}
        <LiveBanner stories={allStories} />
      </div>

      {/* CVRD puzzle logo */}
      <div className="fixed left-1/2 pointer-events-none" style={{ top: '51px', transform: 'translateX(-50%)', zIndex: 101, filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.4))' }}>
        <div className="flex gap-[1px]">
          {['C','V','R','D'].map((letter, i) => (
            <div key={letter} style={{
              width: 26, height: 26,
              background: i % 2 === 0 ? '#1a2a3a' : '#253545',
              borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700,
              color: '#e0e0e0',
              clipPath: i === 0
                ? 'polygon(0 0, 100% 0, 100% 40%, 110% 40%, 110% 60%, 100% 60%, 100% 100%, 0 100%)'
                : i === 3
                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 60%, -10% 60%, -10% 40%, 0 40%)'
                : 'polygon(0 0, 100% 0, 100% 40%, 110% 40%, 110% 60%, 100% 60%, 100% 100%, 0 100%, 0 60%, -10% 60%, -10% 40%, 0 40%)',
            }}>{letter}</div>
          ))}
        </div>
      </div>

      {/* ALL BREAKING STORIES: red banner → Dashboard → HeroStory */}
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
          <a href="/terms" className="text-[11px] text-[#888] hover:text-white transition-colors">Terms of Service</a>
          <span className="text-[#555]">·</span>
          <a href="/privacy" className="text-[11px] text-[#888] hover:text-white transition-colors">Privacy Policy</a>
          <span className="text-[#555]">·</span>
          <span className="text-[11px] text-[#666]">info@cvrdnews.com</span>
        </div>
      </footer>
    </div>
  );
}
