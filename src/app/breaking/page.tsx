"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { HeroStory } from "@/components/HeroStory";
import { LiveBanner } from "@/components/LiveBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { NarrativeGap } from "@/lib/data";

const ALL_CATS = [
  { label: 'Daily Pick', slug: '/' },
  { label: 'World', slug: '/world' },
  { label: 'Politics', slug: '/politics' },
  { label: 'Markets & Crypto', slug: '/markets-crypto' },
  { label: 'Tech & AI', slug: '/tech-ai' },
  { label: 'Culture', slug: '/culture' },
  { label: 'Unfiltered', slug: '/unfiltered' },
];

function toNarrativeGap(b: any): NarrativeGap {
  const ytVideos = (b.youtube_videos || []).length > 0
    ? b.youtube_videos.map((v: any) => ({ ...v, _breaking: true }))
    : (b.clips || [])
        .filter((c: any) => c.platform === 'youtube' && c.embed_id)
        .map((c: any) => ({ url: c.url || '', embed_id: c.embed_id, channel: c.title || 'Breaking', duration: c.duration, title: c.title, _breaking: true }));

  const socialClips = (b.social_clips || []).length > 0
    ? b.social_clips.map((c: any) => ({ ...c, _breaking: true }))
    : (b.clips || [])
        .filter((c: any) => c.platform !== 'youtube' && c.embed_id)
        .map((c: any) => ({ platform: c.platform, url: c.url || '', embed_id: c.embed_id, title: c.title, author: c.author, thumbnail: c.thumbnail, duration: c.duration, _breaking: true }));

  const story: NarrativeGap = {
    topic: b.topic,
    summary: b.summary,
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

  // If no YouTube clips, promote first social clip so center player has something
  if (story.youtube_videos!.length === 0) {
    const first = socialClips.find((c: any) => c.embed_id);
    if (first) {
      story.youtube_videos = [{ url: first.url || '', embed_id: first.embed_id, channel: first.title || 'Breaking', duration: first.duration }];
    }
  }

  return story;
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
  const allStories = breakingItems.map(toNarrativeGap);
  const firstStory = allStories[0];

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      {/* NAV + BANNER — same as homepage */}
      <div className="sticky top-0" style={{ zIndex: 100 }}>
        {/* 1. CATEGORY NAV */}
        <div className="overflow-x-auto" style={{ background: '#1e2a3a' }}>
          <div className="h-12 flex items-center justify-center gap-6 px-8">
            <a href="/breaking"
              className="shrink-0 px-5 py-2 text-[14px] font-semibold rounded-full transition-colors"
              style={{ background: 'rgba(220,38,38,0.25)', color: '#fff', border: '1px solid rgba(220,38,38,0.5)' }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 animate-pulse" style={{ background: '#ef4444' }} />
              Breaking
            </a>
            {ALL_CATS.map((cat) => (
              <a key={cat.slug} href={cat.slug}
                className="shrink-0 px-5 py-2 text-[14px] font-semibold rounded-full transition-colors"
                style={{ color: 'rgba(255,255,255,0.55)' }}>
                {cat.label}
              </a>
            ))}
          </div>
        </div>

        {/* 2. LIVE BANNER with logo */}
        <div className="relative">
          <LiveBanner stories={allStories} />
          <div className="absolute inset-0 pointer-events-none z-10" style={{
            background: 'radial-gradient(ellipse 10% 100% at 50% 50%, white 0%, white 70%, transparent 100%)'
          }} />
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <img src="/logo3.png" alt="CVRD" style={{ height: '44px' }} />
          </div>
        </div>

        {/* 3. RED BREAKING BANNER for most recent story */}
        <div className="px-4 py-2 flex items-center gap-3" style={{ background: 'linear-gradient(to right, #7f1d1d, #991b1b, #7f1d1d)' }}>
          <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded animate-pulse">LIVE</span>
          <span className="text-[13px] text-white font-bold flex-1 truncate">{breakingItems[0].topic}</span>
          <span className="text-[10px] text-white/60 shrink-0">{timeAgo(breakingItems[0].detected_at)} · {breakingItems.length > 1 ? `${breakingItems.length} stories` : 'Updated every 30 min'}</span>
        </div>
      </div>

      {/* MOST RECENT: Dashboard + HeroStory */}
      <ErrorBoundary>
        <Dashboard stories={[firstStory]} />
      </ErrorBoundary>
      <div className="h-3" />
      <HeroStory story={firstStory} />

      {/* OLDER BREAKING STORIES: each with its own red banner + HeroStory */}
      {breakingItems.slice(1).map((b, i) => {
        const story = allStories[i + 1];
        return (
          <div key={i}>
            {/* Red banner for this story */}
            <div className="px-4 py-2 flex items-center gap-3 mt-4" style={{ background: 'linear-gradient(to right, #7f1d1d, #991b1b, #7f1d1d)' }}>
              <span className="text-[10px] font-bold text-white bg-red-600/70 px-2 py-0.5 rounded">BREAKING</span>
              <span className="text-[13px] text-white font-bold flex-1 truncate">{b.topic}</span>
              <span className="text-[10px] text-white/60 shrink-0">{timeAgo(b.detected_at)}</span>
            </div>
            <div className="h-3" />
            <HeroStory story={story} />
          </div>
        );
      })}

      {/* FOOTER */}
      <footer className="py-10 text-center" style={{ borderTop: '1px solid #2a3a4a' }}>
        <img src="/logo3.png" alt="CVRD News" className="h-36 mx-auto mb-4 opacity-30" />
        <span className="text-[11px] text-[#666] block mb-3">Your news streaming platform to cover the news</span>
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
