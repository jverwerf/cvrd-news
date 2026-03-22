import type { Metadata } from "next";
import { getDailyGaps } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import { LiveBanner } from "@/components/LiveBanner";
import { HeroStory } from "@/components/HeroStory";
import { StoryFeed } from "@/components/StoryFeed";

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

  const heroStory = displayStories[0];
  const rest = displayStories.slice(1);

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      {/* NAV + BANNER — wrapped together, both sticky */}
      <div className="sticky top-0" style={{ zIndex: 100 }}>
        {/* 1. CATEGORY NAV */}
        <div className="overflow-x-auto" style={{ background: '#1e2a3a', scrollbarWidth: 'none' }}>
          <div className="h-12 flex items-center justify-center gap-3 px-4">
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
            <a href="/tv" className="shrink-0 p-1.5 rounded-full transition-colors flex items-center"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/@CoveredNews" target="_blank" rel="noreferrer" className="shrink-0 p-1 transition-opacity hover:opacity-80 flex items-center"
              title="Watch the daily show">
              <img src="/logo3.png" alt="CVRD" style={{ height: '22px', opacity: 0.5, filter: 'grayscale(1) brightness(10)' }} />
            </a>
          </div>
        </div>

        {/* 2. LIVE BANNER with logo */}
        <div className="relative">
          {data && <LiveBanner stories={allStories} liveData={data.live_data} />}
          <div className="absolute inset-0 pointer-events-none z-10" style={{
            background: 'radial-gradient(ellipse 10% 100% at 50% 50%, white 0%, white 70%, transparent 100%)'
          }} />
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <img src="/logo3.png" alt="CVRD" style={{ height: '44px' }} />
          </div>
        </div>
      </div>

      {/* Fade from banner into content */}
      <div className="h-4 -mt-1" style={{ background: 'linear-gradient(to bottom, #e5e5e5, #1e2a3a)' }} />

      {/* 3. DASHBOARD — category stories only, NO anchor video */}
      {displayStories.length > 0 && (
        <Dashboard
          stories={displayStories}
          videoUrl={undefined}
          videoDate={undefined}
        />
      )}

      {/* 4. HERO STORY */}
      {heroStory && <HeroStory story={heroStory} />}

      {/* 5. REST */}
      {rest.length > 0 && <StoryFeed stories={rest} startIndex={1} />}

      {!displayStories.length && (
        <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">
          <p className="text-[#999]">No {cat.label.toLowerCase()} stories today.</p>
        </div>
      )}

      <footer className="py-10 text-center border-t border-[#e5e5e5]">
        <img src="/logo3.png" alt="CVRD" className="h-36 mx-auto mb-4 opacity-30" />
        <span className="text-[11px] text-[#ccc]">Your news streaming platform to cover the news</span>
      </footer>
    </div>
  );
}
