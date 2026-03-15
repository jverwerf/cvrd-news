import { getDailyGaps } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import { LiveBanner } from "@/components/LiveBanner";
import { HeroStory } from "@/components/HeroStory";
import { StoryFeed } from "@/components/StoryFeed";

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
    <div className="min-h-screen bg-white">

      {/* NAV + BANNER — wrapped together, both sticky */}
      <div className="sticky top-0" style={{ zIndex: 100 }}>
        {/* 1. CATEGORY NAV */}
        <div className="overflow-x-auto" style={{ background: '#1e2a3a' }}>
          <div className="h-12 flex items-center justify-center gap-6 px-8">
            {[{ label: 'Daily Pick', slug: '/' }, ...Object.values(CATEGORIES)].map((c) => (
              <a key={c.slug} href={c.slug === '/' ? '/' : `/${c.slug}`}
                className="shrink-0 px-5 py-2 text-[14px] font-semibold rounded-full transition-colors"
                style={{
                  background: c.slug === category ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: c.slug === category ? '#fff' : 'rgba(255,255,255,0.85)',
                }}>
                {c.label}
              </a>
            ))}
          </div>
        </div>

        {/* 2. LIVE BANNER with logo */}
        <div className="relative">
          {data && <LiveBanner stories={allStories} liveData={data.live_data} />}
          <div className="absolute inset-0 pointer-events-none z-10" style={{
            background: 'radial-gradient(ellipse 10% 100% at 50% 50%, white 0%, white 70%, transparent 100%)'
          }} />
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <img src="/logo2.png" alt="CVRD" style={{ height: '44px' }} />
          </div>
        </div>
      </div>

      {/* Fade from banner into dashboard */}
      <div className="h-4 -mt-1" style={{ background: 'linear-gradient(to bottom, #e5e5e5, white)' }} />

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
        <img src="/logo2.png" alt="CVRD" className="h-36 mx-auto mb-4 opacity-30" />
        <span className="text-[11px] text-[#ccc]">Sourced from the social pulse</span>
      </footer>
    </div>
  );
}
