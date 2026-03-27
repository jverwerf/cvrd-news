import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryPage } from "@/components/StoryPage";

export const dynamic = 'force-dynamic';

async function getStory(slug: string) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  try {
    const resp = await fetch(`${baseUrl}/api/story/${slug}`, { cache: 'no-store' });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getStory(slug);
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
    alternates: { canonical: `/story/${slug}` },
  };
}

const ALL_CATS = [
  { label: 'On Record', slug: '/onrecord' },
  { label: 'Daily Pick', slug: '/' },
  { label: 'World', slug: '/world' },
  { label: 'Politics', slug: '/politics' },
  { label: 'Markets', slug: '/markets' },
  { label: 'Trending', slug: '/trending' },
  { label: 'Sports', slug: '/sports' },
];

export default async function StoryRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getStory(slug);
  if (!result) notFound();

  const { story, date, otherStories } = result;

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>
      <div className="sticky top-0" style={{ zIndex: 100 }}>
        <div className="relative" style={{ background: '#1e2a3a' }}>
          <div className="h-12 flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-2 px-3 md:gap-3 md:px-4 md:mx-auto">
              {ALL_CATS.map((cat) => (
                <a key={cat.slug} href={cat.slug}
                  className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors whitespace-nowrap"
                  style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)' }}>
                  {cat.label}
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

      <StoryPage story={story} date={date} otherStories={otherStories} />

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
