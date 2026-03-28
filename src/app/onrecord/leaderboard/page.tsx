"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LiveBanner } from "@/components/LiveBanner";

type PoliticianScore = {
  handle: string;
  name: string;
  overall_score: number;
  confidence_interval: number;
  verified_claims: number;
  true_count: number;
  somewhat_misleading_count: number;
  misleading_count: number;
  false_count: number;
  pending_count: number;
  country?: string;
  party?: string;
  role?: string;
  tags?: string[];
};

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

const ALL_CATS = [
  { label: 'On Record', slug: '/onrecord' },
  { label: 'Daily Pick', slug: '/' },
  { label: 'World', slug: '/world' },
  { label: 'Politics', slug: '/politics' },
  { label: 'Markets', slug: '/markets' },
  { label: 'Trending', slug: '/trending' },
  { label: 'Sports', slug: '/sports' },
];

const HANDLES = [
  'realDonaldTrump', 'AOC', 'JDVance', 'marcorubio', 'BernieSanders',
  'GovRonDeSantis', 'tedcruz', 'VivekGRamaswamy', 'SpeakerJohnson',
  'AliVelshi', 'AnnCoulter', 'HakeemJeffries', 'MattGaetz', 'RandPaul', 'SenSchumer',
];

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'US Politicians', value: 'us-politician' },
  { label: 'World Leaders', value: 'world' },
  { label: 'Republicans', value: 'republican' },
  { label: 'Democrats', value: 'democrat' },
  { label: 'Public Figures', value: 'public-figure' },
  { label: 'Journalists', value: 'journalist' },
];

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState<PoliticianScore[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [liveData, setLiveData] = useState<any[]>();
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    Promise.all(HANDLES.map(h =>
      fetch(`/data/politicians/score_${h}.json`).then(r => r.ok ? r.json() : null).catch(() => null)
    )).then(results => {
      setScores(results.filter(Boolean));
    });

    const today = new Date().toISOString().split('T')[0];
    fetch(`/data/daily_gaps_${today}.json`).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.top_narratives) setStories(data.top_narratives);
      if (data?.live_data) setLiveData(data.live_data);
    }).catch(() => {});
    fetch('/api/live').then(r => r.ok ? r.json() : null).then(data => {
      if (data) setLiveData(data);
    }).catch(() => {});
  }, []);

  const filtered = scores
    .filter(p => {
      if (filter === 'all') return true;
      if (filter === 'us-politician') return p.country === 'US';
      if (filter === 'world') return p.country && p.country !== 'US';
      if (filter === 'republican') return p.party?.toLowerCase().includes('republican');
      if (filter === 'democrat') return p.party?.toLowerCase().includes('democrat') || p.party?.toLowerCase().includes('independent');
      if (filter === 'public-figure') return !p.party;
      if (filter === 'journalist') return (p.tags || []).some(t => t.toLowerCase().includes('journalist') || t.toLowerCase().includes('media'));
      return true;
    })
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.handle?.toLowerCase().includes(q) || p.party?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q);
    })
    .sort((a, b) => b.overall_score - a.overall_score);

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      {/* NAV */}
      <div className="sticky top-0" style={{ zIndex: 100, background: '#1e2a3a' }}>
        <div className="h-12 flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 px-3 md:gap-3 md:px-4 md:mx-auto">
            {ALL_CATS.map((cat) => (
              <a key={cat.slug} href={cat.slug}
                className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors whitespace-nowrap"
                style={{
                  background: cat.slug === '/onrecord' ? 'rgba(184,134,11,0.2)' : 'transparent',
                  color: cat.slug === '/onrecord' ? '#b8860b' : 'rgba(255,255,255,0.55)',
                  border: cat.slug === '/onrecord' ? '1px solid rgba(184,134,11,0.3)' : 'none',
                }}>
                {cat.label}
              </a>
            ))}
            {/* Icons pill */}
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <a href="/tv" className="flex items-center" style={{ color: 'rgba(255,255,255,0.5)', transform: 'translateY(-1px)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
                </svg>
              </a>
              <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.25)', display: 'block' }} />
              <a href="https://www.youtube.com/@cvrdnews" target="_blank" rel="noreferrer" className="flex items-center transition-opacity hover:opacity-80"
                title="CVRD on YouTube" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <LiveBanner stories={stories} liveData={liveData} />
      </div>

      {/* CVRD puzzle logo */}
      <div className="fixed left-1/2 pointer-events-none" style={{ top: '51px', transform: 'translateX(-50%)', zIndex: 101, filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.4))' }}>
        <div className="flex gap-[1px]">
          {['C','V','R','D'].map((letter, i) => (
            <div key={letter} style={{
              width: 26, height: 26,
              background: i % 2 === 0 ? '#1a2a3a' : '#253545',
              borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700,
              color: '#e0e0e0',
              clipPath: i === 0
                ? 'polygon(0 0, 100% 0, 100% 40%, 110% 40%, 110% 60%, 100% 60%, 100% 100%, 0 100%)'
                : i === 3
                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 60%, -10% 60%, -10% 40%, 0 40%)'
                : 'polygon(0 0, 100% 0, 100% 40%, 110% 40%, 110% 60%, 100% 60%, 100% 100%, 0 100%, 0 60%, -10% 60%, -10% 40%, 0 40%)',
            }}>{letter}</div>
          ))}
        </div>
      </div>

      {/* VIEW TOGGLE + SEARCH PILL */}
      {/* TOOLBAR — grid pill + filters + search, all one line */}
      <div className="flex items-center gap-2 px-4 md:px-12 py-2 overflow-x-auto" style={{ background: '#1e2a3a', scrollbarWidth: 'none' }}>
        <div className="inline-flex items-center gap-1.5 px-1.5 rounded-full shrink-0"
          style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.3)', height: 32 }}>
          <a href="/onrecord" className="flex items-center p-1.5 rounded-full transition-colors hover:bg-[rgba(184,134,11,0.2)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </a>
          <span className="flex items-center p-1.5 rounded-full" style={{ background: 'rgba(184,134,11,0.3)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/><line x1="3" y1="18" x2="11" y2="18"/>
            </svg>
          </span>
        </div>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className="shrink-0 px-3 py-1 text-[10px] font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap"
            style={{
              background: filter === f.value ? 'rgba(184,134,11,0.2)' : 'rgba(255,255,255,0.05)',
              color: filter === f.value ? '#daa520' : 'rgba(255,255,255,0.35)',
              border: filter === f.value ? '1px solid rgba(184,134,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}>
            {f.label}
          </button>
        ))}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full shrink-0 ml-auto"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 180 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[10px] text-white/80 placeholder-white/25 outline-none"
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>
      </div>

      {/* LEADERBOARD */}
      <section className="px-4 md:px-12 pt-1 pb-6">
        <div className="rounded-xl overflow-hidden" style={{ background: '#0f1923', border: '1px solid #2a3a4a' }}>
          <h2 className="text-[18px] text-white tracking-[-0.02em] text-center py-3" style={{ ...serif, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Leaderboard</h2>

          {/* Ranked list */}
          {filtered.map((p, rank) => (
            <Link key={p.handle} href={`/onrecord/${nameToSlug(p.name || p.handle)}`}
              className="flex items-center gap-4 py-3 px-5 transition-colors hover:bg-white/5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[18px] font-bold w-8 text-center shrink-0" style={{
                ...serif,
                color: rank === 0 ? '#daa520' : rank === 1 ? '#a8a8a8' : rank === 2 ? '#cd7f32' : 'rgba(255,255,255,0.25)',
              }}>{rank + 1}</span>
              <img src={`/data/politicians/photo_${p.handle}.png`} alt={p.name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
                style={{ border: '2px solid #253545' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-white truncate" style={serif}>{p.name}</div>
                <div className="text-[10px] text-white/30">{p.role || ''} {p.party ? `· ${p.party}` : ''} · {p.verified_claims} claims</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden md:flex items-center gap-2 text-[9px]">
                  <span style={{ color: '#60a5fa' }}>{p.true_count}</span>
                  <span style={{ color: '#f59e0b' }}>{p.somewhat_misleading_count}</span>
                  <span style={{ color: '#daa520' }}>{p.misleading_count}</span>
                  <span style={{ color: '#f87171' }}>{p.false_count}</span>
                </div>
                <div className="flex items-end gap-[1px] h-4 w-16">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const pct = (i / 20) * 100;
                    const color = pct < 35 ? '#f87171' : pct < 55 ? '#daa520' : '#60a5fa';
                    return (
                      <div key={i} className="flex-1 rounded-sm" style={{
                        height: `${30 + Math.random() * 50}%`,
                        background: pct <= p.overall_score ? color : '#253545',
                        opacity: pct <= p.overall_score ? 0.7 : 0.2,
                      }} />
                    );
                  })}
                </div>
                <span className="text-[18px] font-bold text-white w-12 text-right" style={serif}>
                  {p.overall_score}<span className="text-[10px] text-white/30">%</span>
                </span>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-white/30 text-center py-10 text-[13px]">No results found.</p>
          )}

          {/* Share */}
          <div className="flex items-center justify-center gap-2 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[8px] uppercase tracking-[0.12em] text-[#555] mr-1">Share</span>
            {[
              { label: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Politician Truthfulness Leaderboard by CVRD News')}&url=${encodeURIComponent('https://cvrdnews.com/onrecord/leaderboard')}`, color: '#fff', isText: true },
              { label: 'Reddit', href: `https://www.reddit.com/submit?title=${encodeURIComponent('Politician Truthfulness Leaderboard')}&url=${encodeURIComponent('https://cvrdnews.com/onrecord/leaderboard')}`, svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4500" opacity={0.5}><circle cx="12" cy="12" r="12"/></svg> },
              { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent('Politician Truthfulness Leaderboard\n\nhttps://cvrdnews.com/onrecord/leaderboard')}`, svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.13 1.6 5.93L0 24l6.26-1.64A11.93 11.93 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg> },
              { label: 'Telegram', href: `https://t.me/share/url?url=${encodeURIComponent('https://cvrdnews.com/onrecord/leaderboard')}&text=${encodeURIComponent('Politician Truthfulness Leaderboard')}`, svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0088cc" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37z"/></svg> },
              { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cvrdnews.com/onrecord/leaderboard')}`, svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#1877F2" opacity={0.5}><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"/></svg> },
              { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cvrdnews.com/onrecord/leaderboard')}`, svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2" opacity={0.5}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
              { label: 'Threads', href: `https://www.threads.net/intent/post?text=${encodeURIComponent('Politician Truthfulness Leaderboard\n\nhttps://cvrdnews.com/onrecord/leaderboard')}`, svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" opacity={0.3}><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.083.717 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.281 1.332-3.08.857-.74 2.063-1.182 3.39-1.246.927-.044 1.813.06 2.647.306l.053-.265c.231-1.148.084-2.078-.437-2.762-.544-.715-1.465-1.1-2.593-1.084-1.593.023-2.727.637-3.467 1.033l-.096.053-.924-1.685.122-.067c.928-.51 2.395-1.265 4.39-1.293h.044c1.616-.02 2.95.525 3.855 1.576.753.876 1.133 2.059.96 3.437.792.326 1.476.784 2.036 1.37 1.033 1.08 1.532 2.555 1.443 4.265-.105 2.028-1.066 3.793-2.862 5.254C17.677 23.276 15.252 23.977 12.186 24z"/></svg> },
              { label: 'Bluesky', href: `https://bsky.app/intent/compose?text=${encodeURIComponent('Politician Truthfulness Leaderboard\n\nhttps://cvrdnews.com/onrecord/leaderboard')}`, svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0085ff" opacity={0.5}><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg> },
            ].map((s, j) => (
              <a key={j} href={s.href} target="_blank" rel="noreferrer" className="p-1.5 rounded transition-opacity hover:opacity-100 opacity-70">
                {(s as any).isText ? <span className="text-[11px] font-bold text-white/50">{s.label}</span> : (s as any).svg}
              </a>
            ))}
          </div>
        </div>

        {/* AD */}
        <div className="mt-4">
          <ins className="adsbygoogle" style={{ display: 'block', width: '100%' }}
            data-ad-client="ca-pub-2572735826517528" data-ad-slot="8292849831"
            data-ad-format="horizontal" data-full-width-responsive="true" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center" style={{ borderTop: '1px solid #2a3a4a' }}>
        <img src="/logo3.png" alt="CVRD News" className="h-36 mx-auto mb-4 opacity-30" />
        <span className="text-[11px] text-[#666] block mb-3">Your streaming platform to cover the news</span>
        <div className="flex items-center justify-center gap-4">
          <a href="/terms" className="text-[11px] text-[#888] hover:text-white transition-colors">Terms of Service</a>
          <span className="text-[#555]">·</span>
          <a href="/privacy" className="text-[11px] text-[#888] hover:text-white transition-colors">Privacy Policy</a>
          <span className="text-[#555]">·</span>
          <span className="text-[11px] text-[#666]">info@cvrdnews.com</span>
        </div>
      </footer>
    </div>
  );
}
