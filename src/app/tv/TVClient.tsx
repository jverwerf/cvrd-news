"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import type { NarrativeGap } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SiteNav } from "@/components/SiteNav";

interface QueuedClip {
  id: string;
  embed_id: string;
  platform: 'youtube' | 'x' | 'telegram' | 'tiktok' | 'reels';
  storyTopic: string;
  url: string;
  title?: string;
  channel?: string;
  duration?: number;
  thumbnail?: string;
}

const CHANNELS = [
  { id: 'breaking', label: 'Breaking', sub: 'Live updates', color: '#991b1b' },
  { id: 'daily', label: 'Daily Pick', sub: 'Today\'s top stories', color: '#3b82f6' },
  { id: 'world', label: 'World', sub: 'Global affairs', color: '#60a5fa' },
  { id: 'politics', label: 'Politics', sub: 'Left. Right. Uncovered.', color: '#818cf8' },
  { id: 'markets', label: 'Markets', sub: 'Economy & finance', color: '#38bdf8' },
  { id: 'sports', label: 'Sports', sub: 'The game behind the game', color: '#34d399' },
  { id: 'trending', label: 'Trending', sub: 'What everyone is talking about', color: '#a5b4fc' },
] as const;

export function TVClient({
  allStories,
  videoUrl,
  videoDate,
  initialChannel,
  isBreaking = false,
}: {
  allStories: NarrativeGap[];
  videoUrl?: string;
  videoDate?: string;
  initialChannel?: string;
  isBreaking?: boolean;
}) {
  const [activeChannel, setActiveChannel] = useState<string | null>(
    CHANNELS.find(ch => ch.id === initialChannel) ? (initialChannel ?? null) : null
  );
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [entered, setEntered] = useState(false);

  // Staggered reveal on mount
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Keyboard nav for TV remote
  useEffect(() => {
    if (activeChannel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setFocusedIdx(p => Math.min(p + 1, CHANNELS.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setFocusedIdx(p => Math.max(p - 1, 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        setActiveChannel(CHANNELS[focusedIdx].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeChannel, focusedIdx]);

  const getStories = (channelId: string) => {
    if (channelId === 'daily') {
      const top = allStories.filter(s => s.is_top_story);
      return top.length >= 10 ? top : allStories.slice(0, 10);
    }
    const filtered = allStories.filter(s => s.category === channelId);
    return filtered.length > 0 ? filtered : allStories.filter(s => !s.category);
  };

  // ── Landing screen ──
  if (!activeChannel) {
    return (
      <div className="tv-landing" style={{
        background: '#0a1018',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'var(--font-dm), -apple-system, sans-serif',
      }}>

        {/* Clean dark background — no gradients, no overlays */}

        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>

          <SiteNav isBreaking={isBreaking} />

          {/* Center content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, paddingBottom: '40px' }}>

            {/* Logo */}
            <div style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'scale(1)' : 'scale(0.9)',
              transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
              marginBottom: '8px',
            }}>
              <img src="/logo3.png" alt="CVRD" style={{
                height: '80px',
                filter: 'none',
              }} />
            </div>

            {/* Tagline */}
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.25em', textTransform: 'uppercase',
              fontWeight: 400, marginBottom: '48px',
              opacity: entered ? 1 : 0,
              transition: 'opacity 1s ease 0.5s',
            }}>
              Your streaming platform to cover the news
            </p>

            {/* Channel strip — horizontal, editorial */}
            <div style={{
              display: 'flex', alignItems: 'stretch', gap: '2px',
              maxWidth: '1100px', width: '90%',
              opacity: entered ? 1 : 0,
              transform: entered ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
            }}>
              {CHANNELS.map((ch, i) => {
                const count = ch.id === 'breaking'
                  ? 0 // live count, not from daily data
                  : ch.id === 'daily'
                  ? (allStories.filter(s => s.is_top_story).length >= 10 ? allStories.filter(s => s.is_top_story).length : Math.min(allStories.length, 10))
                  : allStories.filter(s => s.category === ch.id).length;
                const isFocused = focusedIdx === i;
                const isFirst = ch.id === 'daily';

                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    onMouseEnter={() => setFocusedIdx(i)}
                    className="tv-channel-btn"
                    style={{
                      flex: isFocused ? 2.2 : 1,
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      padding: isFocused ? '20px 24px' : '16px 14px',
                      background: isFocused
                        ? `linear-gradient(170deg, ${ch.color}18, ${ch.color}08 50%, rgba(10,16,24,0.95))`
                        : 'rgba(255,255,255,0.02)',
                      border: 'none', cursor: 'pointer',
                      borderTop: isFocused ? `2px solid ${ch.color}` : '2px solid transparent',
                      borderRadius: '4px',
                      minHeight: '160px',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      textAlign: 'left',
                      animationDelay: `${0.5 + i * 0.08}s`,
                    }}
                  >
                    {/* Hover glow */}
                    {isFocused && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '80px',
                        background: `linear-gradient(180deg, ${ch.color}12, transparent)`,
                        pointerEvents: 'none',
                      }} />
                    )}


                    {/* Channel number */}
                    <span style={{
                      fontSize: isFocused ? 11 : 10,
                      color: isFocused ? ch.color : 'rgba(255,255,255,0.12)',
                      fontWeight: 500, letterSpacing: '0.05em',
                      marginBottom: '8px',
                      fontVariantNumeric: 'tabular-nums',
                      transition: 'all 0.3s ease',
                    }}>
                      CH{String(i + 1).padStart(2, '0')}
                    </span>

                    {/* Label — Instrument Serif for focused */}
                    <span style={{
                      fontSize: isFocused ? 22 : 14,
                      fontFamily: isFocused ? "'Instrument Serif', Georgia, serif" : 'inherit',
                      fontWeight: isFocused ? 400 : 600,
                      color: isFocused ? '#fff' : 'rgba(255,255,255,0.45)',
                      lineHeight: 1.1,
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      marginBottom: '4px',
                    }}>
                      {ch.label}
                    </span>

                    {/* Subtitle — only when focused */}
                    <span style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.3)',
                      fontWeight: 400,
                      opacity: isFocused ? 1 : 0,
                      maxHeight: isFocused ? '20px' : '0',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                    }}>
                      {ch.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Headline preview — shows first story of focused channel */}
            <HeadlinePreview stories={allStories} channelId={CHANNELS[focusedIdx].id} color={CHANNELS[focusedIdx].color} entered={entered} />
          </div>

          {/* Bottom bar */}
          <div style={{
            padding: '0 40px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            opacity: entered ? 1 : 0,
            transition: 'opacity 0.8s ease 0.8s',
          }}>
            <a href="/" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textDecoration: 'none' }}>
              ← Back to cvrdnews.com
            </a>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.05em' }}>
              ← → Navigate &middot; Enter to select
            </span>
          </div>
        </div>

        <style>{`
          @keyframes tvPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .tv-channel-btn:hover {
            background: rgba(255,255,255,0.04) !important;
          }
        `}</style>
      </div>
    );
  }

  // ── Breaking TV ──
  if (activeChannel === 'breaking') {
    return <BreakingTV onBack={() => setActiveChannel(null)} />;
  }

  // ── Dashboard view ──
  const stories = getStories(activeChannel);
  const channel = CHANNELS.find(c => c.id === activeChannel)!;
  return <ChannelTV stories={stories} channel={channel} onBack={() => setActiveChannel(null)} />;
}

