"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Tweet } from 'react-tweet';

type VideoItem = {
  type: 'youtube' | 'tiktok' | 'reels' | 'x';
  embed_id: string;
  url: string;
  label: string;
  thumbnail?: string;
  duration?: number;
};

export function VideoGrid({ youtubeVideos, socialClips, storyImage, storyIndex }: {
  youtubeVideos: { url: string; embed_id: string; channel?: string; duration?: number }[];
  socialClips: { platform: string; url: string; embed_id?: string; title?: string }[];
  storyImage?: string;
  storyIndex?: number;
}) {
  const items: VideoItem[] = [];

  for (const v of youtubeVideos) {
    items.push({
      type: 'youtube',
      embed_id: v.embed_id,
      url: v.url,
      label: v.channel || 'YouTube',
      thumbnail: `https://img.youtube.com/vi/${v.embed_id}/mqdefault.jpg`,
      duration: v.duration,
    });
  }

  for (const c of socialClips) {
    if (c.platform === 'tiktok' && c.embed_id) {
      items.push({ type: 'tiktok', embed_id: c.embed_id, url: c.url, label: c.title || 'TikTok', duration: (c as any).duration });
    } else if (c.platform === 'reels' && c.embed_id) {
      items.push({ type: 'reels', embed_id: c.embed_id, url: c.url, label: c.title || 'Reels', duration: (c as any).duration });
    } else if (c.platform === 'x' && c.embed_id && (c as any).duration) {
      // Only include X posts that have video (duration > 0 means video attached)
      items.push({ type: 'x', embed_id: c.embed_id, url: c.url, label: c.title || (c as any).author || 'X', duration: (c as any).duration });
    }
    // Reddit skipped — not embeddable, shown in expand section instead
  }

  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Auto-select video from URL hash (when tile is clicked in dashboard)
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash.includes('--') || !storyIndex) return;
      const [storyPart, embedId] = hash.split('--');
      if (storyPart !== `story-${storyIndex}` || !embedId) return;
      const idx = items.findIndex(item => item.embed_id === embedId);
      if (idx >= 0) {
        setActiveIdx(idx);
        setPlaying(false); // Ready to play, not auto-playing
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [items, storyIndex]);
  const [progress, setProgress] = useState(0); // 0-1 across entire playlist
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const active = items.length > 0 ? items[activeIdx] : null;

  // Poll YouTube iframe for current time via postMessage
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        // Request current time and duration from YouTube
        iframeRef.current.contentWindow.postMessage(JSON.stringify({
          event: 'command', func: 'getCurrentTime'
        }), '*');
        iframeRef.current.contentWindow.postMessage(JSON.stringify({
          event: 'command', func: 'getDuration'
        }), '*');
      }
    }, 500);
  }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  // Timer for TikTok/Reels progress (uses stored duration)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const dur = active?.duration || 30; // fallback 30s
    setDuration(dur);
    timerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= dur) {
          next();
          return 0;
        }
        return prev + 0.5;
      });
    }, 500);
  }, [active]);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  // Start/stop timer or polling based on video type
  // For YouTube: try API polling, but also run a fallback timer
  useEffect(() => {
    if (!playing) { stopPolling(); stopTimer(); return; }
    if (active?.type === 'x') {
      // X posts are static embeds — no timer, no auto-advance
      setDuration(0);
      setCurrentTime(0);
    } else if (active?.type === 'youtube') {
      startPolling();
      const dur = active.duration || 120;
      setDuration(dur);
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= dur) { next(); return 0; }
          return prev + 0.5;
        });
      }, 500);
    } else {
      startTimer();
    }
    return () => { stopPolling(); stopTimer(); };
  }, [playing, activeIdx]);

  // Listen for YouTube API responses
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
          if (data.info.playerState === 0) next();
          if (data.info.playerState === 2) { setPlaying(false); }
          if (data.info.playerState === 1) { setPlaying(true); }
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => { window.removeEventListener('message', handler); };
  }, [activeIdx]);

  // Calculate overall progress
  useEffect(() => {
    if (items.length === 0) return;
    const dur = duration || active?.duration || 120;
    const segmentSize = 1 / items.length;
    const segmentProgress = dur > 0 ? Math.min(currentTime / dur, 1) : 0;
    setProgress(activeIdx * segmentSize + segmentProgress * segmentSize);
  }, [activeIdx, currentTime, duration, items.length]);

  if (items.length === 0 || !active) return null;

  const next = () => {
    if (activeIdx < items.length - 1) {
      setActiveIdx(prev => prev + 1);
      setCurrentTime(0);
      setDuration(0);
    } else {
      setPlaying(false);
      stopPolling();
    }
  };
  const prevItem = () => {
    setActiveIdx(prev => (prev - 1 + items.length) % items.length);
    setCurrentTime(0);
    setDuration(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-6">
      {/* PLAYER */}
      <div className="rounded-md overflow-hidden border border-[#e5e5e5]">
        <div className="aspect-video bg-[#111] relative">
          {playing ? (
            <>
              {active.type === 'youtube' && (
                <iframe ref={iframeRef} key={`${active.embed_id}-${activeIdx}`}
                  src={`https://www.youtube.com/embed/${active.embed_id}?autoplay=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                  className="w-full h-full" allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              )}
              {active.type === 'tiktok' && (
                <iframe key={active.embed_id} src={`https://www.tiktok.com/embed/v2/${active.embed_id}`}
                  className="w-full h-full" allowFullScreen allow="encrypted-media" />
              )}
              {active.type === 'reels' && (
                <iframe key={active.embed_id} src={`https://www.instagram.com/reel/${active.embed_id}/embed`}
                  className="w-full h-full" allowFullScreen />
              )}
              {active.type === 'x' && (
                <iframe key={active.embed_id}
                  src={`https://platform.twitter.com/embed/Tweet.html?id=${active.embed_id}&theme=light`}
                  className="w-full h-full"
                  style={{ border: 'none' }}
                  allowFullScreen />
              )}
            </>
          ) : (
            <div className="w-full h-full cursor-pointer" onClick={() => setPlaying(true)}>
              {active.thumbnail ? (
                <img src={active.thumbnail} alt={active.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#111]" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-white ml-1" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS BAR */}
        <div className="flex items-center px-3 py-2 bg-[#fafafa] border-t border-[#f0f0f0]">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{
              background: active.type === 'youtube' ? '#ff0000' : active.type === 'tiktok' ? '#fe2c55' : active.type === 'x' ? '#1d9bf0' : '#c026d3'
            }} />
            <span className="text-[11px] text-[#555] font-medium truncate">{active.label}</span>
            {playing && duration > 0 && active.type !== 'x' && (
              <span className="text-[9px] text-[#999] font-mono ml-1">{formatTime(currentTime)} / {formatTime(duration)}</span>
            )}
          </div>

          {items.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={prevItem} className="flex items-center justify-center p-1 hover:opacity-60 transition-opacity">
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-[#555]" />
              </button>
              <span className="text-[10px] text-[#999] font-mono">{activeIdx + 1}/{items.length}</span>
              <button onClick={next} className="flex items-center justify-center p-1 hover:opacity-60 transition-opacity">
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#555]" />
              </button>
            </div>
          )}

          <a href={active.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#b8860b] hover:underline ml-3 shrink-0">
            original
          </a>
        </div>
      </div>

      {/* TIMELINE + THUMBNAILS */}
      {items.length > 1 && (
        <div className="mt-3">
          {/* Progress bar — gradually fills based on actual playback */}
          <div className="h-2 rounded-full overflow-hidden bg-[#e5e5e5] mb-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              const idx = Math.floor(pct * items.length);
              const newIdx = Math.max(0, Math.min(idx, items.length - 1));
              setActiveIdx(newIdx);
              setCurrentTime(0);
              setDuration(0);
              setPlaying(true);
              stopPolling();
              stopTimer();
            }}>
            <div className="h-full rounded-full transition-all duration-500 ease-linear" style={{
              width: `${progress * 100}%`,
              background: active.type === 'youtube' ? '#ff0000' : active.type === 'tiktok' ? '#fe2c55' : active.type === 'x' ? '#1d9bf0' : '#c026d3',
            }} />
          </div>

          {/* Thumbnails — scrollable with arrows */}
          <div className="relative">
            {items.length > 4 && (
              <>
                <button onClick={() => {
                  const el = document.getElementById(`thumbs-${items[0]?.embed_id}`);
                  el?.scrollBy({ left: -300, behavior: 'smooth' });
                }} className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-white to-transparent">
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-[#999]" />
                </button>
                <button onClick={() => {
                  const el = document.getElementById(`thumbs-${items[0]?.embed_id}`);
                  el?.scrollBy({ left: 300, behavior: 'smooth' });
                }} className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-white to-transparent">
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[#999]" />
                </button>
              </>
            )}
          <div id={`thumbs-${items[0]?.embed_id}`} className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {items.map((item, i) => (
              <button key={i} onClick={() => { setActiveIdx(i); setCurrentTime(0); setDuration(0); setPlaying(true); }}
                className="rounded overflow-hidden transition-all group shrink-0"
                style={{
                  width: '100px',
                  border: i === activeIdx ? `2px solid ${item.type === 'youtube' ? '#ff0000' : item.type === 'tiktok' ? '#fe2c55' : item.type === 'x' ? '#1d9bf0' : '#c026d3'}` : '2px solid transparent',
                  opacity: i === activeIdx ? 1 : i < activeIdx ? 0.5 : 0.7,
                }}>
                <div className="aspect-video bg-[#111] relative">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[14px]" style={{ color: item.type === 'tiktok' ? '#fe2c55' : item.type === 'x' ? '#1d9bf0' : '#c026d3' }}>
                        {item.type === 'tiktok' ? '♪' : item.type === 'x' ? '𝕏' : '◎'}
                      </span>
                    </div>
                  )}
                  {i !== activeIdx && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-1 py-0.5 bg-[#fafafa]">
                  <span className="text-[7px] text-[#777] truncate block">{item.label}</span>
                </div>
              </button>
            ))}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
