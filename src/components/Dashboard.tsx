"use client";

import { useRef, useEffect, useState } from "react";
import { TileAdBanner } from "./AdBanners";
import Image from "next/image";
import type { NarrativeGap } from "../lib/data";

type PlaylistItem = {
  type: 'anchor' | 'youtube' | 'tiktok' | 'reels' | 'x' | 'telegram';
  url?: string;
  embed_id?: string;
  channel?: string;
  storyTopic?: string;
  storyIndex?: number;
  duration?: number;
  videoTitle?: string;
  thumbnail?: string;
  isSocial?: boolean;
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
  platform?: 'x' | 'tiktok' | 'reels' | 'telegram' | 'reddit';
  embedId?: string;
  clipLabel?: string;
  videoTitle?: string;
  url?: string;
  isFresh?: boolean; // < 15 min old — tile should freeze
  duration?: number; // has video if set
};

export function Dashboard({
  stories,
  videoUrl,
  videoDate,
  tvMode,
  noAutoPlay,
  compact,
  tilesOnly,
  onEnd,
  startEmbedId,
}: {
  stories: NarrativeGap[];
  videoUrl?: string;
  videoDate?: string;
  tvMode?: boolean;
  noAutoPlay?: boolean;
  compact?: boolean;
  tilesOnly?: boolean;
  onEnd?: () => void;
  startEmbedId?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<HTMLIFrameElement>(null);
  const [inView, setInView] = useState(true);
  const [unmuted, setUnmuted] = useState(false);
  const [showVolSlider, setShowVolSlider] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pause tiles when Dashboard is not in view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Drag-to-center: override video from tile drag
  const [overrideVideo, setOverrideVideo] = useState<{ type: string; embed_id: string; title: string; url?: string } | null>(null);
  const [dropHighlight, setDropHighlight] = useState(false);

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
  // Dashboard player: YouTube + social clips with video (X, Telegram, TikTok)
  for (const [i, story] of stories.entries()) {
    for (const v of (story.youtube_videos || [])) {
      if ((v as any).download_failed) continue;
      playlist.push({ type: 'youtube', embed_id: v.embed_id, channel: v.channel, storyTopic: story.topic, storyIndex: i + 1, duration: v.duration, videoTitle: (v as any).title || v.channel || '' });
    }
  }
  // Social clips below YT — auto-advance after 60s
  for (const [i, story] of stories.entries()) {
    for (const c of (story.social_clips || [])) {
      if ((c as any).download_failed || !c.embed_id) continue;
      if ((c.platform === 'x' || c.platform === 'telegram') && c.duration) {
        playlist.push({ type: c.platform as any, embed_id: c.embed_id, url: c.url, channel: c.author || c.platform, storyTopic: story.topic, storyIndex: i + 1, duration: 60, videoTitle: c.title || c.author || c.platform, isSocial: true });
      } else if (c.platform === 'tiktok' && c.embed_id && /^\d+$/.test(c.embed_id)) {
        playlist.push({ type: 'tiktok', embed_id: c.embed_id, url: c.url, channel: c.author || 'TikTok', storyTopic: story.topic, storyIndex: i + 1, duration: 60, videoTitle: c.title || c.author || 'TikTok', thumbnail: (c as any).thumbnail, isSocial: true });
      }
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
  useEffect(() => {
    if (!startEmbedId) return;
    const idx = playlist.findIndex(p => p.embed_id === startEmbedId);
    if (idx > 0) setCurrentIdx(idx);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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

    // noAutoPlay: don't start videos or timers automatically
    if (noAutoPlay) return;

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
  }, [currentIdx, noAutoPlay]);

  // Listen for YouTube center player end event (skip if noAutoPlay)
  useEffect(() => {
    if (noAutoPlay) return;
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'infoDelivery' && data.info?.playerState === 0) {
          if (onEnd) {
            onEnd();
          } else {
            setCurrentIdx(p => (p + 1) % playlist.length);
          }
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [playlist.length, noAutoPlay]);

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
      setOverrideVideo(null);
    }
  };

  const toggleSound = () => {
    const newUnmuted = !unmuted;
    setUnmuted(newUnmuted);
    // Control ALL video elements in center player
    const centerPlayer = document.querySelector('.col-span-2');
    if (centerPlayer) {
      centerPlayer.querySelectorAll('video').forEach(v => {
        v.muted = !newUnmuted;
        if (newUnmuted) v.volume = volume;
      });
    }
    // YouTube center player
    const ytFrame = ytPlayerRef.current;
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
      // Only video clips in tiles — X and Telegram need duration (= has video), TikTok/Reels always have video
      const isVideo = c.platform === 'tiktok' || c.platform === 'reels' || ((c.platform === 'x' || c.platform === 'telegram') && c.duration);
      if (c.embed_id && isVideo) {
        // Telegram thumbnails must go through proxy (direct CDN URLs blocked by referrer)
        const thumbImg = c.platform === 'telegram'
          ? `/api/tg-video?post=${c.embed_id}&thumb=1`
          : c.platform === 'x'
          ? `/api/x-video?id=${c.embed_id}&thumb=1`
          : c.platform === 'tiktok' && /^\d+$/.test(c.embed_id)
          ? `/api/tt-video?id=${c.embed_id}&thumb=1`
          : (c as any).thumbnail || story.image_file || '';
        linked.push({
          type: 'social',
          image: thumbImg,
          topic: story.topic, index: i + 1, sources: story.sources || [],
          platform: c.platform as 'x' | 'tiktok' | 'reels' | 'telegram' | 'reddit',
          embedId: c.embed_id,
          clipLabel: c.title || (c as any).author || c.platform,
          isFresh: !!(c as any)._breaking,
          duration: c.duration,
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

  // Build text tweet pool for tweet takeover mode
  const textTweets: TileContent[] = [];
  if (currentStoryIdx !== undefined && currentStoryIdx > 0) {
    const story = stories[currentStoryIdx - 1];
    for (const c of (story?.social_clips || [])) {
      if (c.platform === 'x' && c.embed_id && !c.duration) {
        textTweets.push({
          type: 'social', image: '', topic: story.topic, index: currentStoryIdx,
          sources: story.sources || [], platform: 'x', embedId: c.embed_id,
          clipLabel: c.title || (c as any).author || 'X',
        });
      }
    }
  }

  // Tweet takeover: after 60s, if 10+ text tweets, show them in tiles
  const [tweetTakeover, setTweetTakeover] = useState(false);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    mountTimeRef.current = Date.now();
    setTweetTakeover(false);
  }, [currentIdx]);

  useEffect(() => {
    if (textTweets.length < 10) return;
    let cancelled = false;

    // After 60s show tweets
    const showTimer = setTimeout(() => {
      if (cancelled) return;
      setTweetTakeover(true);
      // After 30s switch back to videos, then cycle again
      const hideTimer = setTimeout(() => {
        if (cancelled) return;
        setTweetTakeover(false);
        // Repeat the cycle
        const cycleInterval = setInterval(() => {
          if (cancelled) return;
          setTweetTakeover(true);
          setTimeout(() => { if (!cancelled) setTweetTakeover(false); }, 30000);
        }, 90000); // 60s videos + 30s tweets = 90s cycle
        return () => clearInterval(cycleInterval);
      }, 30000);
      return () => clearTimeout(hideTimer);
    }, 60000);

    return () => { cancelled = true; clearTimeout(showTimer); };
  }, [currentIdx, textTweets.length]);

  // If no linked content, fall back to default tiles
  const videoPool = linkedContent.length > 0 ? linkedContent : defaultTiles;
  const pool = (tweetTakeover && textTweets.length >= 10) ? textTweets : videoPool;

  // Freezing logic for fresh/breaking content
  const freshCount = pool.filter(t => t.isFresh).length;
  const shouldFreeze = freshCount > 0 && freshCount <= 10;

  // Each tile gets a starting offset into the pool — cycles through ALL items
  const tileOffsets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i =>
    pool.length > 0 ? Math.floor((i / 10) * pool.length) % pool.length : 0
  );
  const tileIsFrozen = tileOffsets.map(offset => !inView || (shouldFreeze && (pool[offset]?.isFresh || false)));

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

    // First ad immediately (5s delay for page load)
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
    }, 5000);

    return () => { cancelled = true; clearTimeout(initial); };
  }, []);

  const activeType = overrideVideo?.type || current?.type;
  const needsExtraHeight = activeType === 'x' || activeType === 'tiktok';

  if (tilesOnly) {
    return (
      <section style={{ background: '#1e2a3a', height: '100%', overflow: 'hidden' }}>
        <div className="h-full grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map(i => (
            <PoolTile key={i} pool={pool} startOffset={tileOffsets[i]} delay={[0, 2, 4, 1][i]} frozen={tileIsFrozen[i]} skipEmbedId={undefined} onPlayInCenter={undefined} showAd={adPosition === i} adKey={adKey} tvMode={true} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} style={{ background: '#1e2a3a', height: compact ? '100%' : tvMode ? '100%' : 'calc(100vh - 122px)', overflow: 'hidden', display: 'flex' }}>
      <style>{`
        @media (max-width: 600px) {
          .dash-side-tile { display: none !important; }
          .dash-center { grid-column: span 4 / span 4 !important; }
          .dash-compact .dash-top-tile { display: none !important; }
          .dash-compact .dash-center { grid-row: 1 / -1 !important; }
          .dash-clip-strip { display: none !important; }
        }
      `}</style>
      <div className={`h-full grid ${compact ? 'grid-rows-2 dash-compact' : 'grid-rows-3'} grid-cols-4 gap-1 flex-1 min-w-0`}>

        {/* ROW 1 */}
        {[0, 1, 2, 3].map(i => (
          <PoolTile key={i} pool={pool} startOffset={tileOffsets[i]} delay={[0, 2, 4, 1][i]} frozen={tileIsFrozen[i]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} onPlayInCenter={setOverrideVideo} showAd={adPosition === i} adKey={adKey} tvMode={tvMode} className="dash-top-tile" />
        ))}

        {/* ROW 2 */}
        <PoolTile pool={pool} startOffset={tileOffsets[4]} delay={5} frozen={tileIsFrozen[4]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} onPlayInCenter={setOverrideVideo} showAd={adPosition === 4} adKey={adKey} tvMode={tvMode} className="dash-side-tile" />

        <div className="col-span-2 dash-center flex flex-col rounded-xl overflow-hidden" style={{ background: '#0a0a0a', ...(needsExtraHeight ? { gridRow: 'span 2 / span 2' } : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDropHighlight(true); }}
          onDragLeave={() => setDropHighlight(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropHighlight(false);
            try {
              const data = JSON.parse(e.dataTransfer.getData('text/plain'));
              if (data.embed_id) setOverrideVideo(data);
            } catch {}
          }}>
          <div className="flex-1 relative min-h-0" style={dropHighlight ? { outline: '2px solid #3b82f6', outlineOffset: '-2px' } : {}}>

          {/* Override video from drag */}
          {overrideVideo && (
            <>
              {overrideVideo.type === 'youtube' && (
                <iframe key={`override-${overrideVideo.embed_id}`}
                  src={`https://www.youtube.com/embed/${overrideVideo.embed_id}?autoplay=1&mute=1&enablejsapi=1&rel=0`}
                  className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              )}
              {overrideVideo.type === 'x' && (
                <iframe key={`override-${overrideVideo.embed_id}`}
                  src={`https://platform.twitter.com/embed/Tweet.html?id=${overrideVideo.embed_id}&theme=dark&dnt=true`}
                  className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }} />
              )}
              {overrideVideo.type === 'telegram' && (
                <VideoThumb
                  thumbSrc={`/api/tg-video?post=${overrideVideo.embed_id}&thumb=1`}
                  url={overrideVideo.url || `https://t.me/${overrideVideo.embed_id}`}
                  badge="Telegram" badgeColor="#0088cc"
                  label={overrideVideo.title}
                />
              )}
              {overrideVideo.type === 'tiktok' && (
                <iframe key={`override-${overrideVideo.embed_id}`}
                  src={`https://www.tiktok.com/embed/v2/${overrideVideo.embed_id}`}
                  className="w-full h-full absolute inset-0" allowFullScreen allow="encrypted-media" style={{ border: 'none' }} />
              )}
              {/* X button to exit override */}
              <button onClick={() => setOverrideVideo(null)}
                className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                <span className="text-white text-[16px] leading-none">×</span>
              </button>
              {/* Title bar */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 z-10" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <span className="text-[10px] text-white/80">{overrideVideo.title}</span>
              </div>
            </>
          )}

          {/* Normal playlist video (hidden when override active) */}
          {!overrideVideo && current?.type === 'anchor' && current.url && (
            <video ref={videoRef} key="anchor" src={current.url}
              className="w-full h-full object-cover absolute inset-0"
              playsInline muted={!unmuted} onEnded={next}
              onTimeUpdate={() => { if (videoRef.current) setProgress(videoRef.current.currentTime); }}
              onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }} />
          )}
          {!overrideVideo && current?.type === 'youtube' && current.embed_id && (
            <iframe key={current.embed_id} ref={ytPlayerRef}
              src={`https://www.youtube.com/embed/${current.embed_id}?autoplay=${noAutoPlay ? 0 : 1}&mute=1&enablejsapi=1&rel=0&disablekb=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
              onLoad={() => {
                const win = ytPlayerRef.current?.contentWindow;
                if (!win) return;
                // Re-register for API events — required after each iframe load
                const listenCmd = JSON.stringify({ event: 'listening', id: 'yt-player' });
                setTimeout(() => { win.postMessage(listenCmd, '*'); }, 500);
                setTimeout(() => { win.postMessage(listenCmd, '*'); }, 1500);
                // Unmute if user has unmuted, or always on TV mode (user clicked channel = interaction)
                if (unmuted || tvMode) {
                  if (tvMode && !unmuted) setUnmuted(true);
                  const unmuteFn = () => {
                    win.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
                    win.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }), '*');
                  };
                  setTimeout(unmuteFn, 1000);
                  setTimeout(unmuteFn, 2000);
                }
              }}
              className="w-full h-full absolute inset-0" allowFullScreen id="yt-player" style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          )}
          {!overrideVideo && current?.type === 'tiktok' && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://www.tiktok.com/embed/v2/${current.embed_id}`}
              className="w-full h-full absolute inset-0" allowFullScreen allow="encrypted-media" style={{ border: 'none' }} />
          )}
          {!overrideVideo && current?.type === 'reels' && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://www.instagram.com/reel/${current.embed_id}/embed`}
              className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }} />
          )}
          {!overrideVideo && current?.type === 'x' && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://platform.twitter.com/embed/Tweet.html?id=${current.embed_id}&theme=dark&dnt=true`}
              className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }} />
          )}
          {!overrideVideo && current?.type === 'telegram' && current.embed_id && (
            <VideoThumb
              thumbSrc={`/api/tg-video?post=${current.embed_id}&thumb=1`}
              url={current.url || `https://t.me/${current.embed_id}`}
              badge="Telegram" badgeColor="#0088cc"
              label={current.videoTitle || current.channel}
            />
          )}
          {/* Volume overlay — bottom-left corner of video */}
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.55)', pointerEvents: 'auto' }}>
            <button onClick={toggleSound} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                {unmuted && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
                {!unmuted && <><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>}
              </svg>
            </button>
            <input type="range" min="0" max="1" step="0.05"
              value={unmuted ? volume : 0}
              style={{ width: 60, accentColor: 'white', cursor: 'pointer' }}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                setVolume(vol > 0 ? vol : volume);
                setUnmuted(vol > 0);
                const centerPlayer = document.querySelector('.col-span-2');
                if (centerPlayer) centerPlayer.querySelectorAll('video').forEach(v => { v.volume = vol; v.muted = vol === 0; });
                const ytFrame = ytPlayerRef.current;
                if (ytFrame?.contentWindow) {
                  ytFrame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: vol === 0 ? 'mute' : 'unMute' }), '*');
                  ytFrame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(vol * 100)] }), '*');
                }
              }} />
          </div>
          </div>
        </div>

        <PoolTile pool={pool} startOffset={tileOffsets[5]} delay={3} frozen={tileIsFrozen[5]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} onPlayInCenter={setOverrideVideo} showAd={adPosition === 5} adKey={adKey} tvMode={tvMode} className="dash-side-tile" />

        {/* ROW 3 — hidden when compact; tiles 7+8 hidden when center needs extra height */}
        {!compact && [6, 7, 8, 9].map(i => {
          if (needsExtraHeight && (i === 7 || i === 8)) return null;
          return <PoolTile key={i} pool={pool} startOffset={tileOffsets[i]} delay={[6, 1.5, 3.5, 5.5][i - 6]} frozen={tileIsFrozen[i]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} onPlayInCenter={setOverrideVideo} showAd={adPosition === i} adKey={adKey} tvMode={tvMode} />;
        })}
      </div>

      {/* Clip strip — right side */}
      {!tvMode && <div className="dash-clip-strip" style={{ width: 200, flexShrink: 0, background: '#1e2a3a', borderLeft: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {playlist.map((clip, idx) => {
            const isActive = idx === currentIdx;
            const thumb = clip.type === 'youtube' && clip.embed_id
              ? `https://img.youtube.com/vi/${clip.embed_id}/mqdefault.jpg`
              : clip.type === 'x' && clip.embed_id
              ? `/api/x-video?id=${clip.embed_id}&thumb=1`
              : clip.type === 'telegram' && clip.embed_id
              ? `/api/tg-video?post=${clip.embed_id}&thumb=1`
              : clip.thumbnail;
            const PLATFORM_COLOR: Record<string, string> = { youtube: '#ff0000', x: '#1d9bf0', telegram: '#0088cc', tiktok: '#ee1d52', anchor: '#22c55e' };
            const PLATFORM_LABEL: Record<string, string> = { youtube: 'YT', x: 'X', telegram: 'TG', tiktok: 'TT', anchor: 'CVRD' };
            const isFirstSocial = clip.isSocial && !playlist[idx - 1]?.isSocial;
            const storyBoundary = storyBoundaries.find(b => idx >= b.start && idx <= b.end);
            const isFirstInStory = !clip.isSocial && storyBoundary?.start === idx;
            return (
              <div key={idx}>
                {isFirstSocial && (
                  <div style={{ padding: '8px 10px 4px', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    more
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                )}
                {isFirstInStory && storyBoundary?.topic && (
                  <div style={{ padding: '6px 10px 2px', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
                    {storyBoundary.topic.slice(0, 30)}
                  </div>
                )}
                <button onClick={() => setCurrentIdx(idx)} style={{
                  width: '100%', padding: '6px 8px', display: 'flex', gap: 7, alignItems: 'flex-start',
                  background: isActive ? 'rgba(34,197,94,0.12)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 56, height: 32, flexShrink: 0, borderRadius: 3, overflow: 'hidden', background: '#1a1a1a', position: 'relative' }}>
                    {thumb
                      ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (PLATFORM_COLOR[clip.type] ?? '#333') + '22' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: PLATFORM_COLOR[clip.type] ?? '#666' }}>{PLATFORM_LABEL[clip.type] ?? clip.type}</span>
                        </div>
                    }
                    {isActive && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, color: '#22c55e' }}>▶</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 9, color: isActive ? '#86efac' : 'rgba(255,255,255,0.6)', fontWeight: isActive ? 600 : 400, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {clip.videoTitle || clip.channel || `Clip ${idx + 1}`}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {PLATFORM_LABEL[clip.type] ?? clip.type}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>}
    </section>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PoolTile({ pool, startOffset, delay, frozen, onTileClick, showAd, adKey, skipEmbedId, onPlayInCenter, tvMode, className }: {
  pool: TileContent[];
  startOffset: number;
  delay: number;
  frozen?: boolean;
  onTileClick?: (embedId: string) => void;
  showAd?: boolean;
  adKey?: number;
  skipEmbedId?: string;
  onPlayInCenter?: (video: { type: string; embed_id: string; title: string }) => void;
  tvMode?: boolean;
  className?: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(startOffset);
  const [prevIdx, setPrevIdx] = useState(-1);
  const [tapped, setTapped] = useState(false);
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
  const platformColors: Record<string, string> = { x: '#1d9bf0', tiktok: '#fe2c55', reels: '#c026d3', telegram: '#0088cc', reddit: '#ff4500' };
  const platformIcons: Record<string, string> = { x: '𝕏', tiktok: '♪', reels: '◎' };

  return (
    <div
      style={frozen ? { boxShadow: '0 0 12px 2px rgba(239,68,68,0.6), inset 0 0 12px rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)' } : {}}
      onDoubleClick={() => {
        const embedId = current.type === 'video'
          ? current.image.match(/\/vi\/([^/]+)/)?.[1] || ''
          : current.embedId || '';

        if (current.type === 'video' || (current.type === 'social' && current.duration)) {
          const videoGrid = document.querySelector('[data-section="videogrid"]');
          if (videoGrid) {
            videoGrid.scrollIntoView({ behavior: 'smooth' });
            window.dispatchEvent(new CustomEvent('play-in-grid', { detail: embedId }));
          }
        } else if (current.type === 'social' && current.platform === 'x') {
          document.querySelector('[data-section="x-posts"]')?.scrollIntoView({ behavior: 'smooth' });
        } else if (current.type === 'social' && current.platform === 'telegram') {
          document.querySelector('[data-section="telegram"]')?.scrollIntoView({ behavior: 'smooth' });
        }
      }}
      onClick={() => setTapped(t => !t)}
      className={`relative rounded-xl overflow-hidden group cursor-pointer block${className ? ` ${className}` : ''}`}>

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

      {/* Glass emboss overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-xl" style={{
        background: 'linear-gradient(145deg, rgba(120,160,220,0.15) 0%, rgba(30,42,58,0.05) 40%, rgba(0,0,0,0.2) 100%)',
        boxShadow: 'inset 1px 1px 1px rgba(255,255,255,0.08), inset -1px -1px 2px rgba(0,0,0,0.3)',
      }} />

      {/* Hover overlay with actions (hidden in TV mode) */}
      {!tvMode && <div className={`tile-actions absolute inset-0 z-20 ${tapped ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between`}
        style={{ background: 'rgba(0,0,0,0.5)', padding: '0 0 6px' }}>
        <div />
        <div className="flex flex-col items-stretch gap-1.5 w-24">
        {(current.type === 'video' || (current.type === 'social' && current.duration)) && (
            <button onClick={(e) => {
              e.stopPropagation();
              const embedId = current.embedId || current.image?.match(/\/vi\/([^/]+)/)?.[1] || '';
              const type = current.type === 'video' ? 'youtube' : current.platform || 'youtube';
              onPlayInCenter?.({ type, embed_id: embedId, title: current.clipLabel || current.videoTitle || current.topic });
            }} className="px-2 py-1 rounded text-[8px] text-white font-medium" style={{ background: 'rgba(37,99,235,0.8)', border: 'none', cursor: 'pointer' }}>
              ▶ Play in center
            </button>
        )}
        </div>
        <div className="flex flex-col items-stretch gap-1.5 w-24">
        {(current.type === 'video' || (current.type === 'social' && current.duration)) && (
            <button onClick={(e) => {
              e.stopPropagation();
              const embedId = current.embedId || current.image?.match(/\/vi\/([^/]+)/)?.[1] || '';
              const videoGrid = document.querySelector('[data-section="videogrid"]');
              if (videoGrid) {
                videoGrid.scrollIntoView({ behavior: 'smooth' });
                window.dispatchEvent(new CustomEvent('play-in-grid', { detail: embedId }));
              }
            }} className="px-2 py-1 rounded text-[8px] text-white font-medium" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer' }}>
              ↓ Open below
            </button>
        )}
        {current.type === 'social' && !current.duration && (
          <button onClick={(e) => {
            e.stopPropagation();
            if (current.platform === 'x') document.querySelector('[data-section="x-posts"]')?.scrollIntoView({ behavior: 'smooth' });
            else if (current.platform === 'telegram') document.querySelector('[data-section="telegram"]')?.scrollIntoView({ behavior: 'smooth' });
          }} className="px-2 py-1 rounded text-[8px] text-white font-medium" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer' }}>
            ↓ Open below
          </button>
        )}
        {(() => {
          const embedId = current.embedId || current.image?.match(/\/vi\/([^/]+)/)?.[1] || '';
          if (!embedId) return null;
          let url = '';
          let label = '';
          if (current.type === 'video') {
            url = `https://www.youtube.com/watch?v=${embedId}`;
            label = 'YouTube';
          } else if (current.platform === 'x') {
            url = `https://x.com/i/status/${embedId}`;
            label = '𝕏';
          } else if (current.platform === 'tiktok') {
            url = `https://www.tiktok.com/@/video/${embedId}`;
            label = 'TikTok';
          } else if (current.platform === 'telegram') {
            url = `https://t.me/${embedId}`;
            label = 'Telegram';
          }
          if (!url) return null;
          return (
            <button onClick={(e) => {
              e.stopPropagation();
              window.open(url, '_blank', 'noopener');
            }} className="px-2 py-1 rounded text-[8px] text-white font-medium" style={{ background: platformColors[current.platform || ''] || 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer' }}>
              ↗ Go to {label}
            </button>
          );
        })()}
        </div>
      </div>}

      {/* Overlays for image/text tiles */}
      {!(isVideo || (isSocial && current.embedId && (current.platform === 'tiktok' || current.platform === 'x' || current.platform === 'telegram'))) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          {isSocial && current.platform && (
            <div className="absolute top-2 right-2">
              <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded"
                style={{ background: platformColors[current.platform] }}>
                {current.platform === 'x' ? '𝕏' : current.platform === 'tiktok' ? 'TikTok' : current.platform === 'telegram' ? 'Telegram' : 'Reels'}
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
        <div className="absolute inset-0 z-30 rounded-xl overflow-hidden animate-[fadeIn_1s_ease-in-out]">
          <span className="absolute top-1.5 right-2 z-10 text-[7px] font-medium uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.3)', pointerEvents: 'none' }}>Sponsored</span>
          <div className="w-full h-full">
            <TileAdBanner key={adKey} />
          </div>
        </div>
      )}
    </div>
  );
}


function VideoThumb({ thumbSrc, url, badge, badgeColor, label }: {
  thumbSrc: string; url?: string; badge: string; badgeColor: string; label?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="w-full h-full relative overflow-hidden"
      style={{ background: '#1e2a3a', cursor: url ? 'pointer' : 'default' }}
      onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}>
      {!failed && (
        <img src={thumbSrc} className="absolute inset-0 w-full h-full object-cover"
          style={{ animation: 'thumbZoom 8s ease-in-out infinite alternate', transformOrigin: 'center' }}
          onError={() => setFailed(true)} />
      )}
      {failed && label && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-[12px] text-white/70 text-center leading-snug line-clamp-5">{label}</p>
        </div>
      )}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.2)' }} />
      <div className="absolute top-2 left-2 z-10">
        <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: badgeColor }}>{badge}</span>
      </div>
      {label && (
        <div className="absolute bottom-0 left-0 right-0 p-2 z-10" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
          <p className="text-[10px] text-white/90 leading-snug line-clamp-1">{label}</p>
        </div>
      )}
    </div>
  );
}

/** Renders tile content — shared between PoolTile and AdTile */
function TileContentRenderer({ item }: { item: TileContent }) {
  const platformColors: Record<string, string> = { x: '#1d9bf0', tiktok: '#fe2c55', reels: '#c026d3', telegram: '#0088cc', reddit: '#ff4500' };

  if (item.type === 'video') {
    const videoId = item.image.match(/\/vi\/([^/]+)/)?.[1] || '';
    return (
      <div className="w-full h-full relative overflow-hidden">
        <img
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ animation: 'thumbZoom 8s ease-in-out infinite alternate', transformOrigin: 'center' }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
          alt=""
        />
        <iframe
          src={`/api/yt-tile?v=${videoId}`}
          className="absolute"
          style={{ border: 'none', pointerEvents: 'none', top: '-50%', left: '-50%', width: '200%', height: '200%' }}
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
  if (item.type === 'social' && item.platform === 'x' && item.embedId && item.duration) {
    return (
      <VideoThumb
        thumbSrc={`/api/x-video?id=${item.embedId}&thumb=1`}
        url={item.url || `https://x.com/i/web/status/${item.embedId}`}
        badge="𝕏" badgeColor="#000"
        label={item.clipLabel || item.topic}
      />
    );
  }
  if (item.type === 'social' && item.platform === 'x' && item.embedId) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: '#1e2a3a' }}>
        <iframe
          src={`https://platform.twitter.com/embed/Tweet.html?id=${item.embedId}&theme=dark&hideCard=false&hideThread=true&dnt=true`}
          className="absolute"
          style={{
            border: 'none', pointerEvents: 'none',
            left: '-8px', width: 'calc(100% + 16px)',
            height: '200%', top: '0',
            animation: 'xScrollDown 50s ease-in-out infinite alternate',
          }}
          loading="lazy"
        />
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: '#1d9bf0' }}>𝕏</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 z-10 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-[10px] text-white/90 leading-snug line-clamp-1">{item.clipLabel || item.topic}</p>
        </div>
      </div>
    );
  }
  if (item.type === 'social' && item.platform === 'tiktok' && item.embedId) {
    return (
      <VideoThumb
        thumbSrc={`/api/tt-video?id=${item.embedId}&thumb=1`}
        url={item.url || `https://www.tiktok.com/@_/video/${item.embedId}`}
        badge="TikTok" badgeColor="#fe2c55"
        label={item.clipLabel || item.topic}
      />
    );
  }
  if (item.type === 'social' && item.platform === 'telegram' && item.embedId && item.duration) {
    return (
      <VideoThumb
        thumbSrc={item.image || `/api/tg-video?post=${item.embedId}&thumb=1`}
        url={item.url || `https://t.me/${item.embedId}`}
        badge="Telegram" badgeColor="#0088cc"
        label={item.clipLabel || item.topic}
      />
    );
  }
  if (item.type === 'social') {
    return (
      <div className="w-full h-full relative flex flex-col justify-between p-3" style={{ background: '#1e2a3a' }}>
        <div>
          <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded inline-block mb-2"
            style={{ background: platformColors[item.platform || 'x'] }}>
            {item.platform === 'x' ? '𝕏' : item.platform === 'tiktok' ? 'TikTok' : item.platform === 'telegram' ? 'Telegram' : item.platform === 'reddit' ? 'Reddit' : 'Reels'}
          </span>
          <p className="text-[11px] text-white/90 leading-[1.5] line-clamp-3">{item.clipLabel}</p>
        </div>
        <p className="text-[9px] text-white/40 truncate">{item.topic}</p>
      </div>
    );
  }
  if (item.image) {
    return <Image src={item.image} alt={item.topic} fill className="object-cover" />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center p-3" style={{ background: '#1e2a3a' }}>
      <p className="text-[11px] text-white/40 text-center leading-snug line-clamp-4">{item.topic}</p>
    </div>
  );
}

