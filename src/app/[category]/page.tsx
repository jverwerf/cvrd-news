import type { Metadata } from "next";
import { getDailyGaps } from "@/lib/data";
import { LiveBanner } from "@/components/LiveBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StoryViewer } from "@/components/StoryViewer";

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  'world': { title: 'World News', description: 'Unfiltered world news from 36+ international sources. Conflicts, diplomacy, and global events — every side of every story.' },
  'politics': { title: 'Politics', description: 'Political news without the spin. Coverage from left, right, and international outlets so you get the full picture.' },
  'markets-crypto': { title: 'Markets & Crypto', description: 'Financial markets, cryptocurrency, and economic news. Bitcoin, stocks, oil — analysis from every angle.' },
  'tech-ai': { title: 'Tech & AI', description: 'Technology and artificial intelligence news. From startups to Big Tech, covered without bias.' },
  'culture': { title: 'Culture', description: 'Entertainment, sports, and cultural news. The stories shaping society today.' },
  'unfiltered': { title: 'Unfiltered', description: 'The stories mainstream media won\'t touch. Investigations, conspiracies debunked, and the news behind the news.' },
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
  'markets-crypto': { label: 'Markets & Crypto', slug: 'markets-crypto' },
  'tech-ai': { label: 'Tech & AI', slug: 'tech-ai' },
  'culture': { label: 'Culture', slug: 'culture' },
  'unfiltered': { label: 'Unfiltered', slug: 'unfiltered' },
};

const ALL_CATS = Object.values(CATEGORIES);

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];

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
        <div className="overflow-x-auto" style={{ background: '#1e2a3a', scrollbarWidth: 'none' }}>
          <div className="h-12 flex items-center justify-center gap-3 px-4 relative">
            {[{ label: 'Daily Pick', slug: '/' }, ...Object.values(CATEGORIES)].map((c) => (
              <a key={c.slug} href={c.slug === '/' ? '/' : `/${c.slug}`}
                className="shrink-0 px-3 py-1.5 text-[13px] font-semibold rounded-full transition-colors"
                style={{
                  background: c.slug === category ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: c.slug === category ? '#fff' : 'rgba(255,255,255,0.85)',
                }}>
                {c.label}
              </a>
            ))}
            <div className="absolute right-4 flex items-center gap-1.5">
              <a href="/tv" className="p-1 transition-colors flex items-center"
                style={{ color: 'rgba(255,255,255,0.35)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
                </svg>
              </a>
              <span style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.4)', display: 'block' }} />
              <a href="/show" className="p-1 transition-opacity hover:opacity-80 flex items-center"
                title="Watch the daily show">
                <img src="/logo-outline.png" alt="CVRD" style={{ height: '16px', opacity: 0.7, filter: 'brightness(0) invert(1)' }} />
              </a>
            </div>
          </div>
        </div>

        {/* 2. LIVE BANNER */}
        {data && <LiveBanner stories={allStories} liveData={data.live_data} />}
      </div>

      {/* LOGO */}
      <img src="/logo3.png" alt="CVRD" className="fixed left-1/2 pointer-events-none"
        style={{ top: '36px', transform: 'translateX(-50%)', height: '68px', zIndex: 101, filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }} />

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
