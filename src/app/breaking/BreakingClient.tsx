"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import type { NarrativeGap } from "@/lib/data";

const serif = "'Instrument Serif', Georgia, serif";
const mono = "'DM Mono', monospace";
const sans = "'DM Sans', system-ui, sans-serif";

const C = {
  bg: '#1e2a3a', panel: '#253545', panelDark: '#1a2535',
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
              <Dashboard stories={[story]} tilesOnly={true} />
            </ErrorBoundary>
          ) : firstThumb ? (
            <img src={firstThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
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
            <p style={{ fontFamily: sans, fontSize: 12, lineHeight: 1.6, color: C.dim, margin: 0 }}>
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
            <p style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.65, color: C.dim, margin: 0, maxWidth: 480 }}>
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

        {/* Tiles side */}
        <div style={{ flex: 6, minWidth: 0, position: 'relative', overflow: 'hidden' }} className="strip-tiles">
          <ErrorBoundary>
            <Dashboard stories={[story]} tilesOnly={true} />
          </ErrorBoundary>
        </div>
      </div>
    </a>
  );
}

/* ── Section header ──────────────────────────────────────────────── */
function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{ marginBottom: 14, display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <h2 style={{ fontFamily: serif, fontSize: 21, fontWeight: 400, color: C.text, margin: 0 }}>{label}</h2>
      {count !== undefined && (
        <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.1em', color: C.dim }}>
          {count} {count === 1 ? 'story' : 'stories'}
        </span>
      )}
    </div>
  );
}

/* ── Lay out stories with mixed horizontal/vertical rhythm ──────── */
function StoryGrid({ stories, raws, type }: {
  stories: NarrativeGap[]; raws: any[]; type: 'breaking' | 'live';
}) {
  const getRaw = (s: NarrativeGap, i: number) =>
    raws.find((r: any) => (r.topic || r.title) === s.topic) || raws[i];

  const elements: React.ReactNode[] = [];
  let i = 0;
  let block = 0;

  while (i < stories.length) {
    const remaining = stories.length - i;

    if (block % 2 === 0 && remaining >= 2) {
      // 2-wide card row
      elements.push(
        <div key={`row2-${i}`} style={{ display: 'flex', gap: 16 }} className="card-row">
          <StoryCard story={stories[i]} raw={getRaw(stories[i], i)} type={type} tall />
          <StoryCard story={stories[i + 1]} raw={getRaw(stories[i + 1], i + 1)} type={type} tall />
        </div>
      );
      i += 2;
    } else {
      // Full-width horizontal strip (text + tiles)
      elements.push(
        <StoryStrip key={`strip-${i}`} story={stories[i]} raw={getRaw(stories[i], i)} type={type} reverse={block % 4 === 3} />
      );
      i++;
    }
    block++;
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{elements}</div>;
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

  // Remaining stories for the grid
  const gridBreaking = heroFromBreaking ? allStories.slice(1) : allStories;
  const gridLive = heroFromBreaking ? liveStories : liveStories.slice(1);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .live-dot { animation: blink 1.3s ease-in-out infinite; }
        .hover-panel:hover { border-color: rgba(218,165,32,0.25) !important; }
        @media (max-width: 700px) {
          .card-row { flex-direction: column !important; }
          .strip-row { flex-direction: column !important; }
          .strip-text { padding: 16px 18px !important; }
          .strip-tiles { min-height: 160px !important; }
          .hero-meta-row { flex-wrap: wrap; }
        }
      `}} />

      <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: sans }}>
        <SiteNav isBreaking={true} />

        {/* ── HERO: first breaking story (full bleed) ─────── */}
        {heroStory && (<>
          <a href={`/breaking/${heroSlug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
              {/* Background */}
              {heroFirstThumb ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${heroFirstThumb})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: 'brightness(0.35) blur(2px)',
                }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, #7f1d1d22, ${C.panelDark})` }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30,42,58,1) 0%, rgba(30,42,58,0.45) 55%, rgba(30,42,58,0.1) 100%)' }} />

              <div style={{ position: 'relative', padding: '52px 28px 20px', maxWidth: 1120, margin: '0 auto' }}>
                {/* Badge row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }} className="hero-meta-row">
                  <Badge type={heroType} pulse />
                  {heroRaw?.detected_at && (
                    <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', color: C.dim }}>
                      {timeAgo(heroRaw.detected_at)}
                    </span>
                  )}
                  {heroTotalSources > 0 && (
                    <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', color: C.dim }}>
                      {heroTotalSources} sources covering this
                    </span>
                  )}
                  <CoverageStrip story={heroStory} />
                  <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: C.gold, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Follow live
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                  </span>
                </div>

                {/* Headline */}
                <h1 style={{
                  fontFamily: serif, fontSize: 'clamp(26px, 3.8vw, 42px)',
                  lineHeight: 1.12, color: C.text, fontWeight: 400,
                  margin: '0 0 14px', maxWidth: 760,
                }}>
                  {heroStory.topic}
                </h1>

                {/* Summary */}
                {heroStory.summary && (
                  <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.7, color: C.dim, maxWidth: 660, margin: '0 0 8px' }}>
                    {heroStory.summary.slice(0, 240)}{heroStory.summary.length > 240 ? '...' : ''}
                  </p>
                )}

                {/* Dashboard tiles */}
                {heroTotalClips > 0 && (
                  <div style={{ height: 180, borderRadius: 10, overflow: 'hidden', marginTop: 14 }}>
                    <Dashboard stories={[heroStory]} videoUrl={heroRaw?.breaking_short_url || undefined} tilesOnly={true} />
                  </div>
                )}
              </div>
            </div>
          </a>

          {/* X text tweets below hero */}
          {(() => {
            const xText = (heroStory.social_clips ?? []).filter((c: any) => c.platform === 'x' && !c.duration && c.embed_id);
            if (xText.length === 0) return null;
            return (
              <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: C.dim }}>𝕏 REACTIONS</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {xText.slice(0, 8).map((c: any, i: number) => (
                    <div key={i} style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', background: C.panelDark, height: 90 }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '125%', height: '125%', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                        <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${c.embed_id}&theme=dark&dnt=true`}
                          style={{ border: 'none', width: '100%', height: '100%' }} loading="lazy" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>)}

        {/* ── GRID: remaining stories ────────────────────── */}
        <main style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 16px 40px' }}>

          {gridBreaking.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <SectionHeader label="More Breaking" count={gridBreaking.length} />
              <StoryGrid stories={gridBreaking} raws={breakingItems} type="breaking" />
            </div>
          )}

          {gridLive.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <SectionHeader label="Live" count={gridLive.length} />
              <StoryGrid stories={gridLive} raws={liveNowItems} type="live" />
            </div>
          )}

        </main>

        <SiteFooter />
      </div>
    </>
  );
}
