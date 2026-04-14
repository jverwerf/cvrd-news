import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryPage } from "@/components/StoryPage";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { getDailyGaps } from "@/lib/data";
import { getTimelineThreads } from "@/lib/timeline-data";

export const revalidate = 86400; // 24 hours — stories don't change once published

function topicToSlug(topic: string): string {
  return topic.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

async function getStory(slug: string) {
  const BLOB_BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';

  // Build list of dates to check: today + last 7 days
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(Date.now() - i * 86400000).toISOString().split('T')[0]);
  }

  // Search Blob (production)
  if (BLOB_BASE) {
    for (const date of dates) {
      try {
        const resp = await fetch(`${BLOB_BASE}/data/daily_gaps_${date}.json`, { next: { revalidate: 86400 } });
        if (!resp.ok) continue;
        const data = await resp.json();
        const all = data.top_narratives || [];
        const idx = all.findIndex((s: any) => topicToSlug(s.topic) === slug);
        if (idx !== -1) {
          const story = all[idx];
          const prevStory = idx > 0 ? all[idx - 1] : all[all.length - 1];
          const nextStory = idx < all.length - 1 ? all[idx + 1] : all[0];
          const otherStories = all.filter((s: any) => topicToSlug(s.topic) !== slug).slice(0, 5);
          return { story, date, otherStories, prevStory, nextStory };
        }
      } catch {}
    }
  }

  // Fallback: local public/data (dev only)
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataDir = path.resolve(process.cwd(), 'public/data');
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir)
        .filter((f: string) => f.startsWith('daily_gaps_') && f.endsWith('.json'))
        .sort().reverse();
      for (const f of files) {
        const date = f.replace('daily_gaps_', '').replace('.json', '');
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
          const all = data.top_narratives || [];
          const idx = all.findIndex((s: any) => topicToSlug(s.topic) === slug);
          if (idx !== -1) {
            const story = all[idx];
            const prevStory = idx > 0 ? all[idx - 1] : all[all.length - 1];
            const nextStory = idx < all.length - 1 ? all[idx + 1] : all[0];
            const otherStories = all.filter((s: any) => topicToSlug(s.topic) !== slug).slice(0, 5);
            return { story, date, otherStories, prevStory, nextStory };
          }
        } catch {}
      }
    }
  } catch {}

  return null;
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

export default async function StoryRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getStory(slug);
  if (!result) notFound();

  const { story, date, otherStories, prevStory, nextStory } = result;

  // Enrich onrecord_matches with role from blob score files
  const BLOB_BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';
  const onrecordMatches: any[] = (story as any).onrecord_matches || [];
  if (onrecordMatches.length > 0) {
    await Promise.all(onrecordMatches.map(async (m: any) => {
      try {
        const resp = await fetch(`${BLOB_BASE}/politicians/score_${m.handle}.json`, { next: { revalidate: 86400 } });
        if (resp.ok) {
          const s = await resp.json();
          m.role = s.role || null;
          m.overall_score = s.overall_score ?? null;
        }
      } catch {}
    }));
  }

  // Look up the thread this story explicitly belongs to (stamped by thread-detector)
  const threadId = (story as any).thread_id;
  let matchedTimelines: { id: string; title: string; image_file?: string }[] = [];
  if (threadId) {
    const timelineData = await getTimelineThreads();
    const thread = (timelineData?.threads || []).find((t: any) => t.id === threadId);
    if (thread) matchedTimelines = [{ id: thread.id, title: thread.title, image_file: thread.image_file }];
  }

  const isBreaking = await import('@/lib/breaking-store').then(m => m.hasBreakingData()).catch(() => false);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.topic,
    description: (story.summary || '').slice(0, 200),
    image: story.image_file ? [story.image_file.startsWith('http') ? story.image_file : `https://cvrdnews.com${story.image_file}`] : [],
    datePublished: date,
    dateModified: date,
    author: { '@type': 'Organization', name: 'CVRD News', url: 'https://cvrdnews.com' },
    publisher: { '@type': 'Organization', name: 'CVRD News', logo: { '@type': 'ImageObject', url: 'https://cvrdnews.com/logo3.png' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://cvrdnews.com/story/${slug}` },
  };

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteNav isBreaking={isBreaking} />
      <StoryPage story={story} date={date} otherStories={otherStories} prevStory={prevStory} nextStory={nextStory} matchedTimelines={matchedTimelines} />
      <SiteFooter />
    </div>
  );
}
