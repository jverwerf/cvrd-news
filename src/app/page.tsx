export const revalidate = 3600;

import fs from 'fs';
import path from 'path';
import { getDailyGaps } from '@/lib/data';
import { getTimelineThreads } from '@/lib/timeline-data';
import type { NarrativeGap } from '@/lib/data';
import type { TimelineThread, ThreadEntry } from '@/lib/timeline-data';
import { StoryScroll } from './home/StoryScroll';
import { HeroCarousel } from './home/HeroCarousel';
import { BreakingCard } from './home/BreakingCard';
import { TimelineHomeCard } from '@/components/TimelineHomeCard';
import TheDivide from '@/components/TheDivide';
import { getRideSlugs } from '@/lib/ride-data';
import { TvTile } from './home/TvTile';
import { RollingClaim } from './home/RollingClaim';
import { SiteNav, SiteFooter } from '@/components/SiteNav';
import { editorialSlug } from '@/lib/onrecord-slug';
import { HorizontalAdBanner } from '@/components/AdBanners';
import { toSentence } from '@/lib/text';
import { CONTENT_MAX, CONTENT_GUTTER } from '@/lib/layout';

export const metadata = { alternates: { canonical: "/" } };

// ── helpers ──────────────────────────────────────────────────────
function toSlug(topic: string) {
  return topic.toLowerCase()
    .replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function ytThumb(id: string) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function catColor(cat?: string) {
  const map: Record<string, string> = {
    world: '#1d4ed8', politics: '#7c3aed', markets: '#047857',
    trending: '#b45309', sports: '#0e7490',
  };
  return map[cat ?? ''] ?? '#374151';
}
function catLabel(cat?: string) {
  const map: Record<string, string> = {
    world: 'World', politics: 'Politics', markets: 'Markets',
    trending: 'Trending', sports: 'Sports',
  };
  return map[cat ?? ''] ?? 'News';
}

async function getOnRecordToday(): Promise<any | null> {
  const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL;
  if (blobBase) {
    try {
      const resp = await fetch(`${blobBase}/politicians/onrecord_today.json`, { next: { revalidate: 3600 } });
      if (resp.ok) return await resp.json();
    } catch {}
  }
  try {
    const dir = path.resolve(process.cwd(), 'public/data');
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('onrecord_today_') && f.endsWith('.json'))
      .sort().reverse();
    if (!files.length) return null;
    return JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf8'));
  } catch { return null; }
}


// ── palette ───────────────────────────────────────────────────────
const C = {
  bg: '#3f5a80', panel: '#1e2d3d', panelDark: '#1a2535',
  gold: '#daa520', goldDim: 'rgba(218,165,32,0.14)', goldBorder: 'rgba(218,165,32,0.25)',
  left: '#60a5fa', leftDim: 'rgba(96,165,250,0.12)',
  right: '#f87171', rightDim: 'rgba(248,113,113,0.12)',
  text: '#e2e8f0', dim: '#7a8fa6', dimmer: '#4a5a6a',
  border: 'rgba(255,255,255,0.07)',
  // muted tones that sit directly on `bg` need to be lighter than the in-card
  // `dim`/`dimmer`, which are tuned against the much darker panel fills
  dimOnField: '#c5d3e3', dimmerOnField: '#a3b4c9',
};
const serif = `'Instrument Serif', Georgia, serif`;
const mono  = `'DM Mono', monospace`;

// ── components ────────────────────────────────────────────────────

// Fixed heights so there's no random/hydration mismatch in a server component
const WAVE_HEIGHTS = [58,42,72,55,80,63,48,76,60,85,70,44,66,82,54,71,59,77,50,88,64,73,53,81,61,46,74,66,49,72,83,54,67,76,58,87,51,71,44,63];

