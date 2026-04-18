'use client';

import { useState } from 'react';
import type { TimelineThread } from '@/lib/timeline-data';

const C = {
  bg: '#1e2a3a', panel: '#253545', panelDark: '#1a2535',
  gold: '#daa520', border: 'rgba(255,255,255,0.07)',
  text: '#e2e8f0', dim: '#7a8fa6', dimmer: '#4a5a6a',
};
const serif = `'Instrument Serif', Georgia, serif`;
const mono  = `'DM Mono', monospace`;

function catColor(cat?: string) {
  const map: Record<string, string> = {
    world: '#1d4ed8', politics: '#7c3aed', markets: '#047857',
    trending: '#b45309', sports: '#0e7490',
  };
  return map[cat ?? ''] ?? '#374151';
}
function truncateAtSentence(text: string, max: number): string {
  if (!text || text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastPeriod = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return lastPeriod > max * 0.4 ? cut.slice(0, lastPeriod + 1) + '...' : cut + '...';
}

function catLabel(cat?: string) {
  const map: Record<string, string> = {
    world: 'World', politics: 'Politics', markets: 'Markets',
    trending: 'Trending', sports: 'Sports',
  };
  return map[cat ?? ''] ?? 'News';
}

export function TimelineCarousel({ threads, blobBase }: { threads: TimelineThread[]; blobBase: string }) {
  const [idx, setIdx] = useState(0);
  if (!threads.length) return null;

  const thread = threads[idx];
  const img = thread.image_file ?? thread.entries[0]?.image_file;
  const imgUrl = img ? (img.startsWith('http') ? img : `${blobBase}${img}`) : null;
  const sorted = [...thread.entries].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const older  = sorted.slice(1, 5);

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        @media (max-width: 600px) {
          .strip-card { flex-direction: column !important; min-height: 0 !important; }
          .strip-photo { width: 100% !important; height: 150px !important; flex-shrink: 0 !important; }
          .strip-photo-fade-r { display: none !important; }
          .strip-right { padding: 14px 16px !important; }
        }
      `}</style>

      {/* Dot navigator — absolutely positioned top-right, above the <a> */}
      <div style={{
        position: 'absolute', top: 13, right: 14, zIndex: 10,
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {threads.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Thread ${i + 1}`}
            style={{
              width: i === idx ? 16 : 5, height: 5, borderRadius: 3,
              background: i === idx ? C.gold : C.dimmer,
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.2s, background 0.2s',
            }}
          />
        ))}
      </div>

      {/* Card */}
      <a href={`/timeline#${thread.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ background: C.panel, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', minHeight: 220 }} className="hover-panel strip-card">

          {/* LEFT — image */}
          <div style={{ width: 200, flexShrink: 0, position: 'relative', overflow: 'hidden', background: C.panelDark }} className="strip-photo">
            {imgUrl
              ? <img src={imgUrl} alt={thread.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.8 }} />
              : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${catColor(thread.category)}30, ${C.panelDark})` }} />
            }
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, rgba(37,53,69,0.95) 100%)' }} className="strip-photo-fade-r" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,37,53,0.9) 0%, transparent 50%)' }} />
            <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
              <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 3, background: catColor(thread.category), fontFamily: mono, fontSize: 8, letterSpacing: '0.1em', color: '#fff', textTransform: 'uppercase' }}>
                {catLabel(thread.category)}
              </span>
            </div>
          </div>

          {/* RIGHT — content */}
          <div style={{ flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column' }} className="strip-right">

            {/* header */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                Timeline · Recently Updated
              </div>
              <p style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.4, color: C.text, margin: 0, fontWeight: 400 }}>
                {thread.title}
              </p>
            </div>

            {/* latest entry */}
            {latest && (
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', color: C.gold, textTransform: 'uppercase', marginBottom: 6 }}>
                  Latest · {latest.date}
                </div>
                <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.55, color: 'rgba(226,232,240,0.85)' }}>
                  "{truncateAtSentence(latest.summary ?? '', 180)}"
                </div>
              </div>
            )}

            {/* older entries mini-timeline */}
            {older.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                {older.map((entry, i) => (
                  <div key={entry.date + i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: i < older.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.dimmer, flexShrink: 0 }} />
                      {i < older.length - 1 && <div style={{ width: 1, flex: 1, background: C.border, minHeight: 18, marginTop: 3 }} />}
                    </div>
                    <div>
                      <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.08em', color: C.dimmer, marginBottom: 2 }}>{entry.date}</div>
                      <div style={{ fontFamily: mono, fontSize: 10, color: C.dim, lineHeight: 1.4 }}>
                        {truncateAtSentence(entry.summary ?? '', 100)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
