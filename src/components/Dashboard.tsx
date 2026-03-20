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
};

export function Dashboard({
  stories,
  videoUrl,
  videoDate,
}: {
  stories: NarrativeGap[];
  videoUrl?: string;
  videoDate?: string;
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
      playlist.push({ type: 'youtube', embed_id: v.embed_id, channel: v.channel, storyTopic: story.topic, storyIndex: i + 1, duration: v.duration });
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
      } else {
        // For everything else, tick the timer (no auto-advance — user controls skip)
        setCurrentTime(prev => {
          if (prev >= dur) return dur;
          return prev + 0.5;
        });
      }
    }, 500);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIdx]);

  // Calculate overall playlist progress
  useEffect(() => {
    if (playlist.length === 0 || duration === 0) return;
    const segmentSize = 1 / playlist.length;
    const segmentProgress = Math.min(currentTime / duration, 1);
    setProgress(currentIdx * segmentSize + segmentProgress * segmentSize);
  }, [currentIdx, currentTime, duration, playlist.length]);

  // Within-story: next/prev clip
  const next = () => setCurrentIdx(prev => (prev + 1) % playlist.length);
  const prevItem = () => setCurrentIdx(prev => (prev - 1 + playlist.length) % playlist.length);

  // Between stories: skip to first clip of next/prev story
  const nextStory = () => {
    const nextBIdx = (currentBoundaryIdx + 1) % storyBoundaries.length;
    setCurrentIdx(storyBoundaries[nextBIdx].start);
  };
  const prevStory = () => {
    // If we're past the first clip in this story, go back to first clip
    if (currentBoundary && currentIdx > currentBoundary.start) {
      setCurrentIdx(currentBoundary.start);
    } else {
      const prevBIdx = (currentBoundaryIdx - 1 + storyBoundaries.length) % storyBoundaries.length;
      setCurrentIdx(storyBoundaries[prevBIdx].start);
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
      });
    }
    for (const c of (story.social_clips || [])) {
      if ((c as any).download_failed) continue;
      if (c.embed_id && (c.platform === 'tiktok' || c.platform === 'reels' || (c.platform === 'x' && (c as any).duration))) {
        linked.push({
          type: 'social',
          image: (c as any).thumbnail || story.image_file || '',
          topic: story.topic, index: i + 1, sources: story.sources || [],
          platform: c.platform as 'x' | 'tiktok' | 'reels',
          embedId: c.embed_id,
          clipLabel: c.title || (c as any).author || c.platform,
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

  // Build 10 tile pairs — each tile gets 2 random items from the pool to crossfade between
  const tilePairs: [TileContent, TileContent][] = [];
  for (let i = 0; i < 10; i++) {
    const a = pool[i % pool.length];
    const b = pool[(i + Math.max(1, Math.floor(pool.length / 2))) % pool.length];
    tilePairs.push([a, b]);
  }

  return (
    <section className="px-4 md:px-8" style={{ background: '#1e2a3a', height: 'calc(100vh - 104px)', overflow: 'hidden' }}>
      <div className="h-full grid grid-rows-3 grid-cols-5 gap-1">

        {/* ROW 1 */}
        <FadingTile pair={tilePairs[0]} delay={0} />
        <FadingTile pair={tilePairs[1]} delay={2} />
        <FadingTile pair={tilePairs[2]} delay={4} />
        <FadingTile pair={tilePairs[3]} delay={1} />
        <FadingTile pair={tilePairs[4]} delay={5} />

        {/* ROW 2 */}
        <FadingTile pair={tilePairs[5]} delay={3} />

        {/* CENTER PLAYER — large, spans 3 columns */}
        <div className="col-span-3 flex flex-col rounded-xl overflow-hidden" style={{ background: '#0a0a0a' }}>
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
              src={`https://www.youtube.com/embed/${current.embed_id}?autoplay=1&mute=${unmuted ? 0 : 1}&enablejsapi=1`}
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
          {/* CONTROLS BAR — below video */}
          <div className="px-2 py-1 bg-[#111] shrink-0">

            {/* Story progress — segmented by story */}
            {storyBoundaries.length > 1 && (
              <div className="relative mb-1">
              <button className="absolute left-0 top-0 bottom-0 z-10 px-1 flex items-center" style={{ background: 'linear-gradient(to right, #1e2a3a, transparent)' }}
                onClick={() => { const el = document.getElementById('story-timebar'); if (el) el.scrollBy({ left: -200, behavior: 'smooth' }); }}>
                <span className="text-white/60 text-[10px]">◀</span>
              </button>
              <div id="story-timebar" className="flex gap-0.5 overflow-x-auto px-5" style={{ scrollbarWidth: 'none' }}>
                {storyBoundaries.map((b, i) => {
                  const isActive = i === currentBoundaryIdx;
                  const isPast = currentBoundaryIdx > i;
                  const blues = ['#0f1f33', '#132740', '#172f4d', '#1b375a', '#1f3f67', '#234774', '#274f81', '#0f2540', '#14304f', '#19385c'];
                  const bg = isActive ? '#2563eb' : blues[i % blues.length];
                  return (
                    <div key={i} className="rounded cursor-pointer overflow-hidden px-2 py-1.5 flex items-center shrink-0 transition-all"
                      style={{ background: bg, opacity: isActive ? 1 : isPast ? 0.8 : 0.5, minWidth: 90 }}
                      onClick={() => setCurrentIdx(b.start)}>
                      <p className="text-[9px] leading-tight truncate text-white font-medium" style={{ opacity: isActive ? 1 : 0.8 }}>
                        {b.topic || `Story ${i + 1}`}
                      </p>
                    </div>
                  );
                })}
              </div>
              <button className="absolute right-0 top-0 bottom-0 z-10 px-1 flex items-center" style={{ background: 'linear-gradient(to left, #1e2a3a, transparent)' }}
                onClick={() => { const el = document.getElementById('story-timebar'); if (el) el.scrollBy({ left: 200, behavior: 'smooth' }); }}>
                <span className="text-white/60 text-[10px]">▶</span>
              </button>
              </div>
            )}

            {/* Controls row */}
            <div className="flex items-center gap-2">
              {/* Clip bar — shows clips within current story */}
              <div className="flex items-center gap-0.5 min-w-0 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {currentBoundary && Array.from({ length: currentBoundary.end - currentBoundary.start + 1 }, (_, ci) => {
                  const clipIdx = currentBoundary.start + ci;
                  const clip = playlist[clipIdx];
                  const isActiveClip = clipIdx === currentIdx;
                  return (
                    <div key={ci} className="rounded px-1.5 py-0.5 cursor-pointer shrink-0 transition-all"
                      style={{
                        background: isActiveClip ? '#4ade80' : 'rgba(255,255,255,0.1)',
                        minWidth: 60,
                      }}
                      onClick={() => setCurrentIdx(clipIdx)}>
                      <p className="text-[8px] truncate" style={{ color: isActiveClip ? '#000' : 'rgba(255,255,255,0.5)' }}>
                        {clip?.channel || clip?.storyTopic?.substring(0, 15) || `Clip ${ci + 1}`}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Story skip: |<< prev story */}
              <button onClick={prevStory} className="flex items-center justify-center p-1.5 hover:opacity-60 transition-opacity shrink-0" title="Previous story">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="3" y="5" width="2" height="14" /><polygon points="19 5 9 12 19 19" /></svg>
              </button>

              {/* Clip skip: < prev clip */}
              <button onClick={prevItem} className="flex items-center justify-center p-1.5 hover:opacity-60 transition-opacity shrink-0" title="Previous clip">
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[8px] border-r-white" />
              </button>

              {/* Clip skip: next clip > */}
              <button onClick={next} className="flex items-center justify-center p-1.5 hover:opacity-60 transition-opacity shrink-0" title="Next clip">
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white" />
              </button>

              {/* Story skip: next story >>| */}
              <button onClick={nextStory} className="flex items-center justify-center p-1.5 hover:opacity-60 transition-opacity shrink-0" title="Next story">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 5 15 12 5 19" /><rect x="19" y="5" width="2" height="14" /></svg>
              </button>

              {/* Divider */}
              <div className="w-px h-5 bg-white/20 shrink-0" />

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

        <FadingTile pair={tilePairs[6]} delay={6} />

        {/* ROW 3 */}
        <FadingTile pair={tilePairs[7]} delay={1.5} />
        <FadingTile pair={tilePairs[8]} delay={3.5} />
        <FadingTile pair={tilePairs[9]} delay={5.5} />
        <FadingTile pair={tilePairs[3]} delay={2.5} />
        <FadingTile pair={tilePairs[0]} delay={4.5} />
      </div>
    </section>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function FadingTile({ pair, delay }: {
  pair: [TileContent, TileContent];
  delay: number;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const pairRef = useRef(pair);
  pairRef.current = pair;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const schedule = (idx: number) => {
      const item = pairRef.current[idx];
      // YouTube tiles stay twice as long as social tiles
      const baseDuration = item.type === 'video' ? 16000 : 8000;
      timer = setTimeout(() => {
        if (cancelled) return;
        const next = (idx + 1) % 2;
        setActiveIdx(next);
        schedule(next);
      }, baseDuration + delay * 600);
    };

    timer = setTimeout(() => {
      if (cancelled) return;
      setActiveIdx(1);
      schedule(1);
    }, (pairRef.current[0].type === 'video' ? 8000 : 4000) + delay * 800);

    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]);

  const current = pair[activeIdx];
  const isVideo = current.type === 'video';
  const isSocial = current.type === 'social';
  const platformColors: Record<string, string> = { x: '#1d9bf0', tiktok: '#fe2c55', reels: '#c026d3' };
  const platformIcons: Record<string, string> = { x: '𝕏', tiktok: '♪', reels: '◎' };

  return (
    <a href={`#story-${current.index}`}
      onClick={(e) => {
        e.preventDefault();
        // Build video identifier from current tile content
        const embedId = current.type === 'video'
          ? current.image.match(/\/vi\/([^/]+)/)?.[1] || ''
          : current.embedId || '';
        const hash = embedId ? `story-${current.index}--${embedId}` : `story-${current.index}`;
        window.location.hash = hash;
        document.getElementById(`story-${current.index}`)?.scrollIntoView({ behavior: 'smooth' });
      }}
      className="relative rounded-xl overflow-hidden group cursor-pointer block">

      {pair.map((item, i) => (
        <div key={i} className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: activeIdx === i ? 1 : 0 }}>
          {item.type === 'video' ? (
            <div className="w-full h-full relative">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${item.image.match(/\/vi\/([^/]+)/)?.[1]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.image.match(/\/vi\/([^/]+)/)?.[1]}&showinfo=0&modestbranding=1&playsinline=1&enablejsapi=0&rel=0&iv_load_policy=3`}
                className="w-full h-full"
                style={{ border: 'none', pointerEvents: 'none' }}
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
          ) : item.type === 'social' && item.platform === 'x' && item.embedId ? (
            <div className="w-full h-full relative overflow-hidden" style={{ background: '#1e2a3a' }}>
              <iframe
                src={`https://platform.twitter.com/embed/Tweet.html?id=${item.embedId}&theme=dark&hideCard=false&hideThread=true&dnt=true`}
                className="absolute"
                style={{ border: 'none', pointerEvents: 'none', top: '-8px', left: '-8px', right: '-8px', bottom: '-8px', width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }}
                loading="lazy"
              />
            </div>
          ) : item.type === 'social' && item.platform === 'tiktok' && item.embedId ? (
            <div className="w-full h-full relative overflow-hidden" style={{ background: '#1e2a3a' }}>
              <iframe
                src={`https://www.tiktok.com/player/v1/${item.embedId}?rel=0&mute=1&autoplay=1`}
                className="w-full h-full"
                style={{ border: 'none', pointerEvents: 'none', transform: 'scale(1.3)', transformOrigin: 'center center' }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                loading="lazy"
              />
            </div>
          ) : item.type === 'social' ? (
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
          ) : item.image ? (
            <Image src={item.image} alt={item.topic} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-[#1a1a1a]" />
          )}
        </div>
      ))}

      {/* Only show overlays for non-embedded tiles (images). Embedded iframes (YouTube/TikTok/X) handle their own display */}
      {!(isVideo || (isSocial && current.embedId && (current.platform === 'tiktok' || current.platform === 'x'))) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          {/* Platform badge for social tiles */}
          {isSocial && current.platform && (
            <div className="absolute top-2 right-2">
              <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded"
                style={{ background: platformColors[current.platform] }}>
                {current.platform === 'x' ? '𝕏' : current.platform === 'tiktok' ? 'TikTok' : 'Reels'}
              </span>
            </div>
          )}

          {/* Info */}
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
    </a>
  );
}
