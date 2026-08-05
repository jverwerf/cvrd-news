'use client';

import React from 'react';
import type { NarrativeGap } from '@/lib/data';
import { toSentence, isPlaceholderProse } from '@/lib/text';

/**
 * What a story shows where its video tiles would go when it has no playable
 * clips. Repeating the one still image across four tiles reads as a bug, so
 * these fall back to the reporting instead.
 *
 * Which filler a story gets is derived from its topic rather than picked at
 * random: the choice varies across the page but stays identical between server
 * and client render, so it can't cause a hydration mismatch or flicker.
 */

const mono = "'DM Mono', monospace";
const sans = "'DM Sans', system-ui, sans-serif";

const C = {
  panelDark: '#1a2535',
  gold: '#daa520',
  text: '#e2e8f0',
  dim: '#7a8fa6',
  border: 'rgba(255,255,255,0.07)',
};

const BODY: React.CSSProperties = {
  fontFamily: sans, fontSize: 12, lineHeight: 1.65,
  textAlign: 'justify', hyphens: 'auto', WebkitHyphens: 'auto',
} as React.CSSProperties;

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
/** The pipeline writes a placeholder rather than omitting an uncovered side. */
const isThin = (t?: string) => !t || t.trim().length < 80 || isPlaceholderProse(t);

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Label({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{ display: 'block', marginBottom: 3, fontFamily: mono, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color }}>
      {children}
    </span>
  );
}

/** How each side is covering it. */
function CoverageFiller({ story, max }: { story: NarrativeGap; max: number }) {
  const sides = (isFanCategory(story.category) ? FAN_LEANS : LEANS)
    // Trending runs Media vs Fans only — no analyst middle ground.
    .filter(s => !(story.category === 'trending' && s.key === 'center_narrative'))
    .filter(s => !isThin((story as any)[s.key]))
    .slice(0, max);
  if (sides.length === 0) return null;
  return (
    <>
      {sides.map(side => (
        <div key={side.key}>
          <Label color={side.color}>{side.label}</Label>
          <p style={{ ...BODY, color: 'rgba(226,232,240,0.78)', margin: 0 }}>
            {toSentence((story as any)[side.key], 220)}
          </p>
        </div>
      ))}
    </>
  );
}

/*
 * There was an "Across outlets" filler here listing each source's headline. It
 * is gone: only sources the analyser managed to attach a `title` to can be
 * listed, which on 15 of today's 46 stories is a single outlet out of four, so
 * the panel contradicted the lean counts printed on the same card (one line
 * under a 2-1-1 strip) and read as a bug rather than as reporting.
 */

/** What the feeds are saying. */
function SocialFiller({ story }: { story: NarrativeGap }) {
  if (isThin(story.social_summary)) return null;
  return (
    <div>
      <Label color={C.gold}>In social media</Label>
      <p style={{ ...BODY, color: 'rgba(226,232,240,0.78)', margin: 0 }}>
        {toSentence(story.social_summary, 340)}
      </p>
    </div>
  );
}

function hasCoverageBlocks(story: NarrativeGap) {
  return (isFanCategory(story.category) ? FAN_LEANS : LEANS)
    .some(side => !(story.category === 'trending' && side.key === 'center_narrative')
      && !isThin((story as any)[side.key]));
}

/**
 * Whether this story has anything worth putting in a filler panel at all.
 *
 * Callers need to know before they lay out: a panel that would render nothing
 * should not be given a slot, otherwise the card reserves space for it and
 * shows a hole. There is deliberately no summary fallback — the summary is
 * already printed beside the panel, so falling back to it filled the box by
 * saying the same thing twice.
 */
export function hasFillerContent(story: NarrativeGap) {
  return hasCoverageBlocks(story) || !isThin(story.social_summary);
}

export function StoryFiller({ story, compact }: { story: NarrativeGap; compact?: boolean }) {
  const max = compact ? 1 : 3;

  const available = [
    hasCoverageBlocks(story) && <CoverageFiller key="coverage" story={story} max={max} />,
    !isThin(story.social_summary) && <SocialFiller key="social" story={story} />,
  ].filter(Boolean) as React.ReactElement[];

  if (available.length === 0) return null;

  // Rotate which one this story gets, so the page doesn't show the same filler
  // over and over, while staying stable between server and client render.
  const chosen = available[hash(story.topic) % available.length];

  return (
    <div style={{
      height: '100%', width: '100%', overflow: 'hidden',
      background: C.panelDark,
      // Centred rather than top-aligned: where the panel sits in a box taller
      // than its text, the leftover space reads as a gap under the copy unless
      // it is split evenly above and below.
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12,
      padding: compact ? '12px 14px' : '16px 20px',
    }}>
      {chosen}
    </div>
  );
}
