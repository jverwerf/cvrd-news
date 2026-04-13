'use client';

import { TileAdBanner } from '@/components/AdBanners';

export type YTVideo = {
  embed_id: string;
  url: string;
  channel?: string;
};

function platformColor() { return '#b8860b'; }

export function HeroVideoTiles({ videos }: { videos: YTVideo[] }) {
  if (!videos.length) return null;

  // Insert ad after slot 2 (index 2)
  const AD_SLOT = 2;

  return (
    <div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9, letterSpacing: '0.12em', color: 'rgba(122,143,166,0.8)',
        textTransform: 'uppercase', marginBottom: 10,
      }}>
        How different outlets covered this story
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-scroll">
        {videos.map((v, i) => (
          <>
            <a key={v.embed_id} href={v.url} target="_blank" rel="noreferrer"
              style={{ textDecoration: 'none', flexShrink: 0, width: 220 }} className="vid-tile">
              {/* tile */}
              <div style={{
                width: '100%', aspectRatio: '16/9', position: 'relative',
                overflow: 'hidden', borderRadius: 6,
                border: '2px solid transparent',
                background: '#111',
              }} className="vid-tile-inner">
                <img
                  src={`https://img.youtube.com/vi/${v.embed_id}/mqdefault.jpg`}
                  alt={v.channel ?? ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* play overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.15)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(2px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 0, height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderLeft: '9px solid rgba(255,255,255,0.9)',
                      marginLeft: 2,
                    }} />
                  </div>
                </div>
              </div>
              {/* label below tile */}
              {v.channel && (
                <div style={{
                  marginTop: 4, paddingLeft: 2,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: platformColor(), flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9.5,
                    color: 'rgba(226,232,240,0.6)', letterSpacing: '0.04em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{v.channel}</span>
                </div>
              )}
            </a>

            {/* Ad tile after slot AD_SLOT */}
            {i === AD_SLOT && (
              <div key="ad" style={{ flexShrink: 0, width: 220 }}>
                <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                  <TileAdBanner />
                </div>
                <div style={{ marginTop: 4, paddingLeft: 2 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, color: 'rgba(122,143,166,0.4)', letterSpacing: '0.04em' }}>
                    Sponsored
                  </span>
                </div>
              </div>
            )}
          </>
        ))}
      </div>

      <style>{`
        .vid-tile-inner { transition: border-color 0.15s; }
        .vid-tile:hover .vid-tile-inner { border-color: rgba(184,134,11,0.5) !important; }
      `}</style>
    </div>
  );
}
