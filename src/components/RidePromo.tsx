"use client";

const BLOB = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';

/**
 * Entry points to a played thread. They show a real frame of it rather than a
 * badge, and they say what pressing play actually does — the whole thread,
 * in order, told to you — because "ride" means nothing to a reader.
 */
export function RidePromo({ slug, count, title, size = 'wide' }: {
  slug: string;
  count: number;
  title?: string;
  size?: 'wide' | 'tile' | 'chip' | 'banner';
}) {
  const poster = `${BLOB}/data/ride/${slug}-poster.jpg`;
  const href = `/timeline/${slug}/ride`;

  // sits in a list row: small, but says what it does
  if (size === 'chip') {
    return (
      <a href={href} onClick={(e) => e.stopPropagation()}
         className="group relative block overflow-hidden shrink-0"
         style={{ width: 150, height: 52, border: '1px solid rgba(224,169,78,0.4)', textDecoration: 'none' }}>
        <img src={poster} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2,
          background: 'rgba(6,11,17,0.5)', fontFamily: 'ui-monospace, monospace',
        }}>
          <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F6D9A0' }}>▶ Play story</span>
          <span style={{ fontSize: 9, color: 'rgba(230,236,239,0.65)' }}>{count} days · narrated</span>
        </span>
      </a>
    );
  }

  // introduces the whole idea at the top of the timeline page
  if (size === 'banner') {
    return (
      <a href={href} className="group relative block overflow-hidden"
         style={{ border: '1px solid rgba(224,169,78,0.42)', textDecoration: 'none', background: '#060B11' }}>
        <img src={poster} alt=""
             style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 45%', opacity: 0.9 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(6,11,17,0.95) 0%, rgba(6,11,17,0.82) 42%, rgba(6,11,17,0.35) 100%)' }} />
        <div className="relative flex items-center justify-between gap-6" style={{ padding: '26px 28px', minHeight: 150 }}>
          <div style={{ maxWidth: '52ch' }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#E0A94E' }}>
              Don't read it — watch it
            </div>
            <div className="mt-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 27, color: '#fff', lineHeight: 1.15 }}>
              Press play and the thread tells itself
            </div>
            <div className="mt-2" style={{ fontSize: 12.5, color: 'rgba(230,236,239,0.72)', lineHeight: 1.65 }}>
              Every development in order, from the first day to today, with the coverage from each one playing as you go and a narrator on the moments that mattered.
              {title && <> Starting with <span style={{ color: '#F6D9A0' }}>{title}</span>, {count} days of it.</>}
            </div>
          </div>
          <span className="shrink-0" style={{
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            border: '1px solid rgba(224,169,78,0.6)', padding: '12px 18px',
            fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#F6D9A0',
          }}>▶ Play</span>
        </div>
      </a>
    );
  }

  const tall = size === 'tile';
  return (
    <a href={href} className="group relative block overflow-hidden"
       style={{ border: '1px solid rgba(224,169,78,0.42)', textDecoration: 'none', background: '#060B11' }}>
      <img src={poster} alt=""
           style={{ display: 'block', width: '100%', height: tall ? 220 : 168, objectFit: 'cover', objectPosition: 'center 42%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,11,17,0.05) 0%, rgba(6,11,17,0.55) 62%, rgba(6,11,17,0.94) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: tall ? '16px 18px' : '18px 22px' }}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: tall ? 20 : 24, color: '#fff', lineHeight: 1.15 }}>
              {title ? `Watch ${title} unfold` : 'Watch this thread unfold'}
            </div>
            <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(230,236,239,0.72)', fontFamily: 'ui-monospace, monospace' }}>
              {count} days, in order · narrated
            </div>
          </div>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            border: '1px solid rgba(224,169,78,0.6)', padding: '9px 14px',
            fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#F6D9A0',
          }}>▶ Play</span>
        </div>
      </div>
    </a>
  );
}
