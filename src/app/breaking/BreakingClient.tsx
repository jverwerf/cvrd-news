"use client";

import { Fragment, useEffect, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { SidePanel } from "@/components/TheDivide";
import { HeroDuo, BODY } from "@/components/HeroDuo";
import { StoryFiller, clipCount } from "@/components/StoryFiller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import type { NarrativeGap } from "@/lib/data";
import { toSentence } from '@/lib/text';
import { CONTENT_MAX, CONTENT_GUTTER } from '@/lib/layout';

const serif = "'Instrument Serif', Georgia, serif";
const mono = "'DM Mono', monospace";
const sans = "'DM Sans', system-ui, sans-serif";

const C = {
  bg: '#3f5a80', panel: '#1e2d3d', panelDark: '#1a2535',
  gold: '#daa520', goldBorder: 'rgba(218,165,32,0.25)',
  text: '#e2e8f0', dim: '#7a8fa6', dimmer: '#4a5a6a',
  border: 'rgba(255,255,255,0.07)',
};

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


function timeAgo(dateStr: string): string {
  const mins = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  return mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
}

function toSlug(topic: string) {
  return topic.toLowerCase()
    .replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function ytThumb(id: string) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function CoverageStrip({ story }: { story: NarrativeGap }) {
  if ((story as any).category === 'sports' || (story as any).category === 'trending') return null;
  const sources = story.sources ?? [];
  const left = sources.filter(s => s.lean === 'left').length;
  const right = sources.filter(s => s.lean === 'right').length;
  const center = sources.filter(s => !s.lean || s.lean === 'center').length;
  if (left + center + right === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 9 }}>
      {left > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#1d4ed8' }} /><span style={{ color: '#60a5fa' }}>{left}</span></span>}
      {center > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#999' }} /><span style={{ color: '#bbb' }}>{center}</span></span>}
      {right > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#b91c1c' }} /><span style={{ color: '#f87171' }}>{right}</span></span>}
    </div>
  );
}

/* ── Badge ──────────────────────────────────────────────────────── */
function Badge({ type, pulse }: { type: 'breaking' | 'live'; pulse?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 3,
      background: type === 'breaking' ? '#dc2626' : '#1d4ed8',
      fontFamily: mono, fontSize: 9, letterSpacing: '0.1em',
      color: '#fff', textTransform: 'uppercase', fontWeight: 700,
    }}>
      {pulse && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} className="live-dot" />}
      {type === 'breaking' ? 'BREAKING' : 'LIVE'}
    </span>
  );
}

/* ── Card: used in 2-col and 3-col rows ─────────────────────────── */
function StoryCard({ story, raw, type, tall }: {
  story: NarrativeGap; raw: any; type: 'breaking' | 'live'; tall?: boolean;
}) {
  const slug = toSlug(story.topic);
  const ytVids = story.youtube_videos ?? [];
  const firstThumb = story.image_file || (ytVids[0] ? ytThumb(ytVids[0].embed_id) : null);
  const totalClips = ytVids.length + (story.social_clips ?? []).filter(c => c.duration).length;

  return (
    <a href={`/breaking/${slug}`} style={{ textDecoration: 'none', display: 'block', flex: 1, minWidth: 0 }}>
      <div className="hover-panel" style={{
        background: C.panel, borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${C.border}`, height: '100%',
        display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s',
      }}>
        {/* Video tiles */}
        <div style={{ position: 'relative', height: tall ? 200 : 160, flexShrink: 0, overflow: 'hidden' }}>
          {totalClips > 0 ? (
            <ErrorBoundary>
              <Dashboard stories={[story]} tilesOnly={true} tilesCount={Math.min(4, totalClips)} />
            </ErrorBoundary>
          ) : firstThumb ? (
            <img src={firstThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
          ) : story.summary ? (
            <StoryFiller story={story} compact />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${type === 'breaking' ? '#7f1d1d' : '#1d4ed8'}25, ${C.panelDark})` }} />
          )}
          <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
            <Badge type={type} pulse={type === 'breaking'} />
          </div>
          {raw?.detected_at && (
            <span style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
              {timeAgo(raw.detected_at)}
            </span>
          )}
        </div>

        {/* Text */}
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontFamily: serif, fontSize: tall ? 18 : 15, lineHeight: 1.3, color: C.text, fontWeight: 400, margin: '0 0 8px' }}>
            {story.topic}
          </h3>
          {story.summary && (
            <p style={{ ...BODY, color: C.dim, margin: 0 }}>
              {story.summary.slice(0, tall ? 140 : 90)}{story.summary.length > (tall ? 140 : 90) ? '...' : ''}
            </p>
          )}
          <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            {totalClips > 0 && (
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', color: C.dimmer }}>
                {totalClips} clips
              </span>
            )}
            <CoverageStrip story={story} />
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: C.gold, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              Follow live
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

