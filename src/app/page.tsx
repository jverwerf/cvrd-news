import { getDailyGaps } from "@/lib/data";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LiveBanner } from "@/components/LiveBanner";
import { StoryViewer } from "@/components/StoryViewer";

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
            <div className="relative" style={{ background: '#1e2a3a' }}>
              {/* Scrollable categories */}
              <div className="h-12 flex items-center overflow-x-auto pr-20" style={{ scrollbarWidth: 'none' }}>
                <div className="flex items-center gap-2 px-3 md:gap-3 md:px-4 md:mx-auto">
                  {isBreaking && (
                    <a href="/breaking"
                      className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors"
                      style={{ background: 'rgba(220,38,38,0.15)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 animate-pulse" style={{ background: '#ef4444' }} />
                      Breaking
                    </a>
                  )}
                  {ALL_CATS.map((cat) => (
                    <a key={cat.slug} href={cat.slug}
                      className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors whitespace-nowrap"
                      style={{
                        background: cat.slug === '/' ? 'rgba(255,255,255,0.2)' : 'transparent',
                        color: cat.slug === '/' ? '#fff' : 'rgba(255,255,255,0.85)',
                      }}>
                      {cat.label}
                    </a>
                  ))}
                </div>
              </div>
              {/* Gradient fade + icons pinned right */}
              <div className="absolute right-0 top-0 h-12 flex items-center gap-1.5 pl-8 pr-3"
                style={{ background: 'linear-gradient(to right, transparent, #1e2a3a 30%)' }}>
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
            <LiveBanner stories={stories} liveData={data.live_data} />
          </div>

          {/* 3. LOGO */}
          <img src="/logo3.png" alt="CVRD" className="fixed left-1/2 pointer-events-none"
            style={{ top: '36px', transform: 'translateX(-50%)', height: '68px', zIndex: 101, filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }} />

          {/* 4. STORY VIEWER — Dashboard with arrows + full story content */}
          <ErrorBoundary>
            <StoryViewer stories={stories} videoUrl={data.video_url} videoDate={data.date} dailyBrief={data.daily_brief} />
          </ErrorBoundary>

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
        </>
      )}
    </div>
  );
}
