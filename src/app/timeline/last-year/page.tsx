export const revalidate = 86400;

import { getTodayLastYear } from "@/lib/timeline-data";
import { getDailyGaps } from "@/lib/data";
import { SiteNav } from "@/components/SiteNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/timeline/last-year" },
  title: "1 Year Ago Today | CVRD Timeline",
  description: "What happened exactly one year ago today — news stories, videos, and context.",
};

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

      <SiteNav isBreaking={isBreaking} />

      {/* Hero image with title overlaid */}
      <div className="relative overflow-hidden" style={{
        height: '35vh', minHeight: '200px',
        backgroundImage: lastYear.image_file ? `url(${lastYear.image_file})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center',
        background: lastYear.image_file ? undefined : '#253545',
      }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(30,42,58,0.95) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-6">
          <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em] mb-2 block">1 Year Ago Today</span>
          <h1 className="text-[28px] md:text-[40px] text-white leading-tight tracking-[-0.02em]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            {dateStr}
          </h1>
          {lastYear.title && <p className="text-[14px] text-white/60 mt-2">{lastYear.title}</p>}
        </div>
      </div>

      {/* Stories */}
      {lastYear.stories && lastYear.stories.length > 0 && (
        <>
        <div className="px-6 md:px-12 py-2" style={{}}>
          <h2 className="text-[16px] md:text-[18px] text-white leading-tight tracking-[-0.02em]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            {lastYear.stories.map(s => s.headline).join(' & ')}
          </h2>
        </div>
        <div className="px-6 md:px-12 py-6 max-w-4xl">
          <div className="space-y-3">
            {lastYear.stories.map((s, i) => (
              <div key={i} className="rounded-lg p-4" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                <span className="text-[8px] font-bold uppercase tracking-[0.1em]" style={{ color: '#60a5fa' }}>{s.category || 'news'}</span>
                <h3 className="text-[15px] font-medium mt-0.5" style={{ color: '#daa520' }}>{s.headline}</h3>
                <p className="text-[13px] text-[#ccc] leading-[1.7] mt-2">{s.summary}</p>
              </div>
            ))}
          </div>
        </div>
        </>
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
        <span className="text-[11px] text-[#666] block mb-3">Watch it. Read it. Check it.</span>
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
