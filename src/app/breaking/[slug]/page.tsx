import { redirect } from 'next/navigation';
import { getBreakingData } from '@/lib/breaking-store';
import { getLiveNowData } from '@/lib/live-now-store';
import BreakingDetailClient from '../BreakingDetailClient';
import type { NarrativeGap } from '@/lib/data';

export const dynamic = 'force-dynamic';

function toSlug(topic: string) {
  return topic.toLowerCase()
    .replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function toNarrativeGap(b: any): NarrativeGap {
  const ytVideos = (b.youtube_videos || []).length > 0
    ? b.youtube_videos
    : (b.clips || [])
        .filter((c: any) => c.platform === 'youtube' && c.embed_id)
        .map((c: any) => ({ url: c.url || '', embed_id: c.embed_id, channel: c.title || 'Breaking', duration: c.duration, title: c.title }));
  const socialClips = (b.social_clips || []).length > 0
    ? b.social_clips
    : (b.clips || [])
        .filter((c: any) => c.platform !== 'youtube' && c.embed_id)
        .map((c: any) => ({ platform: c.platform, url: c.url || '', embed_id: c.embed_id, title: c.title, author: c.author, thumbnail: c.thumbnail, duration: c.duration }));
  return {
    topic: b.topic || 'Breaking News',
    summary: b.summary || '',
    left_narrative: b.left_narrative || '',
    center_narrative: b.center_narrative || '',
    right_narrative: b.right_narrative || '',
    what_they_arent_telling_you: b.what_they_arent_telling_you || '',
    social_summary: b.social_summary || '',
    image_file: undefined,
    image_prompt: b.image_prompt || '',
    sources: (b.sources || []).map((s: any) => ({ name: s.name, url: s.url, lean: s.lean, title: s.title })),
    youtube_videos: ytVideos,
    social_clips: socialClips,
  };
}

export default async function BreakingStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [breaking, live] = await Promise.all([
    getBreakingData(),
    getLiveNowData(),
  ]);

  const allBreaking = breaking ?? [];
  const allLive = live ?? [];

  const breakingRaw = allBreaking.find(s => toSlug(s.topic || '') === slug);
  const liveRaw = allLive.find(s => toSlug(s.topic || '') === slug);

  if (!breakingRaw && !liveRaw) redirect('/breaking');

  const raw = breakingRaw || liveRaw;
  const story = toNarrativeGap(raw);
  const type = breakingRaw ? 'breaking' : 'live';

  return <BreakingDetailClient story={story} raw={raw} type={type as 'breaking' | 'live'} />;
}
