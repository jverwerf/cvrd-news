export const dynamic = 'force-dynamic';

import { getTodayLastYear } from "@/lib/timeline-data";
import { getDailyGaps } from "@/lib/data";
import { LiveBanner } from "@/components/LiveBanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "1 Year Ago Today | CVRD Timeline",
  description: "What happened exactly one year ago today — news stories, videos, and context.",
};

const ALL_CATS = [
  { label: 'On Record', slug: '/onrecord' },
  { label: 'Timeline', slug: '/timeline' },
  { label: 'Daily Pick', slug: '/' },
  { label: 'World', slug: '/world' },
  { label: 'Politics', slug: '/politics' },
  { label: 'Markets', slug: '/markets' },
  { label: 'Trending', slug: '/trending' },
  { label: 'Sports', slug: '/sports' },
];

async function hasBreakingNews(): Promise<boolean> {
  try {
    const { hasBreakingData } = await import('@/lib/breaking-store');
    return await hasBreakingData();
  } catch { return false; }
}

export default async function LastYearPage() {
  const [data, lastYear, isBreaking] = await Promise.all([
    getDailyGaps(),
    getTodayLastYear(),
    hasBreakingNews(),
  ]);

  const allStories = data?.top_narratives || [];

  if (!lastYear?.summary) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e2a3a' }}>
        <p className="text-[#999]">No data for last year today.</p>
      </div>
    );
  }

  const dateStr = new Date(lastYear.date_last_year + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      {/* NAV + BANNER */}
      <div className="sticky top-0" style={{ zIndex: 100 }}>
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
              {ALL_CATS.map((cat) => (
                <a key={cat.slug} href={cat.slug}
                  className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors whitespace-nowrap"
                  style={{
                    background: cat.slug === '/timeline' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    color: cat.slug === '/timeline' ? '#fff' : 'rgba(255,255,255,0.85)',
                  }}>
                  {cat.label}
                </a>
              ))}
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
        {data && <LiveBanner stories={allStories} liveData={data.live_data} />}
      </div>

      {/* Banner */}
      <div className="px-6 md:px-12 py-4" style={{ background: '#f5f5f5' }}>
        <span className="text-[9px] font-bold text-[#1e2a3a] bg-[#1e2a3a]/10 px-2 py-0.5 rounded uppercase tracking-[0.1em]">1 Year Ago Today</span>
        <h1 className="text-[22px] md:text-[28px] text-[#1e2a3a] leading-tight tracking-[-0.02em] mt-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
          {dateStr}
        </h1>
        {lastYear.title && <p className="text-[14px] text-[#666] mt-1">{lastYear.title}</p>}
      </div>

      {/* Hero image */}
      {lastYear.image_file && (
        <div className="h-48 md:h-64 overflow-hidden" style={{
          backgroundImage: `url(${lastYear.image_file})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div className="w-full h-full" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(30,42,58,0.8) 100%)' }} />
        </div>
      )}

      {/* Summary */}
      <div className="px-6 md:px-12 py-6 max-w-4xl">
        <p className="text-[15px] text-[#ccc] leading-[1.8]">{lastYear.summary}</p>
      </div>

      {/* Stories */}
      {lastYear.stories && lastYear.stories.length > 0 && (
        <div className="px-6 md:px-12 pb-6 max-w-4xl">
          <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3">Stories</h2>
          <div className="space-y-3">
            {lastYear.stories.map((s, i) => (
              <div key={i} className="rounded-lg p-4" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                <span className="text-[8px] font-bold uppercase tracking-[0.1em]" style={{ color: '#60a5fa' }}>{s.category || 'news'}</span>
                <h3 className="text-[15px] text-white font-medium mt-0.5">{s.headline}</h3>
                <p className="text-[12px] text-[#999] leading-[1.5] mt-1">{s.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {lastYear.videos.length > 0 && (
        <div className="px-6 md:px-12 pb-8 max-w-4xl">
          <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3">Videos from that day</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {lastYear.videos.map((v, i) => (
              <div key={i} className="rounded-md overflow-hidden" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                <div style={{ aspectRatio: '16/9' }}>
                  <iframe src={`https://www.youtube.com/embed/${v.id}`} className="w-full h-full" style={{ border: 'none' }} allowFullScreen loading="lazy" />
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] text-white font-medium leading-snug line-clamp-2">{v.title}</p>
                  <span className="text-[9px] text-[#555] mt-0.5 block">{v.channel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="px-6 md:px-12 pb-8">
        <a href="/timeline" className="text-[12px] text-[#daa520] hover:text-white transition-colors">&larr; Back to Timeline</a>
      </div>

      {/* Footer */}
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
