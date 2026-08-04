export const revalidate = 3600;

import type { Metadata } from "next";
import { getDailyGaps } from "@/lib/data";
import BriefLayout from "@/components/BriefLayout";

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
    alternates: { canonical: `/${category}` },
    title: meta.title,
    description: meta.description,
    openGraph: { title: `${meta.title} | CVRD News`, description: meta.description },
  };
}

const CATEGORIES = ['world', 'politics', 'markets', 'trending', 'sports'] as const;

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];

  let isBreaking = false;
  try {
    const { hasBreakingData } = await import('@/lib/breaking-store');
    isBreaking = await hasBreakingData();
  } catch {}

  if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#3f5a80' }}>
        <p style={{ color: '#7a8fa6' }}>Category not found.</p>
      </div>
    );
  }

  const filtered = allStories.filter(s => s.category === category);
  const untagged = allStories.filter(s => !s.category);
  const displayStories = filtered.length > 0 ? filtered : untagged;

  return (
    <BriefLayout
      stories={displayStories}
      date={data?.date || ""}
      isBreaking={isBreaking}
      category={category}
    />
  );
}
