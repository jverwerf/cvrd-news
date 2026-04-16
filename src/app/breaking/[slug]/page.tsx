import { redirect } from 'next/navigation';
import { getBreakingData } from '@/lib/breaking-store';
import { getLiveNowData } from '@/lib/live-now-store';
import BreakingClient from '../BreakingClient';

export const dynamic = 'force-dynamic';

function toSlug(topic: string) {
  return topic.toLowerCase()
    .replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export default async function BreakingStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [breaking, live] = await Promise.all([
    getBreakingData(),
    getLiveNowData(),
  ]);

  const allBreaking = breaking ?? [];
  const allLive = live ?? [];

  const breakingStory = allBreaking.find(s => toSlug(s.topic || '') === slug);
  const liveStory = allLive.find(s => toSlug(s.topic || '') === slug);

  if (!breakingStory && !liveStory) redirect('/breaking');

  return (
    <BreakingClient
      initialData={breakingStory ? [breakingStory] : []}
      initialLiveNow={liveStory ? [liveStory] : []}
    />
  );
}
