export const revalidate = 3600; // 1 hour — daily pipeline runs at 7am

import type { Metadata } from "next";
import { getDailyGaps } from "@/lib/data";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StoryViewer } from "@/components/StoryViewer";
import { SiteNav } from "@/components/SiteNav";

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  'world': { title: 'World News', description: 'World news from 36+ international sources. Conflicts, diplomacy, and global events — every side of every story.' },
  'politics': { title: 'Politics', description: 'Political news without the spin. Coverage from left, right, and international outlets so you get the full picture.' },
  'markets': { title: 'Markets', description: 'Financial markets and economic news. Stocks, oil, jobs, inflation — analysis from every angle.' },
  'sports': { title: 'Sports', description: 'Sports news from every angle. Football, basketball, soccer, F1, UFC, transfers, results, and the stories behind the game.' },
  'trending': { title: 'Trending', description: 'What everyone is talking about. Viral moments, entertainment, sports, and the stories shaping the conversation right now.' },
};

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: `${meta.title} | CVRD News`, description: meta.description },
  };
}

const CATEGORIES: Record<string, { label: string; slug: string }> = {
  'world': { label: 'World', slug: 'world' },
  'politics': { label: 'Politics', slug: 'politics' },
  'markets': { label: 'Markets', slug: 'markets' },
  'trending': { label: 'Trending', slug: 'trending' },
  'sports': { label: 'Sports', slug: 'sports' },
};

const ALL_CATS = Object.values(CATEGORIES);

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];

  let isBreaking = false;
  try {
    const { hasBreakingData } = await import('@/lib/breaking-store');
    isBreaking = await hasBreakingData();
  } catch {}

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

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      <SiteNav isBreaking={isBreaking} />

      {/* STORY VIEWER */}
      {displayStories.length > 0 ? (
        <ErrorBoundary>
          <StoryViewer stories={displayStories} dailyBrief={data?.category_briefs?.[category]} />
        </ErrorBoundary>
      ) : (
        <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">
          <p className="text-[#999]">No {cat.label.toLowerCase()} stories today.</p>
        </div>
      )}

      <footer className="py-10 text-center" style={{ borderTop: '1px solid #2a3a4a' }}>
        <img src="/logo3.png" alt="CVRD News" className="h-36 mx-auto mb-4 opacity-30" />
        <span className="text-[11px] text-[#666] block mb-3">Your streaming platform to cover the news</span>
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
