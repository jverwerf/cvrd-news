'use client';

import { useEffect, useState } from 'react';
import type { NarrativeGap } from '../lib/data';
import TweetFactCheck from './TweetFactCheck';

function topicToSlug(topic: string): string {
  return topic.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

type Clip = NonNullable<NarrativeGap['social_clips']>[number];

function pickSides(story: NarrativeGap): { left: Clip; center?: Clip; right: Clip } | null {
  const texts = (story.social_clips || []).filter(c => c.platform === 'x' && !c.duration && c.embed_id);
  const author = (c: Clip) => ((c as any).author || '').toLowerCase().trim();
  const left = texts.find(c => (c as any).lean === 'left');
  if (!left) return null;
  const right = texts.find(c => (c as any).lean === 'right' && c.embed_id !== left.embed_id && (!author(c) || author(c) !== author(left)));
  if (!right) return null;
  // Center must be a different account than both sides — the same outlet
  // appearing twice defeats the point of the column. No qualifying center →
  // the slide runs left VS right only.
  const usedAuthors = new Set([author(left), author(right)].filter(Boolean));
  const usedIds = new Set([left.embed_id, right.embed_id]);
  const center = texts.find(c => (c as any).lean === 'center' && !usedIds.has(c.embed_id) && (!author(c) || !usedAuthors.has(author(c))));
  return { left, center, right };
}

function SidePanel({ clip, side, fan }: { clip: Clip; side: 'left' | 'center' | 'right'; fan?: boolean }) {
  // Fan categories (sports/trending) use the Media/Analysts/Fans framing —
  // same slots, same colors as the story-page coverage panel.
  const color = fan
    ? (side === 'left' ? '#f59e0b' : side === 'right' ? '#34d399' : '#c084fc')
    : (side === 'left' ? '#60a5fa' : side === 'right' ? '#f87171' : '#a3a3a3');
  const label = fan
    ? (side === 'left' ? '◀ Media' : side === 'right' ? 'Fans ▶' : 'Analysts')
    : (side === 'left' ? '◀ From the left' : side === 'right' ? 'From the right ▶' : 'From the center');
  return (
    <div className="flex-1 min-w-0 flex flex-col rounded-md overflow-hidden" style={{ background: '#1e2a3a', border: `1px solid ${color}33` }}>
      <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color, background: `${color}14` }}>
        {label}
      </div>
      {/* interactive island inside the story link: expand must not navigate */}
      <div onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
        <TweetFactCheck fc={(clip as any).fact_check} compact />
      </div>
      <div className="relative flex-1" style={{ minHeight: 230 }}>
        <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${clip.embed_id}&theme=dark&dnt=true`}
          scrolling="no" style={{ border: 'none', width: '100%', height: '100%', minHeight: 230, pointerEvents: 'none' }} loading="lazy" tabIndex={-1} />
        <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: 'linear-gradient(transparent, #1e2a3a)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

const CYCLE_MS = 2 * 60 * 1000; // same rhythm as the hero carousel above it

/**
 * The Divide — homepage carousel pitting the left, center and right take on a
 * story side by side. Auto-advances with the hero-style gold dash indicators
 * (no arrows). The whole card links to the story; embeds are non-interactive
 * so the click always lands.
 */
export default function TheDivide({ stories, slugBase = '/story' }: { stories: NarrativeGap[]; slugBase?: string }) {
  const slides = stories
    .map(s => ({ story: s, sides: pickSides(s) }))
    .filter((x): x is { story: NarrativeGap; sides: { left: Clip; center?: Clip; right: Clip } } => x.sides !== null);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const goTo = (next: number) => {
    if (next === idx) return;
    setVisible(false);
    setTimeout(() => { setIdx(next); setVisible(true); }, 280);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setTimeout(() => goTo((idx + 1) % slides.length), CYCLE_MS);
    return () => clearTimeout(t);
  }, [idx, slides.length]);

  if (slides.length === 0) return null;
  const { story, sides } = slides[Math.min(idx, slides.length - 1)];
  const isFan = story.category === 'sports' || story.category === 'trending';

  return (
    <div>
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease' }}>
        <a href={`${slugBase}/${topicToSlug(story.topic)}`}
          className="@container rounded-lg p-3 block hover:opacity-90 transition-opacity"
          style={{ background: '#253545', border: '1px solid #2a3a4a', textDecoration: 'none' }}>
          <p className="text-[12px] font-semibold text-white leading-snug mb-2 line-clamp-1">{story.topic}</p>
          {/* all leans side by side; stacked only on narrow screens */}
          <div className="flex flex-col @min-[640px]:flex-row gap-2">
            <SidePanel clip={sides.left} side="left" fan={isFan} />
            <div className="hidden @min-[640px]:flex items-center text-[13px] font-black self-center shrink-0" style={{ color: '#daa520' }}>VS</div>
            {sides.center && (<>
              <SidePanel clip={sides.center} side="center" fan={isFan} />
              <div className="hidden @min-[640px]:flex items-center text-[13px] font-black self-center shrink-0" style={{ color: '#daa520' }}>VS</div>
            </>)}
            <SidePanel clip={sides.right} side="right" fan={isFan} />
          </div>
        </a>
      </div>
      {slides.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Story ${i + 1}`} style={{
              width: i === idx ? 18 : 5,
              height: 3,
              borderRadius: 2,
              background: i === idx ? '#daa520' : 'rgba(255,255,255,0.18)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
