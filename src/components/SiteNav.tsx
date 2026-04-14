'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const mono = `'DM Mono', monospace`;

const CATEGORY_STRIP = [
  { label: 'Top Stories', href: '/brief' },
  { label: 'World', href: '/world' },
  { label: 'Politics', href: '/politics' },
  { label: 'Markets', href: '/markets' },
  { label: 'Trending', href: '/trending' },
  { label: 'Sports', href: '/sports' },
];

const CATEGORY_PATHS = new Set(['/brief', '/world', '/politics', '/markets', '/trending', '/sports']);

export function CvrdLogo({ size = 22 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {['C','V','R','D'].map((l, i) => (
        <div key={l} style={{
          width: size, height: size, borderRadius: 2,
          background: i % 2 === 0 ? '#1a2a3a' : '#253545',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Georgia, serif', fontSize: size * 0.48, fontWeight: 700, color: '#e0e0e0',
          clipPath: i === 0
            ? 'polygon(0 0,100% 0,100% 40%,110% 40%,110% 60%,100% 60%,100% 100%,0 100%)'
            : i === 3
            ? 'polygon(0 0,100% 0,100% 100%,0 100%,0 60%,-10% 60%,-10% 40%,0 40%)'
            : 'polygon(0 0,100% 0,100% 40%,110% 40%,110% 60%,100% 60%,100% 100%,0 100%,0 60%,-10% 60%,-10% 40%,0 40%)',
        }}>{l}</div>
      ))}
    </div>
  );
}

let _cachedIssueDate: string | null = null;

export function SiteNav({ isBreaking, storyMeta }: { isBreaking: boolean; storyMeta?: { index: number; total: number; category?: string } }) {
  const [lastIssue, setLastIssue] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    if (_cachedIssueDate !== null) { setLastIssue(_cachedIssueDate); return; }
    const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL;
    if (!blobBase) return;
    (async () => {
      for (let i = 0; i < 5; i++) {
        const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        try {
          const resp = await fetch(`${blobBase}/data/daily_gaps_${date}.json`, { method: 'HEAD' });
          if (resp.ok) {
            const d = new Date(date + 'T12:00:00');
            _cachedIssueDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
            setLastIssue(_cachedIssueDate);
            break;
          }
        } catch {}
      }
    })();
  }, []);

  const isOnTV = pathname === '/tv' || (pathname?.startsWith('/tv/') ?? false);
  const showCategoryStrip = CATEGORY_PATHS.has(pathname ?? '') || !!storyMeta;

  const active = (href: string): boolean => {
    if (href === '/brief') return pathname === '/brief' || !!storyMeta;
    if (href === '/onrecord') return pathname === '/onrecord' || (pathname?.startsWith('/onrecord/') ?? false);
    if (href === '/timeline') return pathname === '/timeline' || (pathname?.startsWith('/timeline/') ?? false);
    if (href === '/tv') return isOnTV;
    return false;
  };

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .live-dot { animation: blink 1.3s ease-in-out infinite; }
        .hide-scroll { scrollbar-width: none; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .nav-pill:hover { color: rgba(226,232,240,0.9) !important; background: rgba(255,255,255,0.07) !important; }
        @media (max-width: 600px) {
          .nav-logo { display: none !important; }
          .nav-right { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#1a2535', borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 20px', height: 48,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <a href="/" style={{ display: 'flex', gap: 1, textDecoration: 'none', flexShrink: 0 }} className="nav-logo">
          <CvrdLogo size={22} />
        </a>

        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', flex: 1 }} className="hide-scroll">
          {/* Breaking pill */}
          {isBreaking && (
            <a href="/breaking" style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              padding: '4px 10px', borderRadius: 4, textDecoration: 'none',
              background: 'rgba(153,27,27,0.15)', border: '1px solid rgba(153,27,27,0.35)',
              fontFamily: mono, fontSize: 9.5, letterSpacing: '0.1em', color: '#dc2626',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#991b1b', display: 'inline-block' }} className="live-dot" />
              BREAKING
            </a>
          )}

          {/* TV pill — visible on non-TV pages as a discovery CTA */}
          {!isOnTV && (
            <a href="/tv" style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              padding: '4px 10px', borderRadius: 4, textDecoration: 'none',
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
              fontFamily: mono, fontSize: 9.5, letterSpacing: '0.1em', color: '#60a5fa',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
              </svg>
              TV
            </a>
          )}

          {/* Main nav items */}
          {([['Daily Cover','/brief'],['On Record','/onrecord'],['Timeline','/timeline']] as [string,string][]).map(([label, href]) => {
            const isAct = active(href);
            return (
              <a key={href} href={href} style={{
                padding: '4px 10px', borderRadius: 4, textDecoration: 'none', flexShrink: 0,
                fontFamily: mono, fontSize: 9.5, letterSpacing: '0.08em',
                color: isAct ? 'rgba(226,232,240,0.95)' : 'rgba(226,232,240,0.6)',
                background: isAct ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${isAct ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
              }} className="nav-pill">{label}</a>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} className="nav-right">
          <a href="https://www.youtube.com/@cvrdnews" target="_blank" rel="noreferrer"
            style={{ color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
          {lastIssue && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontFamily: mono, fontSize: 7, letterSpacing: '0.12em', color: '#3a4a5a', borderBottom: '1px solid #2a3a4a', paddingBottom: 2 }}>LAST ISSUE</span>
              <span style={{ fontFamily: mono, fontSize: 9, color: '#4a5a6a' }}>{lastIssue}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Category strip — visible on /brief and all category pages */}
      {showCategoryStrip && (
        <div style={{
          position: 'sticky', top: 48, zIndex: 99,
          background: '#1a2535', borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '0 20px', height: 36,
          display: 'flex', alignItems: 'center', gap: 2,
          overflowX: 'auto',
        }} className="hide-scroll">
          {CATEGORY_STRIP.map(cat => {
            const isCatActive = storyMeta
              ? (storyMeta.category ? cat.href === `/${storyMeta.category}` : cat.href === '/brief')
              : pathname === cat.href;
            return (
              <a key={cat.href} href={cat.href} style={{
                padding: '3px 10px', textDecoration: 'none', flexShrink: 0,
                fontFamily: mono, fontSize: 9, letterSpacing: '0.08em',
                color: isCatActive ? 'rgba(226,232,240,0.9)' : 'rgba(226,232,240,0.45)',
                borderBottom: `1.5px solid ${isCatActive ? 'rgba(226,232,240,0.55)' : 'transparent'}`,
                paddingBottom: '2px',
              }} className="nav-pill">{cat.label}</a>
            );
          })}
          {storyMeta && (
            <span style={{
              marginLeft: 'auto', flexShrink: 0, fontFamily: mono,
              fontSize: 9, letterSpacing: '0.08em', color: 'rgba(226,232,240,0.3)',
              paddingRight: 4,
            }}>{storyMeta.index} / {storyMeta.total}</span>
          )}
        </div>
      )}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      padding: '20px',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center',
      justifyContent: 'space-between', gap: 12,
      maxWidth: 1120, margin: '0 auto',
    }}>
      <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: '#4a5a6a', textTransform: 'uppercase' }}>
        Your streaming platform to cover the news
      </span>
      <div style={{ display: 'flex', gap: 16 }}>
        {[['About','/about'],['Contact','/contact'],['Terms','/terms'],['Privacy','/privacy']].map(([l,h]) => (
          <a key={l} href={h} style={{ fontSize: 11, color: '#4a5a6a', textDecoration: 'none' }}>{l}</a>
        ))}
      </div>
    </footer>
  );
}
