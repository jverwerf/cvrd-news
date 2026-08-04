'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Dashboard, TILE_GAP } from '@/components/Dashboard';
import type { NarrativeGap } from '@/lib/data';
import { toParagraphs } from '@/lib/text';
import { useElementSize, useIsomorphicLayoutEffect } from '@/lib/measure';

/**
 * The two-story hero shared by the video landing pages.
 *
 * The lead story takes two thirds of the row with its clips in a tall column
 * beside it; the second takes one third and stacks its clips underneath, since
 * a side-by-side split at that width leaves the copy too narrow to read.
 *
 * Nothing here is a fixed size. The row is as tall as the lead story's copy
 * needs, between a floor and a ceiling, so a short write-up doesn't leave a
 * hole under the text. Both tile boxes are then sized off the space that
 * leaves, and the wall chooses its own tile count to match — which is what
 * keeps every clip at 16:9 instead of stretched to fill a slot it never fitted.
 */

const serif = "'Instrument Serif', Georgia, serif";
const mono = "'DM Mono', monospace";
const sans = "'DM Sans', system-ui, sans-serif";

const C = {
  panel: '#1e2d3d', panelDark: '#1a2535',
  gold: '#daa520',
  text: '#e2e8f0', dim: '#7a8fa6',
  border: 'rgba(255,255,255,0.07)',
};

/** Body copy is set like newsprint: justified, hyphenated, one size down. */
export const BODY: React.CSSProperties = {
  fontFamily: sans, fontSize: 12.5, lineHeight: 1.7,
  textAlign: 'justify', hyphens: 'auto', WebkitHyphens: 'auto',
} as React.CSSProperties;

/** The row never grows past this, however long the write-up runs. */
export const HERO_MAX_H = 460;
/** …and never collapses below it, however short. */
const HERO_MIN_H = 300;
/** A tile strip reads as a strip between these heights. */
const STRIP_MIN_H = 104;
const STRIP_MAX_H = 190;
/** Width a tile wants in a horizontal strip, before 16:9 sets its height. */
const STRIP_TILE_W = 230;
const TILE_AR = 16 / 9;

// Sports and trending have no political left/right — they run the Media,
// Analysts and Fans framing, the same slots and colours the story pages and
// The Divide use for those categories.
const LEANS = [
  { key: 'left_narrative', label: 'From the left', color: '#60a5fa' },
  { key: 'center_narrative', label: 'From the center', color: '#a3a3a3' },
  { key: 'right_narrative', label: 'From the right', color: '#f87171' },
] as const;

const FAN_LEANS = [
  { key: 'left_narrative', label: 'Media', color: '#f59e0b' },
  { key: 'center_narrative', label: 'Analysts', color: '#c084fc' },
  { key: 'right_narrative', label: 'Fans', color: '#34d399' },
] as const;

const isFanCategory = (c?: string) => c === 'sports' || c === 'trending';

/**
 * A section only earns its place if there is real coverage behind it. The
 * pipeline writes a placeholder rather than omitting a side that hasn't covered
 * the story, and a one-line stub reads as filler next to a full section — both
 * are left out.
 */
const MIN_SECTION_CHARS = 120;
const isThin = (t?: string) =>
  !t || /^\s*no coverage/i.test(t) || t.trim().length < MIN_SECTION_CHARS;

export type HeroItem = {
  story: NarrativeGap;
  href: string;
  /** Chip shown top-left of the panel, e.g. a BREAKING or LIVE badge. */
  badge?: React.ReactNode;
  /** Short line beside the chip, e.g. "3h ago" or a date. */
  meta?: string;
  /** Optional anchor video for the lead unit's tile column. */
  videoUrl?: string;
  /** Text of the top-right link, e.g. "Read" or "Follow live". */
  readLabel?: string;
};

function clipCount(story: NarrativeGap) {
  return (story.youtube_videos ?? []).length
    + (story.social_clips ?? []).filter(c => c.duration).length;
}

// How many blocks each panel is allowed. The wide panel carries a fuller read,
// the narrow one a tighter one. The point is that the selection is deliberate:
// a curated top of the story, not the whole write-up dumped in and cut off.
const BLOCK_BUDGET = { lead: 6, narrow: 4 };

