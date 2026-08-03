'use client';

import { useRef } from 'react';
import type { NarrativeGap } from '../lib/data';
import TweetFactCheck from './TweetFactCheck';

function topicToSlug(topic: string): string {
  return topic.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

type Clip = NonNullable<NarrativeGap['social_clips']>[number];

function pickSides(story: NarrativeGap): { left: Clip; center?: Clip; right: Clip } | null {
  const texts = (story.social_clips || []).filter(c => c.platform === 'x' && !c.duration && c.embed_id);
  const left = texts.find(c => (c as any).lean === 'left');
  const center = texts.find(c => (c as any).lean === 'center');
  const right = texts.find(c => (c as any).lean === 'right');
  return left && right ? { left, center, right } : null;
}

function SidePanel({ clip, side, className }: { clip: Clip; side: 'left' | 'center' | 'right'; className?: string }) {
  const color = side === 'left' ? '#60a5fa' : side === 'right' ? '#f87171' : '#a3a3a3';
  return (
    <div className={`flex-1 min-w-0 flex flex-col rounded-md overflow-hidden ${className ?? ''}`} style={{ background: '#1e2a3a', border: `1px solid ${color}33` }}>
      <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color, background: `${color}14` }}>
        {side === 'left' ? '◀ From the left' : side === 'right' ? 'From the right ▶' : 'From the center'}
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

/**
 * The Divide — homepage carousel pitting a left take against a right take per
 * story. The whole card links to the story; embeds are non-interactive so the
 * click always lands.
 */
export default function TheDivide({ stories, slugBase = '/story' }: { stories: NarrativeGap[]; slugBase?: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const slides = stories
    .map(s => ({ story: s, sides: pickSides(s) }))
    .filter((x): x is { story: NarrativeGap; sides: { left: Clip; center?: Clip; right: Clip } } => x.sides !== null);
  if (slides.length === 0) return null;

  const nudge = (dir: number) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.9), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div ref={scroller} className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
        {slides.map(({ story, sides }, i) => (
          <a key={i} href={`${slugBase}/${topicToSlug(story.topic)}`}
            className="@container shrink-0 rounded-lg p-3 block hover:opacity-90 transition-opacity"
            style={{ width: sides.center ? 'min(100%, 780px)' : 'min(100%, 560px)', scrollSnapAlign: 'start', background: '#253545', border: '1px solid #2a3a4a', textDecoration: 'none' }}>
            <p className="text-[12px] font-semibold text-white leading-snug mb-2 line-clamp-1">{story.topic}</p>
            {/* Tweet embeds need ~240px each: 3-up only when the card fits it,
                left VS right + center below at mid widths, stacked when narrow */}
            <div className="flex flex-wrap gap-2">
              <SidePanel clip={sides.left} side="left" className="order-1 basis-full @min-[540px]:basis-0" />
              <div className="order-2 hidden @min-[540px]:flex items-center text-[13px] font-black self-center shrink-0" style={{ color: '#daa520' }}>VS</div>
              {sides.center && (<>
                <SidePanel clip={sides.center} side="center" className="order-2 @min-[540px]:order-6 @min-[760px]:order-3 basis-full @min-[760px]:basis-0" />
                <div className="order-4 hidden @min-[760px]:flex items-center text-[13px] font-black self-center shrink-0" style={{ color: '#daa520' }}>VS</div>
              </>)}
              <SidePanel clip={sides.right} side="right" className="order-3 @min-[760px]:order-5 basis-full @min-[540px]:basis-0" />
            </div>
          </a>
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <button onClick={() => nudge(-1)} aria-label="Previous"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(30,42,58,0.9)', border: '1px solid #2a3a4a', cursor: 'pointer', color: '#fff' }}>‹</button>
          <button onClick={() => nudge(1)} aria-label="Next"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(30,42,58,0.9)', border: '1px solid #2a3a4a', cursor: 'pointer', color: '#fff' }}>›</button>
        </>
      )}
    </div>
  );
}
