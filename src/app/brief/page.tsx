export const revalidate = 3600;

import type { Metadata } from "next";
import { getDailyGaps } from "@/lib/data";
import BriefLayout from "@/components/BriefLayout";

export const metadata: Metadata = {
  alternates: { canonical: "/brief" },
  title: 'Daily Pick',
  description: "Today's top 10 stories from across the political spectrum — every angle, every source, no spin.",
  openGraph: { title: 'Daily Pick | CVRD News', description: "Today's top 10 stories from across the political spectrum." },
};

export default async function BriefPage() {
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];

  let isBreaking = false;
  try {
    const { hasBreakingData } = await import('@/lib/breaking-store');
    isBreaking = await hasBreakingData();
  } catch {}

  const displayStories = allStories.filter(s => s.is_top_story).length >= 5
    ? allStories.filter(s => s.is_top_story)
    : allStories.slice(0, 10);

  return (
    <BriefLayout
      stories={displayStories}
      date={data?.date || ""}
      isBreaking={isBreaking}
    />
  );
}
