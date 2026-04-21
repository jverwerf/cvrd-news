"use client";

import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import type { NarrativeGap } from "@/lib/data";

const serif = "'Instrument Serif', Georgia, serif";
const mono = "'DM Mono', monospace";

const C = {
  bg: '#1e2a3a', panelDark: '#1a2535',
  gold: '#daa520', text: '#e2e8f0', dim: '#7a8fa6',
};

function catColor(cat?: string) {
  const map: Record<string, string> = {
    world: '#1d4ed8', politics: '#7c3aed', markets: '#047857',
    trending: '#b45309', sports: '#0e7490',
  };
  return map[cat ?? ''] ?? '#374151';
}

function catLabel(cat?: string) {
  const map: Record<string, string> = { markets: 'markets', trending: 'trending', sports: 'sports' };
  return map[cat ?? ''] ?? (cat ?? 'news');
}

function toSlug(topic: string) {
  return topic.toLowerCase()
    .replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

const CYCLE_MS = 2 * 60 * 1000;

export function HeroCarousel({ stories, blobBase }: { stories: NarrativeGap[]; blobBase: string }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const goTo = (next: number) => {
    if (next === idx) return;
    setVisible(false);
    setTimeout(() => { setIdx(next); setVisible(true); }, 280);
  };

  useEffect(() => {
    if (stories.length <= 1) return;
    const t = setTimeout(() => goTo((idx + 1) % stories.length), CYCLE_MS);
    return () => clearTimeout(t);
  }, [idx, stories.length]);

  const story = stories[idx];
  if (!story) return null;

  const slug = toSlug(story.topic);
  const img = story.image_file;
  const imgUrl = img ? (img.startsWith('http') ? img : `${blobBase}${img}`) : null;
  const vids = story.youtube_videos ?? [];
  const totalSources = vids.length + (story.social_clips?.length ?? 0);
  const articleSources = story.sources ?? [];
  const leftCount = articleSources.filter(s => s.lean === 'left').length;
  const rightCount = articleSources.filter(s => s.lean === 'right').length;
  const centerCount = articleSources.filter(s => !s.lean || s.lean === 'center').length;
  const showCoverage = story.category !== 'sports' && story.category !== 'trending' && (leftCount + centerCount + rightCount) > 0;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease' }}>
      {/* background */}
      {imgUrl
        ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.55)' }} />
        : <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${catColor(story.category)}22 0%, ${C.panelDark} 100%)` }} />
      }
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30,42,58,1) 0%, rgba(30,42,58,0.55) 45%, rgba(30,42,58,0.1) 100%)' }} />

      <div style={{ position: 'relative', padding: '36px 28px 16px', maxWidth: 1120, margin: '0 auto' }}>
        {/* category + source count + read more */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 3, background: catColor(story.category), fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', color: '#fff', textTransform: 'uppercase' }}>
            {catLabel(story.category)}
          </span>
          {totalSources > 0 && (
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: C.dim }}>
              {totalSources} sources covering this
            </span>
          )}
          {showCoverage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 9 }}>
              {leftCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#1d4ed8' }} /><span style={{ color: '#60a5fa' }}>{leftCount}</span></span>}
              {centerCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#999' }} /><span style={{ color: '#bbb' }}>{centerCount}</span></span>}
              {rightCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#b91c1c' }} /><span style={{ color: '#f87171' }}>{rightCount}</span></span>}
            </div>
          )}
          <a href={`/story/${slug}`} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', color: C.gold, textDecoration: 'none' }}>
            Read the full story
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </a>
        </div>

        {/* headline */}
        <a href={`/story/${slug}`} style={{ textDecoration: 'none' }}>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(22px, 3.2vw, 34px)', lineHeight: 1.2, color: C.text, marginBottom: 8, maxWidth: 760, fontWeight: 400 }}>
            {story.topic}
          </h1>
        </a>

        {/* summary */}
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, lineHeight: 1.7, color: C.dim, maxWidth: 660, marginBottom: 8 }}>
          {story.summary?.slice(0, 200)}{(story.summary?.length ?? 0) > 200 ? '...' : ''}
        </p>

        {/* dashboard tiles + indicators */}
        {(vids.length > 0 || (story.social_clips?.length ?? 0) > 0) && (
          <div style={{ position: 'relative' }}>
            {stories.length > 1 && (
              <div style={{ position: 'absolute', top: -18, right: 0, display: 'flex', gap: 5, alignItems: 'center', zIndex: 10 }}>
                {stories.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} style={{
                    width: i === idx ? 18 : 5,
                    height: 3,
                    borderRadius: 2,
                    background: i === idx ? C.gold : 'rgba(255,255,255,0.18)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'width 0.3s ease, background 0.3s ease',
                  }} />
                ))}
              </div>
            )}
            <div style={{ height: 180, borderRadius: 10, overflow: 'hidden' }}>
              <Dashboard stories={[story]} tilesOnly={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
