"use client";

import { useRef, useEffect, useState } from "react";
import { TileAdBanner } from "./AdBanners";
import Image from "next/image";
import type { NarrativeGap } from "../lib/data";
import { useElementSize } from "../lib/measure";

type PlaylistItem = {
  type: 'anchor' | 'youtube' | 'tiktok' | 'reels' | 'x' | 'telegram' | 'dailymotion' | 'rumble';
  url?: string;
  embed_id?: string;
  channel?: string;
  storyTopic?: string;
  storyIndex?: number;
  duration?: number;
  videoTitle?: string;
  thumbnail?: string;
  isSocial?: boolean;
  lean?: 'left' | 'right' | 'center';
  /** direct MP4 (Rumble) — played in a native <video> because the platform's
   *  own embed refuses to autoplay */
  video_src?: string;
};

const LEAN_COLOR: Record<string, string> = { left: '#1d4ed8', right: '#b91c1c', center: '#a3a3a3' };

type TileContent = {
  type: 'image' | 'video' | 'social';
  image: string;
  topic: string;
  index: number;
  sources: { name: string; lean?: string }[];
  playlistIdx?: number;
  channel?: string;
  videoLean?: 'left' | 'right' | 'center';
  // Social clip info
  platform?: 'x' | 'tiktok' | 'reels' | 'telegram' | 'dailymotion' | 'rumble';
  embedId?: string;
  clipLabel?: string;
  videoTitle?: string;
  url?: string;
  videoSrc?: string; // direct MP4 (Rumble) — enables native autoplaying preview
  isFresh?: boolean; // < 15 min old — tile should freeze
  duration?: number; // has video if set
};

/** Content identity for a tile — used to keep the same clip off two tiles at once */
function tileKey(item: TileContent): string {
  return item.embedId || item.image?.match(/\/vi\/([^/]+)/)?.[1] || `${item.type}:${item.image || item.topic}`;
}

/** Shared by every tile of one Dashboard: what each slot is showing, so two
 *  tiles never land on the same clip, plus the clips whose media failed to load
 *  so nothing picks them up again. */
type TileRegistry = { claims: Map<number, string>; bad: Set<string> };

/** Social embeds are narrow by nature: a tweet lays out at ~550px, a TikTok at
 *  ~325. Stretched across the player they hug the left edge with dead space
 *  beside them, so they get centred at their natural width instead. */
const EMBED_MAX: Record<string, number> = { x: 550, tiktok: 325, reels: 400, telegram: 420 };

function CenteredEmbed({ type, children }: { type: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-full w-full" style={{ maxWidth: EMBED_MAX[type] || 550 }}>
        {children}
      </div>
    </div>
  );
}


/** Gap between tiles in the tiles-only wall (Tailwind gap-1). */
export const TILE_GAP = 4;
const TILE_AR = 16 / 9;

/**
 * How many tiles a box should carry.
 *
 * Clips are 16:9, so the count is whatever divides the box into slots closest
 * to that shape rather than a number picked in advance: a tall column takes
 * more, a short strip takes fewer, and a box with room for one gets one. The
 * error is measured on the log of the ratio so a slot twice too tall and one
 * twice too wide count as equally wrong.
 */
export function fitTileCount(
  { width, height, column, max }: { width: number; height: number; column?: boolean; max: number },
) {
  const cap = Math.max(1, Math.min(4, max));
  if (!(width > 0) || !(height > 0)) return cap;
  let best = 1;
  let bestErr = Infinity;
  for (let n = 1; n <= cap; n++) {
    const span = (n - 1) * TILE_GAP;
    const slotW = column ? width : (width - span) / n;
    const slotH = column ? (height - span) / n : height;
    if (slotW <= 0 || slotH <= 0) continue;
    const err = Math.abs(Math.log(slotW / slotH / TILE_AR));
    if (err < bestErr) { bestErr = err; best = n; }
  }
  return best;
}

