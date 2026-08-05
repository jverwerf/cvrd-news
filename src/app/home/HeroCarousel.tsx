"use client";

import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import type { NarrativeGap } from "@/lib/data";
import { toSentence } from '@/lib/text';
import { CONTENT_MAX, CONTENT_GUTTER } from '@/lib/layout';

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

const TILE_ROW_H = 180;
const PAD_BOTTOM = 12;

// Opaque over the headline block in the top-left corner, fading out across and
// down so the photo is fully sharp on the right.
const HERO_BLUR_MASK =
  'radial-gradient(135% 115% at 0% 18%, #000 0%, #000 32%, rgba(0,0,0,0.55) 52%, transparent 74%)';

export function HeroCarousel({ stories }: { stories: NarrativeGap[]; blobBase?: string }) {
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
  const vids = story.youtube_videos ?? [];
  // The band behind the headline is a frame of the story's own coverage. The
  // generated still is never used: an illustration blown up to full width is
  // the most emphatic possible way to show art where footage should be.
  const imgUrl = vids[0]
    ? `https://img.youtube.com/vi/${vids[0].embed_id}/maxresdefault.jpg`
    : null;
  const totalSources = vids.length + (story.social_clips?.length ?? 0);
  const articleSources = story.sources ?? [];
  const leftCount = articleSources.filter(s => s.lean === 'left').length;
  const rightCount = articleSources.filter(s => s.lean === 'right').length;
  const centerCount = articleSources.filter(s => !s.lean || s.lean === 'center').length;
  const showCoverage = story.category !== 'sports' && story.category !== 'trending' && (leftCount + centerCount + rightCount) > 0;

  // The tile row is TILE_ROW_H tall with PAD_BOTTOM of padding beneath it, so
  // cutting the image band this far up from the bottom lands it on the tiles'
  // horizontal midline.
  const hasTiles = vids.length > 0 || (story.social_clips?.length ?? 0) > 0;
  const imageBandBottom = hasTiles ? TILE_ROW_H / 2 + PAD_BOTTOM : 0;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease' }}>
      {/* Background image band. It stops level with the middle of the video tile
          row below, so the tiles straddle the edge: top half over the photo,
          bottom half over the page field. */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: imageBandBottom, overflow: 'hidden' }}>
        {imgUrl
          ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.95) saturate(1.08)' }} />
          : <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${catColor(story.category)}22 0%, ${C.panelDark} 100%)` }} />
        }
        {/* A blurred copy of the same photo, masked so it is solid behind the
            headline at top left and gone by the right-hand side. CSS cannot
            ramp a filter across an element, so the ramp lives in the mask.
            Scaled up slightly so the blur's soft edges stay off-screen. */}
        {imgUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'brightness(0.95) saturate(1.08) blur(16px)',
            transform: 'scale(1.08)',
            WebkitMaskImage: HERO_BLUR_MASK,
            maskImage: HERO_BLUR_MASK,
          }} />
        )}
        {/* light bottom darkening for text legibility — kept weak so the cut edge stays crisp */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(16,24,38,0.55) 0%, rgba(16,24,38,0.18) 34%, rgba(16,24,38,0) 62%)' }} />
        {/* soft left scrim so the headline block stays readable on bright photos */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.25) 38%, rgba(10,14,20,0) 62%)' }} />
      </div>

      <div style={{ position: 'relative', padding: `18px ${CONTENT_GUTTER}px ${PAD_BOTTOM}px`, maxWidth: CONTENT_MAX, margin: '0 auto' }}>
        {/* category + source count + read more */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {totalSources > 0 && (
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: 'rgba(226,232,240,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
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
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(18px, 2.4vw, 26px)', lineHeight: 1.18, color: '#fff', marginBottom: 5, maxWidth: 760, fontWeight: 400, textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 2px 18px rgba(0,0,0,0.45)' }}>
            {story.topic}
          </h1>
        </a>

        {/* summary */}
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, lineHeight: 1.55, color: 'rgba(226,232,240,0.88)', maxWidth: 620, marginBottom: 6, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
          {toSentence(story.summary, 130)}
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
            <div style={{ height: TILE_ROW_H, borderRadius: 10, overflow: 'hidden' }}>
              <Dashboard stories={[story]} tilesOnly={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
