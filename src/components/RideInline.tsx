"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { RidePayload } from "@/lib/ride-data";

const BLOB = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';

const RideClient = dynamic(() => import("@/app/timeline/[slug]/ride/RideClient").then(m => m.RideClient), {
  ssr: false,
  loading: () => (
    <div style={{
      position: 'absolute', inset: 0, display: 'grid', placeContent: 'center',
      fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.22em',
      textTransform: 'uppercase', color: 'rgba(126,142,151,0.75)',
    }}>Threading…</div>
  ),
});

/**
 * A thread offered two ways on its own picture: play it, or read it. Only one
 * player is ever live on the page — a WebGL scene plus five YouTube players per
 * row would flatten a laptop — so the list hands the live slot around.
 */
export function RideInline({ slug, title, count, active, onPlay, height = 300, image, clips = [], dates = [], summary, narrow, canPlay = true, metaLabel }: {
  slug: string;
  title: string;
  count: number;
  active: boolean;
  onPlay: () => void;
  height?: number;
  image?: string;        // the thread's own picture
  clips?: string[];      // first few youtube ids, shown riding the line
  dates?: string[];
  summary?: string;   // what the thread is actually about
  narrow?: boolean;   // stacked, for a half-width column
  canPlay?: boolean;  // false when this thread has no timeline built yet
  metaLabel?: string; // replaces the development count when what it IS matters
                      // more than how big it is
}) {
  const [ride, setRide] = useState<RidePayload | null>(null);

  useEffect(() => {
    if (!active || ride) return;
    let dead = false;
    // no-cache: always revalidate — a rebuilt ride must never play cached
    // captions against fresh voice (or vice versa)
    fetch(`${BLOB}/data/ride/${slug}.json`, { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (!dead) setRide(j); })
      .catch(() => {});
    return () => { dead = true; };
  }, [active, slug, ride]);

  if (active && ride) {
    return (
      <div className="relative overflow-hidden" style={{
        height: Math.max(height, 330), background: '#060B11', isolation: 'isolate', zIndex: 0, contain: 'paint',
      }}>
        <RideClient ride={ride} compact expandHref={`/timeline/${slug}/ride`} />
      </div>
    );
  }

  const span = dates.length > 1
    ? `${fmtShort(dates[0])} → ${fmtShort(dates[dates.length - 1])}`
    : `${count} days`;

  return (
    <div className="relative overflow-hidden" style={{ height, background: '#0B1218' }}>
      {image && (
        <img src={image} alt=""
             style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(8,14,20,0.94) 0%, rgba(8,14,20,0.72) 46%, rgba(8,14,20,0.86) 100%)' }} />

      <div className="relative h-full grid gap-4" style={{
        padding: narrow ? '16px 16px' : '18px 20px',
        gridTemplateColumns: narrow ? '1fr' : '1fr 480px',
        gridTemplateRows: narrow ? 'auto 1fr' : undefined,
      }}>
        {/* left: what this thread is */}
        <div className="min-w-0 flex flex-col">
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 25, color: '#fff', lineHeight: 1.1 }}>{title}</div>
          <div style={{ marginTop: 5, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(230,236,239,0.5)', fontFamily: 'ui-monospace, monospace' }}>
            {metaLabel || `${count} developments · ${span}`}
          </div>
          {summary && (
            <p style={{
              marginTop: 10, fontSize: 12.5, lineHeight: 1.6, color: 'rgba(230,236,239,0.74)',
              display: '-webkit-box', WebkitLineClamp: narrow ? 2 : 5, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{summary}</p>
          )}
          {!narrow && (
            <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: 11, color: 'rgba(230,236,239,0.45)', lineHeight: 1.5 }}>
              Follow it as a story or read it day by day.
            </div>
          )}
        </div>

        {/* right: the two ways in */}
        <div className="flex flex-col gap-2 min-w-0">
          {canPlay && (
          <button onClick={onPlay}
            className="group relative overflow-hidden text-left flex-1"
            style={{ border: '1px solid rgba(224,169,78,0.45)', background: 'rgba(224,169,78,0.05)', cursor: 'pointer', padding: 0, minHeight: 0 }}>
            <svg viewBox="0 0 320 110" preserveAspectRatio="none"
                 style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <path d="M-10 70 C 60 70, 78 16, 150 28 S 260 76, 330 34"
                    fill="none" stroke="url(#g)" strokeWidth="1.6" />
              <defs>
                <linearGradient id="g" x1="0" x2="1">
                  <stop offset="0" stopColor="#E0A94E" stopOpacity="0" />
                  <stop offset="0.25" stopColor="#E0A94E" stopOpacity="0.9" />
                  <stop offset="0.6" stopColor="#F6D9A0" />
                  <stop offset="1" stopColor="#E0A94E" stopOpacity="0.15" />
                </linearGradient>
              </defs>
            </svg>

            {clips.slice(0, 3).map((id, i) => (
              <img key={id} src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt=""
                   style={{
                     position: 'absolute', width: 92, height: 52, objectFit: 'cover',
                     border: '1px solid rgba(224,169,78,0.5)',
                     left: `${9 + i * 28}%`, top: `${[30, 6, 24][i]}%`,
                     transform: `rotate(${[-4, 2, -2][i]}deg)`,
                     boxShadow: '0 6px 16px rgba(0,0,0,0.55)',
                   }} />
            ))}

            <span style={{
              position: 'absolute', left: 12, bottom: 10, display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'ui-monospace, monospace', fontSize: 10.5, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: '#F6D9A0',
            }}>▶ Play recap</span>
            <span style={{
              position: 'absolute', right: 12, bottom: 11, fontSize: 9,
              color: 'rgba(230,236,239,0.5)', fontFamily: 'ui-monospace, monospace',
            }}>narrated · {Math.max(1, Math.round(count / 22))} min</span>
          </button>
          )}

          {/* The recap stops at the turning points; this plays every single
              development. Same player, the ?mode=full payload. */}
          {canPlay && (
          <a href={`/timeline/${slug}/ride?mode=full`}
             className="group relative overflow-hidden flex items-center justify-between shrink-0"
             style={{
               border: '1px solid rgba(224,169,78,0.28)', background: 'rgba(224,169,78,0.04)',
               textDecoration: 'none', padding: '10px 12px', height: 46,
             }}>
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: '#F6D9A0',
            }}>▶ Play the entire history</span>
            <span style={{
              fontSize: 9, color: 'rgba(230,236,239,0.5)', fontFamily: 'ui-monospace, monospace',
            }}>all {count}</span>
          </a>
          )}

          <a href={`/timeline/${slug}`}
             className="group relative overflow-hidden flex items-center justify-between shrink-0"
             style={{
               border: '1px solid rgba(230,236,239,0.13)', background: 'rgba(230,236,239,0.03)',
               textDecoration: 'none', padding: '10px 12px',
               height: canPlay ? 46 : undefined, flex: canPlay ? undefined : 1,
             }}>
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'rgba(230,236,239,0.8)',
            }}>{canPlay ? 'Read it day by day' : 'Open the thread'}</span>
            <span style={{ display: 'flex', gap: 3 }}>
              {[0.9, 0.6, 0.75].map((w, i) => (
                <span key={i} style={{ width: 22 * w, height: 1.5, background: 'rgba(230,236,239,0.25)' }} />
              ))}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

function fmtShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}
