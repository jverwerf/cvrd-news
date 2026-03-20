import { getDailyGaps } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LiveBanner } from "@/components/LiveBanner";
import { HeroStory } from "@/components/HeroStory";
import { StoryFeed } from "@/components/StoryFeed";

import fs from 'fs';
import path from 'path';

const ALL_CATS = [
  { label: 'Daily Pick', slug: '/' },
  { label: 'World', slug: '/world' },
  { label: 'Politics', slug: '/politics' },
  { label: 'Markets & Crypto', slug: '/markets-crypto' },
  { label: 'Tech & AI', slug: '/tech-ai' },
  { label: 'Culture', slug: '/culture' },
  { label: 'Unfiltered', slug: '/unfiltered' },
];

function hasBreakingNews(): boolean {
  try {
    const breakingPath = path.resolve(process.cwd(), 'public/data/breaking.json');
    if (!fs.existsSync(breakingPath)) return false;
    const data = JSON.parse(fs.readFileSync(breakingPath, 'utf8'));
    // Expire after 12 hours
    const lastUpdate = new Date(data.last_updated).getTime();
    return Date.now() - lastUpdate < 12 * 60 * 60 * 1000;
  } catch { return false; }
}

export default async function Home() {
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];
  const isBreaking = hasBreakingNews();

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
                    className="shrink-0 px-5 py-2 text-[14px] font-bold rounded-full animate-pulse"
                    style={{ background: '#dc2626', color: '#fff' }}>
                    🔴 BREAKING
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
              </div>
            </div>

            {/* 2. LIVE BANNER with logo */}
            <div className="relative">
            <LiveBanner stories={stories} liveData={data.live_data} />
            <div className="absolute inset-0 pointer-events-none z-10" style={{
              background: 'radial-gradient(ellipse 10% 100% at 50% 50%, white 0%, white 70%, transparent 100%)'
            }} />
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <img src="/logo2.png" alt="CVRD" style={{ height: '44px' }} />
            </div>
            </div>
          </div>

          {/* 3. DASHBOARD */}
          <ErrorBoundary>
            <Dashboard stories={stories} videoUrl={data.video_url} videoDate={data.date} />
          </ErrorBoundary>

          {/* 4. HERO STORY */}
          <div className="h-3" />
          {heroStory && <HeroStory story={heroStory} />}

          {/* 5. REST OF STORIES */}
          {rest.length > 0 && <StoryFeed stories={rest} startIndex={1} />}

          {/* FOOTER */}
          <footer className="py-10 text-center" style={{ borderTop: '1px solid #2a3a4a' }}>
            <img src="/logo2.png" alt="CVRD News" className="h-36 mx-auto mb-4 opacity-30" />
            <span className="text-[11px] text-[#666] block mb-3">Sourced from the social pulse</span>
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
