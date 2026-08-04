'use client';

import { useEffect, useRef, useState } from 'react';
import type { NarrativeGap } from '../lib/data';
import TweetFactCheck from './TweetFactCheck';

function topicToSlug(topic: string): string {
  return topic.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

type Clip = NonNullable<NarrativeGap['social_clips']>[number];

/**
 * Each side returns every post of that lean, with the headline pairing first,
 * so a column can scroll through the full set rather than showing one post.
 */
function pickSides(story: NarrativeGap): { left: Clip[]; center?: Clip[]; right: Clip[] } | null {
  const texts = (story.social_clips || []).filter(c => c.platform === 'x' && !c.duration && c.embed_id);
  const author = (c: Clip) => ((c as any).author || '').toLowerCase().trim();
  const ofLean = (lean: string) => texts.filter(c => (c as any).lean === lean);

  const left = ofLean('left')[0];
  if (!left) return null;
  const right = ofLean('right').find(c => c.embed_id !== left.embed_id && (!author(c) || author(c) !== author(left)));
  if (!right) return null;
  // Center must be a different account than both sides — the same outlet
  // appearing twice defeats the point of the column. No qualifying center →
  // the slide runs left VS right only.
  const usedAuthors = new Set([author(left), author(right)].filter(Boolean));
  const usedIds = new Set([left.embed_id, right.embed_id]);
  // Trending runs Media VS Fans only — no center column.
  const center = story.category === 'trending' ? undefined
    : ofLean('center').find(c => !usedIds.has(c.embed_id) && (!author(c) || !usedAuthors.has(author(c))));

  const leadFirst = (lean: string, lead: Clip) =>
    [lead, ...ofLean(lean).filter(c => c.embed_id !== lead.embed_id)];

  return {
    left: leadFirst('left', left),
    center: center ? leadFirst('center', center) : undefined,
    right: leadFirst('right', right),
  };
}

/**
 * A tweet sized to its own content. Cross-origin frames can't be measured, but
 * Twitter's embed broadcasts its rendered height, so listen for that and size
 * the box to match. Without it every tweet gets one fixed height and anything
 * with a photo or a long thread is clipped. Falls back to the fixed height if
 * the message never arrives.
 */
function TweetEmbed({ id, scale, fallbackHeight }: { id: string; scale: number; fallbackHeight: number }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [natural, setNatural] = useState<number | null>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const frame = frameRef.current;
      if (!frame || e.source !== frame.contentWindow) return;
      let data: any = e.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { return; }
      }
      const embed = data?.['twttr.embed'];
      if (!embed || embed.method !== 'twttr.private.resize') return;
      const p = embed.params?.[0];
      const h = typeof p?.height === 'number' ? p.height : p?.data?.height;
      if (typeof h === 'number' && h > 0) setNatural(h);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const inv = `${(100 / scale).toFixed(2)}%`;
  const boxHeight = natural ? Math.round(natural * scale) : fallbackHeight;

  return (
    <div className="relative overflow-hidden" style={{ height: boxHeight }}>
      <iframe
        ref={frameRef}
        src={`https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=dark&dnt=true`}
        scrolling="no" tabIndex={-1} loading="lazy"
        style={{
          border: 'none', pointerEvents: 'none',
          position: 'absolute', top: 0, left: 0,
          width: inv, height: natural ? natural : fallbackHeight / scale,
          transform: `scale(${scale})`, transformOrigin: 'top left',
        }}
      />
      {/* only meaningful while we're still on the fallback height */}
      {!natural && (
        <div className="absolute inset-x-0 bottom-0 h-6" style={{ background: 'linear-gradient(transparent, #1e2a3a)', pointerEvents: 'none' }} />
      )}
    </div>
  );
}

