import { getDailyGaps } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LiveBanner } from "@/components/LiveBanner";
import { HeroStory } from "@/components/HeroStory";
import { StoryFeed } from "@/components/StoryFeed";

const ALL_CATS = [
  { label: 'Daily Pick', slug: '/' },
  { label: 'World', slug: '/world' },
  { label: 'Politics', slug: '/politics' },
  { label: 'Markets & Crypto', slug: '/markets-crypto' },
  { label: 'Tech & AI', slug: '/tech-ai' },
  { label: 'Culture', slug: '/culture' },
  { label: 'Unfiltered', slug: '/unfiltered' },
];

async function hasBreakingNews(): Promise<boolean> {
  try {
    const { hasBreakingData } = await import('@/lib/breaking-store');
    return await hasBreakingData();
  } catch { return false; }
}

export default async function Home() {
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];
  const isBreaking = await hasBreakingNews();

  const top10 = allStories.filter(s => s.is_top_story).length >= 10
    ? allStories.filter(s => s.is_top_story)
    : allStories.slice(0, 10);

  const stories = top10;
  const heroStory = stories[0];
  const rest = stories.slice(1);

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      {!data || !data.top_narratives ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-[#999]">No stories today.</p>
        </div>
      ) : (
        <>
          {/* NAV + BANNER — wrapped together, both sticky */}
          <div className="sticky top-0" style={{ zIndex: 100 }}>
            {/* 1. CATEGORY NAV */}
            <div className="overflow-x-auto" style={{ background: '#1e2a3a' }}>
              <div className="h-12 flex items-center justify-center gap-6 px-8">
                {isBreaking && (
                  <a href="/breaking"
                    className="shrink-0 px-5 py-2 text-[14px] font-semibold rounded-full transition-colors"
                    style={{ background: 'rgba(220,38,38,0.15)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 animate-pulse" style={{ background: '#ef4444' }} />
                    Breaking
                  </a>
                )}
                {ALL_CATS.map((cat) => (
                  <a key={cat.slug} href={cat.slug}
                    className="shrink-0 px-5 py-2 text-[14px] font-semibold rounded-full transition-colors"
                    style={{
                      background: cat.slug === '/' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      color: cat.slug === '/' ? '#fff' : 'rgba(255,255,255,0.85)',
                    }}>
                    {cat.label}
                  </a>
                ))}
                <span className="w-px h-5 bg-white/10 shrink-0" />
                <a href="/tv" className="shrink-0 px-4 py-2 text-[12px] font-semibold rounded-full transition-colors flex items-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
                  </svg>
                  TV
                </a>
              </div>
            </div>

            {/* 2. LIVE BANNER */}
            <LiveBanner stories={stories} liveData={data.live_data} />
          </div>

          {/* 3. DASHBOARD + LOGO */}
          <div className="relative">
            <ErrorBoundary>
              <Dashboard stories={stories} videoUrl={data.video_url} videoDate={data.date} />
            </ErrorBoundary>
            {/* Logo centered, overlapping top of dashboard */}
            <img src="/logo3.png" alt="CVRD" className="fixed left-1/2 pointer-events-none"
              style={{ top: '36px', transform: 'translateX(-50%)', height: '68px', zIndex: 101, filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }} />
          </div>

          {/* 4. HERO STORY */}
          <div className="h-3" />
          {heroStory && <HeroStory story={heroStory} />}

          {/* 5. REST OF STORIES */}
          {rest.length > 0 && <StoryFeed stories={rest} startIndex={1} />}

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
        </>
      )}
    </div>
  );
}