/** TV layout prefs — orientation + queue visibility, persisted across sessions */
function useTVLayout() {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [queueHidden, setQueueHidden] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cvrd-tv-orientation');
      if (saved === 'portrait' || saved === 'landscape') setOrientation(saved);
      else if (window.innerHeight > window.innerWidth) setOrientation('portrait');
      if (localStorage.getItem('cvrd-tv-queue-hidden') === '1') setQueueHidden(true);
    } catch {}
  }, []);

  const toggleOrientation = useCallback(() => {
    setOrientation(o => {
      const next = o === 'landscape' ? 'portrait' : 'landscape';
      try { localStorage.setItem('cvrd-tv-orientation', next); } catch {}
      return next;
    });
  }, []);

  const toggleQueue = useCallback(() => {
    setQueueHidden(h => {
      try { localStorage.setItem('cvrd-tv-queue-hidden', h ? '0' : '1'); } catch {}
      return !h;
    });
  }, []);

  return { orientation, queueHidden, toggleOrientation, toggleQueue };
}

function TVControls({ portrait, queueHidden, onToggleOrientation, onToggleQueue }: {
  portrait: boolean;
  queueHidden: boolean;
  onToggleOrientation: () => void;
  onToggleQueue: () => void;
}) {
  const btn: CSSProperties = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4, width: 26, height: 22, display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', padding: 0,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', marginLeft: 'auto', flexShrink: 0 }}>
      <button onClick={onToggleOrientation} title={portrait ? 'Switch to landscape layout' : 'Switch to portrait layout'}
        style={{ ...btn, color: 'rgba(255,255,255,0.6)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {portrait ? <rect x="3" y="7" width="18" height="10" rx="2" /> : <rect x="7" y="3" width="10" height="18" rx="2" />}
        </svg>
      </button>
      <button onClick={onToggleQueue} title={queueHidden ? 'Show up next' : 'Hide up next'}
        style={{ ...btn, color: queueHidden ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      </button>
    </div>
  );
}

/** Up-next queue — vertical side strip in landscape, horizontal bottom strip in portrait */
function QueueStrip({ portrait, currentClip, upcoming, playedIds, onSelect }: {
  portrait: boolean;
  currentClip: QueuedClip | null;
  upcoming: QueuedClip[];
  playedIds: Set<string>;
  onSelect: (clipId: string) => void;
}) {
  const header = (
    <div style={{ padding: '10px 12px 6px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', flexShrink: 0 }}>
      Up next · {upcoming.length}
    </div>
  );
  if (portrait) {
    return (
      <div style={{ height: 124, flexShrink: 0, background: '#0d0d0d', borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100 }}>
        {header}
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', overflowY: 'hidden' }}>
          {currentClip && <div style={{ width: 210, flexShrink: 0 }}><ClipTile clip={currentClip} state="playing" played={false} onClick={() => {}} /></div>}
          {upcoming.map((clip, i) => (
            <div key={clip.id} style={{ width: 210, flexShrink: 0 }}>
              <ClipTile clip={clip} state="queued" played={playedIds.has(clip.id)} index={i + 1} onClick={() => onSelect(clip.id)} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: 220, flexShrink: 0, background: '#0d0d0d', borderLeft: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100 }}>
      {header}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {currentClip && <ClipTile clip={currentClip} state="playing" played={false} onClick={() => {}} />}
        {upcoming.map((clip, i) => (
          <ClipTile key={clip.id} clip={clip} state="queued" played={playedIds.has(clip.id)} index={i + 1} onClick={() => onSelect(clip.id)} />
        ))}
      </div>
    </div>
  );
}

function ChannelTV({ stories, channel, onBack }: {
  stories: NarrativeGap[];
  channel: { id: string; label: string; color: string };
  onBack: () => void;
}) {
  const clips: QueuedClip[] = [];
  for (const story of stories) {
    for (const v of (story.youtube_videos || [])) {
      if (!v.embed_id) continue;
      clips.push({ id: `${story.topic}::yt::${v.embed_id}`, embed_id: v.embed_id, platform: 'youtube', storyTopic: story.topic, url: v.url || '', title: (v as any).title || v.channel || '', channel: v.channel, duration: v.duration });
    }
  }

  // survive page reloads: played + dead clip ids persist per channel/day.
  // The queue itself is rebuilt fresh from server data on every load, so NEW
  // videos always join automatically — resume only reorders (unplayed first)
  // and drops clips that previously errored (private/unavailable).
  const storeKey = `cvrd-tv-${channel.id}-${new Date().toISOString().slice(0, 10)}`;
  const readStore = () => {
    try { return JSON.parse(sessionStorage.getItem(storeKey) || "{}"); } catch { return {}; }
  };
  const [queue, setQueue] = useState<QueuedClip[]>(() => {
    const st = readStore();
    const played = new Set<string>(st.played || []);
    const dead = new Set<string>(st.dead || []);
    const alive = clips.filter(c => !dead.has(c.id));
    return [...alive.filter(c => !played.has(c.id)), ...alive.filter(c => played.has(c.id))];
  });
  const [playedIds, setPlayedIds] = useState<Set<string>>(() => new Set(readStore().played || []));
  const persist = (played: Set<string>, dead?: Set<string>) => {
    try {
      const st = readStore();
      sessionStorage.setItem(storeKey, JSON.stringify({
        played: [...played], dead: dead ? [...dead] : (st.dead || []) }));
    } catch {}
  };

  const advance = useCallback(() => {
    setQueue(q => {
      if (q.length === 0) return q;
      const [cur, ...rest] = q;
      setPlayedIds(p => { const n = new Set([...p, cur.id]); persist(n); return n; });
      return [...rest, cur];
    });
  }, []);

  const skipDead = useCallback(() => {
    setQueue(q => {
      if (q.length === 0) return q;
      const [cur, ...rest] = q;
      try {
        const st = readStore();
        const dead = new Set<string>(st.dead || []);
        dead.add(cur.id);
        sessionStorage.setItem(storeKey, JSON.stringify({ played: st.played || [], dead: [...dead] }));
      } catch {}
      return rest;   // dead clips leave the queue entirely
    });
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'infoDelivery' && data.info?.playerState === 0) advance();
        if (data.event === 'onError') skipDead();   // private/unavailable → drop and move on
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [advance, skipDead]);

  const currentClip = queue[0] ?? null;
  const currentStory = currentClip ? stories.find(s => s.topic === currentClip.storyTopic) ?? null : null;
  const upcoming = queue.slice(1);

  const { orientation, queueHidden, toggleOrientation, toggleQueue } = useTVLayout();
  const portrait = orientation === 'portrait';

  return (
    <div style={{ background: '#000', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: portrait ? 'column' : 'row' }}>
      {/* Dashboard */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="fixed top-0 left-0 h-10 flex items-center overflow-hidden" style={{ background: '#111', zIndex: 100, right: portrait || queueHidden ? 0 : 220 }}>
          <button onClick={onBack} className="shrink-0 px-4 h-full flex items-center gap-2 hover:bg-white/5 transition-colors"
            style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>←</span>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: channel.color }}>{channel.label}</span>
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-8 animate-[ticker_240s_linear_infinite] whitespace-nowrap pl-4">
              {[...stories, ...stories, ...stories].map((s, i) => (
                <span key={i} className="flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: channel.color }} />
                  <span className="text-[12px] text-white/70 font-medium">{s.topic}</span>
                  <span className="text-[#333] ml-2">&middot;</span>
                </span>
              ))}
            </div>
          </div>
          <TVControls portrait={portrait} queueHidden={queueHidden} onToggleOrientation={toggleOrientation} onToggleQueue={toggleQueue} />
        </div>
        <div style={{ paddingTop: '40px', flex: 1, minHeight: 0 }}>
          <ErrorBoundary>
            <Dashboard key={currentClip?.id} stories={currentStory ? [currentStory] : stories} tvMode orientation={orientation} startEmbedId={currentClip?.embed_id} />
          </ErrorBoundary>
        </div>
      </div>

      {/* Queue strip */}
      {!queueHidden && (
        <QueueStrip portrait={portrait} currentClip={currentClip} upcoming={upcoming} playedIds={playedIds}
          onSelect={(clipId) => setQueue(q => { const idx = q.findIndex(c => c.id === clipId); if (idx <= 0) return q; return [q[idx], ...q.slice(0, idx), ...q.slice(idx + 1)]; })}
        />
      )}

      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
      `}</style>
    </div>
  );
}

/** Shows a rotating headline from the focused channel */
function HeadlinePreview({ stories, channelId, color, entered }: {
  stories: NarrativeGap[]; channelId: string; color: string; entered: boolean;
}) {
  const [headlineIdx, setHeadlineIdx] = useState(0);

  const channelStories = channelId === 'daily'
    ? (stories.filter(s => s.is_top_story).length >= 10 ? stories.filter(s => s.is_top_story) : stories.slice(0, 10))
    : stories.filter(s => s.category === channelId);

  useEffect(() => {
    setHeadlineIdx(0);
  }, [channelId]);

  useEffect(() => {
    if (channelStories.length <= 1) return;
    const t = setInterval(() => setHeadlineIdx(p => (p + 1) % channelStories.length), 3000);
    return () => clearInterval(t);
  }, [channelId, channelStories.length]);

  const story = channelStories[headlineIdx];
  if (!story) return null;

  return (
    <div style={{
      marginTop: '28px', textAlign: 'center',
      maxWidth: '600px',
      opacity: entered ? 1 : 0,
      transition: 'opacity 0.8s ease 0.7s',
    }}>
      <p key={`${channelId}-${headlineIdx}`} style={{
        fontSize: 15,
        fontFamily: "'Instrument Serif', Georgia, serif",
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 400,
        fontStyle: 'italic',
        lineHeight: 1.4,
        animation: 'fadeIn 0.5s ease',
      }}>
        {story.topic}
      </p>
    </div>
  );
}

function toNarrativeGap(b: any): NarrativeGap {
  const ytVideos = (b.youtube_videos || []).length > 0
    ? b.youtube_videos
    : (b.clips || []).filter((c: any) => c.platform === 'youtube' && c.embed_id)
        .map((c: any) => ({ url: c.url || '', embed_id: c.embed_id, channel: c.title || 'Breaking', duration: c.duration, title: c.title }));
  const socialClips = (b.social_clips || []).length > 0
    ? b.social_clips
    : (b.clips || []).filter((c: any) => c.platform !== 'youtube' && c.embed_id)
        .map((c: any) => ({ platform: c.platform, url: c.url || '', embed_id: c.embed_id, title: c.title, author: c.author, duration: c.duration }));
  return {
    topic: b.topic || '', summary: b.summary || '', left_narrative: b.left_narrative || '',
    center_narrative: b.center_narrative || '', right_narrative: b.right_narrative || '',
    what_they_arent_telling_you: b.what_they_arent_telling_you || '',
    image_prompt: '', image_file: b.image_file, youtube_videos: ytVideos, social_clips: socialClips,
    sources: b.sources || [],
  };
}

/** Breaking TV — queue-based live TV player */
function BreakingTV({ onBack }: { onBack: () => void }) {
  // same reload-resilience as channel TV: played/dead ids persist per day
  const bStoreKey = `cvrd-tv-breaking-${new Date().toISOString().slice(0, 10)}`;
  const bRead = () => { try { return JSON.parse(sessionStorage.getItem(bStoreKey) || "{}"); } catch { return {}; } };
  const bPersist = (played: Iterable<string>, dead: Iterable<string>) => {
    try { sessionStorage.setItem(bStoreKey, JSON.stringify({ played: [...played], dead: [...dead] })); } catch {}
  };
  const deadRef = useRef<Set<string>>(new Set(bRead().dead || []));
  const [tvState, setTvState] = useState<{ queue: QueuedClip[]; playedIds: Set<string> }>(
    { queue: [], playedIds: new Set(bRead().played || []) });
  const [rawStories, setRawStories] = useState<any[]>([]);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const currentClip = tvState.queue[0] ?? null;
  const currentStory: NarrativeGap | null = (() => {
    if (!currentClip) return null;
    const raw = rawStories.find(s => s.topic === currentClip.storyTopic);
    return raw ? toNarrativeGap(raw) : null;
  })();

  const advance = useCallback(() => {
    setTvState(s => {
      if (s.queue.length === 0) return s;
      const [current, ...rest] = s.queue;
      const played = new Set([...s.playedIds, current.id]);
      bPersist(played, deadRef.current);
      return { queue: [...rest, current], playedIds: played };
    });
  }, []);

  // private/unavailable clips leave the queue for the day
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'onError') {
          setTvState(s => {
            if (s.queue.length === 0) return s;
            const [current, ...rest] = s.queue;
            deadRef.current.add(current.id);
            bPersist(s.playedIds, deadRef.current);
            return { queue: rest, playedIds: s.playedIds };
          });
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const fetchAndSync = useCallback(() => {
    Promise.all([
      fetch('/api/breaking/data').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/live-now/data').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([breakingData, liveData]) => {
      const breakingItems: any[] = breakingData ? (Array.isArray(breakingData) ? breakingData : [breakingData]) : [];
      const liveItems: any[] = liveData ? (Array.isArray(liveData) ? liveData : [liveData]) : [];
      const items = [...breakingItems, ...liveItems];
      if (items.length === 0) return;

      const activeTopics = new Set(items.map(s => s.topic));
      setRawStories(items);

      const newClips: QueuedClip[] = [];
      for (const story of items) {
        for (const v of (story.youtube_videos || [])) {
          if (!v.embed_id) continue;
          const id = `${story.topic}::yt::${v.embed_id}`;
          if (!knownIdsRef.current.has(id)) {
            knownIdsRef.current.add(id);
            newClips.push({ id, embed_id: v.embed_id, platform: 'youtube', storyTopic: story.topic, url: v.url || '', title: v.title || v.channel || '', channel: v.channel, duration: v.duration });
          }
        }
      }

      setTvState(s => {
        const fresh = newClips.filter(c => !deadRef.current.has(c.id));
        const currentPlaying = s.queue[0];
        const upcomingFiltered = s.queue.slice(1).filter(c => activeTopics.has(c.storyTopic) && !deadRef.current.has(c.id));
        // resume after a reload: already-played clips go behind unplayed ones
        const unplayed = fresh.filter(c => !s.playedIds.has(c.id));
        const replayed = fresh.filter(c => s.playedIds.has(c.id));
        return {
          queue: [...(currentPlaying ? [currentPlaying] : []), ...unplayed, ...upcomingFiltered, ...replayed],
          playedIds: s.playedIds,
        };
      });
    });
  }, []);

  useEffect(() => {
    fetchAndSync();
    const interval = setInterval(fetchAndSync, 120000);
    return () => clearInterval(interval);
  }, [fetchAndSync]);


  const { queue, playedIds } = tvState;
  const upcoming = queue.slice(1);

  const { orientation, queueHidden, toggleOrientation, toggleQueue } = useTVLayout();
  const portrait = orientation === 'portrait';

  if (queue.length === 0) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666', fontSize: 16 }}>No breaking news right now.</p>
        <button onClick={onBack} style={{ color: '#dc2626', fontSize: 13, marginTop: 16, background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to channels
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0a0a', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: portrait ? 'column' : 'row' }}>

      {/* Dashboard — main view */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Top bar */}
        <div style={{ height: 40, flexShrink: 0, background: 'linear-gradient(to right, #7f1d1d, #991b1b, #7f1d1d)', display: 'flex', alignItems: 'center', zIndex: 10 }}>
          <button onClick={onBack} style={{ padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>←</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#dc2626', padding: '2px 6px', borderRadius: 3 }}>LIVE</span>
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block', animation: 'tvPulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentClip?.storyTopic ?? ''}
            </span>
          </div>
          <TVControls portrait={portrait} queueHidden={queueHidden} onToggleOrientation={toggleOrientation} onToggleQueue={toggleQueue} />
        </div>

        {currentStory && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ErrorBoundary>
              <Dashboard key={currentClip?.id} stories={[currentStory]} tvMode orientation={orientation} onEnd={advance} startEmbedId={currentClip?.embed_id} />
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Queue strip */}
      {!queueHidden && (
        <QueueStrip portrait={portrait} currentClip={currentClip} upcoming={upcoming} playedIds={playedIds}
          onSelect={(clipId) => setTvState(s => {
            const idx = s.queue.findIndex(c => c.id === clipId);
            if (idx <= 0) return s;
            return { ...s, queue: [s.queue[idx], ...s.queue.slice(0, idx), ...s.queue.slice(idx + 1)] };
          })}
        />
      )}

      <style>{`
        @keyframes tvPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

function ClipTile({ clip, state, played, index, onClick }: {
  clip: QueuedClip;
  state: 'playing' | 'queued';
  played?: boolean;
  index?: number;
  onClick: () => void;
}) {
  const thumb = clip.platform === 'youtube'
    ? `https://img.youtube.com/vi/${clip.embed_id}/mqdefault.jpg`
    : clip.thumbnail;

  const PLATFORM_COLOR: Record<string, string> = { youtube: '#ff0000', x: '#1d9bf0', telegram: '#0088cc', tiktok: '#000', reels: '#e1306c' };
  const PLATFORM_LABEL: Record<string, string> = { youtube: 'YT', x: 'X', telegram: 'TG', tiktok: 'TT', reels: 'IG' };

  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'flex-start',
      background: state === 'playing' ? 'rgba(153,27,27,0.2)' : 'transparent',
      borderLeft: state === 'playing' ? '2px solid #991b1b' : '2px solid transparent',
      border: 'none', cursor: state === 'queued' ? 'pointer' : 'default',
      opacity: played ? 0.4 : 1,
      transition: 'all 0.2s ease',
      textAlign: 'left',
    }}>
      {/* Thumbnail */}
      <div style={{ width: 64, height: 36, flexShrink: 0, borderRadius: 3, overflow: 'hidden', background: '#1a1a1a', position: 'relative' }}>
        {thumb
          ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PLATFORM_COLOR[clip.platform] + '22' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: PLATFORM_COLOR[clip.platform] }}>{PLATFORM_LABEL[clip.platform]}</span>
            </div>
        }
        {state === 'playing' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(153,27,27,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>▶</span>
          </div>
        )}
        {index !== undefined && (
          <div style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{index}</div>
        )}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 10, color: state === 'playing' ? '#fca5a5' : played ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {clip.title || clip.channel || clip.storyTopic}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {clip.channel && clip.title ? `${clip.channel} · ${clip.storyTopic}` : clip.storyTopic}
        </p>
      </div>
    </button>
  );
}

function TVClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!time) return null;

  return (
    <span style={{
      fontSize: 12, color: 'rgba(255,255,255,0.2)',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '0.1em',
      fontWeight: 500,
    }}>
      {time}
    </span>
  );
}