export function SidePanel({ clips, side, fan, height, tweetHeight = 230, scale = 1 }: {
  clips: Clip[]; side: 'left' | 'center' | 'right'; fan?: boolean;
  height: number; tweetHeight?: number; scale?: number;
}) {
  // Fan categories (sports/trending) use the Media/Analysts/Fans framing —
  // same slots, same colors as the story-page coverage panel.
  const color = fan
    ? (side === 'left' ? '#f59e0b' : side === 'right' ? '#34d399' : '#c084fc')
    : (side === 'left' ? '#60a5fa' : side === 'right' ? '#f87171' : '#a3a3a3');
  const label = fan
    ? (side === 'left' ? '◀ Media' : side === 'right' ? 'Fans ▶' : 'Analysts')
    : (side === 'left' ? '◀ From the left' : side === 'right' ? 'From the right ▶' : 'From the center');
  return (
    <div className="flex-1 min-w-0 flex flex-col rounded-md overflow-hidden" style={{ background: '#1e2a3a', border: `1px solid ${color}33`, height }}>
      <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] shrink-0 flex items-center justify-between gap-1" style={{ color, background: `${color}14` }}>
        <span className="truncate">{label}</span>
        {clips.length > 1 && <span style={{ opacity: 0.7 }}>{clips.length}</span>}
      </div>
      {/* every post on this side, scrolled rather than truncated */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-col-scroll">
        {clips.map(clip => (
          <div key={clip.embed_id} style={{ borderBottom: '1px solid #2a3a4a' }}>
            {/* interactive island inside the story link: expand must not navigate */}
            <div onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
              <TweetFactCheck fc={(clip as any).fact_check} compact />
            </div>
            <TweetEmbed id={clip.embed_id!} scale={scale} fallbackHeight={tweetHeight} />
          </div>
        ))}
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
export default function TheDivide({ stories, slugBase = '/story', row, columnHeight = 380, tweetHeight = 230, tweetScale = 1 }: {
  stories: NarrativeGap[];
  slugBase?: string;
  /** Keep the three leans on one row even in a column narrower than the
   *  container breakpoint. Pair with tweetScale so the embeds still fit. */
  row?: boolean;
  /** Height of each lean column; its posts scroll inside it. */
  columnHeight?: number;
  tweetHeight?: number;
  tweetScale?: number;
}) {
  const slides = stories
    .map(s => ({ story: s, sides: pickSides(s) }))
    .filter((x): x is { story: NarrativeGap; sides: { left: Clip[]; center?: Clip[]; right: Clip[] } } => x.sides !== null);
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
      <style>{`
        .divide-col-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .divide-col-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
      `}</style>
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease' }}>
        <a href={`${slugBase}/${topicToSlug(story.topic)}`}
          className="@container rounded-lg p-3 block hover:opacity-90 transition-opacity"
          style={{ background: '#1e2d3d', border: '1px solid #2a3a4a', textDecoration: 'none' }}>
          <p className="text-[12px] font-semibold text-white leading-snug mb-2 line-clamp-1">{story.topic}</p>
          {/* all leans side by side; stacked only on narrow screens */}
          <div className={`flex gap-2 ${row ? 'flex-row' : 'flex-col @min-[640px]:flex-row'}`}>
            <SidePanel clips={sides.left} side="left" fan={isFan} height={columnHeight} tweetHeight={tweetHeight} scale={tweetScale} />
            <div className={`${row ? 'flex' : 'hidden @min-[640px]:flex'} items-center text-[13px] font-black self-center shrink-0`} style={{ color: '#daa520' }}>VS</div>
            {sides.center && (<>
              <SidePanel clips={sides.center} side="center" fan={isFan} height={columnHeight} tweetHeight={tweetHeight} scale={tweetScale} />
              <div className={`${row ? 'flex' : 'hidden @min-[640px]:flex'} items-center text-[13px] font-black self-center shrink-0`} style={{ color: '#daa520' }}>VS</div>
            </>)}
            <SidePanel clips={sides.right} side="right" fan={isFan} height={columnHeight} tweetHeight={tweetHeight} scale={tweetScale} />
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
