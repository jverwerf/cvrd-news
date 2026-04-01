import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTimelineThread, getTimelineThreads } from "@/lib/timeline-data";
import { ThreadDetail } from "./ThreadDetail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const thread = await getTimelineThread(slug);
  if (!thread) return {};
  return {
    title: thread.title,
    description: thread.summary.substring(0, 160),
    openGraph: {
      title: `${thread.title} | CVRD News Timeline`,
      description: thread.summary.substring(0, 160),
      images: thread.image_file ? [{ url: thread.image_file }] : [],
      url: `https://cvrdnews.com/timeline/${slug}`,
    },
  };
}

export default async function TimelineThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const thread = await getTimelineThread(slug);
  if (!thread) notFound();

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>
      {/* NAV */}
      <div className="sticky top-0" style={{ zIndex: 100, background: '#1e2a3a' }}>
        <div className="h-12 flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 px-3 md:gap-3 md:px-4 md:mx-auto">
            {[
              { label: 'On Record', slug: '/onrecord' },
              { label: 'Timeline', slug: '/timeline' },
              { label: 'Daily Pick', slug: '/' },
              { label: 'World', slug: '/world' },
              { label: 'Politics', slug: '/politics' },
              { label: 'Markets', slug: '/markets' },
              { label: 'Trending', slug: '/trending' },
              { label: 'Sports', slug: '/sports' },
            ].map((cat) => (
              <a key={cat.slug} href={cat.slug}
                className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors whitespace-nowrap"
                style={{
                  background: cat.slug === '/timeline' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: cat.slug === '/timeline' ? '#fff' : 'rgba(255,255,255,0.85)',
                }}>
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Hero image */}
      {thread.image_file && (
        <div className="relative overflow-hidden" style={{
          height: '35vh', minHeight: '200px',
          backgroundImage: `url(${thread.image_file})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(30,42,58,0.95) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2 block" style={{
              color: thread.category === 'world' ? '#60a5fa' : thread.category === 'politics' ? '#f87171' : thread.category === 'markets' ? '#34d399' : '#f59e0b',
            }}>{thread.category}</span>
            <h1 className="text-[28px] md:text-[40px] text-white leading-tight tracking-[-0.02em]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {thread.title}
            </h1>
            <p className="text-[12px] text-white/50 mt-2">
              {thread.first_seen} — {thread.last_seen} · {thread.entries.length} events · {thread.days_covered} days covered
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <ThreadDetail thread={thread} />

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
