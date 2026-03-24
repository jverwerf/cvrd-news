import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findStoryBySlug, getAllStorySlugs } from "@/lib/stories";
import { StoryPage } from "@/components/StoryPage";

export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllStorySlugs().map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = findStoryBySlug(slug);
  if (!result) return {};

  const { story } = result;
  const description = (story.summary || '').slice(0, 160);

  return {
    title: story.topic,
    description,
    openGraph: {
      title: `${story.topic} | CVRD News`,
      description: (story.summary || '').slice(0, 200),
      type: 'article',
      images: story.image_file ? [{ url: story.image_file }] : ['/logo3.png'],
      url: `https://cvrdnews.com/story/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: story.topic,
      description,
      images: story.image_file ? [story.image_file] : ['/logo3.png'],
    },
    alternates: {
      canonical: `/story/${slug}`,
    },
  };
}

const ALL_CATS = [
  { label: 'Daily Pick', slug: '/' },
  { label: 'World', slug: '/world' },
  { label: 'Politics', slug: '/politics' },
  { label: 'Markets & Crypto', slug: '/markets-crypto' },
  { label: 'Tech & AI', slug: '/tech-ai' },
  { label: 'Culture', slug: '/culture' },
  { label: 'Unfiltered', slug: '/unfiltered' },
];

export default async function StoryRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = findStoryBySlug(slug);
  if (!result) notFound();

  const { story, date } = result;

  // Get other stories from the same date for "More stories"
  const { getAllDailyReports, topicToSlug } = await import("@/lib/stories");
  const reports = getAllDailyReports();
  const sameDay = reports.find(r => r.date === date);
  const otherStories = (sameDay?.report.top_narratives || [])
    .filter(s => topicToSlug(s.topic) !== slug)
    .slice(0, 5);

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>
      {/* NAV */}
      <div className="sticky top-0" style={{ zIndex: 100 }}>
        <div className="relative" style={{ background: '#1e2a3a' }}>
          <div className="h-12 flex items-center overflow-x-auto pr-20" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-2 px-3 md:gap-3 md:px-4 md:mx-auto">
              {ALL_CATS.map((cat) => (
                <a key={cat.slug} href={cat.slug}
                  className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors whitespace-nowrap"
                  style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)' }}>
                  {cat.label}
                </a>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 h-12 flex items-center pl-8 pr-2"
            style={{ background: 'linear-gradient(to right, transparent, #1e2a3a 30%)' }}>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <a href="/tv" className="flex items-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
                </svg>
              </a>
              <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.25)', display: 'block' }} />
              <a href="/show" className="flex items-center transition-opacity hover:opacity-80">
                <img src="/logo-outline.png" alt="CVRD" style={{ height: '13px', opacity: 0.5, filter: 'brightness(0) invert(1)' }} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* LOGO */}
      <img src="/logo3.png" alt="CVRD" className="fixed left-1/2 pointer-events-none"
        style={{ top: '36px', transform: 'translateX(-50%)', height: '68px', zIndex: 101, filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }} />

      {/* STORY */}
      <StoryPage story={story} date={date} otherStories={otherStories} />

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
    </div>
  );
}
