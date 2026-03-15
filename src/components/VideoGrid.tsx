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

  if (items.length === 0) return null;

  const active = items[activeIdx];
  const next = () => setActiveIdx(prev => (prev + 1) % items.length);
  const prev = () => setActiveIdx(prev => (prev - 1 + items.length) % items.length);

  return (
    <div className="mb-6">
      {/* PLAYER */}
      <div className="rounded-md overflow-hidden border border-[#e5e5e5]">
        {active.type === 'youtube' && (
          <div className="aspect-video bg-[#111]">
            <iframe key={active.embed_id} src={`https://www.youtube.com/embed/${active.embed_id}?autoplay=0`}
              className="w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        )}
        {active.type === 'tiktok' && (
          <div className="aspect-video bg-[#111]">
            <iframe key={active.embed_id} src={`https://www.tiktok.com/embed/v2/${active.embed_id}`}
              className="w-full h-full" allowFullScreen allow="encrypted-media" />
          </div>
        )}
        {active.type === 'reels' && (
          <div className="aspect-video bg-[#111]">
            <iframe key={active.embed_id} src={`https://www.instagram.com/reel/${active.embed_id}/embed`}
              className="w-full h-full" allowFullScreen />
          </div>
        )}

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
              <button onClick={prev} className="w-6 h-6 rounded-full bg-[#eee] hover:bg-[#ddd] flex items-center justify-center transition-colors">
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

      {/* TIMELINE — click to jump between videos */}
      {items.length > 1 && (
        <div className="flex gap-1 mt-2">
          {items.map((item, i) => (
            <button key={i} onClick={() => setActiveIdx(i)}
              className="flex-1 group relative"
              title={item.label}>
              <div className="h-1.5 rounded-full transition-all" style={{
                background: i === activeIdx ? (item.type === 'youtube' ? '#ff0000' : item.type === 'tiktok' ? '#fe2c55' : '#c026d3') : '#e5e5e5',
              }} />
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-[#999] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
