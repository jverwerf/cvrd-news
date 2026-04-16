"use client";

import { useState, useEffect } from "react";

type TileInfo = {
  platform: 'youtube' | 'telegram' | 'x' | 'tiktok';
  embedId: string;
  thumbUrl: string;
  badge: string;
  badgeColor: string;
  title: string;
};

function toSlug(topic: string) {
  return topic.toLowerCase()
    .replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function getFirstTile(story: any): TileInfo | null {
  for (const v of (story.youtube_videos || [])) {
    if (!v.embed_id) continue;
    return { platform: 'youtube', embedId: v.embed_id, thumbUrl: `https://img.youtube.com/vi/${v.embed_id}/hqdefault.jpg`, badge: 'YT', badgeColor: '#cc0000', title: v.title || v.channel || story.topic };
  }
  for (const c of (story.social_clips || [])) {
    if (!c.embed_id) continue;
    const isVideo = (c.platform === 'x' || c.platform === 'telegram') && c.duration;
    if (!isVideo) continue;
    if (c.platform === 'telegram') return { platform: 'telegram', embedId: c.embed_id, thumbUrl: `/api/tg-video?post=${c.embed_id}&thumb=1`, badge: 'TG', badgeColor: '#0088cc', title: c.title || story.topic };
    if (c.platform === 'x') return { platform: 'x', embedId: c.embed_id, thumbUrl: `/api/x-video?id=${c.embed_id}&thumb=1`, badge: '𝕏', badgeColor: '#1a1a1a', title: c.title || story.topic };
  }
  return null;
}

function LiveTile({ tile }: { tile: TileInfo }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {tile.platform === 'youtube' ? (
        <iframe
          src={`/api/yt-tile?v=${tile.embedId}`}
          style={{ position: 'absolute', border: 'none', pointerEvents: 'none', top: '-50%', left: '-50%', width: '200%', height: '200%' }}
          allow="autoplay"
          loading="lazy"
        />
      ) : (
        <img
          src={tile.thumbUrl}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.9,
            animation: 'breakingThumbZoom 8s ease-in-out infinite alternate',
            transformOrigin: 'center',
          }}
        />
      )}
    </div>
  );
}

