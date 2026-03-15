"use client";

import { useState } from "react";
import Image from "next/image";

type VideoItem = {
  type: 'youtube' | 'tiktok' | 'reels' | 'x' | 'reddit';
  embed_id?: string;
  url: string;
  label: string;
  thumbnail?: string;
};

export function VideoGrid({ youtubeVideos, socialClips, storyImage }: {
  youtubeVideos: { url: string; embed_id: string; channel?: string }[];
  socialClips: { platform: string; url: string; embed_id?: string; title?: string }[];
  storyImage?: string;
}) {
  // Build unified list of all visual content
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
    } else if (c.platform === 'x' && c.embed_id) {
      items.push({ type: 'x', embed_id: c.embed_id, url: c.url, label: c.title || 'X' });
    } else if (c.url) {
      items.push({ type: c.platform as any, url: c.url, label: c.title || c.platform });
    }
  }

  const [activeIdx, setActiveIdx] = useState(0);

  if (items.length === 0) return null;

  const active = items[activeIdx];
  const thumbs = items.filter((_, i) => i !== activeIdx);

  // Platform colors
  const platformColor: Record<string, string> = {
    youtube: '#ff0000', tiktok: '#fe2c55', reels: '#c026d3', x: '#111', reddit: '#ff4500',
  };
  const platformName: Record<string, string> = {
    youtube: 'YouTube', tiktok: 'TikTok', reels: 'Reels', x: 'X', reddit: 'Reddit',
  };

  return (
    <div className="mb-5">
      {/* MAIN PLAYER */}
      <div className="rounded-md overflow-hidden border border-[#e5e5e5] mb-2">
        {active.type === 'youtube' && active.embed_id && (
          <div className="aspect-video bg-[#111]">
            <iframe key={active.embed_id} src={`https://www.youtube.com/embed/${active.embed_id}`}
              className="w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        )}
        {active.type === 'tiktok' && active.embed_id && (
          <div className="bg-[#111] aspect-video">
            <iframe key={active.embed_id} src={`https://www.tiktok.com/embed/v2/${active.embed_id}`}
              className="w-full h-full" allowFullScreen allow="encrypted-media" />
          </div>
        )}
        {active.type === 'reels' && active.embed_id && (
          <div className="bg-[#111] aspect-video">
            <iframe key={active.embed_id} src={`https://www.instagram.com/reel/${active.embed_id}/embed`}
              className="w-full h-full" allowFullScreen />
          </div>
        )}
        {(active.type === 'x' || active.type === 'reddit' || !active.embed_id) && (
          <a href={active.url} target="_blank" rel="noreferrer"
            className="flex items-center justify-center aspect-video bg-[#f5f5f5] hover:bg-[#eee] transition-colors">
            <span className="text-[14px] text-[#666]">Open on {platformName[active.type] || active.type} →</span>
          </a>
        )}
        <div className="flex items-center justify-between px-3 py-2 bg-[#fafafa] border-t border-[#f0f0f0]">
          <div className="flex items-center gap-1.5">
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: platformColor[active.type] || '#999' }} />
            <span className="text-[11px] text-[#555] font-medium">{active.label}</span>
          </div>
          <a href={active.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#b8860b] hover:underline">
            original
          </a>
        </div>
      </div>

      {/* THUMBNAIL GRID */}
      {thumbs.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {thumbs.map((item, i) => {
            const realIdx = items.findIndex(v => v === item);
            return (
              <button key={i} onClick={() => setActiveIdx(realIdx)}
                className="relative rounded-sm overflow-hidden border border-[#e5e5e5] hover:border-[#b8860b] transition-all group cursor-pointer shrink-0"
                style={{ width: '240px' }}>
                <div className="aspect-video bg-[#111] relative">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.label}
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[12px]" style={{ color: platformColor[item.type] || '#999' }}>
                        {item.type === 'tiktok' ? '♪' : item.type === 'reels' ? '◎' : item.type === 'x' ? '𝕏' : '▶'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-1 py-0.5 bg-[#fafafa]">
                  <span className="text-[7px] text-[#999] truncate block">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
