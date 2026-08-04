'use client';

import { useState, useEffect } from 'react';
import { toSentence } from '@/lib/text';

const mono = `'DM Mono', monospace`;
const serif = `'Instrument Serif', Georgia, serif`;

function verdictColor(v: string) {
  return v === 'TRUE' ? '#4ade80' : v === 'FALSE' ? '#f87171' : '#daa520';
}

export function RollingClaim({ tweets, topic }: { tweets: { claim: string; verdict: string }[]; topic: string }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (tweets.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % tweets.length);
        setVisible(true);
      }, 350);
    }, 20000);
    return () => clearInterval(interval);
  }, [tweets.length]);

  const claim = tweets[idx];
  if (!claim) return null;

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', color: '#7a8fa6', textTransform: 'uppercase' }}>
          Claims on {topic}
        </div>
        {tweets.length > 1 && (
          <div style={{ display: 'flex', gap: 3 }}>
            {tweets.map((_, i) => (
              <div key={i} onClick={(e) => { e.preventDefault(); setIdx(i); setVisible(true); }} style={{
                width: i === idx ? 12 : 4, height: 4, borderRadius: 2,
                background: i === idx ? '#daa520' : 'rgba(255,255,255,0.15)',
                cursor: 'pointer', transition: 'all 0.3s',
              }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, minHeight: 64 }}>
        <div style={{
          fontFamily: serif, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.55,
          color: 'rgba(226,232,240,0.8)', flex: 1,
          opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease',
          willChange: 'opacity',
        }}>
          "{toSentence(claim.claim, 160)}"
        </div>
        <span style={{
          flexShrink: 0, display: 'inline-block', padding: '4px 10px', borderRadius: 4,
          background: `${verdictColor(claim.verdict)}15`, border: `1px solid ${verdictColor(claim.verdict)}35`,
          fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: verdictColor(claim.verdict), alignSelf: 'center',
          opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease',
          willChange: 'opacity',
        }}>
          {claim.verdict}
        </span>
      </div>
    </div>
  );
}