function StoryCard({ story, now, scrollable }: { story: any; now: number; scrollable?: boolean }) {
  const tile = getFirstTile(story);
  const mins = Math.round((now - new Date(story.detected_at).getTime()) / 60000);
  const ago = mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
  const isBreaking = story._kind === 'breaking';

  return (
    <a href={`/breaking/${toSlug(story.topic || '')}`} className="bk-card" style={{
      flex: scrollable ? 'none' : 1, display: 'flex', flexDirection: 'row', textDecoration: 'none', minWidth: scrollable ? 360 : 0,
      borderRadius: 10, overflow: 'hidden',
      background: '#1e2d3d',
      border: '1px solid rgba(220,38,38,0.18)',
      boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
      height: 150,
    }}>
      <div className="bk-tile" style={{ position: 'relative', width: 200, flexShrink: 0, background: '#111d2b', overflow: 'hidden' }}>
        {tile ? (
          <LiveTile tile={tile} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(127,29,29,0.4) 0%, #111d2b 100%)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(145deg, rgba(120,160,220,0.12) 0%, rgba(30,42,58,0.04) 40%, rgba(0,0,0,0.18) 100%)', boxShadow: 'inset 1px 1px 1px rgba(255,255,255,0.07), inset -1px -1px 2px rgba(0,0,0,0.25)' }} />
        {tile && (
          <div style={{ position: 'absolute', bottom: 6, left: 7, zIndex: 10 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, fontWeight: 700, color: '#fff', background: tile.badgeColor, padding: '2px 5px', borderRadius: 3, letterSpacing: '0.04em' }}>{tile.badge}</span>
          </div>
        )}
      </div>
      <div className="bk-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '9px 11px 9px 10px', minWidth: 0, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0, boxShadow: '0 0 5px #ef4444' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, letterSpacing: '0.14em', color: '#ef4444', textTransform: 'uppercase' }}>
              {isBreaking ? 'Breaking' : 'Live'}
            </span>
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{ago}</span>
        </div>
        <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 13.5, lineHeight: 1.3, color: 'rgba(255,255,255,0.92)', margin: '0 0 5px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
          {story.topic}
        </p>
        {story.summary && (
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 10.5, lineHeight: 1.55, color: 'rgba(203,213,225,0.5)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {story.summary}
          </p>
        )}
      </div>
    </a>
  );
}

function LiveRow({ stories, now }: { stories: any[]; now: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' as any }}>
      {stories.map((story, i) => {
        const tile = getFirstTile(story);
        const mins = Math.round((now - new Date(story.detected_at).getTime()) / 60000);
        const ago = mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;

        return (
          <a key={i} href={`/breaking/${toSlug(story.topic || '')}`} style={{
            flex: 1, minWidth: 0, display: 'flex', flexDirection: 'row', textDecoration: 'none',
            borderRadius: 10, overflow: 'hidden',
            background: '#1e2d3d',
            border: '1px solid rgba(220,38,38,0.18)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
            height: 90,
          }}>
            <div style={{ position: 'relative', width: 100, flexShrink: 0, background: '#111d2b', overflow: 'hidden' }}>
              {tile ? (
                <LiveTile tile={tile} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(127,29,29,0.4) 0%, #111d2b 100%)' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(145deg, rgba(120,160,220,0.12) 0%, rgba(30,42,58,0.04) 40%, rgba(0,0,0,0.18) 100%)' }} />
              {tile && (
                <div style={{ position: 'absolute', bottom: 4, left: 6 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, fontWeight: 700, color: '#fff', background: tile.badgeColor, padding: '2px 5px', borderRadius: 3, letterSpacing: '0.04em' }}>{tile.badge}</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '7px 9px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 5px #ef4444' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.14em', color: '#ef4444', textTransform: 'uppercase' }}>Live</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{ago}</span>
              </div>
              <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 11.5, lineHeight: 1.2, color: 'rgba(255,255,255,0.92)', margin: '0 0 3px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                {story.topic}
              </p>
              {story.summary && (
                <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 9, lineHeight: 1.4, color: 'rgba(203,213,225,0.5)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {story.summary}
                </p>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function BreakingCard({ breakingItems, liveItems, vertical }: { breakingItems: any[]; liveItems: any[]; vertical?: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const hasClips = (s: any) =>
    (s.youtube_videos || []).length + (s.social_clips || []).filter((c: any) => c.duration).length >= 3;

  const breaking = breakingItems.filter(hasClips).map(s => ({ ...s, _kind: 'breaking' as const }));
  const live = liveItems.filter(hasClips).map(s => ({ ...s, _kind: 'live' as const }));

  if (breaking.length === 0 && live.length === 0) return null;

  // Vertical mode: if 3+ breaking and 2+ live, stack breaking normally + live in horizontal row
  const stackLiveHorizontal = vertical && live.length >= 2;

  if (stackLiveHorizontal) {
    return (
      <>
        <style>{`
          @keyframes breakingThumbZoom { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
          @media (max-width: 600px) {
            .bk-card { height: 120px !important; }
            .bk-tile { width: 140px !important; }
          }
        `}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {breaking.map((story, i) => (
            <StoryCard key={i} story={story} now={now} />
          ))}
          <LiveRow stories={live} now={now} />
        </div>
      </>
    );
  }

  // Default: all items stacked/scrolled as before
  const items = [...breaking, ...live];
  const scrollable = !vertical && items.length > 3;

  return (
    <>
      <style>{`
        @keyframes breakingThumbZoom { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
        @media (max-width: 600px) {
          .bk-card { position: relative !important; height: 140px !important; }
          .bk-tile { position: absolute !important; inset: 0 !important; width: 100% !important; }
          .bk-content { position: absolute !important; bottom: 0 !important; left: 0 !important; right: 0 !important; padding: 8px 10px !important; background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 70%, transparent 100%) !important; }
        }
      `}</style>
      <div style={{ position: 'relative', marginBottom: vertical ? 0 : 20 }}>
        {scrollable && (
          <>
            <button onClick={() => document.getElementById('bk-scroll')?.scrollBy({ left: -340, behavior: 'smooth' })}
              style={{ position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(30,45,61,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '6px solid white' }} />
            </button>
            <button onClick={() => document.getElementById('bk-scroll')?.scrollBy({ left: 340, behavior: 'smooth' })}
              style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(30,45,61,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '6px solid white' }} />
            </button>
          </>
        )}
        <div id="bk-scroll" style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: 10, overflowX: scrollable ? 'auto' : undefined, scrollbarWidth: 'none' as any, scrollBehavior: 'smooth' }}>
          {items.map((story, i) => (
            <StoryCard key={i} story={story} now={now} scrollable={scrollable} />
          ))}
        </div>
      </div>
    </>
  );
}
