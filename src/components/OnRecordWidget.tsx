"use client";

import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

type OnRecordMatch = {
  handle: string;
  name: string;
  search_keyword: string;
  matching_claims: number;
  topic_score: number;
  role?: string;
  overall_score?: number;
};

function nameToSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function OnRecordWidget({ matches }: { matches: OnRecordMatch[] }) {
  if (!matches || matches.length === 0) return null;

  const BLOB = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateArrows); ro.disconnect(); };
  }, [updateArrows]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <div className="mb-6 min-w-0 w-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: 'rgba(184,134,11,0.2)' }}>
          <span className="text-[6px] font-bold" style={{ color: '#b8860b' }}>!</span>
        </div>
        <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em]">On Record</span>
      </div>

      <div className="rounded-lg p-4" style={{ background: '#253545', border: '1px solid #2a3a4a', overflow: 'hidden', height: 'var(--card-h, auto)' }}>
      <div className="relative">
        {/* Left arrow */}
        {canLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-80"
            style={{ background: '#1e2a3a', border: '1px solid rgba(184,134,11,0.4)', color: '#daa520' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}

        {/* Right arrow */}
        {canRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-80"
            style={{ background: '#1e2a3a', border: '1px solid rgba(184,134,11,0.4)', color: '#daa520' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8 6l-3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {matches.map((m, i) => (
            <Link
              key={i}
              href={`/onrecord/${nameToSlug(m.name)}?q=${m.search_keyword}`}
              className="shrink-0 flex flex-col items-center rounded-xl p-4 transition-opacity hover:opacity-80"
              style={{
                background: '#253545',
                border: 'none',
                width: 140,
              }}
            >
              <div className="relative mb-3">
                <img
                  src={`${BLOB}/politicians/photo_${m.handle}.png`}
                  alt={m.name}
                  className="w-16 h-16 rounded-full object-cover"
                  style={{ border: '2px solid rgba(184,134,11,0.5)' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo3.png';
                    (e.target as HTMLImageElement).style.opacity = '0.3';
                  }}
                />
                {m.overall_score != null && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(184,134,11,0.4)', color: '#daa520' }}>
                    {m.overall_score}
                  </div>
                )}
              </div>
              <p className="text-center text-[12px] font-semibold leading-[1.3] mb-1" style={{ ...serif, color: '#daa520' }}>{m.name}</p>
              {m.role && (
                <p className="text-center text-[9px] text-[#666] leading-[1.3]">{m.role}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