/* ── Horizontal strip: text left, tiles right (or vice versa) ──── */
function StoryStrip({ story, raw, type, reverse }: {
  story: NarrativeGap; raw: any; type: 'breaking' | 'live'; reverse?: boolean;
}) {
  const slug = toSlug(story.topic);
  const totalClips = (story.youtube_videos ?? []).length + (story.social_clips ?? []).filter(c => c.duration).length;

  return (
    <a href={`/breaking/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="hover-panel strip-row" style={{
        background: C.panel, borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${C.border}`, display: 'flex',
        flexDirection: reverse ? 'row-reverse' : 'row',
        minHeight: 200, transition: 'border-color 0.2s',
      }}>
        {/* Text side */}
        <div style={{ flex: 4, padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="strip-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Badge type={type} pulse={type === 'breaking'} />
            {raw?.detected_at && (
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: C.dimmer }}>
                {timeAgo(raw.detected_at)}
              </span>
            )}
          </div>
          <h3 style={{ fontFamily: serif, fontSize: 22, lineHeight: 1.25, color: C.text, fontWeight: 400, margin: '0 0 10px' }}>
            {story.topic}
          </h3>
          {story.summary && (
            <p style={{ ...BODY, color: C.dim, margin: 0, maxWidth: 480 }}>
              {story.summary.slice(0, 180)}{story.summary.length > 180 ? '...' : ''}
            </p>
          )}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            {totalClips > 0 && (
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', color: C.dimmer }}>
                {totalClips} clips
              </span>
            )}
            <CoverageStrip story={story} />
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: C.gold, display: 'flex', alignItems: 'center', gap: 4 }}>
              Follow live
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </div>
        </div>

        {/* Tiles side. No clips means the wall would just repeat the one still
            image, so show the reporting instead. */}
        <div style={{ flex: 6, minWidth: 0, position: 'relative', overflow: 'hidden' }} className="strip-tiles">
          {clipCount(story) > 0 ? (
            <ErrorBoundary>
              <Dashboard stories={[story]} tilesOnly={true} tilesCount={Math.min(4, clipCount(story))} />
            </ErrorBoundary>
          ) : (
            <StoryFiller story={story} />
          )}
        </div>
      </div>
    </a>
  );
}

/* ── Section header ──────────────────────────────────────────────── */
// No visible title: the red BREAKING and LIVE chips on the cards already say
// which block is which. The label stays as the region's accessible name.
function SectionHeader({ label }: { label: string; count?: number }) {
  return <h2 className="sr-only">{label}</h2>;
}

/* ── Fit as many blocks as the box allows ────────────────────────── */
// Renders whichever leading blocks fit the container in full and drops the
// rest, so a fixed-height panel fills itself rather than being cut mid-sentence
// or scrolled. Measures with everything mounted, then trims.
/* ── Lay out stories two-up, with a lone leftover run full width ── */
type GridItem = { story: NarrativeGap; raw: any; type: 'breaking' | 'live' };

