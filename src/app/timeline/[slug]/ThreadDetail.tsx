"use client";

import { useState } from "react";
import type { TimelineThread, ThreadEntry } from "@/lib/timeline-data";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function categoryColor(cat: string): string {
  switch (cat) {
    case 'world': return '#60a5fa';
    case 'politics': return '#f87171';
    case 'markets': return '#34d399';
    case 'trending': return '#f59e0b';
    case 'sports': return '#a78bfa';
    default: return '#999';
  }
}

export function ThreadDetail({ thread }: { thread: TimelineThread }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selectedEntry = selectedIdx !== null ? thread.entries[selectedIdx] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

      {/* Summary */}
      <div className="mb-8 p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
        <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em] block mb-2">How Did We Get Here</span>
        <p className="text-[14px] text-[#ccc] leading-[1.8]">{thread.summary}</p>
      </div>

      {/* Timeline entries */}
      <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-4">Timeline</h2>
      <div className="space-y-3 mb-8">
        {thread.entries.map((entry, i) => (
          <button key={i} onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
            className="w-full text-left rounded-lg overflow-hidden cursor-pointer transition-all"
            style={{ background: '#253545', border: selectedIdx === i ? '1px solid #daa520' : '1px solid #2a3a4a' }}>
            <div className="flex">
              {entry.image_file && (
                <div className="w-32 md:w-44 shrink-0 overflow-hidden" style={{
                  backgroundImage: `url(${entry.image_file})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  minHeight: 80,
                }} />
              )}
              <div className="flex-1 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: categoryColor(thread.category) }}>
                    {formatDate(entry.date)}
                  </span>
                </div>
                <h3 className="text-[15px] md:text-[17px] text-white leading-tight tracking-[-0.01em]" style={serif}>
                  {entry.topic}
                </h3>
              </div>
              <div className="flex items-center pr-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: selectedIdx === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            {/* Expanded content */}
            {selectedIdx === i && (
              <div className="px-4 pb-4" style={{ borderTop: '1px solid #2a3a4a' }}>
                <p className="text-[13px] text-[#bbb] leading-[1.7] mt-3 mb-4">{entry.summary}</p>

                {/* YouTube video */}
                {entry.youtube_videos && entry.youtube_videos.length > 0 && (
                  <div className="flex justify-center mb-4">
                    <div className="w-full max-w-[560px] rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${entry.youtube_videos[0].embed_id}`}
                        className="w-full h-full"
                        style={{ border: 'none' }}
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Sources */}
                {entry.sources && entry.sources.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[9px] font-bold text-[#daa520] uppercase tracking-[0.12em] block mb-2">Sources</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {entry.sources.map((s, j) => (
                        <a key={j} href={s.url} target="_blank" rel="noreferrer"
                          className="rounded p-2 hover:opacity-80 transition-opacity block"
                          style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                          <div className="flex items-start gap-2">
                            <span className="w-[5px] h-[5px] rounded-full mt-1.5 shrink-0" style={{
                              background: s.lean === 'left' ? '#1d4ed8' : s.lean === 'right' ? '#b91c1c' : '#777'
                            }} />
                            <div className="min-w-0">
                              <p className="text-[11px] text-[#ccc] leading-snug line-clamp-2">{s.title || s.name}</p>
                              <span className="text-[9px] mt-0.5 block" style={{
                                color: s.lean === 'left' ? '#60a5fa' : s.lean === 'right' ? '#f87171' : '#666'
                              }}>{s.name}</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Share */}
      <div className="flex items-center gap-3 py-4" style={{ borderTop: '1px solid #2a3a4a' }}>
        <a href={`/timeline`} className="text-[11px] text-[#888] hover:text-white transition-colors">← Back to Timeline</a>
        <span className="ml-auto text-[9px] text-[#555] uppercase tracking-[0.12em]">Share</span>
        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(thread.title)}&url=${encodeURIComponent(`https://cvrdnews.com/timeline/${thread.id}`)}`}
          target="_blank" rel="noreferrer" className="text-[11px] font-bold text-white/50 hover:text-white">𝕏</a>
        <a href={`https://www.reddit.com/submit?title=${encodeURIComponent(thread.title)}&url=${encodeURIComponent(`https://cvrdnews.com/timeline/${thread.id}`)}`}
          target="_blank" rel="noreferrer" className="opacity-50 hover:opacity-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4500"><circle cx="12" cy="12" r="12"/></svg>
        </a>
      </div>
    </div>
  );
}
