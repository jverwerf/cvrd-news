export const revalidate = 3600; // 1 hour — daily pipeline runs at 7am

import type { Metadata } from "next";
import { getDailyGaps } from "@/lib/data";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StoryViewer } from "@/components/StoryViewer";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: 'Daily Pick',
  description: "Today's top 10 stories from across the political spectrum — every angle, every source, no spin.",
  openGraph: { title: 'Daily Pick | CVRD News', description: "Today's top 10 stories from across the political spectrum." },
};

const CATEGORIES: Record<string, { label: string; slug: string }> = {
  'world': { label: 'World', slug: 'world' },
  'politics': { label: 'Politics', slug: 'politics' },
  'markets': { label: 'Markets', slug: 'markets' },
  'trending': { label: 'Trending', slug: 'trending' },
  'sports': { label: 'Sports', slug: 'sports' },
};

export default async function BriefPage() {
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];

  let isBreaking = false;
  try {
    const { hasBreakingData } = await import('@/lib/breaking-store');
    isBreaking = await hasBreakingData();
  } catch {}

  const displayStories = allStories.filter(s => s.is_top_story).length >= 5
    ? allStories.filter(s => s.is_top_story)
    : allStories.slice(0, 10);

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      <SiteNav isBreaking={isBreaking} />

      {/* STORY VIEWER */}
      {displayStories.length > 0 ? (
        <ErrorBoundary>
          <StoryViewer stories={displayStories} dailyBrief={data?.daily_brief} />
        </ErrorBoundary>
      ) : (
        <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">
          <p className="text-[#999]">No stories today yet — check back soon.</p>
        </div>
      )}

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
