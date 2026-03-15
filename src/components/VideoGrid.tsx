"use client";

import { useState } from "react";

type VideoItem = {
  type: 'youtube' | 'tiktok' | 'reels';
  embed_id: string;
  url: string;
  label: string;
  thumbnail?: string;
};

export function VideoGrid({ youtubeVideos, socialClips, storyImage }: {
  youtubeVideos: { url: string; embed_id: string; channel?: string }[];
  socialClips: { platform: string; url: string; embed_id?: string; title?: string }[];
  storyImage?: string;
}) {
  const items: VideoItem[] = [];

  for (const v of youtubeVideos) {
    items.push({
      type: 'youtube',
      embed_id: v.embed_id,
      url: v.url,
      label: v.channel || 'YouTube',
      thumbnail: `https://img.youtube.com/vi/${v.embed_id}/mqdefault.jpg`,
    });
  }

  for (const c of socialClips) {
    if (c.platform === 'tiktok' && c.embed_id) {
      items.push({ type: 'tiktok', embed_id: c.embed_id, url: c.url, label: c.title || 'TikTok' });
    } else if (c.platform === 'reels' && c.embed_id) {
      items.push({ type: 'reels', embed_id: c.embed_id, url: c.url, label: c.title || 'Reels' });
    }
  }

  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  if (items.length === 0) return null;

  const active = items[activeIdx];
  const next = () => {
    if (activeIdx < items.length - 1) {
      setActiveIdx(prev => prev + 1);
    } else {
      setPlaying(false); // Stop at end of playlist
    }
  };
  const prevItem = () => setActiveIdx(prev => (prev - 1 + items.length) % items.length);

  return (
    <div className="mb-6">
      {/* PLAYER */}
      <div className="rounded-md overflow-hidden border border-[#e5e5e5]">
        <div className="aspect-video bg-[#111] relative">
          {playing ? (
            <>
              {active.type === 'youtube' && (
                <iframe key={`${active.embed_id}-${activeIdx}`}
                  src={`https://www.youtube.com/embed/${active.embed_id}?autoplay=1&enablejsapi=1`}
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
            </>
          ) : (
            /* Thumbnail with play button when not playing */
            <div className="w-full h-full cursor-pointer" onClick={() => setPlaying(true)}>
              {active.thumbnail ? (
                <img src={active.thumbnail} alt={active.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#111]" />
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
          {/* Source label */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{
              background: active.type === 'youtube' ? '#ff0000' : active.type === 'tiktok' ? '#fe2c55' : '#c026d3'
            }} />
            <span className="text-[11px] text-[#555] font-medium truncate">{active.label}</span>
          </div>

          {/* Prev / counter / Next */}
          {items.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={prevItem} className="w-6 h-6 rounded-full bg-[#eee] hover:bg-[#ddd] flex items-center justify-center transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#555"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" transform="scale(-1,1) translate(-24,0)" /></svg>
              </button>
              <span className="text-[10px] text-[#999] font-mono">{activeIdx + 1}/{items.length}</span>
              <button onClick={next} className="w-6 h-6 rounded-full bg-[#eee] hover:bg-[#ddd] flex items-center justify-center transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#555"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
              </button>
            </div>
          )}

          {/* Open original */}
          <a href={active.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#b8860b] hover:underline ml-3 shrink-0">
            original
          </a>
        </div>
      </div>

      {/* PROGRESS TIMELINE — spans across all videos */}
      {items.length > 1 && (
        <div className="flex gap-0 mt-2 h-1 rounded-full overflow-hidden bg-[#e5e5e5]">
          {items.map((item, i) => (
            <button key={i} onClick={() => { setActiveIdx(i); setPlaying(true); }}
              className="h-full transition-all"
              style={{
                flex: 1,
                background: i < activeIdx ? (item.type === 'youtube' ? '#ff0000' : item.type === 'tiktok' ? '#fe2c55' : '#c026d3')
                  : i === activeIdx ? (playing ? (item.type === 'youtube' ? '#ff0000' : item.type === 'tiktok' ? '#fe2c55' : '#c026d3') : '#bbb')
                  : '#e5e5e5',
                borderRight: i < items.length - 1 ? '1px solid white' : 'none',
              }}
              title={item.label}
            />
          ))}
        </div>
      )}

      {/* THUMBNAIL STRIP — click to jump between videos */}
      {items.length > 1 && (
        <div className="flex gap-1.5 mt-2 overflow-x-auto">
          {items.map((item, i) => (
            <button key={i} onClick={() => { setActiveIdx(i); setPlaying(true); }}
              className="shrink-0 rounded overflow-hidden transition-all group"
              style={{
                width: '120px',
                border: i === activeIdx ? `2px solid ${item.type === 'youtube' ? '#ff0000' : item.type === 'tiktok' ? '#fe2c55' : '#c026d3'}` : '2px solid #e5e5e5',
                opacity: i === activeIdx ? 1 : 0.7,
              }}>
              <div className="aspect-video bg-[#111] relative">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[14px]" style={{ color: item.type === 'tiktok' ? '#fe2c55' : '#c026d3' }}>
                      {item.type === 'tiktok' ? '♪' : '◎'}
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
              <div className="px-1.5 py-1 bg-[#fafafa]">
                <div className="flex items-center gap-1">
                  <span className="w-[4px] h-[4px] rounded-full shrink-0" style={{
                    background: item.type === 'youtube' ? '#ff0000' : item.type === 'tiktok' ? '#fe2c55' : '#c026d3'
                  }} />
                  <span className="text-[8px] text-[#777] truncate">{item.label}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
