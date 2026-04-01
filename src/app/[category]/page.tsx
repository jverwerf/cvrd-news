export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { getDailyGaps } from "@/lib/data";
import { LiveBanner } from "@/components/LiveBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StoryViewer } from "@/components/StoryViewer";

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  'world': { title: 'World News', description: 'World news from 36+ international sources. Conflicts, diplomacy, and global events — every side of every story.' },
  'politics': { title: 'Politics', description: 'Political news without the spin. Coverage from left, right, and international outlets so you get the full picture.' },
  'markets': { title: 'Markets', description: 'Financial markets and economic news. Stocks, oil, jobs, inflation — analysis from every angle.' },
  'sports': { title: 'Sports', description: 'Sports news from every angle. Football, basketball, soccer, F1, UFC, transfers, results, and the stories behind the game.' },
  'trending': { title: 'Trending', description: 'What everyone is talking about. Viral moments, entertainment, sports, and the stories shaping the conversation right now.' },
};

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: `${meta.title} | CVRD News`, description: meta.description },
  };
}

const CATEGORIES: Record<string, { label: string; slug: string }> = {
  'world': { label: 'World', slug: 'world' },
  'politics': { label: 'Politics', slug: 'politics' },
  'markets': { label: 'Markets', slug: 'markets' },
  'trending': { label: 'Trending', slug: 'trending' },
  'sports': { label: 'Sports', slug: 'sports' },
};

const ALL_CATS = Object.values(CATEGORIES);

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];

  let isBreaking = false;
  try {
    const { hasBreakingData } = await import('@/lib/breaking-store');
    isBreaking = await hasBreakingData();
  } catch {}

  const cat = CATEGORIES[category];
  if (!cat) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#999]">Category not found.</p>
      </div>
    );
  }

  const filtered = allStories.filter(s => s.category === category);
  const untagged = allStories.filter(s => !s.category);
  const displayStories = filtered.length > 0 ? filtered : untagged;

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      {/* NAV + BANNER — wrapped together, both sticky */}
      <div className="sticky top-0" style={{ zIndex: 100 }}>
        {/* 1. CATEGORY NAV */}
        <div className="relative" style={{ background: '#1e2a3a' }}>
          <div className="h-12 flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-2 px-3 md:gap-3 md:px-4 md:mx-auto">
              {isBreaking && (
                <a href="/breaking"
                  className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors"
                  style={{ background: 'rgba(220,38,38,0.15)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 animate-pulse" style={{ background: '#ef4444' }} />
                  Breaking
                </a>
              )}
              {[{ label: 'On Record', slug: 'onrecord' }, { label: 'Timeline', slug: 'timeline' }, { label: 'Daily Pick', slug: '/' }, ...Object.values(CATEGORIES)].map((c) => (
                <a key={c.slug} href={c.slug === '/' ? '/' : `/${c.slug}`}
                  className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors whitespace-nowrap"
                  style={{
                    background: c.slug === category ? 'rgba(255,255,255,0.2)' : 'transparent',
                    color: c.slug === category ? '#fff' : 'rgba(255,255,255,0.85)',
                  }}>
                  {c.label}
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
        {data && <LiveBanner stories={allStories} liveData={data.live_data} />}
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

      {/* STORY VIEWER */}
      {displayStories.length > 0 ? (
        <ErrorBoundary>
          <StoryViewer stories={displayStories} dailyBrief={data?.category_briefs?.[category]} />
        </ErrorBoundary>
      ) : (
        <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">
          <p className="text-[#999]">No {cat.label.toLowerCase()} stories today.</p>
        </div>
      )}

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