function StoryGrid({ items }: { items: GridItem[] }) {
  const rows: React.ReactNode[] = [];
  // Pair stories side by side; an odd one left at the end gets the full-width
  // strip rather than sitting alone in a half-width column.
  for (let i = 0; i < items.length; i += 2) {
    const a = items[i];
    const b = items[i + 1];
    if (!b) {
      rows.push(<StoryStrip key={`strip-${i}`} story={a.story} raw={a.raw} type={a.type} />);
      break;
    }
    rows.push(
      <div key={`row-${i}`} style={{ display: 'flex', gap: 4 }} className="card-row">
        <StoryCard story={a.story} raw={a.raw} type={a.type} tall />
        <StoryCard story={b.story} raw={b.raw} type={b.type} tall />
      </div>
    );
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{rows}</div>;
}

type LiveNowItem = any;

export default function BreakingClient({ initialData, initialLiveNow }: { initialData: any[]; initialLiveNow: LiveNowItem[] }) {
  const [breakingItems, setBreakingItems] = useState<any[]>(initialData);
  const [liveNowItems, setLiveNowItems] = useState<LiveNowItem[]>(initialLiveNow);


  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/breaking/data')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || (Array.isArray(data) && data.length === 0)) return;
          const items = Array.isArray(data) ? data : [data];
          items.sort((a: any, b: any) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
          setBreakingItems(items);
        })
        .catch(() => {});
      fetch('/api/live-now/data')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || (Array.isArray(data) && data.length === 0)) return;
          setLiveNowItems(Array.isArray(data) ? data : [data]);
        })
        .catch(() => {});
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const allStories = breakingItems.map(toNarrativeGap).filter(s => {
    const videoClips = (s.youtube_videos || []).length + (s.social_clips || []).filter(c => c.duration).length;
    return videoClips >= 3;
  });

  const topicWords = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  const isSameStory = (a: string, b: string) => {
    const aw = topicWords(a); const bw = topicWords(b);
    const shorter = aw.length <= bw.length ? aw : bw;
    const longer = aw.length <= bw.length ? bw : aw;
    return shorter.filter(w => longer.includes(w)).length / shorter.length >= 0.7;
  };
  const breakingTopics = allStories.map(s => s.topic || '');
  const liveStories = liveNowItems.map(toNarrativeGap).filter(s => {
    const videoClips = (s.youtube_videos || []).length + (s.social_clips || []).filter((c: any) => c.duration).length;
    return videoClips >= 3 && !breakingTopics.some(bt => isSameStory(s.topic || '', bt));
  });

  if (allStories.length === 0 && liveStories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="text-center">
          <p className="text-white/50 mb-2">Breaking news is being verified...</p>
          <p className="text-white/30 text-[12px]">Stories appear once we have enough video sources.</p>
          <a href="/brief" className="text-[13px] mt-4 inline-block" style={{ color: C.gold }}>Back to Daily Cover</a>
        </div>
      </div>
    );
  }

  // Hero = first breaking; fall back to first live when no breaking
  const heroFromBreaking = allStories.length > 0;
  const heroStory = heroFromBreaking ? allStories[0] : liveStories[0];
  const heroType: 'breaking' | 'live' = heroFromBreaking ? 'breaking' : 'live';
  const heroRaws = heroFromBreaking ? breakingItems : liveNowItems;
  const heroRaw = heroStory ? heroRaws.find((bi: any) => bi.topic === heroStory.topic) || heroRaws[0] : null;
  const heroSlug = heroStory ? toSlug(heroStory.topic) : '';
  const heroYtVids = heroStory?.youtube_videos ?? [];
  const heroFirstThumb = heroStory?.image_file || (heroYtVids[0] ? ytThumb(heroYtVids[0].embed_id) : null);
  const heroTotalSources = heroStory ? (heroStory.sources ?? []).length : 0;
  const heroTotalClips = heroStory ? heroYtVids.length + (heroStory.social_clips ?? []).filter(c => c.duration).length : 0;

  const rawFor = (pool: any[], story: NarrativeGap, i: number) =>
    pool.find((r: any) => (r.topic || r.title) === story.topic) || pool[i];

  // Breaking first, then live, in one ordered list. The hero takes the top two
  // and the grid gets everything after them.
  const allItems: GridItem[] = [
    ...allStories.map((story, i) => ({ story, raw: rawFor(breakingItems, story, i), type: 'breaking' as const })),
    ...liveStories.map((story, i) => ({ story, raw: rawFor(liveNowItems, story, i), type: 'live' as const })),
  ];
  const heroItems = allItems.slice(0, 2);
  const gridItems: GridItem[] = allItems.slice(2);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .live-dot { animation: blink 1.3s ease-in-out infinite; }
        .hover-panel:hover { border-color: rgba(218,165,32,0.25) !important; }
        .hide-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
        .divide-col-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .divide-col-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
        @media (max-width: 700px) {
          .xreact-row { flex-direction: column !important; }
          .xreact-vs { display: none !important; }
          .card-row { flex-direction: column !important; }
          .strip-row { flex-direction: column !important; }
          .strip-text { padding: 16px 18px !important; }
          .strip-tiles { min-height: 160px !important; }
          .hero-meta-row { flex-wrap: wrap; }
          .hero-row { flex-direction: column !important; height: auto !important; }
          .hero-slab { width: 100% !important; padding: 14px 16px !important; }
          .hero-row { flex-direction: column !important; }
          .hero-unit { flex-direction: column !important; }
          .hero-tiles { flex: none !important; width: 100% !important; height: 320px !important; }
        }
      `}} />

      <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: sans }}>
        <SiteNav isBreaking={true} />

        {/* ── HERO: first breaking story (full bleed) ─────── */}
        {heroStory && (<>
          <div style={{ padding: `20px ${CONTENT_GUTTER}px 4px`, maxWidth: CONTENT_MAX, margin: '0 auto' }}>
            <HeroDuo
              bgThumb={heroFirstThumb}
              items={heroItems.map((item, i) => ({
                story: item.story,
                href: `/breaking/${toSlug(item.story.topic)}`,
                badge: <Badge type={item.type} pulse />,
                meta: item.raw?.detected_at ? timeAgo(item.raw.detected_at) : undefined,
                readLabel: 'Follow live',
                videoUrl: i === 0 ? (heroRaw?.breaking_short_url || undefined) : undefined,
              }))}
            />
          </div>

          {/* X text tweets below hero, in The Divide's lean columns */}
          {(() => {
            const xText = (heroStory.social_clips ?? []).filter((c: any) => c.platform === 'x' && !c.duration && c.embed_id);
            if (xText.length === 0) return null;
            const byLean: Record<'left' | 'center' | 'right', any[]> = { left: [], center: [], right: [] };
            for (const c of xText) byLean[c.lean === 'left' || c.lean === 'right' ? c.lean : 'center'].push(c);
            const leans = (['left', 'center', 'right'] as const).filter(l => byLean[l].length > 0);
            // Mixed leans → one column per lean with the VS framing. A single
            // lean (common on breaking, where most reactions are wire accounts)
            // still fills the row: its posts split across columns instead.
            let columns: { side: 'left' | 'center' | 'right'; clips: any[] }[];
            const vs = leans.length > 1;
            if (vs) {
              columns = leans.map(l => ({ side: l, clips: byLean[l] }));
            } else {
              const clips = byLean[leans[0]];
              const n = Math.min(3, Math.max(1, Math.ceil(clips.length / 2)));
              columns = Array.from({ length: n }, (_, i) => ({ side: leans[0], clips: clips.filter((_: any, j: number) => j % n === i) }));
            }
            return (
              <div style={{ maxWidth: CONTENT_MAX, margin: '0 auto', padding: `4px ${CONTENT_GUTTER}px 4px` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: C.dim }}>𝕏 REACTIONS</span>
                </div>
                <div className="xreact-row" style={{ display: 'flex', gap: 8 }}>
                  {columns.map((col, i) => (
                    <Fragment key={i}>
                      {vs && i > 0 && (
                        <div className="xreact-vs" style={{ display: 'flex', alignItems: 'center', alignSelf: 'center', flexShrink: 0, fontSize: 13, fontWeight: 900, color: C.gold }}>VS</div>
                      )}
                      <SidePanel clips={col.clips} side={col.side} height={340} />
                    </Fragment>
                  ))}
                </div>
              </div>
            );
          })()}
        </>)}

        {/* ── GRID: remaining stories ────────────────────── */}
        <main style={{ maxWidth: CONTENT_MAX, margin: '0 auto', padding: `4px ${CONTENT_GUTTER}px 32px` }}>

          {/* Breaking and live share one grid so they pair up across the row;
              each card carries its own BREAKING or LIVE chip. */}
          {gridItems.length > 0 && (
            <>
              <SectionHeader label="More breaking and live" />
              <StoryGrid items={gridItems} />
            </>
          )}

        </main>

        <SiteFooter />
      </div>
    </>
  );
}
