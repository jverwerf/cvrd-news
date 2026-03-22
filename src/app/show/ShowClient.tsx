"use client";

import { useState } from "react";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

type Episode = {
  date: string;
  videoUrl: string;
  embedId: string;
  topics: string[];
};

export function ShowClient({ episodes }: { episodes: Episode[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = episodes[activeIdx];

  return (
    <div style={{ fontFamily: 'var(--font-dm), -apple-system, sans-serif' }}>
      {/* NAV */}
      <div className="px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-[13px] text-white/50 hover:text-white transition-colors">← Back to CVRD News</a>
        <img src="/logo3.png" alt="CVRD" style={{ height: '32px', opacity: 0.3 }} />
      </div>

      {/* HEADER */}
      <div className="px-6 md:px-12 py-8 text-center">
        <h1 className="text-[36px] md:text-[48px] text-white tracking-[-0.03em] mb-2" style={serif}>
          The Daily Covered
        </h1>
        <p className="text-[14px] text-white/40">Every day, the stories they won&apos;t cover — in one show.</p>
      </div>

      {episodes.length === 0 ? (
        <div className="px-6 md:px-12 py-20 text-center">
          <p className="text-[16px] text-white/30 mb-4">No episodes yet.</p>
          <p className="text-[13px] text-white/20">Episodes will appear here once published.</p>
          <a href="https://www.youtube.com/@CoveredNews" target="_blank" rel="noreferrer"
            className="inline-block mt-6 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white transition-colors"
            style={{ background: '#ff0000' }}>
            Watch on YouTube →
          </a>
        </div>
      ) : (
        <div className="px-6 md:px-12 max-w-[900px] mx-auto">
          {/* PLAYER */}
          {active && (
            <div className="rounded-lg overflow-hidden mb-6" style={{ border: '1px solid #1a2535' }}>
              <div className="aspect-video">
                <iframe
                  key={active.embedId}
                  src={`https://www.youtube-nocookie.com/embed/${active.embedId}?rel=0`}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  style={{ border: 'none' }}
                />
              </div>
              <div className="px-4 py-3" style={{ background: '#111' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-white/40 font-medium">{active.date}</span>
                    <h2 className="text-[16px] text-white font-medium mt-0.5" style={serif}>
                      The Daily Covered — {active.date}
                    </h2>
                  </div>
                  <a href={`https://www.youtube.com/watch?v=${active.embedId}`} target="_blank" rel="noreferrer"
                    className="text-[10px] text-[#b8860b] hover:underline shrink-0">
                    Watch on YouTube →
                  </a>
                </div>
                {active.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {active.topics.map((t, i) => (
                      <span key={i} className="text-[9px] text-white/50 px-2 py-0.5 rounded" style={{ background: '#1a2535' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EPISODE LIST */}
          {episodes.length > 1 && (
            <div className="space-y-1 mb-12">
              <h3 className="text-[11px] text-white/30 uppercase tracking-[0.15em] font-bold mb-3">All Episodes</h3>
              {episodes.map((ep, i) => (
                <button key={i} onClick={() => setActiveIdx(i)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                  style={{
                    background: i === activeIdx ? '#1a2535' : 'transparent',
                    border: 'none', cursor: 'pointer',
                  }}>
                  <img src={`https://img.youtube.com/vi/${ep.embedId}/mqdefault.jpg`} alt="" className="w-24 h-14 rounded object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-white/40">{ep.date}</span>
                    <p className="text-[13px] text-white/80 truncate">The Daily Covered — {ep.date}</p>
                  </div>
                  {i === activeIdx && <span className="text-[10px] text-[#b8860b] shrink-0">Now playing</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