function ScoreWave({ score }: { score: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f87171', opacity: 0.7 }}>Less truthful</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#60a5fa', opacity: 0.7 }}>More truthful</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 28 }}>
        {WAVE_HEIGHTS.map((h, i) => {
          const pct = (i / WAVE_HEIGHTS.length) * 100;
          const barColor = pct < 35 ? '#f87171' : pct < 55 ? '#daa520' : '#60a5fa';
          const active = pct <= score;
          return (
            <div key={i} style={{
              flex: 1, borderRadius: 2,
              height: `${h}%`,
              background: active ? barColor : 'rgba(255,255,255,0.06)',
              opacity: active ? 0.75 : 0.25,
            }} />
          );
        })}
      </div>
    </div>
  );
}

function PlayIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 10 12" fill="rgba(255,255,255,0.9)">
      <polygon points="0,0 10,6 0,12" />
    </svg>
  );
}



// ── Story card ────────────────────────────────────────────────────
function StoryCard({ story }: { story: NarrativeGap }) {
  const slug = toSlug(story.topic);
  const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? '';
  const img = story.image_file;
  const imgUrl = img ? (img.startsWith('http') ? img : `${blobBase}${img}`) : null;
  const vids = story.youtube_videos ?? [];
  const firstVid = vids[0];

  return (
    <a href={`/story/${slug}`} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', background: C.panel, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }} className="story-card">
      {/* thumb: prefer story image, fall back to yt thumb */}
      <div style={{ height: 110, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
        {(imgUrl || firstVid)
          ? <img
              src={imgUrl ?? ytThumb(firstVid.embed_id)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
            />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${catColor(story.category)}30, ${C.panelDark})` }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(37,53,69,0.9) 0%, transparent 55%)' }} />
        {vids.length > 0 && (
          <span style={{ position: 'absolute', bottom: 7, right: 8, display: 'flex', alignItems: 'center', gap: 3, fontFamily: mono, fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>
            <PlayIcon size={6} />
            {vids.length} video{vids.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* text */}
      <div style={{ padding: '11px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontFamily: serif, fontSize: 14, lineHeight: 1.35, color: C.text, fontWeight: 400, margin: 0 }}>
          {story.topic}
        </h3>

      </div>
    </a>
  );
}

// ── Section header ────────────────────────────────────────────────
// No section title: each block already announces itself (red BREAKING chips,
// the ON RECORD label, the lean columns, the TV sets). The `label` is kept as
// the accessible name for the region rather than being drawn on the page.
function SectionHeader({ label, blurb, href, hrefText }: { label: string; blurb?: string; href: string; hrefText: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <h2 className="sr-only">{label}</h2>
      {blurb
        ? <p style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.06em', color: C.dimOnField, margin: 0, minWidth: 0 }}>{blurb}</p>
        : <span />}
      <a href={href} style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.1em', color: C.gold, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {hrefText}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
      </a>
    </div>
  );
}

// ── On Record card ────────────────────────────────────────────────
function OnRecordStrip({ data }: { data: any }) {
  const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? '';
  const person = data?.person;
  const photoUrl = person?.handle
    ? `${blobBase}/politicians/photo_${person.handle}.png`
    : null;
  const score: number = data?.overall_score ?? data?.topic_score ?? 0;
  const scoreColor = score >= 70 ? '#4ade80' : score >= 50 ? C.gold : score >= 35 ? '#f97316' : '#f87171';
  const edDate = (data?.generated_at || '').slice(0, 10);
  const edSlug = edDate && person?.handle
    ? editorialSlug(edDate, person.handle, data?.search_keyword)
    : null;
  const href = edSlug ? `/onrecord/today/${edSlug}` : '/onrecord/today';

  return (
    <a href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ background: C.panel, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', minHeight: 220 }} className="hover-panel strip-card">

        {/* LEFT — photo */}
        <div style={{ width: 200, flexShrink: 0, position: 'relative', overflow: 'hidden', background: C.panelDark }} className="strip-photo onrecord-photo">
          {photoUrl && (
            <img src={photoUrl} alt={person?.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', opacity: 0.85 }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, rgba(37,53,69,0.95) 100%)' }} className="strip-photo-fade-r" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,37,53,0.9) 0%, transparent 50%)' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
            <div style={{ fontFamily: serif, fontSize: 17, color: '#fff', lineHeight: 1.2 }}>{person?.name}</div>
            <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', marginTop: 4 }}>{person?.role}</div>
          </div>
        </div>

        {/* RIGHT — content */}
        <div style={{ flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="strip-right">

          {/* what is this */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
              On Record
            </div>
            <p style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.55, color: C.text, margin: 0, maxWidth: 520, fontWeight: 400 }} className="strip-main-text">
              Today we're covering{' '}
              <span style={{ fontStyle: 'italic' }}>{data?.story_topic}</span>
              {' '}and checking{' '}
              <span style={{ fontStyle: 'italic' }}>{person?.name}</span>
              's public claims for truthfulness.
            </p>
          </div>

          {/* score row */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <div style={{ fontFamily: serif, fontSize: 38, fontWeight: 700, color: scoreColor, lineHeight: 1 }} className="strip-score-num">{score}%</div>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', color: C.dim, textTransform: 'uppercase' }}>
                {data?.matching_claims ?? 0} claims verified
              </div>
            </div>
            <div style={{ maxWidth: 260 }}>
              <ScoreWave score={score} />
            </div>
          </div>

          {/* rolling claims */}
          {(data?.matched_tweets?.length ?? 0) > 0 && (
            <RollingClaim tweets={data.matched_tweets} topic={data.story_topic} />
          )}
        </div>

      </div>
    </a>
  );
}

// ── Timeline strip (mirrors OnRecordStrip) ────────────────────────
function TimelineStrip({ thread }: { thread: TimelineThread }) {
  const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? '';
  const img = thread.image_file ?? thread.entries[0]?.image_file;
  const imgUrl = img ? (img.startsWith('http') ? img : `${blobBase}${img}`) : null;
  // Entries newest-first
  const sorted = [...thread.entries].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const older  = sorted.slice(1, 5); // up to 4 previous entries

  return (
    <a href={`/timeline#${thread.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ background: C.panel, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', minHeight: 220 }} className="hover-panel">

        {/* LEFT — image */}
        <div style={{ width: 200, flexShrink: 0, position: 'relative', overflow: 'hidden', background: C.panelDark }}>
          {imgUrl
            ? <img src={imgUrl} alt={thread.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.8 }} />
            : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${catColor(thread.category)}30, ${C.panelDark})` }} />
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, rgba(37,53,69,0.95) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,37,53,0.9) 0%, transparent 50%)' }} />
        </div>

        {/* RIGHT — content */}
        <div style={{ flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>

          {/* header */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
              Timeline · Recently Updated
            </div>
            <p style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.4, color: C.text, margin: 0, fontWeight: 400 }} className="strip-title-text">
              {thread.title}
            </p>
          </div>

          {/* latest entry */}
          {latest && (
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', color: C.gold, textTransform: 'uppercase', marginBottom: 6 }}>
                Latest · {latest.date}
              </div>
              <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.55, color: 'rgba(226,232,240,0.85)' }}>
                "{toSentence(latest.summary, 180)}"
              </div>
            </div>
          )}

          {/* older entries mini-timeline */}
          {older.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
              {older.map((entry, i) => (
                <div key={entry.date + i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: i < older.length - 1 ? 10 : 0 }}>
                  {/* timeline line + dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.dimmer, flexShrink: 0 }} />
                    {i < older.length - 1 && <div style={{ width: 1, flex: 1, background: C.border, minHeight: 18, marginTop: 3 }} />}
                  </div>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.08em', color: C.dimmer, marginBottom: 2 }}>{entry.date}</div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: C.dim, lineHeight: 1.4 }}>
                      {toSentence(entry.summary, 100)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}


// ── Developing-stories rail ───────────────────────────────────────
// Fills the foot of the page, which sat empty once the columns ended at
// different heights. Uses the threads the Timeline card isn't currently on.
function ThreadRail({ threads, blobBase }: { threads: TimelineThread[]; blobBase: string }) {
  if (threads.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
      {threads.map(thread => {
        const img = thread.image_file ?? thread.entries.find(e => e.image_file)?.image_file;
        const imgUrl = img ? (img.startsWith('http') ? img : `${blobBase}${img}`) : null;
        const dates = thread.entries.map(e => e.date).filter(Boolean).sort();
        return (
          <a key={thread.id} href={`/timeline#${thread.id}`} className="story-card" style={{
            textDecoration: 'none', display: 'flex', flexDirection: 'column',
            background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden',
          }}>
            <div style={{ height: 110, position: 'relative', flexShrink: 0, background: C.panelDark, overflow: 'hidden' }}>
              {imgUrl && <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', opacity: 0.8 }} />}
            </div>
            <div style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim }}>
                {thread.entries.length} developments
                {dates.length > 1 ? ` · ${dates[0]} → ${dates[dates.length - 1]}` : ''}
              </span>
              <h3 style={{ fontFamily: serif, fontSize: 15, lineHeight: 1.25, color: C.text, fontWeight: 400, margin: 0 }}>
                {thread.title}
              </h3>
              {thread.summary && (
                <p style={{ fontFamily: mono, fontSize: 10, lineHeight: 1.5, color: C.dim, margin: 0 }}>
                  {toSentence(thread.summary, 120)}
                </p>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────
export default async function Home() {
  const [data, threadData, onRecordData, breakingStories, liveStories] = await Promise.all([
    getDailyGaps(),
    getTimelineThreads(),
    getOnRecordToday(),
    import('@/lib/breaking-store').then(m => m.getBreakingData()).catch(() => null),
    import('@/lib/live-now-store').then(m => m.getLiveNowData()).catch(() => null),
  ]);
  const hasClips = (s: any) =>
    (s.youtube_videos || []).length + (s.social_clips || []).filter((c: any) => c.duration).length >= 3;
  const isBreaking =
    (breakingStories ?? []).some(hasClips) || (liveStories ?? []).some(hasClips);

  const allStories = data?.top_narratives ?? [];
  const stories = allStories.filter(s => s.is_top_story).length >= 5
    ? allStories.filter(s => s.is_top_story)
    : allStories.slice(0, 10);

  const gridStories = stories.slice(1, 5);
  const allThreads   = threadData?.threads ?? [];
  const threadCount  = allThreads.length;
  // Most recently updated first
  const sortedThreads = [...allThreads].sort((a, b) => b.last_seen.localeCompare(a.last_seen));

  // the most recently moved thread that has a ride built for it leads the block
  // TimelineHomeCard only renders id/title/summary/one image/entry dates/first 3
  // clips per thread — full entries are ~10MB of serialized homepage payload.
  const homeThreads = sortedThreads.slice(0, 8).map(t => {
    let clipsKept = 0;
    const entries = t.entries.map((e, i) => {
      const slim: Partial<ThreadEntry> = { date: e.date };
      if (i === t.entries.length - 1) slim.image_file = e.image_file;
      if (clipsKept < 3 && e.youtube_videos?.length) {
        const keep = e.youtube_videos.slice(0, 3 - clipsKept);
        slim.youtube_videos = keep.map(v => ({ url: v.url, embed_id: v.embed_id }));
        clipsKept += keep.length;
      }
      return slim as ThreadEntry;
    });
    return { ...t, entries, gap_days: [] } as TimelineThread;
  });
  const homeRideSlugs = await getRideSlugs();
  const videoUrl   = data?.video_url;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .live-dot { animation: blink 1.3s ease-in-out infinite; }
        .hide-scroll { scrollbar-width: none; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .nav-pill:hover { color: rgba(226,232,240,0.9) !important; background: rgba(255,255,255,0.05); }
        .story-card:hover { border-color: rgba(218,165,32,0.3) !important; }
        .hover-panel:hover { border-color: rgba(218,165,32,0.2) !important; }
        .vid-thumb:hover img { opacity: 1 !important; }
        @media (max-width: 700px) {
          .story-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-vids   { flex-wrap: wrap; }
          .hero-vids a div { width: 160px !important; height: 90px !important; }
        }
        @media (max-width: 440px) {
          .story-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 601px) {
          .timeline-strip-wrap .strip-card { flex-direction: column !important; min-height: 0 !important; }
          .timeline-strip-wrap .strip-photo { width: 100% !important; height: 200px !important; flex-shrink: 0 !important; }
          .timeline-strip-wrap .strip-photo-fade-r { display: none !important; }
          .timeline-strip-wrap .strip-right { padding: 16px 20px !important; }
        }
        @media (max-width: 600px) {
          .pick-scroll { max-height: none !important; }
          .strip-card { flex-direction: column !important; min-height: auto !important; overflow: visible !important; }
          .strip-photo { width: 100% !important; height: 150px !important; flex-shrink: 0 !important; }
          .onrecord-photo { height: 400px !important; }
          .strip-photo-fade-r { display: none !important; }
          .strip-right { padding: 14px 16px !important; }
          .section-pad { padding-left: 0 !important; padding-right: 0 !important; }
          .breaking-live { display: none !important; }
          .home-cols { flex-direction: column !important; }
          .strip-main-text { font-size: 13px !important; line-height: 1.45 !important; }
          .strip-score-num { font-size: 26px !important; }
          .strip-title-text { font-size: 13px !important; }
        }
      `}} />

      <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        <SiteNav isBreaking={isBreaking} />

        {/* ── HERO — full bleed ─────────────────────────── */}
        {stories.length > 0 && (
          <div style={{ overflow: 'hidden' }}>
            <HeroCarousel stories={stories} blobBase={process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? ''} />
          </div>
        )}

        <main style={{ maxWidth: CONTENT_MAX, margin: '0 auto', padding: `16px ${CONTENT_GUTTER}px 40px` }}>

          {stories.length === 0 && (
            <div style={{ marginBottom: 24, padding: '60px 24px', borderRadius: 10, background: C.panel, textAlign: 'center', border: `1px solid ${C.border}` }}>
              <p style={{ color: C.dim, fontFamily: mono, fontSize: 11 }}>Today's stories loading...</p>
            </div>
          )}

          {/* ── BREAKING (left) | TODAY'S PICK + ON RECORD + TIMELINE (right) ── */}
          {stories.length > 0 && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'stretch' }} className="home-cols">
              {/* Left: Breaking (when live) + On Record + Timeline stacked */}
              <div style={{ flex: 6, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {isBreaking && (
                  <div>
                    <SectionHeader label="Breaking" blurb="" href="/breaking" hrefText="Open live" />
                    <BreakingCard
                      breakingItems={breakingStories ?? []}
                      liveItems={liveStories ?? []}
                      vertical
                    />
                  </div>
                )}
                {stories.length > 0 && (
                  <div>
                    <SectionHeader
                      label="The Divide"
                      blurb="The same story, opposite feeds"
                      href="/brief"
                      hrefText="All stories"
                    />
                    <TheDivide stories={allStories} row columnHeight={420} tweetHeight={250} tweetScale={0.62} />
                  </div>
                )}
                {sortedThreads.length > 0 && (
                  <div className="timeline-strip-wrap">
                    <SectionHeader
                      label="Timeline"
                      blurb={`Following ${threadCount} developing stories`}
                      href="/timeline"
                      hrefText={`All ${threadCount} threads`}
                    />
                    <TimelineHomeCard threads={homeThreads} rideSlugs={homeRideSlugs} />
                  </div>
                )}
              </div>

              {/* Right: Today's Pick + On Record + Watch */}
              {stories.length > 1 && (
                <div style={{ flex: 4, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <SectionHeader label="Today's Pick" href="/brief" hrefText="All stories" />
                  <StoryScroll
                    stories={allStories.slice(1)}
                    blobBase={process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? ''}
                    vertical
                    dividerAfter={stories.length - 1}
                    cappedHeight={780}
                  />
                  {/* On Record — between Today's Pick and Watch; marginTop
                      clears Today's Pick's down-scroll arrow */}
                  {onRecordData && (
                    <div style={{ marginTop: 28 }}>
                      <SectionHeader
                        label="On Record"
                        blurb={`Today: ${onRecordData.story_topic}`}
                        href="/onrecord"
                        hrefText="All politicians"
                      />
                      <OnRecordStrip data={onRecordData} />
                    </div>
                  )}
                  <div style={{ marginTop: 28 }}>
                    <SectionHeader label="Watch" blurb="Stream every story's video coverage in one non-stop loop" href="/tv" hrefText="Open CVRD TV" />
                    <div style={{ background: C.panel, borderRadius: 8, border: `1px solid ${C.border}`, padding: '20px 24px' }}>
                      <p style={{ fontFamily: serif, fontSize: 15, lineHeight: 1.65, color: C.text, margin: '0 0 8px', fontWeight: 400 }}>
                        Every story we cover comes with video clips from across the web. CVRD TV streams all of them in one non-stop loop across channels — Daily Pick, World, Politics, Markets, Sports, and Trending. Open it on a second screen, or cast it to your TV and let it run.
                      </p>
                      <p style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.06em', color: C.dim, margin: '0 0 20px', lineHeight: 1.6 }}>
                        Clips from YouTube, TikTok, Instagram Reels, X, and Telegram — all in one place.
                      </p>
                      {(() => {
                        const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? '';
                        const thumb = (s: any) => {
                          if (s.image_file) return s.image_file.startsWith('http') ? s.image_file : `${blobBase}${s.image_file}`;
                          if (s.youtube_videos?.[0]) return `https://img.youtube.com/vi/${s.youtube_videos[0].embed_id}/mqdefault.jpg`;
                          return null;
                        };
                        const thumbsFor = (cat: string | null) => {
                          const src = cat ? allStories.filter(s => s.category === cat) : allStories.slice(0, 10);
                          return src.map(thumb).filter(Boolean) as string[];
                        };
                        const breakingThumbs = (breakingStories ?? []).map(thumb).filter(Boolean) as string[];
                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                            {isBreaking && <TvTile channelNum="CH01" label="Breaking" sub="Live updates" href="/tv?channel=breaking" thumbs={breakingThumbs} isLive={true} interval={3100} />}
                            {[
                              { num: isBreaking ? '02' : '01', label: 'Daily Pick', sub: "Today's top 10",    href: '/tv?channel=daily',    cat: null,       ms: 4700 },
                              { num: isBreaking ? '03' : '02', label: 'World',      sub: 'Global affairs',    href: '/tv?channel=world',    cat: 'world',    ms: 3600 },
                              { num: isBreaking ? '04' : '03', label: 'Politics',   sub: 'Left & right',      href: '/tv?channel=politics', cat: 'politics', ms: 5200 },
                              { num: isBreaking ? '05' : '04', label: 'Markets',    sub: 'Economy & crypto',  href: '/tv?channel=markets',  cat: 'markets',  ms: 4100 },
                              { num: isBreaking ? '06' : '05', label: 'Sports',     sub: 'Beyond the score',  href: '/tv?channel=sports',   cat: 'sports',   ms: 3900 },
                              { num: isBreaking ? '07' : '06', label: 'Trending',   sub: 'What the web says', href: '/tv?channel=trending', cat: 'trending', ms: 5800 },
                            ].map(ch => (
                              <TvTile key={ch.href} channelNum={`CH${ch.num}`} label={ch.label} sub={ch.sub} href={ch.href} thumbs={thumbsFor(ch.cat)} interval={ch.ms} />
                            ))}
                            <TvTile channelNum="YT" label="YouTube" sub="Shorts + full shows" href="https://www.youtube.com/@cvrdnews" thumbs={thumbsFor(null)} interval={4400} />
                          </div>
                        );
                      })()}
                      <style>{`.tv-set:hover > div:first-child { border-color: rgba(218,165,32,0.4) !important; }`}</style>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Developing stories — fills the foot of the page */}
          {sortedThreads.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeader
                label="Developing stories"
                blurb={`Following ${threadCount} threads`}
                href="/timeline"
                hrefText={`All ${threadCount} threads`}
              />
              <ThreadRail threads={homeThreads.slice(1)} blobBase={process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? ''} />
            </div>
          )}

          <HorizontalAdBanner />

        </main>

        <SiteFooter />

      </div>
    </>
  );
}
