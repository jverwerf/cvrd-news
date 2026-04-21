'use client';

import { useRef } from 'react';

const C = {
  panel: '#253545', panelDark: '#1a2535',
  gold: '#daa520', border: 'rgba(255,255,255,0.07)',
  text: '#e2e8f0', dim: '#7a8fa6', dimmer: '#4a5a6a',
};
const serif = `'Instrument Serif', Georgia, serif`;
const mono  = `'DM Mono', monospace`;

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
function ytThumb(id: string) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
function toSlug(topic: string) {
  return topic.toLowerCase()
    .replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export type StoryItem = {
  topic: string;
  category?: string;
  image_file?: string;
  summary?: string;
  youtube_videos?: { embed_id: string; channel?: string }[];
  sources?: { lean?: string }[];
};

function coverageCounts(story: StoryItem) {
  const sources = story.sources ?? [];
  const left = sources.filter(s => s.lean === 'left').length;
  const right = sources.filter(s => s.lean === 'right').length;
  const center = sources.filter(s => !s.lean || s.lean === 'center').length;
  return { left, center, right };
}

function CoverageStrip({ story }: { story: StoryItem }) {
  if (story.category === 'sports' || story.category === 'trending') return null;
  const { left, center, right } = coverageCounts(story);
  if (left + center + right === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 8.5, marginTop: 4 }}>
      {left > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#1d4ed8' }} /><span style={{ color: '#60a5fa' }}>{left}</span></span>}
      {center > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#999' }} /><span style={{ color: '#bbb' }}>{center}</span></span>}
      {right > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#b91c1c' }} /><span style={{ color: '#f87171' }}>{right}</span></span>}
    </div>
  );
}

export function StoryScroll({ stories, blobBase, vertical, dividerAfter, cappedHeight }: { stories: StoryItem[]; blobBase: string; vertical?: boolean; dividerAfter?: number; cappedHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: 'left' | 'right' | 'up' | 'down') {
    if (!ref.current) return;
    if (dir === 'left' || dir === 'right')
      ref.current.scrollBy({ left: dir === 'right' ? 460 : -460, behavior: 'smooth' });
    else
      ref.current.scrollBy({ top: dir === 'down' ? 300 : -300, behavior: 'smooth' });
  }

  if (vertical) return (
    <div style={{ position: 'relative', ...(cappedHeight ? {} : { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }) }}>
      <button onClick={() => scroll('up')} aria-label="Scroll up" style={{
        position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, width: 32, height: 32, borderRadius: '50%',
        background: C.panel, border: `1px solid rgba(255,255,255,0.12)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: C.dim,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
      </button>

      <div ref={ref} style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: 2,
        scrollbarWidth: 'none',
        ...(cappedHeight ? { maxHeight: cappedHeight } : {}),
      }} className="hide-scroll pick-scroll">
        {stories.map((story, idx) => {
          const slug = toSlug(story.topic);
          const img = story.image_file;
          const imgUrl = img ? (img.startsWith('http') ? img : `${blobBase}${img}`) : null;
          const vids = story.youtube_videos ?? [];
          const firstVid = vids[0];
          return (
            <>
              {dividerAfter !== undefined && idx === dividerAfter && (
                <div key={`divider-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '2px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontFamily: mono, fontSize: 7.5, letterSpacing: '0.1em', color: C.dimmer, textTransform: 'uppercase', flexShrink: 0 }}>More stories</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                </div>
              )}
              <a key={story.topic} href={`/story/${slug}`} style={{
                textDecoration: 'none', flexShrink: 0,
                display: 'flex', flexDirection: 'row', minHeight: 110,
                background: C.panel, borderRadius: 8, overflow: 'hidden',
                border: `1px solid ${C.border}`,
              }} className="story-card">
                <div style={{ width: 96, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                  {(imgUrl || firstVid)
                    ? <img src={imgUrl ?? ytThumb(firstVid.embed_id)} alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
                    : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${catColor(story.category)}30, ${C.panelDark})` }} />
                  }
                  <span style={{ position: 'absolute', top: 5, left: 5, padding: '1px 5px', borderRadius: 3, background: catColor(story.category), fontFamily: mono, fontSize: 7, letterSpacing: '0.1em', color: '#fff', textTransform: 'uppercase' }}>
                    {catLabel(story.category)}
                  </span>
                </div>
                <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <h3 style={{ fontFamily: serif, fontSize: 13, lineHeight: 1.3, color: C.text, fontWeight: 400, margin: 0 }}>
                    {story.topic}
                  </h3>
                  {story.summary && (
                    <p style={{ fontFamily: mono, fontSize: 10, lineHeight: 1.45, color: C.dim, margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {story.summary}
                    </p>
                  )}
                  <CoverageStrip story={story} />
                </div>
              </a>
            </>
          );
        })}
        <a href="/brief" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.panel, borderRadius: 8, border: `1px solid ${C.border}`, gap: 6 }} className="story-card">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: C.gold }}>All stories</span>
          </div>
        </a>
      </div>

      <button onClick={() => scroll('down')} aria-label="Scroll down" style={{
        position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, width: 32, height: 32, borderRadius: '50%',
        background: C.panel, border: `1px solid rgba(255,255,255,0.12)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: C.dim,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Left arrow */}
      <button onClick={() => scroll('left')} aria-label="Scroll left" style={{
        position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)',
        zIndex: 10, width: 32, height: 32, borderRadius: '50%',
        background: C.panel, border: `1px solid rgba(255,255,255,0.12)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: C.dim,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
      </button>

      {/* Scroll row */}
      <div ref={ref} style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none',
      }} className="hide-scroll">
        {stories.map((story) => {
          const slug = toSlug(story.topic);
          const img = story.image_file;
          const imgUrl = img ? (img.startsWith('http') ? img : `${blobBase}${img}`) : null;
          const vids = story.youtube_videos ?? [];
          const firstVid = vids[0];

          return (
            <a key={story.topic} href={`/story/${slug}`} style={{
              textDecoration: 'none', width: 260, flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              background: C.panel, borderRadius: 8, overflow: 'hidden',
              border: `1px solid ${C.border}`, transition: 'border-color 0.15s',
            }} className="story-card">
              {/* thumb */}
              <div style={{ height: 120, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
                {(imgUrl || firstVid)
                  ? <img src={imgUrl ?? ytThumb(firstVid.embed_id)} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
                  : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${catColor(story.category)}30, ${C.panelDark})` }} />
                }
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(37,53,69,0.9) 0%, transparent 55%)' }} />
                <span style={{ position: 'absolute', top: 7, left: 8, padding: '2px 7px', borderRadius: 3, background: catColor(story.category), fontFamily: mono, fontSize: 8, letterSpacing: '0.1em', color: '#fff', textTransform: 'uppercase' }}>
                  {catLabel(story.category)}
                </span>
                {vids.length > 0 && (
                  <span style={{ position: 'absolute', bottom: 7, right: 8, display: 'flex', alignItems: 'center', gap: 3, fontFamily: mono, fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>
                    <svg width="6" height="8" viewBox="0 0 6 8" fill="currentColor"><polygon points="0,0 6,4 0,8" /></svg>
                    {vids.length} video{vids.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div style={{ padding: '11px 13px', flex: 1 }}>
                <h3 style={{ fontFamily: serif, fontSize: 14, lineHeight: 1.35, color: C.text, fontWeight: 400, margin: 0 }}>
                  {story.topic}
                </h3>
                <CoverageStrip story={story} />
              </div>
            </a>
          );
        })}

        {/* trailing "all stories" tile */}
        <a href="/brief" style={{ width: 120, flexShrink: 0, textDecoration: 'none' }}>
          <div style={{ height: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.panel, borderRadius: 8, border: `1px solid ${C.border}`, gap: 8 }} className="story-card">
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid rgba(218,165,32,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: C.gold, textAlign: 'center' }}>All stories</span>
          </div>
        </a>
      </div>

      {/* Right arrow */}
      <button onClick={() => scroll('right')} aria-label="Scroll right" style={{
        position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)',
        zIndex: 10, width: 32, height: 32, borderRadius: '50%',
        background: C.panel, border: `1px solid rgba(255,255,255,0.12)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: C.dim,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </div>
  );
}
