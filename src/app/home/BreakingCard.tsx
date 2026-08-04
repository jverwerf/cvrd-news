"use client";

import { useState, useEffect } from "react";
import { getStoryTiles, StoryTile } from "./StoryTile";
import { toSentence } from '@/lib/text';

function toSlug(topic: string) {
  return topic.toLowerCase()
    .replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function Coverage({ story, size = 'md' }: { story: any; size?: 'sm' | 'md' }) {
  if (story.category === 'sports' || story.category === 'trending') return null;
  const sources = story.sources ?? [];
  const left = sources.filter((s: any) => s.lean === 'left').length;
  const right = sources.filter((s: any) => s.lean === 'right').length;
  const center = sources.filter((s: any) => !s.lean || s.lean === 'center').length;
  if (left + center + right === 0) return null;
  const dot = size === 'sm' ? 4 : 5;
  const fs = size === 'sm' ? 7.5 : 9;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? 5 : 7, fontFamily: "'DM Mono', monospace", fontSize: fs }}>
      {left > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: dot, height: dot, borderRadius: '50%', background: '#1d4ed8' }} /><span style={{ color: '#60a5fa' }}>{left}</span></span>}
      {center > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: dot, height: dot, borderRadius: '50%', background: '#999' }} /><span style={{ color: '#bbb' }}>{center}</span></span>}
      {right > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: dot, height: dot, borderRadius: '50%', background: '#b91c1c' }} /><span style={{ color: '#f87171' }}>{right}</span></span>}
    </div>
  );
}

