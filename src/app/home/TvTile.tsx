'use client';

import { useState, useEffect } from 'react';

const mono = `'DM Mono', monospace`;
const serif = `'Instrument Serif', Georgia, serif`;

export function TvTile({ channelNum, label, sub, href, thumbs, isLive = false, interval = 4000 }: {
  channelNum: string;
  label: string;
  sub: string;
  href: string;
  thumbs: string[];
  isLive?: boolean;
  interval?: number;
}) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (thumbs.length <= 1) return;
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % thumbs.length);
        setFade(true);
      }, 400);
    }, interval);
    return () => clearInterval(t);
  }, [thumbs.length, interval]);

  const thumb = thumbs[idx];

  return (
    <a href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="tv-set">
      {/* bezel */}
      <div style={{
        background: '#1a1a1a', borderRadius: 8, padding: 5,
        border: isLive ? '2px solid rgba(239,68,68,0.5)' : '2px solid #2a2a2a',
        boxShadow: isLive
          ? '0 4px 16px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {/* screen */}
        <div style={{
          borderRadius: 4, width: 90, height: 66,
          overflow: 'hidden', position: 'relative',
          border: '1px solid rgba(255,255,255,0.04)',
          background: '#0a0f14',
        }}>
          {/* cycling thumbnail */}
          {thumb && (
            <img
              src={thumb}
              alt=""
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: fade ? 0.55 : 0,
                transition: 'opacity 0.4s ease',
              }}
            />
          )}
          {/* screen overlay gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)',
          }} />
          {/* scanline effect */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
            pointerEvents: 'none',
          }} />
          {/* channel num top-left */}
          <span style={{
            position: 'absolute', top: 5, left: 6,
            fontFamily: mono, fontSize: 6, letterSpacing: '0.14em',
            color: isLive ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.3)',
          }}>{channelNum}</span>
          {/* live dot */}
          {isLive && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 4, height: 4, borderRadius: '50%',
              background: '#991b1b',
              boxShadow: '0 0 4px rgba(153,27,27,0.8)',
              animation: 'blink 1.3s ease-in-out infinite',
              display: 'inline-block',
            }} />
          )}
          {/* label bottom */}
          <div style={{ position: 'absolute', bottom: 5, left: 6, right: 6 }}>
            <div style={{ fontFamily: serif, fontSize: 11, color: isLive ? '#fca5a5' : '#e2e8f0', lineHeight: 1.2 }}>{label}</div>
            <div style={{ fontFamily: mono, fontSize: 6, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', marginTop: 1 }}>{sub}</div>
          </div>
        </div>
      </div>
      {/* stand */}
      <div style={{ width: 24, height: 3, background: '#1a1a1a' }} />
      <div style={{ width: 36, height: 3, background: '#151515', borderRadius: 2 }} />
    </a>
  );
}
