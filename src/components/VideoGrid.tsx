"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Tweet } from 'react-tweet';

type VideoItem = {
  type: 'youtube' | 'tiktok' | 'reels' | 'x' | 'reddit' | 'telegram';
  embed_id: string;
  url: string;
  label: string;
  thumbnail?: string;
  duration?: number;
  relevance?: number;
};

export function VideoGrid({ youtubeVideos, socialClips, storyImage, storyIndex }: {
  youtubeVideos: { url: string; embed_id: string; channel?: string; duration?: number }[];
  socialClips: { platform: string; url: string; embed_id?: string; title?: string }[];
  storyImage?: string;
  storyIndex?: number;
}) {
  // Merge all videos into one list, preserving relevance order from the pipeline
  // Pipeline already sorted each array by relevance (highest first)
  // We interleave by taking the most relevant from each source alternately
  const allItems: VideoItem[] = [];

  for (const v of youtubeVideos) {
    if ((v as any).download_failed) continue; // Skip clips that failed in the pipeline
    allItems.push({
      type: 'youtube' as const, embed_id: v.embed_id, url: v.url,
      label: (v as any).title ? `${v.channel ? v.channel + ': ' : ''}${(v as any).title}` : v.channel || 'YouTube',
      thumbnail: `https://img.youtube.com/vi/${v.embed_id}/mqdefault.jpg`,
      duration: v.duration,
      relevance: (v as any).relevance,
    });
  }
  for (const c of socialClips) {
    if ((c as any).download_failed) continue; // Skip clips that failed in the pipeline
    if (c.platform === 'tiktok' && c.embed_id) {
      allItems.push({ type: 'tiktok', embed_id: c.embed_id, url: c.url, label: c.title || `TikTok @${(c as any).author || ''}`.trim(), thumbnail: (c as any).thumbnail || storyImage, duration: (c as any).duration, relevance: (c as any).relevance });
    } else if (c.platform === 'reels' && c.embed_id) {
      allItems.push({ type: 'reels', embed_id: c.embed_id, url: c.url, label: c.title || `Reels @${(c as any).author || ''}`.trim(), thumbnail: (c as any).thumbnail || storyImage, duration: (c as any).duration, relevance: (c as any).relevance });
    } else if (c.platform === 'x' && c.embed_id && (c as any).duration) {
      allItems.push({ type: 'x', embed_id: c.embed_id, url: c.url, label: c.title || `𝕏 @${(c as any).author || ''}`.trim(), thumbnail: (c as any).thumbnail, duration: (c as any).duration, relevance: (c as any).relevance });
    } else if (c.platform === 'telegram' && c.embed_id) {
      allItems.push({ type: 'telegram', embed_id: c.embed_id, url: c.url, label: c.title || `Telegram @${(c as any).author || ''}`.trim(), thumbnail: (c as any).thumbnail, duration: (c as any).duration || 30, relevance: (c as any).relevance });
    }
  }

  // Interleave by platform for variety — don't clump all YouTube then all TikTok
  // Split by platform, then round-robin pick from each
  const byPlatform: Record<string, VideoItem[]> = {};
  for (const item of allItems) {
    const key = item.type;
    if (!byPlatform[key]) byPlatform[key] = [];
    byPlatform[key].push(item);
  }
  // YouTube first, then interleave the rest
  const platforms = Object.keys(byPlatform).sort((a, b) => a === 'youtube' ? -1 : b === 'youtube' ? 1 : 0);
  const items: VideoItem[] = [];
  let maxLen = Math.max(...platforms.map(p => byPlatform[p].length));
  for (let i = 0; i < maxLen; i++) {
    for (const p of platforms) {
      if (i < byPlatform[p].length) items.push(byPlatform[p][i]);
    }
  }

  const [activeIdx, setActiveIdx] = useState(-1); // -1 = no video selected, thumbnails only
  const [playing, setPlaying] = useState(false);
  const [videosSinceAd, setVideosSinceAd] = useState(0);
  const [showingAd, setShowingAd] = useState(false);
  const adTimerRef = useRef<NodeJS.Timeout | null>(null);
  const AD_INTERVAL = 5; // show ad every 5 videos

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
  const [muted, setMuted] = useState(true); // persists across video changes
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const active = activeIdx >= 0 && items.length > 0 ? items[activeIdx] : null;

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

  const nextItem = useCallback(() => {
    if (activeIdx < items.length - 1) {
      setActiveIdx(prev => prev + 1);
      setCurrentTime(0);
      setDuration(0);
    } else {
      setPlaying(false);
    }
  }, [activeIdx, items.length]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const dur = active?.duration || 30;
    setDuration(dur);
    timerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= dur) {
          nextRef.current();
          return 0;
        }
        return prev + 0.5;
      });
    }, 500);
  }, [active]);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  // Keep next() in a ref so timers always use the latest version
  const nextRef = useRef(() => {});

  // Start/stop timer or polling based on video type
  // For YouTube: try API polling, but also run a fallback timer
  useEffect(() => {
    if (!playing) { stopPolling(); stopTimer(); return; }
    if (active?.type === 'reddit') {
      // Reddit posts are static — no auto-advance
      setDuration(0);
      setCurrentTime(0);
    } else if (active?.type === 'x' || active?.type === 'tiktok' || active?.type === 'reels') {
      // X/TikTok/Reels — no auto-advance, user controls skip
      setDuration(0);
      setCurrentTime(0);
    } else if (active?.type === 'youtube') {
      startPolling();
      // Use stored duration + 10s buffer, or 600s (10min) fallback
      // Don't skip early — better to wait too long than cut short
      const dur = active.duration ? active.duration + 10 : 600;
      setDuration(active.duration || 600);
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= dur) { nextRef.current(); return 0; }
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
          if (data.info.playerState === 0) nextRef.current();
          if (data.info.playerState === 2) { setPlaying(false); }
          if (data.info.playerState === 1) { setPlaying(true); }
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => { window.removeEventListener('message', handler); };
  }, [activeIdx]);

  // Calculate overall progress — based on which video we're on
  useEffect(() => {
    if (items.length === 0) return;
    setProgress((activeIdx + 0.5) / items.length);
  }, [activeIdx, items.length]);

  if (items.length === 0) return null;

  const triggerAdIfDue = (afterAd: () => void) => {
    setVideosSinceAd(prev => {
      const newCount = prev + 1;
      if (newCount >= AD_INTERVAL) {
        // Show ad for 5 seconds
        setShowingAd(true);
        stopPolling();
        stopTimer();
        adTimerRef.current = setTimeout(() => {
          setShowingAd(false);
          afterAd();
        }, 5000);
        return 0; // reset counter
      }
      afterAd();
      return newCount;
    });
  };

  const advanceToNext = () => {
    setActiveIdx(prev => {
      if (prev < items.length - 1) return prev + 1;
      setPlaying(false);
      return prev;
    });
    setCurrentTime(0);
    setDuration(0);
    stopPolling();
    stopTimer();
  };

  const next = nextRef.current = () => {
    triggerAdIfDue(advanceToNext);
  };

  const prevItem = () => {
    triggerAdIfDue(() => {
      setActiveIdx(prev => (prev - 1 + items.length) % items.length);
      setCurrentTime(0);
      setDuration(0);
      setPlaying(true);
      stopPolling();
      stopTimer();
    });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const platformColor = (type: string) =>
    type === 'youtube' ? '#ff0000' : type === 'tiktok' ? '#fe2c55' : type === 'x' ? '#1d9bf0' : '#c026d3';

  const closePlayer = () => { setActiveIdx(-1); setPlaying(false); setCurrentTime(0); setDuration(0); stopPolling(); stopTimer(); };

  return (
    <div className="mb-6">
      {/* PLAYER — only visible when a thumbnail is clicked */}
      {active && (
        <div className="rounded-md overflow-hidden border border-[#2a3a4a] mb-3">
          <div className="aspect-video bg-[#111] relative">
            {showingAd ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: '#111' }}>
                <div className="absolute top-2 right-3 z-10">
                  <span className="text-[9px] text-white/30 font-medium">Ad · Resuming in 5s</span>
                </div>
                <VideoAdSlot />
              </div>
            ) : playing ? (
              <>
                {active.type === 'youtube' && (
                  <iframe ref={iframeRef} key={active.embed_id}
                    src={`https://www.youtube-nocookie.com/embed/${active.embed_id}?autoplay=0&mute=${muted ? 1 : 0}&enablejsapi=1&rel=0&disablekb=1`}
                    className="w-full h-full" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                )}
                {active.type === 'tiktok' && (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: '#ffffff' }}>
                    <iframe key={active.embed_id} src={`https://www.tiktok.com/embed/v2/${active.embed_id}`}
                      style={{ border: 'none', width: '330px', height: '100%' }} allowFullScreen allow="encrypted-media" />
                  </div>
                )}
                {active.type === 'reels' && (
                  <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ background: '#1e2a3a' }}>
                    <iframe key={active.embed_id} src={`https://www.instagram.com/reel/${active.embed_id}/embed`}
                      style={{ width: '360px', height: '120%', border: 'none', marginTop: '-5%' }} allowFullScreen />
                  </div>
                )}
                {active.type === 'x' && (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: '#ffffff' }}>
                    <iframe key={active.embed_id}
                      src={`https://platform.twitter.com/embed/Tweet.html?id=${active.embed_id}&theme=light`}
                      className="h-full" style={{ border: 'none', width: '550px', maxWidth: '100%' }} allowFullScreen />
                  </div>
                )}
                {active.type === 'telegram' && (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: '#ffffff' }}>
                    <iframe key={active.embed_id}
                      src={`https://t.me/${active.embed_id}?embed=1&userpic=false`}
                      className="w-full h-full" style={{ border: 'none' }} allowFullScreen />
                  </div>
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

            {/* Close button */}
            <button onClick={closePlayer}
              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
              style={{ border: 'none', cursor: 'pointer' }}>
              <span className="text-white/70 text-[14px] leading-none">×</span>
            </button>
          </div>

          {/* CONTROLS BAR */}
          <div className="flex items-center px-3 py-2 border-t" style={{ background: '#1e2a3a', borderColor: '#2a3a4a' }}>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: platformColor(active.type) }} />
              <span className="text-[11px] text-[#ccc] font-medium truncate">{active.label}</span>
            </div>

            <button onClick={() => {
              const newMuted = !muted;
              setMuted(newMuted);
              if (iframeRef.current?.contentWindow && active.type === 'youtube') {
                iframeRef.current.contentWindow.postMessage(JSON.stringify({
                  event: 'command', func: newMuted ? 'mute' : 'unMute',
                }), '*');
              }
            }} className="text-[11px] px-2 py-0.5 rounded hover:opacity-70 transition-opacity shrink-0 mr-2"
              style={{ color: muted ? '#777' : '#fff', background: muted ? 'transparent' : '#333' }}>
              {muted ? '🔇' : '🔊'}
            </button>

            {items.length > 1 && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={prevItem} className="flex items-center justify-center p-1 hover:opacity-60 transition-opacity">
                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-[#aaa]" />
                </button>
                <span className="text-[10px] text-[#888] font-mono">{activeIdx + 1}/{items.length}</span>
                <button onClick={next} className="flex items-center justify-center p-1 hover:opacity-60 transition-opacity">
                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#aaa]" />
                </button>
              </div>
            )}

            <a href={active.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#b8860b] hover:underline ml-3 shrink-0">
              original
            </a>
          </div>
        </div>
      )}

      {/* THUMBNAILS — always visible */}
      <div className="flex items-center gap-2">
        {/* Left arrow */}
        {items.length > 6 && (
          <button onClick={() => {
            const el = document.getElementById(`thumbs-${storyIndex}-${items[0]?.embed_id}`);
            el?.scrollBy({ left: -300, behavior: 'smooth' });
          }} className="shrink-0 w-6 flex items-center justify-center hover:opacity-60 transition-opacity">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-[#666]" />
          </button>
        )}
        <div id={`thumbs-${storyIndex}-${items[0]?.embed_id}`} className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
          {items.map((item, i) => (
            <button key={i} onClick={() => { setActiveIdx(i); setCurrentTime(0); setDuration(0); setPlaying(false); stopPolling(); stopTimer(); }}
              className="rounded overflow-hidden transition-all group shrink-0 cursor-pointer"
              style={{
                width: '240px',
                border: i === activeIdx ? `2px solid ${platformColor(item.type)}` : '2px solid transparent',
                opacity: i === activeIdx ? 1 : 0.7,
              }}>
              <div className="aspect-video bg-[#111] relative overflow-hidden">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.label} className="w-full h-full object-cover" />
                ) : item.type === 'x' && item.embed_id ? (
                  <iframe
                    src={`https://platform.twitter.com/embed/Tweet.html?id=${item.embed_id}&theme=dark&hideCard=true&hideThread=true`}
                    className="w-full h-full"
                    style={{ border: 'none', pointerEvents: 'none', transform: 'scale(0.45)', transformOrigin: 'top left', width: '222%', height: '222%' }}
                    loading="lazy" tabIndex={-1}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[14px]" style={{ color: platformColor(item.type) }}>
                      {item.type === 'tiktok' ? '♪' : item.type === 'x' ? '𝕏' : '◎'}
                    </span>
                  </div>
                )}
                {/* Platform badge */}
                <div className="absolute top-1 left-1">
                  <span className="text-[7px] font-bold text-white px-1 py-0.5 rounded" style={{ background: platformColor(item.type) }}>
                    {item.type === 'youtube' ? 'YT' : item.type === 'tiktok' ? 'TT' : item.type === 'x' ? '𝕏' : 'IG'}
                  </span>
                </div>
                {/* Play icon on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="px-1.5 py-1" style={{ background: '#1e2a3a' }}>
                <span className="text-[8px] text-[#aaa] truncate block leading-tight">{item.label}</span>
              </div>
            </button>
          ))}
        </div>
        {/* Right arrow */}
        {items.length > 6 && (
          <button onClick={() => {
            const el = document.getElementById(`thumbs-${storyIndex}-${items[0]?.embed_id}`);
            el?.scrollBy({ left: 300, behavior: 'smooth' });
          }} className="shrink-0 w-6 flex items-center justify-center hover:opacity-60 transition-opacity">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[#666]" />
          </button>
        )}
      </div>
      {activeIdx < 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[10px] text-[#888]">▶ Click to play</span>
          <span className="text-[10px] text-[#555]">·</span>
          <span className="text-[10px] text-[#666]">{items.length} clips</span>
        </div>
      )}
    </div>
  );
}

function VideoAdSlot() {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <ins className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-2572735826517528"
        data-ad-slot="8292849831"
        data-ad-format="fluid"
        data-full-width-responsive="false" />
    </div>
  );
}