// Scrolls, so everything selected can actually be read, with a fade on the
// bottom edge to signal there is more below.
function CopyColumn({ blocks, boxRef, contentRef }: {
  blocks: { key: string; node: React.ReactNode }[];
  /** The scrolling viewport — how much room the copy has been given. */
  boxRef?: React.Ref<HTMLDivElement>;
  /** The copy itself — how much room it wants, slack included. */
  contentRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <div ref={boxRef} className="hero-hide-scroll" style={{ height: '100%', overflowY: 'auto' }}>
        <div ref={contentRef}>
          {blocks.map(b => <div key={b.key}>{b.node}</div>)}
        </div>
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 34,
        background: `linear-gradient(transparent, ${C.panel})`, pointerEvents: 'none',
      }} />
    </div>
  );
}

function HeroPanel({ item, lead, onNeedHeight }: {
  item: HeroItem;
  lead: boolean;
  /** Reports the height this panel's copy wants, so the row can size to it. */
  onNeedHeight?: (px: number) => void;
}) {
  const { story } = item;
  const boxRef = useRef<HTMLDivElement>(null);
  const copyBoxRef = useRef<HTMLDivElement>(null);
  const copyContentRef = useRef<HTMLDivElement>(null);

  // What the panel wants = its furniture (meta row, headline, padding) plus the
  // natural height of the copy. Measuring the copy's own element rather than
  // the viewport's scrollHeight is what makes slack visible: scrollHeight never
  // reports less than the box it sits in, so a short write-up would look like a
  // perfect fit and the hole under it would never close.
  //
  // Both terms are fixed by the panel's width, not its height, so feeding this
  // back into the row height settles in one pass instead of oscillating.
  useIsomorphicLayoutEffect(() => {
    const box = boxRef.current;
    const viewport = copyBoxRef.current;
    const content = copyContentRef.current;
    if (!box || !viewport || !content || !onNeedHeight) return;
    onNeedHeight(box.offsetHeight - viewport.clientHeight + content.offsetHeight);
  });
  // A window resize reflows the copy without React re-rendering, so watch the
  // copy itself for the render that re-runs the measurement above.
  useElementSize(copyContentRef);

  const blocks: { key: string; node: React.ReactNode }[] = [];

  // The write-up is the opener, never the whole panel: one paragraph of it, so
  // the coverage split and the social read always get room.
  const lede = toParagraphs(story.summary)[0];
  if (lede) {
    blocks.push({
      key: 'lede',
      node: <p style={{ ...BODY, color: 'rgba(226,232,240,0.87)', margin: 0 }}>{lede}</p>,
    });
  }
  // How each side is covering it — the comparison is the point of the site, and
  // it gives the panel real body copy.
  const sides = isFanCategory(story.category) ? FAN_LEANS : LEANS;
  for (const side of sides) {
    // Trending runs Media vs Fans only — there is no analyst middle ground,
    // same rule The Divide applies to that category.
    if (story.category === 'trending' && side.key === 'center_narrative') continue;
    const text = (story as any)[side.key] as string | undefined;
    if (isThin(text)) continue;
    blocks.push({
      key: side.key,
      node: (
        <div style={{ marginTop: 15 }}>
          <span style={{ display: 'block', marginBottom: 4, fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: side.color }}>
            {side.label}
          </span>
          {toParagraphs(text).map((para, i) => (
            <p key={i} style={{ ...BODY, color: 'rgba(226,232,240,0.78)', margin: i === 0 ? 0 : '9px 0 0' }}>{para}</p>
          ))}
        </div>
      ),
    });
  }
  if (!isThin(story.social_summary)) {
    blocks.push({
      key: 'social',
      node: (
        <div style={{ marginTop: 15 }}>
          <span style={{ display: 'block', marginBottom: 4, fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold }}>
            In social media
          </span>
          {toParagraphs(story.social_summary).map((para, i) => (
            <p key={i} style={{ ...BODY, color: 'rgba(226,232,240,0.78)', margin: i === 0 ? 0 : '9px 0 0' }}>{para}</p>
          ))}
        </div>
      ),
    });
  }

  return (
    // minHeight 0 matters: as a column flex item this would otherwise refuse to
    // shrink below its content and push the tiles out of the capped row.
    <a href={item.href} style={{ flex: '2 1 0%', minWidth: 0, minHeight: 0, textDecoration: 'none', display: 'block' }}>
      <div ref={boxRef} style={{
        height: '100%', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '18px 22px',
      }}>
        {/* Kept deliberately bare: a full meta row wrapped onto four lines in
            the narrow panel and pushed the headline down. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9, flexShrink: 0 }}>
          {item.badge}
          {item.meta && (
            <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', color: C.dim, whiteSpace: 'nowrap' }}>
              {item.meta}
            </span>
          )}
          <span style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: C.gold, whiteSpace: 'nowrap' }}>
            {item.readLabel ?? 'Read'}
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </span>
        </div>

        <h2 style={{
          fontFamily: serif, fontSize: 'clamp(19px, 1.7vw, 24px)',
          lineHeight: 1.16, color: C.text, fontWeight: 400, margin: '0 0 7px', flexShrink: 0,
        }}>
          {story.topic}
        </h2>

        {/* Priority order: the story, then how each side is covering it, then
            the social read — trimmed to this panel's budget. */}
        <CopyColumn
          boxRef={copyBoxRef}
          contentRef={copyContentRef}
          blocks={blocks.slice(0, lead ? BLOCK_BUDGET.lead : BLOCK_BUDGET.narrow)}
        />
      </div>
    </a>
  );
}

