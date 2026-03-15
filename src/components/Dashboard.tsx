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
  type: 'image' | 'video';
  image: string;
  topic: string;
  index: number;
  sources: { name: string; lean?: string }[];
  playlistIdx?: number;
  channel?: string;
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

  // Build playlist — anchor first, then ALL videos from all stories
  const playlist: PlaylistItem[] = [];
  if (videoUrl) playlist.push({ type: 'anchor', url: videoUrl });
  for (const [i, story] of stories.entries()) {
    for (const v of (story.youtube_videos || [])) {
      playlist.push({ type: 'youtube', embed_id: v.embed_id, channel: v.channel, storyTopic: story.topic, storyIndex: i + 1, duration: v.duration });
    }
    for (const c of (story.social_clips || [])) {
      if (c.platform === 'tiktok' && c.embed_id) {
        playlist.push({ type: 'tiktok', embed_id: c.embed_id, channel: c.title || 'TikTok', storyTopic: story.topic, storyIndex: i + 1, duration: c.duration });
      } else if (c.platform === 'reels' && c.embed_id) {
        playlist.push({ type: 'reels', embed_id: c.embed_id, channel: c.title || 'Reels', storyTopic: story.topic, storyIndex: i + 1, duration: c.duration });
      } else if (c.platform === 'x' && c.embed_id) {
        playlist.push({ type: 'x', embed_id: c.embed_id, channel: c.title || c.author || 'X', storyTopic: story.topic, storyIndex: i + 1, duration: c.duration || 30 });
      }
    }
  }

  const [currentIdx, setCurrentIdx] = useState(0);
  const current = playlist[currentIdx];

  useEffect(() => {
    if (videoRef.current && current?.type === 'anchor') {
      videoRef.current.muted = !unmuted;
      videoRef.current.volume = volume;
      videoRef.current.play().catch(() => {});
    }
    setProgress(0);
    setDuration(0);
  }, [currentIdx]);

  const next = () => setCurrentIdx(prev => (prev + 1) % playlist.length);
  const prevItem = () => setCurrentIdx(prev => (prev - 1 + playlist.length) % playlist.length);

  const toggleSound = () => {
    const newUnmuted = !unmuted;
    setUnmuted(newUnmuted);
    // Anchor video
    if (videoRef.current) {
      videoRef.current.muted = !newUnmuted;
    }
    // YouTube iframe
    const ytFrame = document.getElementById('yt-player') as HTMLIFrameElement;
    if (ytFrame?.contentWindow) {
      ytFrame.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: newUnmuted ? 'unMute' : 'mute',
      }), '*');
    }
  };

  // Build tile content — mix of story images and video thumbnails
  const allTileContent: TileContent[] = [];
  for (const [i, story] of stories.entries()) {
    if (story.image_file) {
      allTileContent.push({ type: 'image', image: story.image_file, topic: story.topic, index: i + 1, sources: story.sources || [] });
    }
    for (const v of (story.youtube_videos || []).slice(0, 1)) {
      const pIdx = playlist.findIndex(p => p.embed_id === v.embed_id);
      allTileContent.push({
        type: 'video',
        image: `https://img.youtube.com/vi/${v.embed_id}/hqdefault.jpg`,
        topic: story.topic, index: i + 1, sources: story.sources || [],
        playlistIdx: pIdx >= 0 ? pIdx : undefined, channel: v.channel,
      });
    }
  }
  while (allTileContent.length < 16) allTileContent.push(...allTileContent.slice(0, 16 - allTileContent.length));

  // Each tile gets 2 items to crossfade between
  const tilePairs: [TileContent, TileContent][] = [];
  for (let i = 0; i < 10; i++) {
    tilePairs.push([allTileContent[i % allTileContent.length], allTileContent[(i + 5) % allTileContent.length]]);
  }

  return (
    <section style={{ background: '#fff', height: '85vh', overflow: 'hidden', padding: '4px' }}>
      <div className="h-full grid grid-rows-3 grid-cols-4 gap-1">

        {/* ROW 1 */}
        <FadingTile pair={tilePairs[0]} delay={0} />
        <FadingTile pair={tilePairs[1]} delay={2} />
        <FadingTile pair={tilePairs[2]} delay={4} />
        <FadingTile pair={tilePairs[3]} delay={1} />

        {/* ROW 2 */}
        <FadingTile pair={tilePairs[4]} delay={5} />

        {/* CENTER PLAYER — slightly smaller to make room for controls beneath */}
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
              src={`https://www.youtube.com/embed/${current.embed_id}?autoplay=1&mute=0&enablejsapi=1`}
              className="w-full h-full" allowFullScreen id="yt-player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          )}
          {current?.type === 'tiktok' && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://www.tiktok.com/embed/v2/${current.embed_id}`}
              className="w-full h-full" allowFullScreen allow="encrypted-media" />
          )}
          {current?.type === 'reels' && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://www.instagram.com/reel/${current.embed_id}/embed`}
              className="w-full h-full" allowFullScreen />
          )}
          {current?.type === 'x' && current.embed_id && (
            <iframe key={current.embed_id}
              src={`https://platform.twitter.com/embed/Tweet.html?id=${current.embed_id}&theme=light`}
              className="w-full h-full" allowFullScreen />
          )}
          </div>
          {/* CONTROLS BAR — below video */}
          <div className="px-3 py-2 bg-[#111] shrink-0">

            {/* Playlist timeline — gradually fills across ALL videos */}
            {playlist.length > 1 && (
              <div className="flex items-center gap-2 mt-1 mb-2">
                <span className="text-[9px] text-white/60 font-mono shrink-0">{currentIdx + 1}/{playlist.length}</span>
                <div className="h-[5px] bg-white/20 rounded-full cursor-pointer overflow-hidden flex-1"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    const idx = Math.floor(pct * playlist.length);
                    setCurrentIdx(Math.max(0, Math.min(idx, playlist.length - 1)));
                  }}>
                  <div className="h-full bg-white rounded-full transition-all duration-500 ease-linear" style={{
                    width: `${((currentIdx + (duration > 0 ? progress / duration : 0)) / playlist.length) * 100}%`
                  }} />
                </div>
              </div>
            )}

            {/* Controls row — evenly spaced */}
            <div className="flex items-center gap-4">
              {/* Now playing */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-[5px] h-[5px] rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80] animate-pulse shrink-0" />
                <span className="text-[11px] text-white font-medium truncate">
                  {current?.type === 'anchor' ? 'Daily Briefing' : `${current?.channel || current?.type?.toUpperCase() || 'Video'}: ${current?.storyTopic || ''}`}
                </span>
              </div>

              {/* Prev */}
              <button onClick={prevItem} className="flex items-center justify-center p-2 hover:opacity-60 transition-opacity shrink-0">
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[8px] border-r-white" />
              </button>

              {/* Counter */}
              <span className="text-[11px] text-white font-mono shrink-0">{currentIdx + 1} / {playlist.length}</span>

              {/* Next */}
              <button onClick={next} className="flex items-center justify-center p-2 hover:opacity-60 transition-opacity shrink-0">
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white" />
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

        <FadingTile pair={tilePairs[5]} delay={3} />

        {/* ROW 3 */}
        <FadingTile pair={tilePairs[6]} delay={6} />
        <FadingTile pair={tilePairs[7]} delay={1.5} />
        <FadingTile pair={tilePairs[8]} delay={3.5} />
        <FadingTile pair={tilePairs[9]} delay={5.5} />
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % 2);
    }, 8000 + delay * 600);
    const timeout = setTimeout(() => setActiveIdx(1), 4000 + delay * 800);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [delay]);

  const current = pair[activeIdx];
  const isVideo = current.type === 'video';

  return (
    <a href={`#story-${current.index}`}
      className="relative rounded-xl overflow-hidden group cursor-pointer block">

      {/* For video tiles — show YouTube embed playing muted */}
      {pair.map((item, i) => (
        <div key={i} className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: activeIdx === i ? 1 : 0 }}>
          {item.type === 'video' && item.playlistIdx !== undefined ? (
            <iframe
              src={`https://www.youtube.com/embed/${item.image.match(/\/vi\/([^/]+)/)?.[1]}?autoplay=1&mute=1&controls=0&loop=1&showinfo=0&modestbranding=1&playsinline=1`}
              className="w-full h-full"
              style={{ border: 'none', pointerEvents: 'none' }}
              allow="autoplay"
            />
          ) : (
            <Image src={item.image} alt={item.topic} fill className="object-cover" />
          )}
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Channel badge */}
      {isVideo && current.channel && (
        <div className="absolute top-2 right-2">
          <span className="text-[7px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded">{current.channel}</span>
        </div>
      )}

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <div className="text-[10px] font-mono text-white/40 mb-0.5">{current.index}</div>
        <h3 className="text-[11px] md:text-[12px] font-bold text-white leading-snug line-clamp-2">{current.topic}</h3>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {current.sources.slice(0, 3).map((s, i) => (
            <span key={i} className="text-[8px] font-medium text-white/50 px-1 py-0.5 rounded"
              style={{ background: s.lean === 'left' ? 'rgba(59,130,246,0.3)' : s.lean === 'right' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)' }}>
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
