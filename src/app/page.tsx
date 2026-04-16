export const revalidate = 3600;

import fs from 'fs';
import path from 'path';
import { getDailyGaps } from '@/lib/data';
import { getTimelineThreads } from '@/lib/timeline-data';
import type { NarrativeGap } from '@/lib/data';
import type { TimelineThread } from '@/lib/timeline-data';
import { StoryScroll } from './home/StoryScroll';
import { HeroCarousel } from './home/HeroCarousel';
import { BreakingCard } from './home/BreakingCard';
import { TimelineCarousel } from './home/TimelineCarousel';
import { TvTile } from './home/TvTile';
import { RollingClaim } from './home/RollingClaim';
import { SiteNav, SiteFooter } from '@/components/SiteNav';
import { HorizontalAdBanner } from '@/components/AdBanners';

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
  bg: '#1e2a3a', panel: '#253545', panelDark: '#1a2535',
  gold: '#daa520', goldDim: 'rgba(218,165,32,0.14)', goldBorder: 'rgba(218,165,32,0.25)',
  left: '#60a5fa', leftDim: 'rgba(96,165,250,0.12)',
  right: '#f87171', rightDim: 'rgba(248,113,113,0.12)',
  text: '#e2e8f0', dim: '#7a8fa6', dimmer: '#4a5a6a',
  border: 'rgba(255,255,255,0.07)',
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
        <span style={{ position: 'absolute', top: 7, left: 8, padding: '2px 7px', borderRadius: 3, background: catColor(story.category), fontFamily: mono, fontSize: 8, letterSpacing: '0.1em', color: '#fff', textTransform: 'uppercase' }}>
          {catLabel(story.category)}
        </span>
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
function SectionHeader({ label, blurb, href, hrefText }: { label: string; blurb?: string; href: string; hrefText: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: blurb ? 4 : 0 }}>
        <h2 style={{ fontFamily: serif, fontSize: 19, fontWeight: 400, color: C.text, margin: 0 }}>{label}</h2>
        <a href={href} style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.1em', color: C.gold, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {hrefText}
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </a>
      </div>
      {blurb && <p style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.06em', color: C.dim, margin: 0 }}>{blurb}</p>}
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
  const personSlug = person?.name
    ? person.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : null;
  const href = personSlug ? `/onrecord/${personSlug}` : '/onrecord';

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
          <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
            <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 3, background: catColor(thread.category), fontFamily: mono, fontSize: 8, letterSpacing: '0.1em', color: '#fff', textTransform: 'uppercase' }}>
              {catLabel(thread.category)}
            </span>
          </div>
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
                "{latest.summary?.slice(0, 180)}{(latest.summary?.length ?? 0) > 180 ? '...' : ''}"
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
                      {entry.summary?.slice(0, 100)}{(entry.summary?.length ?? 0) > 100 ? '...' : ''}
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

        <main style={{ maxWidth: 1120, margin: '0 auto', padding: '16px 16px 40px' }}>

          {stories.length === 0 && (
            <div style={{ marginBottom: 24, padding: '60px 24px', borderRadius: 10, background: C.panel, textAlign: 'center', border: `1px solid ${C.border}` }}>
              <p style={{ color: C.dim, fontFamily: mono, fontSize: 11 }}>Today's stories loading...</p>
            </div>
          )}

          {/* ── BREAKING (left) | TODAY'S PICK + ON RECORD + TIMELINE (right) ── */}
          {isBreaking && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'stretch' }} className="home-cols">
              {/* Left: Breaking + On Record + Timeline stacked */}
              <div style={{ flex: 6, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <SectionHeader label="Breaking" blurb="" href="/breaking" hrefText="Open live" />
                  <BreakingCard
                    breakingItems={breakingStories ?? []}
                    liveItems={liveStories ?? []}
                    vertical
                  />
                </div>
                {onRecordData && (
                  <div>
                    <SectionHeader
                      label="On Record"
                      blurb={`Today: ${onRecordData.story_topic}`}
                      href="/onrecord"
                      hrefText="All politicians"
                    />
                    <OnRecordStrip data={onRecordData} />
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
                    <TimelineCarousel threads={sortedThreads} blobBase={process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? ''} />
                  </div>
                )}
              </div>

              {/* Right: Today's Pick + Watch */}
              {stories.length > 1 && (
                <div style={{ flex: 4, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <SectionHeader label="Today's Pick" href="/brief" hrefText="All stories" />
                  <StoryScroll
                    stories={allStories.slice(1)}
                    blobBase={process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? ''}
                    vertical
                    dividerAfter={stories.length - 1}
                    cappedHeight={600}
                  />
                  {/* Watch — below Today's Pick; marginTop clears the down-scroll arrow */}
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
                            <TvTile channelNum="CH01" label="Breaking" sub="Live updates" href="/breaking" thumbs={breakingThumbs} isLive={true} interval={3100} />
                            {[
                              { num: '02', label: 'Daily Pick', sub: "Today's top 10",    href: '/tv?channel=daily',    cat: null,       ms: 4700 },
                              { num: '03', label: 'World',      sub: 'Global affairs',    href: '/tv?channel=world',    cat: 'world',    ms: 3600 },
                              { num: '04', label: 'Politics',   sub: 'Left & right',      href: '/tv?channel=politics', cat: 'politics', ms: 5200 },
                              { num: '05', label: 'Markets',    sub: 'Economy & crypto',  href: '/tv?channel=markets',  cat: 'markets',  ms: 4100 },
                              { num: '06', label: 'Sports',     sub: 'Beyond the score',  href: '/tv?channel=sports',   cat: 'sports',   ms: 3900 },
                              { num: '07', label: 'Trending',   sub: 'What the web says', href: '/tv?channel=trending', cat: 'trending', ms: 5800 },
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

          {/* ── TODAY'S PICK — horizontal row when no breaking ── */}
          {!isBreaking && stories.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeader label="Today's Pick" href="/brief" hrefText="All stories" />
              <StoryScroll
                stories={allStories.slice(1)}
                blobBase={process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? ''}
                dividerAfter={stories.length - 1}
              />
            </div>
          )}

          {/* ── WATCH — right after Today's Pick (non-breaking only; breaking puts it in the right column) ─── */}
          {!isBreaking && <div style={{ marginBottom: 20 }}>
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
                    {isBreaking && <TvTile channelNum="CH01" label="Breaking" sub="Live updates" href="/breaking" thumbs={breakingThumbs} isLive={true} interval={3100} />}
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
          </div>}

          {/* ── ON RECORD — full width when no breaking ── */}
          {!isBreaking && onRecordData && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeader
                label="On Record"
                blurb={`Today: ${onRecordData.story_topic}`}
                href="/onrecord"
                hrefText="All politicians"
              />
              <OnRecordStrip data={onRecordData} />
            </div>
          )}

          {/* ── TIMELINE — full width when no breaking ── */}
          {!isBreaking && sortedThreads.length > 0 && (
            <div style={{ marginBottom: 20 }} className="timeline-strip-wrap">
              <SectionHeader
                label="Timeline"
                blurb={`Following ${threadCount} developing stories`}
                href="/timeline"
                hrefText={`All ${threadCount} threads`}
              />
              <TimelineCarousel threads={sortedThreads} blobBase={process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? ''} />
            </div>
          )}

          <HorizontalAdBanner />

        </main>

        <SiteFooter />

      </div>
    </>
  );
}