export function HeroDuo({ items, bgThumb }: { items: HeroItem[]; bgThumb?: string | null }) {
  // The lead story's copy sets the row height: it is the panel given the room
  // to be read in full, so when it runs short the whole row comes up with it
  // rather than leaving dead space under the text.
  const [leadNeed, setLeadNeed] = useState<number | null>(null);
  const onLeadNeedHeight = useCallback((px: number) => {
    setLeadNeed(prev => (prev !== null && Math.abs(prev - px) < 2 ? prev : px));
  }, []);
  const rowH = leadNeed === null
    ? HERO_MAX_H
    : Math.round(Math.max(HERO_MIN_H, Math.min(HERO_MAX_H, leadNeed)));

  // The narrow unit's strip is as tall as its tiles are, not the other way
  // round: pick the count its width carries, then let 16:9 give the height.
  const stripRef = useRef<HTMLDivElement>(null);
  const stripW = useElementSize(stripRef)?.width ?? 0;
  const stripTiles = stripW > 0 ? Math.max(1, Math.min(4, Math.round(stripW / STRIP_TILE_W))) : 3;
  const stripH = stripW > 0
    ? Math.round(Math.max(STRIP_MIN_H, Math.min(STRIP_MAX_H,
        ((stripW - (stripTiles - 1) * TILE_GAP) / stripTiles) / TILE_AR)))
    : STRIP_MIN_H;

  if (items.length === 0) return null;

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .hero-hide-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .hero-hide-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
        @media (max-width: 700px) {
          .hero-duo-row { flex-direction: column !important; height: auto !important; }
          .hero-duo-unit { flex-direction: column !important; }
          /* Stacked, the tile box takes the full width, so let 16:9 give it its
             height rather than a fixed one the tiles then have to stretch to. */
          .hero-duo-tiles { flex: none !important; width: 100% !important; height: auto !important; aspect-ratio: 16 / 9 !important; }
        }
      `}</style>

      {bgThumb ? (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${bgThumb})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.35) blur(2px)',
        }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, #7f1d1d22, ${C.panelDark})` }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(63,90,128,1) 0%, rgba(63,90,128,0.45) 55%, rgba(63,90,128,0.1) 100%)' }} />

      <div className="hero-duo-row" style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 12, height: rowH }}>
        {items.slice(0, 2).map((item, i) => {
          const lead = i === 0;
          const clips = clipCount(item.story);
          return (
            <div
              key={item.story.topic}
              className="hero-duo-unit"
              style={{
                flex: lead ? '2 1 0%' : '1 1 0%', minWidth: 0,
                display: 'flex', alignItems: 'stretch', gap: 10,
                flexDirection: lead ? 'row' : 'column',
              }}
            >
              <HeroPanel item={item} lead={lead} onNeedHeight={lead ? onLeadNeedHeight : undefined} />
              {clips > 0 && (
                <div
                  ref={lead ? undefined : stripRef}
                  className="hero-duo-tiles"
                  style={lead
                    ? { flex: '1 1 0%', minWidth: 0, borderRadius: 10, overflow: 'hidden' }
                    : { flex: 'none', width: '100%', height: stripH, borderRadius: 10, overflow: 'hidden' }}
                >
                  {/* The count passed is the ceiling — how many clips there are.
                      The wall measures its box and takes as many as fit. */}
                  <Dashboard
                    stories={[item.story]}
                    videoUrl={lead ? item.videoUrl : undefined}
                    tilesOnly={true}
                    tilesColumn={lead}
                    tilesCount={Math.min(4, clips)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
