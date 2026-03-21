"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import type { NarrativeGap } from "../lib/data";

type PlaylistItem = {
  type: 'anchor' | 'youtube' | 'tiktok' | 'reels' | 'x';
  url?: string;
  embed_id?: string;
  channel?: string;
  storyTopic?: string;
  storyIndex?: number;
  duration?: number;
  videoTitle?: string;
};

type TileContent = {
  type: 'image' | 'video' | 'social';
  image: string;
  topic: string;
  index: number;
  sources: { name: string; lean?: string }[];
  playlistIdx?: number;
  channel?: string;
  // Social clip info
  platform?: 'x' | 'tiktok' | 'reels';
  embedId?: string;
  clipLabel?: string;
  videoTitle?: string;
  isFresh?: boolean; // < 15 min old — tile should freeze
};

export function Dashboard({
  stories,
  videoUrl,
  videoDate,
  tvMode,
}: {
  stories: NarrativeGap[];
  videoUrl?: string;
  videoDate?: string;
  tvMode?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [unmuted, setUnmuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Build playlist — anchor first, then ALL videos from all stories
  const playlist: PlaylistItem[] = [];
  if (videoUrl) {
    if (videoUrl.includes('youtube.com/embed/')) {
      const ytId = videoUrl.split('/embed/')[1]?.split('?')[0];
      playlist.push({ type: 'youtube', embed_id: ytId, channel: 'CVRD Daily Brief', storyTopic: 'Daily Briefing', storyIndex: 0 });
    } else {
      playlist.push({ type: 'anchor', url: videoUrl, storyIndex: 0 });
    }
  }
  // Dashboard player: YouTube only (skip clips flagged as broken)
  for (const [i, story] of stories.entries()) {
    for (const v of (story.youtube_videos || [])) {
      if ((v as any).download_failed) continue;
      playlist.push({ type: 'youtube', embed_id: v.embed_id, channel: v.channel, storyTopic: story.topic, storyIndex: i + 1, duration: v.duration, videoTitle: (v as any).title || v.channel || '' });
    }
  }

  // Build story boundaries: storyIndex → [firstPlaylistIdx, lastPlaylistIdx]
  const storyBoundaries: { storyIndex: number; topic: string; start: number; end: number }[] = [];
  {
    let lastStoryIdx = -1;
    for (let i = 0; i < playlist.length; i++) {
      const si = playlist[i].storyIndex ?? -1;
      if (si !== lastStoryIdx) {
        if (storyBoundaries.length > 0) storyBoundaries[storyBoundaries.length - 1].end = i - 1;
        storyBoundaries.push({ storyIndex: si, topic: playlist[i].storyTopic || '', start: i, end: i });
        lastStoryIdx = si;
      }
    }
    if (storyBoundaries.length > 0) storyBoundaries[storyBoundaries.length - 1].end = playlist.length - 1;
  }

  const [currentIdx, setCurrentIdx] = useState(0);
  const current = playlist[currentIdx];

  // Determine which story group we're in
  const currentBoundary = storyBoundaries.find(b => currentIdx >= b.start && currentIdx <= b.end);
  const currentBoundaryIdx = storyBoundaries.findIndex(b => currentIdx >= b.start && currentIdx <= b.end);
  const clipInStory = currentBoundary ? currentIdx - currentBoundary.start + 1 : 1;
  const clipsInStory = currentBoundary ? currentBoundary.end - currentBoundary.start + 1 : 1;


  // Scroll timebars to active segment
  useEffect(() => {
    requestAnimationFrame(() => {
      document.getElementById('story-timebar')?.querySelector('[data-active="true"]')
        ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      document.getElementById('clip-timebar')?.querySelector('[data-active="true"]')
        ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }, [currentIdx]);

  // Track progress for ALL video types using timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentTime(0);
    const dur = current?.duration || (current?.type === 'anchor' ? 300 : 120);
    setDuration(dur);

    if (current?.type === 'anchor' && videoRef.current) {
      videoRef.current.muted = !unmuted;
      videoRef.current.volume = volume;
      videoRef.current.play().catch(() => {});
    }

    // Start timer
    timerRef.current = setInterval(() => {
      // For anchor, use real video time
      if (current?.type === 'anchor' && videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        setDuration(videoRef.current.duration || dur);
      } else if (current?.type === 'youtube') {
        // YouTube — just tick for progress display, DON'T auto-advance
        // The YouTube iframe end event listener handles advancing
        setCurrentTime(prev => prev + 0.5);
      } else {
        // TikTok/X — tick timer and auto-advance when done (no end event available)
        setCurrentTime(prev => {
          if (prev >= dur) {
            setCurrentIdx(p => (p + 1) % playlist.length);
            return 0;
          }
          return prev + 0.5;
        });
      }
    }, 500);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIdx]);

  // Listen for YouTube center player end event ONLY
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'infoDelivery' && data.info?.playerState === 0) {
          // Verify this came from the center player iframe, not a tile
          const centerPlayer = document.getElementById('yt-player') as HTMLIFrameElement;
          if (centerPlayer && e.source === centerPlayer.contentWindow) {
            setCurrentIdx(p => (p + 1) % playlist.length);
          }
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [playlist.length]);

  // Calculate overall playlist progress
  useEffect(() => {
    if (playlist.length === 0 || duration === 0) return;
    const segmentSize = 1 / playlist.length;
    const segmentProgress = Math.min(currentTime / duration, 1);
    setProgress(currentIdx * segmentSize + segmentProgress * segmentSize);
  }, [currentIdx, currentTime, duration, playlist.length]);

  // Within-story: next/prev clip
  const next = () => { if (playlist.length > 0) setCurrentIdx(prev => (prev + 1) % playlist.length); };
  const prevItem = () => { if (playlist.length > 0) setCurrentIdx(prev => (prev - 1 + playlist.length) % playlist.length); };

  // Between stories: skip to first clip of next/prev story
  const nextStory = () => {
    if (storyBoundaries.length === 0) return;
    const nextBIdx = (currentBoundaryIdx + 1) % storyBoundaries.length;
    setCurrentIdx(storyBoundaries[nextBIdx].start);
  };
  const prevStory = () => {
    if (storyBoundaries.length === 0) return;
    // If we're past the first clip in this story, go back to first clip
    if (currentBoundary && currentIdx > currentBoundary.start) {
      setCurrentIdx(currentBoundary.start);
    } else {
      const prevBIdx = (currentBoundaryIdx - 1 + storyBoundaries.length) % storyBoundaries.length;
      setCurrentIdx(storyBoundaries[prevBIdx].start);
    }
  };

  // Tile click → play that video in center player
  const handleTileClick = (embedId: string) => {
    const idx = playlist.findIndex(p => p.embed_id === embedId);
    if (idx >= 0) {
      setCurrentIdx(idx);
    }
  };

  const toggleSound = () => {
    const newUnmuted = !unmuted;
    setUnmuted(newUnmuted);
    // Anchor video
    if (videoRef.current) {
      videoRef.current.muted = !newUnmuted;
    }
    // YouTube center player ONLY
    const ytFrame = document.getElementById('yt-player') as HTMLIFrameElement;
    if (ytFrame?.contentWindow) {
      ytFrame.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: newUnmuted ? 'unMute' : 'mute',
      }), '*');
    }
  };

  // Build ALL linked content per story (YouTube + social clips)
  const storyLinked: Record<number, TileContent[]> = {};
  for (const [i, story] of stories.entries()) {
    const linked: TileContent[] = [];
    for (const v of (story.youtube_videos || [])) {
      linked.push({
        type: 'video',
        image: `https://img.youtube.com/vi/${v.embed_id}/hqdefault.jpg`,
        topic: story.topic, index: i + 1, sources: story.sources || [],
        channel: v.channel,
        videoTitle: (v as any).title || v.channel || '',
        isFresh: !!(v as any)._breaking,
      });
    }
    for (const c of (story.social_clips || [])) {
      if ((c as any).download_failed) continue;
      if (c.embed_id && (c.platform === 'tiktok' || c.platform === 'reels' || (c.platform === 'x' && ((c as any).duration || (c as any)._breaking)))) {
        linked.push({
          type: 'social',
          image: (c as any).thumbnail || story.image_file || '',
          topic: story.topic, index: i + 1, sources: story.sources || [],
          platform: c.platform as 'x' | 'tiktok' | 'reels',
          embedId: c.embed_id,
          clipLabel: c.title || (c as any).author || c.platform,
          isFresh: !!(c as any)._breaking,
        });
      }
    }
    if (linked.length > 0) storyLinked[i + 1] = linked;
  }

  // Build default tiles from OTHER stories (not the current one)
  const defaultTiles: TileContent[] = [];
  for (const [i, story] of stories.entries()) {
    if (story.image_file) {
      defaultTiles.push({ type: 'image', image: story.image_file, topic: story.topic, index: i + 1, sources: story.sources || [] });
    }
  }
  // Ensure we have at least one tile (fallback for breaking/single-story pages)
  if (defaultTiles.length === 0) {
    defaultTiles.push({ type: 'image', image: '', topic: stories[0]?.topic || 'Breaking', index: 1, sources: stories[0]?.sources || [] });
  }
  while (defaultTiles.length < 16) defaultTiles.push(...defaultTiles.slice(0, 16 - defaultTiles.length));

  // Get linked content for current context
  const currentStoryIdx = current?.storyIndex;
  let linkedContent: TileContent[] = [];

  if (currentStoryIdx && currentStoryIdx > 0) {
    // Playing a specific story's clip — show that story's videos
    linkedContent = storyLinked[currentStoryIdx] || [];
  } else if (currentStoryIdx === 0) {
    // Playing the anchor/daily briefing — show ALL videos from ALL stories
    // This shows the source material used in the briefing
    linkedContent = Object.values(storyLinked).flat();
  }

  // If no linked content, fall back to default tiles
  const pool = linkedContent.length > 0 ? linkedContent : defaultTiles;

  // Freezing logic for fresh/breaking content
  const freshCount = pool.filter(t => t.isFresh).length;
  const shouldFreeze = freshCount > 0 && freshCount <= 10;

  // Each tile gets a starting offset into the pool — cycles through ALL items
  const tileOffsets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i =>
    pool.length > 0 ? Math.floor((i / 10) * pool.length) % pool.length : 0
  );
  const tileIsFrozen = tileOffsets.map(offset => shouldFreeze && (pool[offset]?.isFresh || false));

  // Roaming ad: randomly picks a tile position, shows ad for 30s, hides for 90s, moves to new position
  const TILE_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // all tile indices
  const [adPosition, setAdPosition] = useState(-1); // -1 = no ad showing
  const [adKey, setAdKey] = useState(0); // force fresh ad mount

  useEffect(() => {
    let cancelled = false;

    const cycle = () => {
      // Wait 90s before showing ad
      setTimeout(() => {
        if (cancelled) return;
        // Pick random tile position
        const pos = TILE_POSITIONS[Math.floor(Math.random() * TILE_POSITIONS.length)];
        setAdPosition(pos);
        setAdKey(k => k + 1);

        // Show ad for 30s, then hide
        setTimeout(() => {
          if (cancelled) return;
          setAdPosition(-1);
          cycle();
        }, 30000);
      }, 90000);
    };

    // First ad after 60s
    const initial = setTimeout(() => {
      if (cancelled) return;
      const pos = TILE_POSITIONS[Math.floor(Math.random() * TILE_POSITIONS.length)];
      setAdPosition(pos);
      setAdKey(k => k + 1);

      setTimeout(() => {
        if (cancelled) return;
        setAdPosition(-1);
        cycle();
      }, 30000);
    }, 60000);

    return () => { cancelled = true; clearTimeout(initial); };
  }, []);

  return (
    <section style={{ background: '#1e2a3a', height: tvMode ? '100%' : 'calc(100vh - 104px)', overflow: 'hidden' }}>
      <div className="h-full grid grid-rows-3 grid-cols-4 gap-1">

        {/* ROW 1 */}
        {[0, 1, 2, 3].map(i => (
          <PoolTile key={i} pool={pool} startOffset={tileOffsets[i]} delay={[0, 2, 4, 1][i]} frozen={tileIsFrozen[i]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} showAd={adPosition === i} adKey={adKey} />
        ))}

        {/* ROW 2 */}
        <PoolTile pool={pool} startOffset={tileOffsets[4]} delay={5} frozen={tileIsFrozen[4]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} showAd={adPosition === 4} adKey={adKey} />

        <div className="col-span-2 flex flex-col rounded-xl overflow-hidden" style={{ background: '#0a0a0a' }}>
          <div className="flex-1 relative min-h-0">
          {current?.type === 'anchor' && current.url && (
            <video ref={videoRef} key="anchor" src={current.url}
              className="w-full h-full object-cover absolute inset-0"
              playsInline muted={!unmuted} onEnded={next}
              onTimeUpdate={() => { if (videoRef.current) setProgress(videoRef.current.currentTime); }}
              onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }} />
          )}
          {current?.type === 'youtube' && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://www.youtube-nocookie.com/embed/${current.embed_id}?autoplay=0&mute=${unmuted ? 0 : 1}&enablejsapi=1&rel=0&disablekb=1`}
              className="w-full h-full absolute inset-0" allowFullScreen id="yt-player" style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          )}
          {current?.type === 'tiktok' && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://www.tiktok.com/embed/v2/${current.embed_id}`}
              className="w-full h-full absolute inset-0" allowFullScreen allow="encrypted-media" style={{ border: 'none' }} />
          )}
          {current?.type === 'reels' && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://www.instagram.com/reel/${current.embed_id}/embed`}
              className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }} />
          )}
          {current?.type === 'x' && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://platform.twitter.com/embed/Tweet.html?id=${current.embed_id}&theme=light`}
              className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }} />
          )}
          </div>
          {/* CONTROLS BAR — below video (hidden in TV mode) */}
          <div className="px-2 py-1 bg-[#111] shrink-0" style={tvMode ? { display: 'none' } : {}}>

            {/* Story progress — segmented by story */}
            {storyBoundaries.length > 1 && (
              <div className="flex items-center gap-0.5 mb-1">
              <button className="shrink-0 px-1 py-1 flex items-center hover:opacity-70"
                onClick={() => { const el = document.getElementById('story-timebar'); if (el) el.scrollBy({ left: -200, behavior: 'smooth' }); }}>
                <span className="text-[10px]" style={{ color: '#3b82f6' }}>◀</span>
              </button>
              <div id="story-timebar" className="flex gap-0.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
                {storyBoundaries.map((b, i) => {
                  const isActive = i === currentBoundaryIdx;
                  const isPast = currentBoundaryIdx > i;
                  const blues = ['#0f1f33', '#132740', '#172f4d', '#1b375a', '#1f3f67', '#234774', '#274f81', '#0f2540', '#14304f', '#19385c'];
                  const bg = isActive ? '#2563eb' : blues[i % blues.length];
                  return (
                    <div key={i} data-active={isActive ? 'true' : undefined} className="rounded cursor-pointer overflow-hidden px-2 py-1.5 flex items-center shrink-0 transition-all"
                      style={{ background: bg, opacity: isActive ? 1 : isPast ? 0.8 : 0.5, minWidth: 90 }}
                      onClick={(e) => { setCurrentIdx(b.start); (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }}>
                      <p className="text-[9px] leading-tight truncate text-white font-medium" style={{ opacity: isActive ? 1 : 0.8 }}>
                        {b.topic || `Story ${i + 1}`}
                      </p>
                    </div>
                  );
                })}
              </div>
              <button className="shrink-0 px-1 py-1 flex items-center hover:opacity-70"
                onClick={() => { const el = document.getElementById('story-timebar'); if (el) el.scrollBy({ left: 200, behavior: 'smooth' }); }}>
                <span className="text-[10px]" style={{ color: '#3b82f6' }}>▶</span>
              </button>
              </div>
            )}

            {/* Controls row */}
            <div className="flex items-center gap-2">
              {/* Clip bar — same style as story bar, green, scrollable */}
              <div className="flex items-center gap-0.5 flex-1 min-w-0">
                <button className="shrink-0 px-1 py-1 flex items-center hover:opacity-70"
                  onClick={() => { const el = document.getElementById('clip-timebar'); if (el) el.scrollBy({ left: -150, behavior: 'smooth' }); }}>
                  <span className="text-[10px]" style={{ color: '#22c55e' }}>◀</span>
                </button>
                <div id="clip-timebar" className="flex gap-0.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
                  {currentBoundary && Array.from({ length: currentBoundary.end - currentBoundary.start + 1 }, (_, ci) => {
                    const clipIdx = currentBoundary.start + ci;
                    const clip = playlist[clipIdx];
                    const isActiveClip = clipIdx === currentIdx;
                    const isPastClip = clipIdx < currentIdx;
                    const greens = ['#0f2b1a', '#123320', '#153b26', '#18432c', '#1b4b32', '#1e5338', '#215b3e', '#0f2d1e', '#133524', '#173d2a'];
                    const bg = isActiveClip ? '#22c55e' : greens[ci % greens.length];
                    return (
                      <div key={ci} data-active={isActiveClip ? 'true' : undefined} className="rounded cursor-pointer overflow-hidden px-2 py-1.5 flex items-center shrink-0 transition-all"
                        style={{ background: bg, opacity: isActiveClip ? 1 : isPastClip ? 0.8 : 0.5, minWidth: 90 }}
                        onClick={(e) => { setCurrentIdx(clipIdx); (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }}>
                        <p className="text-[9px] leading-tight truncate text-white font-medium" style={{ opacity: isActiveClip ? 1 : 0.8 }}>
                          {clip?.videoTitle || clip?.channel || `Clip ${ci + 1}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <button className="shrink-0 px-1 py-1 flex items-center hover:opacity-70"
                  onClick={() => { const el = document.getElementById('clip-timebar'); if (el) el.scrollBy({ left: 150, behavior: 'smooth' }); }}>
                  <span className="text-[10px]" style={{ color: '#22c55e' }}>▶</span>
                </button>
              </div>

              <button onClick={prevStory} className="p-0.5 hover:opacity-60 shrink-0" title="Previous story">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><rect x="3" y="5" width="2" height="14" /><polygon points="19 5 9 12 19 19" /></svg>
              </button>
              <button onClick={prevItem} className="p-0.5 hover:opacity-60 shrink-0" title="Previous clip">
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-white" />
              </button>
              <span className="text-[7px] text-white/40 font-mono shrink-0">{currentBoundaryIdx + 1}/{storyBoundaries.length}·{clipInStory}/{clipsInStory}</span>
              <button onClick={next} className="p-0.5 hover:opacity-60 shrink-0" title="Next clip">
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white" />
              </button>
              <button onClick={nextStory} className="p-0.5 hover:opacity-60 shrink-0" title="Next story">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5 5 15 12 5 19" /><rect x="19" y="5" width="2" height="14" /></svg>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={toggleSound}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    {unmuted && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
                    {!unmuted && <><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>}
                  </svg>
                </button>
                <input type="range" min="0" max="1" step="0.05"
                  value={unmuted ? volume : 0}
                  className="w-20 h-1 shrink-0"
                  style={{ accentColor: 'white' }}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    setVolume(vol > 0 ? vol : volume);
                    setUnmuted(vol > 0);
                    // Control anchor video
                    if (videoRef.current) {
                      videoRef.current.volume = vol;
                      videoRef.current.muted = vol === 0;
                    }
                    // Control YouTube iframe
                    const ytFrame = document.getElementById('yt-player') as HTMLIFrameElement;
                    if (ytFrame?.contentWindow) {
                      ytFrame.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: vol === 0 ? 'mute' : 'unMute',
                      }), '*');
                      ytFrame.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'setVolume',
                        args: [Math.round(vol * 100)],
                      }), '*');
                    }
                  }} />
              </div>
            </div>
          </div>
        </div>

        <PoolTile pool={pool} startOffset={tileOffsets[5]} delay={3} frozen={tileIsFrozen[5]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} showAd={adPosition === 5} adKey={adKey} />

        {/* ROW 3 */}
        {[6, 7, 8, 9].map(i => (
          <PoolTile key={i} pool={pool} startOffset={tileOffsets[i]} delay={[6, 1.5, 3.5, 5.5][i - 6]} frozen={tileIsFrozen[i]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} showAd={adPosition === i} adKey={adKey} />
        ))}
      </div>
    </section>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PoolTile({ pool, startOffset, delay, frozen, onTileClick, showAd, adKey, skipEmbedId }: {
  pool: TileContent[];
  startOffset: number;
  delay: number;
  frozen?: boolean;
  onTileClick?: (embedId: string) => void;
  showAd?: boolean;
  adKey?: number;
  skipEmbedId?: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(startOffset);
  const [prevIdx, setPrevIdx] = useState(-1);
  const poolRef = useRef(pool);
  const skipRef = useRef(skipEmbedId);
  poolRef.current = pool;
  skipRef.current = skipEmbedId;

  // Helper: find next index that isn't the currently playing center video
  const getNextIdx = (fromIdx: number) => {
    const len = poolRef.current.length;
    let next = (fromIdx + 1) % len;
    // Skip items matching the center player's video (max 1 skip to avoid infinite loop)
    if (skipRef.current && len > 2) {
      const item = poolRef.current[next];
      const embedId = item.type === 'video'
        ? item.image.match(/\/vi\/([^/]+)/)?.[1] || ''
        : item.embedId || '';
      if (embedId === skipRef.current) {
        next = (next + 1) % len;
      }
    }
    return next;
  };

  useEffect(() => {
    if (frozen || pool.length <= 1) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (idx: number) => {
      const item = poolRef.current[idx % poolRef.current.length];
      const baseDuration = item.type === 'video' ? 16000 : 8000;
      timer = setTimeout(() => {
        if (cancelled) return;
        const nextIdx = getNextIdx(idx);
        setPrevIdx(idx);
        setCurrentIdx(nextIdx);
        schedule(nextIdx);
      }, baseDuration + delay * 600);
    };

    // Initial delay before first rotation
    const firstItem = poolRef.current[startOffset % poolRef.current.length];
    timer = setTimeout(() => {
      if (cancelled) return;
      const nextIdx = (startOffset + 1) % poolRef.current.length;
      setPrevIdx(startOffset);
      setCurrentIdx(nextIdx);
      schedule(nextIdx);
    }, (firstItem.type === 'video' ? 8000 : 4000) + delay * 800);

    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, frozen, pool.length]);

  const current = pool[currentIdx % pool.length];
  const prev = prevIdx >= 0 ? pool[prevIdx % pool.length] : null;
  const isVideo = current.type === 'video';
  const isSocial = current.type === 'social';
  const platformColors: Record<string, string> = { x: '#1d9bf0', tiktok: '#fe2c55', reels: '#c026d3' };
  const platformIcons: Record<string, string> = { x: '𝕏', tiktok: '♪', reels: '◎' };

  return (
    <div
      style={frozen ? { boxShadow: '0 0 12px 2px rgba(239,68,68,0.6), inset 0 0 12px rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)' } : {}}
      onClick={() => {
        const embedId = current.type === 'video'
          ? current.image.match(/\/vi\/([^/]+)/)?.[1] || ''
          : current.embedId || '';
        if (onTileClick && embedId) {
          onTileClick(embedId);
        } else {
          document.getElementById(`story-${current.index}`)?.scrollIntoView({ behavior: 'smooth' });
        }
      }}
      className="relative rounded-xl overflow-hidden group cursor-pointer block">

      {frozen && (
        <div className="absolute top-2 right-2 z-20">
          <span className="text-[8px] font-bold text-white px-2 py-0.5 rounded animate-pulse"
            style={{ background: '#dc2626', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}>
            NEW
          </span>
        </div>
      )}

      {/* Current item */}
      <div className="absolute inset-0">
        <TileContentRenderer item={current} />
      </div>

      {/* Overlays for image/text tiles */}
      {!(isVideo || (isSocial && current.embedId && (current.platform === 'tiktok' || current.platform === 'x'))) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          {isSocial && current.platform && (
            <div className="absolute top-2 right-2">
              <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded"
                style={{ background: platformColors[current.platform] }}>
                {current.platform === 'x' ? '𝕏' : current.platform === 'tiktok' ? 'TikTok' : 'Reels'}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="text-[11px] md:text-[12px] font-bold text-white leading-snug line-clamp-2">
              {isSocial ? (current.clipLabel || current.topic) : (current.videoTitle || current.channel || current.topic)}
            </h3>
            {!isSocial && current.sources.length > 0 && (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {current.sources.slice(0, 3).map((s, i) => (
                  <span key={i} className="text-[8px] font-medium text-white/50 px-1 py-0.5 rounded"
                    style={{ background: s.lean === 'left' ? 'rgba(59,130,246,0.3)' : s.lean === 'right' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)' }}>
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Ad overlay — fades in/out over this tile when selected */}
      {showAd && (
        <div className="absolute inset-0 z-30 rounded-xl overflow-hidden animate-[fadeIn_1s_ease-in-out]"
          style={{ background: '#1a2535' }}>
          <div className="absolute top-1.5 right-2 z-10">
            <span className="text-[7px] font-medium text-white/20 uppercase tracking-wider">Sponsored</span>
          </div>
          <div className="w-full h-full flex items-center justify-center p-1">
            <AdSlot key={adKey} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Mounts a fresh AdSense ad — unmounts cleanly when removed */
function AdSlot() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div ref={ref} className="w-full h-full">
      <ins className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-2572735826517528"
        data-ad-slot="8292849831"
        data-ad-format="fluid"
        data-full-width-responsive="false" />
    </div>
  );
}

/** Renders tile content — shared between PoolTile and AdTile */
function TileContentRenderer({ item }: { item: TileContent }) {
  const platformColors: Record<string, string> = { x: '#1d9bf0', tiktok: '#fe2c55', reels: '#c026d3' };

  if (item.type === 'video') {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <iframe
          src={`/api/yt-tile?v=${item.image.match(/\/vi\/([^/]+)/)?.[1]}`}
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none', pointerEvents: 'none', transform: 'scale(1.5)', transformOrigin: 'center center' }}
          allow="autoplay"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: '#f00' }}>YouTube</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 z-10 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-[10px] text-white/90 leading-snug line-clamp-1">{item.videoTitle || item.channel}</p>
        </div>
      </div>
    );
  }
  if (item.type === 'social' && item.platform === 'x' && item.embedId) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: '#1e2a3a' }}>
        <iframe
          src={`https://platform.twitter.com/embed/Tweet.html?id=${item.embedId}&theme=dark&hideCard=false&hideThread=true&dnt=true`}
          className="absolute"
          style={{ border: 'none', pointerEvents: 'none', top: '-8px', left: '-8px', right: '-8px', bottom: '-8px', width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }}
          loading="lazy"
        />
      </div>
    );
  }
  if (item.type === 'social' && item.platform === 'tiktok' && item.embedId) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: '#1e2a3a' }}>
        <iframe
          src={`https://www.tiktok.com/player/v1/${item.embedId}?rel=0&mute=1&autoplay=1`}
          className="w-full h-full"
          style={{ border: 'none', pointerEvents: 'none', transform: 'scale(1.3)', transformOrigin: 'center center' }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          loading="lazy"
        />
      </div>
    );
  }
  if (item.type === 'social') {
    return (
      <div className="w-full h-full relative flex flex-col justify-between p-3" style={{ background: '#1e2a3a' }}>
        <div>
          <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded inline-block mb-2"
            style={{ background: platformColors[item.platform || 'x'] }}>
            {item.platform === 'x' ? '𝕏' : item.platform === 'tiktok' ? 'TikTok' : 'Reels'}
          </span>
          <p className="text-[11px] text-white/90 leading-[1.5] line-clamp-5">{item.clipLabel}</p>
        </div>
        <p className="text-[9px] text-white/40 truncate">{item.topic}</p>
      </div>
    );
  }
  if (item.image) {
    return <Image src={item.image} alt={item.topic} fill className="object-cover" />;
  }
  return <div className="w-full h-full bg-[#1a1a1a]" />;
}