export function Dashboard({
  stories,
  videoUrl,
  videoDate,
  tvMode,
  noAutoPlay,
  compact,
  heroPlayer,
  tilesOnly,
  tilesColumn,
  tilesCount,
  onEnd,
  startEmbedId,
  orientation,
}: {
  stories: NarrativeGap[];
  videoUrl?: string;
  videoDate?: string;
  tvMode?: boolean;
  noAutoPlay?: boolean;
  compact?: boolean;
  /** Story-page band layout: one big player with three tiles stacked beside it,
   *  so the wall shares the row with the Divide and Timeline cards. */
  heroPlayer?: boolean;
  tilesOnly?: boolean;
  /** Stack the tiles in one column instead of a row. */
  tilesColumn?: boolean;
  /** Ceiling on the tile count (1-4) — how many clips the story can fill.
   *  The wall measures itself and may render fewer so the slots stay 16:9. */
  tilesCount?: number;
  onEnd?: () => void;
  startEmbedId?: string;
  orientation?: 'landscape' | 'portrait';
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

  // The tiles-only wall picks its own tile count from the box it lands in, so
  // the caller only has to say how many clips it has, not how many fit.
  const tilesBoxRef = useRef<HTMLElement>(null);
  const tilesBox = useElementSize(tilesBoxRef);

  // Pause tiles when Dashboard is not in view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Drag-to-center: override video from tile drag
  const [overrideVideo, setOverrideVideo] = useState<{ type: string; embed_id: string; title: string; url?: string; video_src?: string } | null>(null);
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
      playlist.push({ type: 'youtube', embed_id: v.embed_id, channel: v.channel, lean: v.lean, storyTopic: story.topic, storyIndex: i + 1, duration: v.duration, videoTitle: (v as any).title || v.channel || '' });
    }
    // Dailymotion/Rumble are outlet news clips, peers of the YouTube videos —
    // they list with the story's videos, not under MORE with the social chatter.
    // Membership rule (Jordy): only clips that genuinely AUTOPLAY belong in the
    // rotation. DM's player honors autoplay; Rumble's doesn't, so Rumble
    // qualifies only via its direct MP4 (played in a native <video>). A Rumble
    // clip with no MP4 drops to the social bucket below, like X.
    for (const c of (story.social_clips || [])) {
      if ((c as any).download_failed || !c.embed_id) continue;
      if (c.platform === 'dailymotion' || (c.platform === 'rumble' && (c as any).video_src)) {
        playlist.push({ type: c.platform as any, embed_id: c.embed_id, url: c.url, channel: c.author || c.platform, lean: (c as any).lean, storyTopic: story.topic, storyIndex: i + 1, duration: ((c as any).duration || 60) + 5, videoTitle: c.title || c.author || c.platform, thumbnail: (c as any).thumbnail, video_src: (c as any).video_src });
      }
    }
  }
  // Social clips below YT — auto-advance after 60s
  for (const [i, story] of stories.entries()) {
    for (const c of (story.social_clips || [])) {
      if ((c as any).download_failed || !c.embed_id) continue;
      // Telegram stays out of the dashboard wall (Jordy, 2026-08-04) — its
      // "player" is only a zooming thumbnail, which reads as broken next to
      // real embeds. Telegram clips still show in the story cards below.
      if (c.platform === 'x' && c.duration) {
        playlist.push({ type: c.platform as any, embed_id: c.embed_id, url: c.url, channel: c.author || c.platform, storyTopic: story.topic, storyIndex: i + 1, duration: 60, videoTitle: c.title || c.author || c.platform, isSocial: true });
      } else if (c.platform === 'tiktok' && c.embed_id && /^\d+$/.test(c.embed_id)) {
        playlist.push({ type: 'tiktok', embed_id: c.embed_id, url: c.url, channel: c.author || 'TikTok', storyTopic: story.topic, storyIndex: i + 1, duration: 60, videoTitle: c.title || c.author || 'TikTok', thumbnail: (c as any).thumbnail, isSocial: true });
      } else if (c.platform === 'rumble' && !(c as any).video_src) {
        // No MP4 resolved → can't autoplay → same standing as X clips
        playlist.push({ type: 'rumble', embed_id: c.embed_id, url: c.url, channel: c.author || 'Rumble', storyTopic: story.topic, storyIndex: i + 1, duration: 60, videoTitle: c.title || c.author || 'Rumble', thumbnail: (c as any).thumbnail, isSocial: true });
      }
    }
  }
  // The same clip can be attached to several stories — keep only its first
  // appearance so the loop never replays a video
  {
    const seen = new Set<string>();
    for (let i = 0; i < playlist.length; i++) {
      const id = playlist[i].embed_id;
      if (!id) continue;
      if (seen.has(id)) { playlist.splice(i, 1); i--; } else seen.add(id);
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
  const [stripHidden, setStripHidden] = useState(true);
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
        videoLean: v.lean,
        videoTitle: (v as any).title || v.channel || '',
        isFresh: !!(v as any)._breaking,
      });
    }
    for (const c of (story.social_clips || [])) {
      if ((c as any).download_failed) continue;
      // Only video clips in tiles — X and Telegram need duration (= has video), TikTok/Reels always have video
      const isVideo = c.platform === 'tiktok' || c.platform === 'reels' || c.platform === 'dailymotion' || c.platform === 'rumble'
        || (c.platform === 'x' && c.duration);
      if (c.embed_id && isVideo) {
        // Telegram thumbnails must go through proxy (direct CDN URLs blocked by referrer)
        const thumbImg = c.platform === 'telegram'
          ? `/api/tg-video?post=${c.embed_id}&thumb=1`
          : c.platform === 'x'
          ? `/api/x-video?id=${c.embed_id}&thumb=1`
          : c.platform === 'tiktok' && /^\d+$/.test(c.embed_id)
          ? `/api/tt-video?id=${c.embed_id}&thumb=1`
          : c.platform === 'dailymotion'
          ? (c as any).thumbnail || `https://www.dailymotion.com/thumbnail/video/${c.embed_id}`
          : (c as any).thumbnail || story.image_file || '';
        linked.push({
          type: 'social',
          image: thumbImg,
          topic: story.topic, index: i + 1, sources: story.sources || [],
          platform: c.platform as TileContent['platform'],
          embedId: c.embed_id,
          url: c.url,
          videoSrc: (c as any).video_src,
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
    const seen = new Set<string>();
    linkedContent = Object.values(storyLinked).flat().filter(t => {
      const k = tileKey(t);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
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

  // Tiles coordinate through this so no two show the same clip at once
  const tileRegistryRef = useRef<TileRegistry>({ claims: new Map(), bad: new Set() });

  // Freezing logic for fresh/breaking content
  const freshCount = pool.filter(t => t.isFresh).length;
  const shouldFreeze = freshCount > 0 && freshCount <= 10;

  // Each tile gets a starting offset into the pool — cycles through ALL items
  const SLOTS = 12;
  const tileOffsets = Array.from({ length: SLOTS }, (_, i) =>
    pool.length > 0 ? Math.floor((i / SLOTS) * pool.length) % pool.length : 0
  );
  const tileIsFrozen = tileOffsets.map(offset => !inView || (shouldFreeze && (pool[offset]?.isFresh || false)));

  // Roaming ad: randomly picks a tile position, shows ad for 30s, hides for 90s, moves to new position
  const TILE_POSITIONS = Array.from({ length: 12 }, (_, i) => i); // all tile indices
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

  // Standalone dashboards (story pages) get the same landscape/portrait choice
  // as TV — but only when uncollapsed; TV keeps driving its own orientation prop
  const [userOrientation, setUserOrientation] = useState<'landscape' | 'portrait' | null>(null);
  const showOrientationToggle = !tvMode && !compact && !tilesOnly && orientation === undefined;
  const effectiveOrientation = orientation ?? (showOrientationToggle ? userOrientation : null) ?? 'landscape';

  if (tilesOnly) {
    // The caller's count is a ceiling — how many clips it has. How many are
    // actually shown comes from the measured box, so the slots stay 16:9 and
    // a box with room for one gets one instead of a stretched pair.
    const max = Math.max(1, Math.min(4, tilesCount ?? (tilesColumn ? 3 : 4)));
    const count = tilesBox
      ? fitTileCount({ ...tilesBox, column: tilesColumn, max })
      : max;
    const tileSlots = Array.from({ length: count }, (_, i) => i);
    return (
      <section ref={tilesBoxRef} style={{ background: '#1e2a3a', height: '100%', overflow: 'hidden' }}>
        <div
          className="h-full grid gap-1"
          style={tilesColumn
            ? { gridTemplateColumns: '1fr', gridTemplateRows: `repeat(${tileSlots.length}, minmax(0, 1fr))` }
            : { gridTemplateColumns: `repeat(${tileSlots.length}, minmax(0, 1fr))` }}
        >
          {tileSlots.map(i => (
            <PoolTile key={i} slot={i} registry={tileRegistryRef.current} pool={pool} startOffset={tileOffsets[i]} delay={[0, 2, 4, 1][i]} frozen={tileIsFrozen[i]} skipEmbedId={undefined} onPlayInCenter={undefined} showAd={adPosition === i} adKey={adKey} tvMode={true} />
          ))}
        </div>
      </section>
    );
  }

  // Portrait layout: same 8-tile wall as landscape, redistributed for a tall
  // screen — 3 tiles top, portrait-aspect player with 2 side tiles in the right
  // column, 3 tiles bottom
  const portraitTV = effectiveOrientation === 'portrait';
  // heroPlayer only makes sense on the landscape story-page band; TV and
  // portrait keep the full wall.
  const heroLayout = !!heroPlayer && !tvMode && !portraitTV;

  return (
    <section ref={sectionRef} style={{ background: '#1e2a3a', height: compact ? '100%' : tvMode ? '100%' : 'calc(100vh - 122px)', overflow: 'hidden', display: 'flex' }}>
      <style>{`
        @media (max-width: 600px) {
          .dash-side-tile { display: none !important; }
          .dash-center { grid-column: span 4 / span 4 !important; }
          .dash-portrait .dash-center { grid-column: span 2 / span 2 !important; }
          .dash-compact .dash-top-tile { display: none !important; }
          .dash-compact .dash-center { grid-row: 1 / -1 !important; }
          .dash-hero .dash-hero-tile { display: none !important; }
          .dash-hero .dash-center { grid-column: 1 / -1 !important; }
          .dash-clip-strip { display: none !important; }
        }
      `}</style>
      <div className={`h-full grid ${portraitTV ? 'grid-rows-4 grid-cols-3 dash-portrait' : heroLayout ? 'grid-rows-3 grid-cols-4 dash-hero' : `${compact ? 'grid-rows-2 dash-compact' : tvMode ? 'grid-rows-3' : 'grid-rows-4'} grid-cols-4`} gap-1 flex-1 min-w-0`}>

        {/* ROW 1 — in hero layout the three tiles stack in the far-right column
            beside the player instead of running across the top */}
        {(portraitTV ? [0, 1, 2] : heroLayout ? [] : [0, 1, 2, 3]).map(i => (
          <PoolTile key={i} slot={i} registry={tileRegistryRef.current} pool={pool} startOffset={tileOffsets[i]} delay={[0, 2, 4, 1][i]} frozen={tileIsFrozen[i]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} onPlayInCenter={setOverrideVideo} showAd={adPosition === i} adKey={adKey} tvMode={tvMode} className="dash-top-tile" />
        ))}

        {/* ROW 2 */}
        {!heroLayout && (
        <PoolTile slot={4} registry={tileRegistryRef.current} pool={pool} startOffset={tileOffsets[4]} delay={5} frozen={tileIsFrozen[4]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} onPlayInCenter={setOverrideVideo} showAd={adPosition === 4} adKey={adKey} tvMode={tvMode} className={portraitTV ? undefined : "dash-side-tile"} />
        )}

        <div className={`${heroLayout ? '' : 'col-span-2 '}dash-center flex flex-col rounded-xl overflow-hidden`} style={{ background: '#0a0a0a', gridRow: heroLayout ? '1 / span 3' : portraitTV ? '2 / span 2' : 'span 2 / span 2', ...(heroLayout ? { gridColumn: '1 / span 3' } : portraitTV ? { gridColumn: '1 / span 2' } : {}), ...(current?.lean ? { boxShadow: `inset 0 0 0 3px ${LEAN_COLOR[current.lean]}` } : {}) }}
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
                <CenteredEmbed type="x">
                  <iframe key={`override-${overrideVideo.embed_id}`}
                    src={`https://platform.twitter.com/embed/Tweet.html?id=${overrideVideo.embed_id}&theme=dark&dnt=true`}
                    className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }} />
                </CenteredEmbed>
              )}
              {overrideVideo.type === 'telegram' && (
                <CenteredEmbed type="telegram"><VideoThumb
                  thumbSrc={`/api/tg-video?post=${overrideVideo.embed_id}&thumb=1`}
                  url={overrideVideo.url || `https://t.me/${overrideVideo.embed_id}`}
                  badge="Telegram" badgeColor="#0088cc"
                  label={overrideVideo.title}
                /></CenteredEmbed>
              )}
              {overrideVideo.type === 'tiktok' && (
                <CenteredEmbed type="tiktok">
                  <iframe key={`override-${overrideVideo.embed_id}`}
                    src={`https://www.tiktok.com/embed/v2/${overrideVideo.embed_id}`}
                    className="w-full h-full absolute inset-0" allowFullScreen allow="encrypted-media" style={{ border: 'none' }} />
                </CenteredEmbed>
              )}
              {overrideVideo.type === 'dailymotion' && (
                <iframe key={`override-${overrideVideo.embed_id}`}
                  src={`https://geo.dailymotion.com/player.html?video=${overrideVideo.embed_id}&autoplay=true&mute=true&controls=false`}
                  className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              )}
              {overrideVideo.type === 'rumble' && overrideVideo.video_src && (
                // no controls: the dashboard's own volume overlay drives this
                // element via toggleSound, a second control bar is clutter
                <video key={`override-${overrideVideo.video_src}`} src={overrideVideo.video_src}
                  className="w-full h-full absolute inset-0 object-contain bg-black"
                  autoPlay playsInline
                  ref={(el: HTMLVideoElement | null) => { if (el) { el.volume = volume; } }} />
              )}
              {overrideVideo.type === 'rumble' && !overrideVideo.video_src && (
                <iframe key={`override-${overrideVideo.embed_id}`}
                  src={`https://rumble.com/embed/${overrideVideo.embed_id}/?rel=0`}
                  className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
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
            <CenteredEmbed type="tiktok">
              <iframe key={current.embed_id}
                src={`https://www.tiktok.com/embed/v2/${current.embed_id}`}
                className="w-full h-full absolute inset-0" allowFullScreen allow="encrypted-media" style={{ border: 'none' }} />
            </CenteredEmbed>
          )}
          {!overrideVideo && current?.type === 'reels' && current.embed_id && (
            <CenteredEmbed type="reels">
              <iframe key={current.embed_id}
                src={`https://www.instagram.com/reel/${current.embed_id}/embed`}
                className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }} />
            </CenteredEmbed>
          )}
          {!overrideVideo && current?.type === 'x' && current.embed_id && (
            <CenteredEmbed type="x">
              <iframe key={current.embed_id}
                src={`https://platform.twitter.com/embed/Tweet.html?id=${current.embed_id}&theme=dark&dnt=true`}
                className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }} />
            </CenteredEmbed>
          )}
          {!overrideVideo && current?.type === 'dailymotion' && current.embed_id && (
            // controls=false: the dashboard has its own mute/volume overlay;
            // DM's player chrome would add a second unmute button on top of it
            <iframe key={current.embed_id}
              src={`https://geo.dailymotion.com/player.html?video=${current.embed_id}&autoplay=${noAutoPlay ? 'false' : 'true'}&mute=${unmuted ? 'false' : 'true'}&controls=false`}
              className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          )}
          {!overrideVideo && current?.type === 'rumble' && current.video_src && (
            // Native playback from Rumble's CDN MP4 — their embed refuses to
            // autoplay, the MP4 doesn't. Sound follows the dashboard's own
            // mute state, end advances the rotation like YouTube's end event.
            <video key={current.video_src} src={current.video_src}
              className="w-full h-full absolute inset-0 object-contain bg-black"
              autoPlay={!noAutoPlay} playsInline muted={!unmuted} onEnded={next}
              ref={el => { if (el) { el.muted = !unmuted; el.volume = volume; } }}
              poster={current.thumbnail} />
          )}
          {!overrideVideo && current?.type === 'rumble' && !current.video_src && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://rumble.com/embed/${current.embed_id}/?rel=0`}
              className="w-full h-full absolute inset-0" allowFullScreen style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          )}
          {!overrideVideo && current?.type === 'telegram' && current.embed_id && (
            <CenteredEmbed type="telegram"><VideoThumb
              thumbSrc={`/api/tg-video?post=${current.embed_id}&thumb=1`}
              url={current.url || `https://t.me/${current.embed_id}`}
              badge="Telegram" badgeColor="#0088cc"
              label={current.videoTitle || current.channel}
            /></CenteredEmbed>
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
          {/* Landscape/portrait toggle — same control as TV mode's top bar */}
          {showOrientationToggle && (
            <button onClick={() => setUserOrientation(portraitTV ? 'landscape' : 'portrait')}
              title={portraitTV ? 'Switch to landscape layout' : 'Switch to portrait layout'}
              className="absolute top-2 z-20 flex items-center justify-center rounded-full"
              style={{ right: overrideVideo ? 44 : 8, width: 26, height: 26, background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {portraitTV ? <rect x="3" y="7" width="18" height="10" rx="2" /> : <rect x="7" y="3" width="10" height="18" rx="2" />}
              </svg>
            </button>
          )}
          </div>
        </div>

        {!heroLayout && (
        <PoolTile slot={5} registry={tileRegistryRef.current} pool={pool} startOffset={tileOffsets[5]} delay={3} frozen={tileIsFrozen[5]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} onPlayInCenter={setOverrideVideo} showAd={adPosition === 5} adKey={adKey} tvMode={tvMode} className={portraitTV ? undefined : "dash-side-tile"} />
        )}

        {/* Hero layout: the three tiles that share the row with the player */}
        {heroLayout && [0, 1, 2].map(i => (
          <PoolTile key={i} slot={i} registry={tileRegistryRef.current} pool={pool} startOffset={tileOffsets[i]} delay={[0, 2, 4][i]} frozen={tileIsFrozen[i]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} onPlayInCenter={setOverrideVideo} showAd={adPosition === i} adKey={adKey} tvMode={tvMode} className="dash-hero-tile" />
        ))}

        {/* ROW 3 — the player's other flank; hidden when compact */}
        {!compact && !heroLayout && (portraitTV ? [6, 9, 3] : [6, 9]).map(i => (
          <PoolTile key={i} slot={i} registry={tileRegistryRef.current} pool={pool} startOffset={tileOffsets[i]} delay={({ 6: 6, 9: 5.5, 3: 1 } as Record<number, number>)[i]} frozen={tileIsFrozen[i]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} onPlayInCenter={setOverrideVideo} showAd={adPosition === i} adKey={adKey} tvMode={tvMode} />
        ))}

        {/* ROW 4 — closes the wall under the player, so expanded is a full ring */}
        {!compact && !heroLayout && !portraitTV && !tvMode && [7, 8, 10, 11].map((i, n) => (
          <PoolTile key={i} slot={i} registry={tileRegistryRef.current} pool={pool} startOffset={tileOffsets[i]} delay={[4.5, 2.5, 6.5, 1.5][n]} frozen={tileIsFrozen[i]} onTileClick={handleTileClick} skipEmbedId={current?.embed_id} onPlayInCenter={setOverrideVideo} showAd={adPosition === i} adKey={adKey} tvMode={tvMode} />
        ))}
      </div>

      {/* Clip strip — right side */}
      {!tvMode && <div className="dash-clip-strip" style={{ width: stripHidden ? 20 : 200, flexShrink: 0, background: '#1e2a3a', borderLeft: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', transition: 'width 0.25s ease' }}>

        <button onClick={() => setStripHidden(h => !h)}
          aria-label={stripHidden ? 'Show clip list' : 'Hide clip list'}
          style={{ position: 'absolute', top: 8, left: 4, zIndex: 5, width: 16, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {stripHidden ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
          </svg>
        </button>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', display: stripHidden ? 'none' : 'block' }}>
          {playlist.map((clip, idx) => {
            const isActive = idx === currentIdx;
            const thumb = clip.type === 'youtube' && clip.embed_id
              ? `https://img.youtube.com/vi/${clip.embed_id}/mqdefault.jpg`
              : clip.type === 'x' && clip.embed_id
              ? `/api/x-video?id=${clip.embed_id}&thumb=1`
              : clip.type === 'telegram' && clip.embed_id
              ? `/api/tg-video?post=${clip.embed_id}&thumb=1`
              : clip.thumbnail;
            const PLATFORM_COLOR: Record<string, string> = { youtube: '#ff0000', x: '#1d9bf0', telegram: '#0088cc', tiktok: '#ee1d52', anchor: '#22c55e', dailymotion: '#0066dc', rumble: '#85c742' };
            const PLATFORM_LABEL: Record<string, string> = { youtube: 'YT', x: 'X', telegram: 'TG', tiktok: 'TT', anchor: 'CVRD', dailymotion: 'DM', rumble: 'RUM' };
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
                    {clip.lean && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: LEAN_COLOR[clip.lean] }} />
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

function PoolTile({ pool, startOffset, delay, frozen, onTileClick, showAd, adKey, skipEmbedId, onPlayInCenter, tvMode, className, slot, registry }: {
  pool: TileContent[];
  startOffset: number;
  delay: number;
  frozen?: boolean;
  onTileClick?: (embedId: string) => void;
  showAd?: boolean;
  adKey?: number;
  skipEmbedId?: string;
  onPlayInCenter?: (video: { type: string; embed_id: string; title: string; video_src?: string }) => void;
  tvMode?: boolean;
  className?: string;
  slot: number;
  registry?: TileRegistry;
}) {
  const [currentIdx, setCurrentIdx] = useState(startOffset);
  const [prevIdx, setPrevIdx] = useState(-1);
  const [tapped, setTapped] = useState(false);
  const poolRef = useRef(pool);
  const skipRef = useRef(skipEmbedId);
  const idxRef = useRef(currentIdx);
  poolRef.current = pool;
  skipRef.current = skipEmbedId;
  idxRef.current = currentIdx;

  // Helper: next index whose content no other tile is showing and that isn't
  // the center player's video. When the pool is too small for every tile to be
  // unique, fall back to the item the fewest other tiles are showing.
  const getNextIdx = (fromIdx: number) => {
    const len = poolRef.current.length;
    if (len === 0) return 0;
    const others = new Map<string, number>();
    if (registry) {
      for (const [s, k] of registry.claims) {
        if (s !== slot) others.set(k, (others.get(k) || 0) + 1);
      }
    }
    let best = (fromIdx + 1) % len;
    let bestCount = Infinity;
    for (let step = 1; step <= len; step++) {
      const idx = (fromIdx + step) % len;
      const item = poolRef.current[idx];
      if (registry?.bad.has(tileKey(item))) continue;
      const embedId = item.type === 'video'
        ? item.image.match(/\/vi\/([^/]+)/)?.[1] || ''
        : item.embedId || '';
      if (skipRef.current && len > 2 && embedId === skipRef.current) continue;
      const count = others.get(tileKey(item)) || 0;
      if (count === 0) return idx;
      if (count < bestCount) { bestCount = count; best = idx; }
    }
    return best;
  };

  // Move to the next clip and claim it right away. Claiming inside the timer
  // rather than in an effect is what keeps two tiles apart: a sibling rotating
  // in the same tick sees the claim before it chooses.
  const advance = () => {
    const len = poolRef.current.length;
    if (len === 0) return;
    const fromIdx = idxRef.current;
    const nextIdx = getNextIdx(fromIdx);
    idxRef.current = nextIdx;
    registry?.claims.set(slot, tileKey(poolRef.current[nextIdx % len]));
    setPrevIdx(fromIdx);
    setCurrentIdx(nextIdx);
  };

  // A clip whose thumbnail will not load is dead weight — remember it so no
  // tile shows it again, and move on instead of sitting on a blank tile.
  const handleMediaFail = () => {
    const len = poolRef.current.length;
    if (!registry || len === 0) return;
    registry.bad.add(tileKey(poolRef.current[idxRef.current % len]));
    if (registry.bad.size < len) advance();
  };

  // Publish what this tile starts on. Start offsets are already spread evenly
  // across the pool, so there is no reshuffle here; that reshuffle is what put
  // two tiles on one clip whenever a layout change remounted every tile.
  useEffect(() => {
    if (!registry) return;
    const len = poolRef.current.length;
    if (len === 0) return;
    registry.claims.set(slot, tileKey(poolRef.current[idxRef.current % len]));
    return () => { registry.claims.delete(slot); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-publish the claim whenever the tile or the pool moves, and settle a
  // collision when the pool itself is swapped underneath us (videos to tweets
  // and back) — indices carry over, so two tiles can land on one item. Only
  // move when the alternative is genuinely free, otherwise a pool smaller than
  // the tile wall would send tiles chasing each other.
  useEffect(() => {
    if (!registry || pool.length === 0) return;
    const claimed = new Set<string>();
    for (const [s, k] of registry.claims) if (s !== slot) claimed.add(k);
    const key = tileKey(pool[currentIdx % pool.length]);
    if (claimed.has(key)) {
      const nextIdx = getNextIdx(currentIdx);
      const nextKey = tileKey(pool[nextIdx % pool.length]);
      if (!claimed.has(nextKey)) {
        idxRef.current = nextIdx;
        registry.claims.set(slot, nextKey);
        setCurrentIdx(nextIdx);
        return;
      }
    }
    registry.claims.set(slot, key);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, pool, registry, slot]);

  useEffect(() => {
    if (frozen || pool.length <= 1) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const item = poolRef.current[idxRef.current % poolRef.current.length];
      const baseDuration = item.type === 'video' ? 16000 : 8000;
      timer = setTimeout(() => {
        if (cancelled) return;
        advance();
        schedule();
      }, baseDuration + delay * 600);
    };

    // Initial delay before first rotation
    const firstItem = poolRef.current[idxRef.current % poolRef.current.length];
    timer = setTimeout(() => {
      if (cancelled) return;
      advance();
      schedule();
    }, (firstItem.type === 'video' ? 8000 : 4000) + delay * 800);

    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, frozen, pool.length]);

  const current = pool[currentIdx % pool.length];
  const prev = prevIdx >= 0 ? pool[prevIdx % pool.length] : null;
  const isVideo = current.type === 'video';
  const isSocial = current.type === 'social';
  const platformColors: Record<string, string> = { x: '#1d9bf0', tiktok: '#fe2c55', reels: '#c026d3', telegram: '#0088cc', dailymotion: '#0066dc', rumble: '#85c742' };
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
        <TileContentRenderer item={current} onMediaFail={handleMediaFail} />
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
              onPlayInCenter?.({ type, embed_id: embedId, title: current.clipLabel || current.videoTitle || current.topic, video_src: current.videoSrc });
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
          } else if (current.platform === 'dailymotion') {
            url = current.url || `https://www.dailymotion.com/video/${embedId}`;
            label = 'Dailymotion';
          } else if (current.platform === 'rumble') {
            url = current.url || `https://rumble.com/embed/${embedId}/`;
            label = 'Rumble';
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

      {/* Overlays for image/text tiles — every platform whose tile content
          already carries its own badge and caption must be listed here, or
          the tile gets a second badge and a doubled title. */}
      {!(isVideo || (isSocial && current.embedId && (current.platform === 'tiktok' || current.platform === 'x' || current.platform === 'telegram' || current.platform === 'dailymotion' || current.platform === 'rumble'))) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          {isSocial && current.platform && (
            <div className="absolute top-2 right-2">
              <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded"
                style={{ background: platformColors[current.platform] }}>
                {current.platform === 'x' ? '𝕏' : current.platform === 'tiktok' ? 'TikTok' : current.platform === 'telegram' ? 'Telegram' : current.platform === 'dailymotion' ? 'DM' : current.platform === 'rumble' ? 'Rumble' : 'Reels'}
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


function VideoThumb({ thumbSrc, url, badge, badgeColor, label, onFail }: {
  thumbSrc: string; url?: string; badge: string; badgeColor: string; label?: string; onFail?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="w-full h-full relative overflow-hidden"
      style={{ background: '#1e2a3a', cursor: url ? 'pointer' : 'default' }}
      onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}>
      {!failed && (
        <img src={thumbSrc} className="absolute inset-0 w-full h-full object-cover"
          style={{ animation: 'thumbZoom 8s ease-in-out infinite alternate', transformOrigin: 'center' }}
          onError={() => { setFailed(true); onFail?.(); }} />
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
function TileContentRenderer({ item, onMediaFail }: { item: TileContent; onMediaFail?: () => void }) {
  const platformColors: Record<string, string> = { x: '#1d9bf0', tiktok: '#fe2c55', reels: '#c026d3', telegram: '#0088cc', dailymotion: '#0066dc', rumble: '#85c742' };

  if (item.type === 'video') {
    const videoId = item.image.match(/\/vi\/([^/]+)/)?.[1] || '';
    return (
      <div className="w-full h-full relative overflow-hidden">
        <img
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ animation: 'thumbZoom 8s ease-in-out infinite alternate', transformOrigin: 'center' }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; onMediaFail?.(); }}
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
        {item.videoLean && (
          <>
            <div
              aria-hidden
              className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
              style={{ height: 24, background: `linear-gradient(to top, ${LEAN_COLOR[item.videoLean]}55, transparent)` }}
            />
            <div
              aria-label={`${item.videoLean}-leaning outlet`}
              title={`${item.videoLean}-leaning outlet`}
              className="absolute bottom-0 left-0 right-0 z-10"
              style={{ height: 4, background: LEAN_COLOR[item.videoLean], boxShadow: `0 0 8px ${LEAN_COLOR[item.videoLean]}` }}
            />
          </>
        )}
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
        onFail={onMediaFail}
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
        onFail={onMediaFail}
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
        onFail={onMediaFail}
      />
    );
  }
  // DM and Rumble tiles get the same live muted preview the YouTube tiles
  // have: thumbnail underneath, autoplaying muted embed on top, no pointer
  // events so clicks land on the tile, not the player.
  if (item.type === 'social' && item.platform === 'dailymotion' && item.embedId) {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <img
          src={item.image || `https://www.dailymotion.com/thumbnail/video/${item.embedId}`}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
          alt=""
        />
        <iframe
          src={`https://geo.dailymotion.com/player.html?video=${item.embedId}&autoplay=true&mute=true&controls=false`}
          className="absolute"
          style={{ border: 'none', pointerEvents: 'none', top: '-50%', left: '-50%', width: '200%', height: '200%' }}
          allow="autoplay"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: '#0066dc' }}>DM</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 z-10 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-[10px] text-white/90 leading-snug line-clamp-1">{item.clipLabel || item.topic}</p>
        </div>
      </div>
    );
  }
  // Rumble's embed ignores autoplay flags (tested: video stays paused with
  // autoplay=1 and =2), so the live preview plays the clip's direct CDN MP4
  // in a native muted <video> — same look as the YouTube tiles. Without an
  // MP4, a real thumbnail beats a dead player showing its own play button.
  if (item.type === 'social' && item.platform === 'rumble' && item.videoSrc) {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <video src={item.videoSrc} className="absolute inset-0 w-full h-full object-cover"
          autoPlay muted loop playsInline poster={item.image || undefined}
          style={{ pointerEvents: 'none' }} />
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: '#85c742' }}>Rumble</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 z-10 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-[10px] text-white/90 leading-snug line-clamp-1">{item.clipLabel || item.topic}</p>
        </div>
      </div>
    );
  }
  if (item.type === 'social' && item.platform === 'rumble' && item.embedId) {
    return (
      <VideoThumb
        thumbSrc={item.image || ''}
        url={item.url || `https://rumble.com/embed/${item.embedId}/`}
        badge="Rumble" badgeColor="#85c742"
        label={item.clipLabel || item.topic}
        onFail={onMediaFail}
      />
    );
  }
  if (item.type === 'social') {
    return (
      <div className="w-full h-full relative flex flex-col justify-between p-3" style={{ background: '#1e2a3a' }}>
        <div>
          <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded inline-block mb-2"
            style={{ background: platformColors[item.platform || 'x'] }}>
            {item.platform === 'x' ? '𝕏' : item.platform === 'tiktok' ? 'TikTok' : item.platform === 'telegram' ? 'Telegram' : item.platform === 'dailymotion' ? 'DM' : item.platform === 'rumble' ? 'Rumble' : 'Reels'}
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

