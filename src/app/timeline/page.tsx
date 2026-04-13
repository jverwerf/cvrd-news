export const revalidate = 86400; // 24 hours — timeline content is static

import type { Metadata } from "next";
import { getDailyGaps } from "@/lib/data";
import { getTimelineThreads, getTodayLastYear, getTodayTenYearsAgo } from "@/lib/timeline-data";
import { LiveBanner } from "@/components/LiveBanner";
import { SiteNav } from "@/components/SiteNav";
import { TimelineContent } from "./TimelineClient";

export async function generateMetadata(): Promise<Metadata> {
  const threadData = await getTimelineThreads();
  const threads = threadData?.threads || [];
  const threadTitles = threads.slice(0, 5).map(t => t.title).join(', ');
  const description = threads.length > 0
    ? `Follow ${threads.length} developing stories: ${threadTitles}. See how each narrative evolves day by day with video evidence from trusted sources.`
    : 'Track ongoing stories across days. See how narratives evolve over time with video evidence.';

  return {
    title: 'Timeline — Catch Me Up',
    description,
    alternates: { canonical: '/timeline' },
    openGraph: {
      title: 'CVRD Timeline — Catch Me Up on the News',
      description,
      url: 'https://cvrdnews.com/timeline',
      type: 'website',
      images: [{ url: '/logo_new.jpg', width: 1024, height: 559, alt: 'CVRD News Timeline' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'CVRD Timeline — Catch Me Up',
      description,
      images: ['/logo_new.jpg'],
    },
  };
}

async function hasBreakingNews(): Promise<boolean> {
  try {
    const { hasBreakingData } = await import('@/lib/breaking-store');
    return await hasBreakingData();
  } catch { return false; }
}

export default async function TimelinePage() {
  const [data, threadData, lastYearData, tenYearsData, isBreaking] = await Promise.all([
    getDailyGaps(),
    getTimelineThreads(),
    getTodayLastYear(),
    getTodayTenYearsAgo(),
    hasBreakingNews(),
  ]);

  const allStories = data?.top_narratives || [];
  const top10 = allStories.filter(s => s.is_top_story).length >= 10
    ? allStories.filter(s => s.is_top_story)
    : allStories.slice(0, 10);

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      <SiteNav isBreaking={isBreaking} />
      {data && <LiveBanner stories={top10} liveData={data.live_data} />}

      {/* JSON-LD structured data for search engines */}
      {threadData && threadData.threads.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'CVRD Timeline — Catch Me Up',
          description: `Follow ${threadData.threads.length} developing stories as they unfold day by day.`,
          url: 'https://cvrdnews.com/timeline',
          publisher: { '@type': 'NewsMediaOrganization', name: 'CVRD News', url: 'https://cvrdnews.com' },
          dateModified: threadData.generated_at,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: threadData.threads.length,
            itemListElement: threadData.threads.map((t, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'NewsArticle',
                headline: t.title,
                description: t.summary,
                datePublished: t.first_seen,
                dateModified: t.last_seen,
                articleSection: t.category,
                publisher: { '@type': 'NewsMediaOrganization', name: 'CVRD News' },
              },
            })),
          },
        }) }} />
      )}

      {/* CONTENT */}
      {!threadData || threadData.threads.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-[#999] text-[15px] mb-2">No active threads yet.</p>
            <p className="text-[#666] text-[12px]">Threads appear when stories span multiple days.</p>
            <a href="/brief" className="inline-block mt-6 px-4 py-2 text-[12px] font-semibold rounded-md"
              style={{ background: '#253545', color: '#daa520', border: '1px solid rgba(184,134,11,0.3)' }}>
              Back to today's stories
            </a>
          </div>
        </div>
      ) : (
        <>
          <TimelineContent threads={threadData.threads} generatedAt={threadData.generated_at} lastYear={lastYearData} tenYearsAgo={tenYearsData} />

          {/* Server-rendered content for SEO — visually hidden, crawlable */}
          <div className="sr-only" aria-hidden="false">
            <h1>CVRD News Timeline — Catch Me Up</h1>
            <p>Track {threadData.threads.length} developing stories as they evolve day by day with video evidence from trusted news sources.</p>
            {threadData.threads.map(thread => (
              <article key={thread.id}>
                <h2>{thread.title}</h2>
                <p>Category: {thread.category} | {thread.first_seen} to {thread.last_seen} | {thread.days_covered} days covered</p>
                <p>{thread.summary}</p>
                {thread.entries.map((entry, i) => (
                  <section key={i}>
                    <h3>{entry.date}: {entry.topic}</h3>
                    <p>{entry.summary}</p>
                    {entry.youtube_videos?.map((v, j) => (
                      <a key={j} href={v.url || `https://youtube.com/watch?v=${v.embed_id}`}>
                        Watch: {v.channel} coverage
                      </a>
                    ))}
                  </section>
                ))}
              </article>
            ))}
            {lastYearData && (
              <article>
                <h2>Last Year Today — {lastYearData.date_last_year}</h2>
                <p>{lastYearData.summary}</p>
              </article>
            )}
          </div>
        </>
      )}

      {/* FOOTER */}
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