function StoryCard({ story, now, scrollable }: { story: any; now: number; scrollable?: boolean }) {
  const tiles = getStoryTiles(story);
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
        {tiles.length ? (
          <StoryTile tiles={tiles} badge="sm" />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(127,29,29,0.4) 0%, #111d2b 100%)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(145deg, rgba(120,160,220,0.12) 0%, rgba(30,42,58,0.04) 40%, rgba(0,0,0,0.18) 100%)', boxShadow: 'inset 1px 1px 1px rgba(255,255,255,0.07), inset -1px -1px 2px rgba(0,0,0,0.25)' }} />
      </div>
      <div className="bk-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '9px 11px 9px 10px', minWidth: 0, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ flexShrink: 0, fontFamily: "'DM Mono', monospace", fontSize: 7.5, letterSpacing: '0.14em', color: '#ef4444', textTransform: 'uppercase' }}>
            {isBreaking ? 'Breaking' : 'Live'}
          </span>
          <Coverage story={story} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{ago}</span>
        </div>
        <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 13.5, lineHeight: 1.3, color: 'rgba(255,255,255,0.92)', margin: '0 0 5px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
          {story.topic}
        </p>
        {story.summary && (
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 10.5, lineHeight: 1.55, color: 'rgba(203,213,225,0.5)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {toSentence(story.summary, 150)}
          </p>
        )}
      </div>
    </a>
  );
}

function timeAgo(story: any, now: number) {
  const mins = Math.round((now - new Date(story.detected_at).getTime()) / 60000);
  return mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
}

function KindLabel({ story, size = 'md' }: { story: any; size?: 'sm' | 'md' }) {
  const isBreaking = story._kind === 'breaking';
  return (
    <span style={{ flexShrink: 0, fontFamily: "'DM Mono', monospace", fontSize: size === 'sm' ? 7 : 8, letterSpacing: '0.14em', color: '#ef4444', textTransform: 'uppercase' }}>
      {isBreaking ? 'Breaking' : 'Live'}
    </span>
  );
}

// The most recent story, given the full width of the section.
function LeadCard({ story, now }: { story: any; now: number }) {
  const tiles = getStoryTiles(story);

  return (
    <a href={`/breaking/${toSlug(story.topic || '')}`} className="bk-lead" style={{
      display: 'flex', flexDirection: 'row', textDecoration: 'none',
      borderRadius: 10, overflow: 'hidden',
      background: '#1e2d3d',
      border: '1px solid rgba(220,38,38,0.3)',
      boxShadow: '0 2px 22px rgba(0,0,0,0.42)',
      height: 250,
    }}>
      <div className="bk-lead-tile" style={{ position: 'relative', width: 340, flexShrink: 0, background: '#111d2b', overflow: 'hidden' }}>
        {tiles.length ? (
          <StoryTile tiles={tiles} badge="md" cycleMs={11000} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(127,29,29,0.4) 0%, #111d2b 100%)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(145deg, rgba(120,160,220,0.12) 0%, rgba(30,42,58,0.04) 40%, rgba(0,0,0,0.18) 100%)', boxShadow: 'inset 1px 1px 1px rgba(255,255,255,0.07), inset -1px -1px 2px rgba(0,0,0,0.25)' }} />
      </div>

      <div className="bk-lead-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <KindLabel story={story} />
          <Coverage story={story} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>{timeAgo(story, now)}</span>
        </div>

        <p className="bk-lead-title" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 21, lineHeight: 1.25, color: 'rgba(255,255,255,0.95)', margin: '0 0 9px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
          {story.topic}
        </p>

        {story.summary && (
          <p className="bk-lead-summary" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, lineHeight: 1.65, color: 'rgba(203,213,225,0.62)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical' as const }}>
            {toSentence(story.summary, 430)}
          </p>
        )}
      </div>
    </a>
  );
}

// Everything after the lead. Flex basis of half a row means a lone leftover
// card stretches to full width instead of leaving a hole.
function CompactCard({ story, now, cycleMs }: { story: any; now: number; cycleMs: number }) {
  const tiles = getStoryTiles(story);

  return (
    <a href={`/breaking/${toSlug(story.topic || '')}`} className="bk-compact" style={{
      flex: '1 1 calc(50% - 5px)', minWidth: 0, display: 'flex', flexDirection: 'row', textDecoration: 'none',
      borderRadius: 10, overflow: 'hidden',
      background: '#1e2d3d',
      border: '1px solid rgba(220,38,38,0.18)',
      boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
      height: 104,
    }}>
      <div style={{ position: 'relative', width: 122, flexShrink: 0, background: '#111d2b', overflow: 'hidden' }}>
        {tiles.length ? (
          <StoryTile tiles={tiles} badge="sm" cycleMs={cycleMs} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(127,29,29,0.4) 0%, #111d2b 100%)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(145deg, rgba(120,160,220,0.12) 0%, rgba(30,42,58,0.04) 40%, rgba(0,0,0,0.18) 100%)' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 10px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <KindLabel story={story} size="sm" />
          <Coverage story={story} size="sm" />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{timeAgo(story, now)}</span>
        </div>
        <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 12.5, lineHeight: 1.25, color: 'rgba(255,255,255,0.92)', margin: '0 0 3px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
          {story.topic}
        </p>
        {story.summary && (
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 9.5, lineHeight: 1.45, color: 'rgba(203,213,225,0.5)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {toSentence(story.summary, 65)}
          </p>
        )}
      </div>
    </a>
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

  const topicWords = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  const isSameStory = (liveTopic: string, breakingTopic: string) => {
    const bWords = topicWords(breakingTopic);
    const lWords = topicWords(liveTopic);
    const shorter = bWords.length <= lWords.length ? bWords : lWords;
    const longer = bWords.length <= lWords.length ? lWords : bWords;
    const matches = shorter.filter(w => longer.includes(w)).length;
    return matches / shorter.length >= 0.7;
  };
  const breakingTopics = breaking.map(s => s.topic || '');
  const live = liveItems.filter(hasClips)
    .filter(s => !breakingTopics.some(bt => isSameStory(s.topic || '', bt)))
    .map(s => ({ ...s, _kind: 'live' as const }));

  if (breaking.length === 0 && live.length === 0) return null;

  // Vertical mode: newest story leads at full width, the rest fill the row
  // beneath it. Works down to a single story, which just renders the lead.
  if (vertical) {
    const byRecency = (a: any, b: any) =>
      new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
    // Live items only take the lead when there is no true breaking story.
    const lead = [...(breaking.length ? breaking : live)].sort(byRecency)[0];
    const rest = [...breaking, ...live].filter(s => s !== lead).sort(byRecency);

    return (
      <>
        <style>{`
          @keyframes breakingThumbZoom { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
          @media (max-width: 900px) {
            .bk-lead-tile { width: 250px !important; }
            .bk-lead-summary { -webkit-line-clamp: 4 !important; }
          }
          @media (max-width: 600px) {
            .bk-lead { flex-direction: column !important; height: auto !important; }
            .bk-lead-tile { width: 100% !important; height: 190px !important; }
            .bk-lead-title { font-size: 17px !important; }
            .bk-lead-summary { -webkit-line-clamp: 3 !important; }
            .bk-compact { flex: 1 1 100% !important; }
          }
        `}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <LeadCard story={lead} now={now} />
          {rest.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {rest.map((story, i) => (
                <CompactCard key={i} story={story} now={now} cycleMs={12000 + i * 2300} />
              ))}
            </div>
          )}
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
