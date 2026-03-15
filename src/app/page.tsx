import { getDailyGaps } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
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

export default async function Home() {
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];

  const top10 = allStories.filter(s => s.is_top_story).length >= 10
    ? allStories.filter(s => s.is_top_story)
    : allStories.slice(0, 10);

  const stories = top10;
  const heroStory = stories[0];
  const rest = stories.slice(1);

  return (
    <div className="min-h-screen bg-white">

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
          <Dashboard stories={stories} videoUrl={data.video_url} videoDate={data.date} />

          {/* 4. HERO STORY */}
          {heroStory && <HeroStory story={heroStory} />}

          {/* 5. REST OF STORIES */}
          {rest.length > 0 && <StoryFeed stories={rest} startIndex={1} />}

          {/* FOOTER */}
          <footer className="py-10 text-center border-t border-[#e5e5e5]">
            <img src="/logo2.png" alt="CVRD" className="h-3 mx-auto mb-2 opacity-30" />
            <span className="text-[11px] text-[#ccc]">Sourced from the social pulse</span>
          </footer>
        </>
      )}
    </div>
  );
}
