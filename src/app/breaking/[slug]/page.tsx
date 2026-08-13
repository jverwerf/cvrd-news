import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getBreakingData, hasBreakingData } from '@/lib/breaking-store';
import { getLiveNowData } from '@/lib/live-now-store';
import { StoryPage } from '@/components/StoryPage';
import { SiteNav, SiteFooter } from '@/components/SiteNav';
import { getTimelineThreads } from '@/lib/timeline-data';
import { toIsoTimestamp, type NarrativeGap } from '@/lib/data';

export const dynamic = 'force-dynamic';

function toSlug(topic: string) {
  return (topic || '').toLowerCase()
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
  const firstYt = ytVideos.find((v: any) => v.embed_id)?.embed_id;
  const imageFile = b.image_file || (firstYt ? `https://img.youtube.com/vi/${firstYt}/maxresdefault.jpg` : undefined);

  return {
    topic: b.topic || 'Breaking News',
    summary: b.summary || '',
    left_narrative: b.left_narrative || '',
    center_narrative: b.center_narrative || '',
    right_narrative: b.right_narrative || '',
    what_they_arent_telling_you: b.what_they_arent_telling_you || '',
    social_summary: b.social_summary || '',
    image_file: imageFile,
    image_prompt: b.image_prompt || '',
    category: b.category,
    sources: (b.sources || []).map((s: any) => ({ name: s.name, url: s.url, lean: s.lean, title: s.title })),
    youtube_videos: ytVideos,
    social_clips: socialClips,
  } as NarrativeGap;
}

function hasEnoughClips(raw: any): boolean {
  const yt = (raw.youtube_videos || []).length;
  const social = (raw.social_clips || []).filter((c: any) => c.duration).length;
  return yt + social >= 3;
}

async function loadStory(slug: string) {
  const [breaking, live] = await Promise.all([
    getBreakingData(),
    getLiveNowData(),
  ]);
  const allBreaking = breaking ?? [];
  const allLive = live ?? [];
  const combined = [...allBreaking, ...allLive];

  const raw = combined.find(s => toSlug(s.topic || '') === slug);
  if (!raw) return null;

  const story = toNarrativeGap(raw);

  const navRaws = combined.filter(hasEnoughClips);
  const navStories = navRaws.map(toNarrativeGap);
  const navIdx = navRaws.findIndex(s => toSlug(s.topic || '') === slug);

  let prevStory: NarrativeGap | undefined;
  let nextStory: NarrativeGap | undefined;
  if (navStories.length > 1) {
    if (navIdx === -1) {
      prevStory = navStories[navStories.length - 1];
      nextStory = navStories[0];
    } else {
      prevStory = navIdx > 0 ? navStories[navIdx - 1] : navStories[navStories.length - 1];
      nextStory = navIdx < navStories.length - 1 ? navStories[navIdx + 1] : navStories[0];
    }
  }

  const date = (raw.detected_at || '').split('T')[0] || new Date().toISOString().split('T')[0];
  // Breaking records carry real instants: detected_at is first publish,
  // last_updated moves every time the engine re-writes the story.
  const publishedAt = toIsoTimestamp(raw.detected_at) || toIsoTimestamp(date);
  const updatedAt = toIsoTimestamp(raw.last_updated) || publishedAt;

  return { story, raw, date, publishedAt, updatedAt, allStories: navStories, prevStory, nextStory };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadStory(slug);
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
      url: `https://cvrdnews.com/breaking/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: story.topic,
      description,
      images: story.image_file ? [story.image_file] : ['/logo3.png'],
    },
    alternates: { canonical: `/breaking/${slug}` },
  };
}

export default async function BreakingStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await loadStory(slug);
  if (!result) redirect('/breaking');

  const { story, date, publishedAt, updatedAt, allStories, prevStory, nextStory } = result;
  const isBreaking = await hasBreakingData().catch(() => false);

  const threadId = (story as any).thread_id;
  let matchedTimelines: { id: string; title: string; image_file?: string; summary?: string; days_covered?: number; is_active?: boolean }[] = [];
  if (threadId) {
    const timelineData = await getTimelineThreads();
    const thread = (timelineData?.threads || []).find((t: any) => t.id === threadId);
    if (thread) matchedTimelines = [{ id: thread.id, title: thread.title, image_file: thread.image_file, summary: thread.summary, days_covered: thread.days_covered, is_active: thread.is_active }];
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.topic,
    description: (story.summary || '').slice(0, 200),
    image: story.image_file ? [story.image_file.startsWith('http') ? story.image_file : `https://cvrdnews.com${story.image_file}`] : [],
    datePublished: publishedAt,
    dateModified: updatedAt,
    author: { '@type': 'Organization', name: 'CVRD News', url: 'https://cvrdnews.com' },
    publisher: { '@type': 'Organization', name: 'CVRD News', logo: { '@type': 'ImageObject', url: 'https://cvrdnews.com/logo3.png' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://cvrdnews.com/breaking/${slug}` },
  };

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteNav isBreaking={isBreaking} />
      <StoryPage
        story={story}
        date={date}
        allStories={allStories}
        prevStory={prevStory}
        nextStory={nextStory}
        matchedTimelines={matchedTimelines}
        slugBase="/breaking"
      />
      <SiteFooter />
    </div>
  );
}
