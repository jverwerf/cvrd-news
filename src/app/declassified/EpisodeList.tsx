"use client";

type Episode = {
  slug: string; title: string; date: string; department: string;
  hook: string; image?: string; status: string;
};

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const mono = "'DM Mono', monospace";
const serif = "'Instrument Serif', Georgia, serif";
const sans = "'DM Sans', system-ui, sans-serif";

export function PastIssues({ episodes, totalCount }: { episodes: Episode[]; totalCount: number }) {
  return (
    <>
      <style>{`
        .past-card { transition: border-color 0.15s, transform 0.15s; }
        .past-card:hover { border-color: rgba(218,165,32,0.3) !important; transform: translateY(-2px); }
        .past-card img { transition: opacity 0.2s; }
        .past-card:hover img { opacity: 0.75 !important; }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 3 }}>
        {episodes.map((ep, i) => {
          const epNum = String(totalCount - 1 - i).padStart(2, '0');
          return (
            <a
              key={ep.slug}
              href={`/declassified/${ep.slug}`}
              className="past-card"
              style={{
                textDecoration: 'none',
                display: 'flex', flexDirection: 'column',
                background: '#253545', border: '1px solid #2a3a4a',
                borderRadius: 3, overflow: 'hidden',
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#1a2535', flexShrink: 0 }}>
                {ep.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={ep.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a2535, #253545)' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(18,28,42,0.92) 0%, rgba(18,28,42,0.2) 60%, transparent 100%)' }} />
                <span style={{
                  position: 'absolute', bottom: 12, left: 14,
                  fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#daa520', opacity: 0.8,
                }}>
                  EP{epNum}
                </span>
              </div>

              {/* Content */}
              <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 11, flexWrap: 'wrap' as const }}>
                  <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#daa520', opacity: 0.75 }}>
                    {formatDate(ep.date).toUpperCase()}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#7a8fa6' }}>
                    {ep.department.toUpperCase()}
                  </span>
                </div>

                <h2 style={{
                  fontFamily: serif, fontSize: 17, fontWeight: 'bold',
                  color: '#e2e8f0', lineHeight: 1.3, margin: '0 0 10px', flex: 1,
                }}>
                  {ep.title}
                </h2>

                <p style={{ fontFamily: sans, fontSize: 13, color: '#7a8fa6', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {ep.hook}
                </p>

                <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 4, color: '#daa520', opacity: 0.55 }}>
                  READ →
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </>
  );
}

/* Keep the old EpisodeList export for backward compatibility */
export function EpisodeList({ episodes }: { episodes: Episode[] }) {
  return <PastIssues episodes={episodes} totalCount={episodes.length} />;
}
