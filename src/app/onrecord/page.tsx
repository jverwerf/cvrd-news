"use client";

import { useState, useEffect, useRef } from "react";
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
  domains: Record<string, { score: number; count: number }>;
  country?: string;
  party?: string;
  role?: string;
  tags?: string[];
};

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

function scoreColor(s: number) { return s >= 70 ? '#22c55e' : s >= 50 ? '#b8860b' : s >= 35 ? '#f97316' : '#ef4444'; }

function MiniMeter({ score }: { score: number }) {
  const lines = 30;
  return (
    <div className="flex items-end gap-[1px] h-4">
      {Array.from({ length: lines }).map((_, i) => {
        const pct = (i / lines) * 100;
        const color = pct < 35 ? '#f87171' : pct < 55 ? '#daa520' : '#60a5fa';
        return (
          <div key={i} className="flex-1 rounded-sm" style={{
            height: `${30 + Math.random() * 50}%`,
            background: pct <= score ? color : '#253545',
            opacity: pct <= score ? 0.7 : 0.2,
          }} />
        );
      })}
    </div>
  );
}

function ScoreMeter({ score }: { score: number }) {
  const lines = 60;
  return (
    <div>
      <div className="mb-1 text-center">
        <span className="text-[22px] text-white font-bold" style={serif}>{score}</span>
        <span className="text-[10px] text-[#777]">%</span>
      </div>
      <div className="flex justify-between mb-1 text-[7px] uppercase tracking-[0.15em]">
        <span style={{ color: '#f87171' }}>Less truthful</span>
        <span style={{ color: '#60a5fa' }}>More truthful</span>
      </div>
      <div className="relative h-8 flex items-end gap-[2px]">
        {Array.from({ length: lines }).map((_, i) => {
          const pct = (i / lines) * 100;
          const isMarker = Math.abs(pct - score) < (100 / lines);
          const color = pct < 35 ? '#f87171' : pct < 55 ? '#daa520' : '#60a5fa';
          return (
            <div key={i} className="flex-1 rounded-sm" style={{
              height: isMarker ? '100%' : `${40 + Math.random() * 40}%`,
              background: isMarker ? '#fff' : pct <= score ? color : '#1e2a3a',
              opacity: isMarker ? 1 : pct <= score ? 0.7 : 0.3,
            }} />
          );
        })}
      </div>
    </div>
  );
}

function AdSlot({ adKey }: { adKey: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch {}
  }, [adKey]);
  return (
    <div ref={ref} className="w-full h-full">
      <ins className="adsbygoogle" style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-2572735826517528" data-ad-slot="8292849831"
        data-ad-format="fluid" data-full-width-responsive="false" />
    </div>
  );
}

function PoliticianTile({ tileIdx, politician, isSelected, onSelect, showAd, adKey, isSearching }: {
  tileIdx: number; politician: PoliticianScore | undefined; isSelected: boolean;
  onSelect: () => void; showAd: boolean; adKey: number; isSearching: boolean;
}) {
  const p = politician;
  return (
    <button onClick={() => p && onSelect()}
      className="relative rounded-lg overflow-hidden transition-all duration-700 cursor-pointer group"
      style={{
        background: '#253545',
        border: isSelected && p ? '2px solid #b8860b' : '2px solid transparent',
        opacity: p ? 1 : 0.3,
      }}>
      {p && (
        <div key={p.handle} style={{ opacity: 0 }}>
          <img src={`/data/politicians/photo_${p.handle}.png`} alt={p.name}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
            style={{ opacity: 0.6 }}
            onLoad={(e) => { (e.target as HTMLImageElement).parentElement!.style.opacity = '1'; (e.target as HTMLImageElement).parentElement!.style.transition = 'opacity 0.5s ease'; }}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; (e.target as HTMLImageElement).parentElement!.style.opacity = '1'; }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
          <div className="absolute inset-0" style={{ background: 'rgba(30,42,58,0.35)', mixBlendMode: 'multiply' }} />
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <MiniMeter score={p.overall_score} />
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-[16px] text-white font-bold" style={serif}>{p.overall_score}%</span>
              <span className="text-[10px] text-white/50 truncate">{p.name}</span>
            </div>
          </div>
        </div>
      )}
      {!p && <div className="flex items-center justify-center h-full text-[10px] text-white/20">Coming soon</div>}

      {/* Ad overlay */}
      {showAd && (
        <div className="absolute inset-0 z-30 rounded-lg overflow-hidden animate-[fadeIn_1s_ease-in-out]" style={{ background: '#1a2535' }}>
          <div className="absolute top-1.5 right-2 z-10">
            <span className="text-[7px] font-medium text-white/20 uppercase tracking-wider">Sponsored</span>
          </div>
          <div className="w-full h-full flex items-center justify-center p-1">
            <AdSlot adKey={adKey} />
          </div>
        </div>
      )}
    </button>
  );
}

const ALL_CATS = [
  { label: 'On Record', slug: '/onrecord' },
  { label: 'Daily Pick', slug: '/' },
  { label: 'World', slug: '/world' },
  { label: 'Politics', slug: '/politics' },
  { label: 'Markets', slug: '/markets' },
  { label: 'Trending', slug: '/trending' },
  { label: 'Sports', slug: '/sports' },
];

export default function PoliticiansPage() {
  const [scores, setScores] = useState<PoliticianScore[]>([]);
  const [selected, setSelected] = useState<number>(0);
  const [stories, setStories] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<any[]>();
  const [search, setSearch] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [editorial, setEditorial] = useState<any>(null);
  const [editorialHandle, setEditorialHandle] = useState<string | null>(null);

  const HANDLES = [
    'realDonaldTrump', 'AOC', 'JDVance', 'marcorubio', 'BernieSanders',
    'GovRonDeSantis', 'tedcruz', 'VivekGRamaswamy', 'SpeakerJohnson',
  ];

  useEffect(() => {
    // Load all score files
    Promise.all(HANDLES.map(h =>
      fetch(`/data/politicians/score_${h}.json`).then(r => r.ok ? r.json() : null).catch(() => null)
    )).then(results => {
      const valid = results.filter(Boolean);
      setScores(valid);
      // Set tile 0 to the On Record Today politician
      if (editorialHandle && valid.length > 0) {
        const idx = valid.findIndex((s: any) => s.handle === editorialHandle);
        if (idx >= 0) {
          setTileOffsets(prev => { const next = [...prev]; next[0] = idx; return next; });
        }
      }
    });
    // Load editorial
    fetch('/data/politicians/onrecord_today.json').then(r => r.ok ? r.json() : null).then(data => {
      setEditorial(data);
      if (data?.person?.handle) setEditorialHandle(data.person.handle);
    }).catch(() => {});

    // Load daily stories for LiveBanner
    const today = new Date().toISOString().split('T')[0];
    fetch(`/data/daily_gaps_${today}.json`).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.top_narratives) setStories(data.top_narratives);
      if (data?.live_data) setLiveData(data.live_data);
    }).catch(() => {});
    fetch('/api/live').then(r => r.ok ? r.json() : null).then(data => {
      if (data) setLiveData(data);
    }).catch(() => {});
    // Check breaking — same 3-clip minimum as homepage
    fetch('/api/breaking/data').then(r => r.ok ? r.json() : null).then(data => {
      if (data && Array.isArray(data) && data.length > 0) {
        const hasEnoughClips = data.some((s: any) => {
          const videoCount = (s.youtube_videos || []).length +
            (s.social_clips || []).filter((c: any) => c.platform !== 'reddit' && c.duration).length;
          return videoCount >= 3;
        });
        if (hasEnoughClips) setIsBreaking(true);
      }
    }).catch(() => {});
  }, []);

  // Tile animation — each tile cycles through politicians at different speeds
  const [tileOffsets, setTileOffsets] = useState([0, 3, 6, 1, 4, 7, 2, 5, 8, 9]);
  const [frozenTile, setFrozenTile] = useState<number | null>(0); // top-left frozen by default
  const animTimers = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (search || scores.length <= 1) return;

    // Each tile cycles at a different speed — skip the frozen (selected) tile
    const speeds = [25000, 35000, 30000, 28000, 33000, 22000, 38000, 27000, 32000, 26000];
    animTimers.current = speeds.map((speed, tileIdx) =>
      setInterval(() => {
        if (tileIdx === frozenTile) return; // don't cycle the selected tile
        setTileOffsets(prev => {
          const next = [...prev];
          next[tileIdx] = (next[tileIdx] + 1) % scores.length;
          return next;
        });
      }, speed)
    );

    return () => animTimers.current.forEach(clearInterval);
  }, [search, scores.length, frozenTile]);

  // Ad tile
  const [adPosition, setAdPosition] = useState(-1);
  const [adKey, setAdKey] = useState(0);
  useEffect(() => {
    const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let cancelled = false;
    const cycle = () => {
      setTimeout(() => {
        if (cancelled) return;
        const pos = positions[Math.floor(Math.random() * positions.length)];
        setAdPosition(pos);
        setAdKey(k => k + 1);
        setTimeout(() => { if (!cancelled) { setAdPosition(-1); cycle(); } }, 30000);
      }, 90000);
    };
    const initial = setTimeout(() => {
      if (cancelled) return;
      const pos = positions[Math.floor(Math.random() * positions.length)];
      setAdPosition(pos);
      setAdKey(k => k + 1);
      setTimeout(() => { if (!cancelled) { setAdPosition(-1); cycle(); } }, 30000);
    }, 10000);
    return () => { cancelled = true; clearTimeout(initial); };
  }, []);

  const filteredScores = (() => {
    let results = [...scores];

    if (search) {
      const q = search.toLowerCase();
      // Score each result by match quality
      results = results
        .map(s => {
          const name = (s.name || '').toLowerCase();
          const handle = (s.handle || '').toLowerCase();
          const searchable = [
            s.name, s.handle,
            (s as any).role || '',
            (s as any).party || '',
            (s as any).country || '',
            (s as any).state || '',
            ...((s as any).tags || []),
            ...((s as any).claim_keywords || []),
            ...Object.keys(s.domains || {}),
          ].join(' ').toLowerCase();

          if (!searchable.includes(q)) return null;

          // Match quality: exact name > starts with > partial name > other match
          let matchScore = 0;
          if (name === q || handle === q) matchScore = 1000;
          else if (name.startsWith(q) || handle.startsWith(q)) matchScore = 500;
          else if (name.includes(q)) matchScore = 200;
          else matchScore = 50;

          return { ...s, _matchScore: matchScore };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b._matchScore - a._matchScore) as typeof scores;
    } else {
      // No search — sort by prominence
      results.sort((a: any, b: any) => (b.prominence || 0) - (a.prominence || 0));
    }

    return results;
  })();
  // Center card shows the politician from the frozen tile
  const current = frozenTile !== null
    ? (search ? filteredScores[frozenTile] : scores[tileOffsets[frozenTile] % scores.length])
    : scores[0];

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      {/* NAV */}
      <div className="sticky top-0" style={{ zIndex: 100, background: '#1e2a3a' }}>
        <div className="h-12 flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 px-3 md:gap-3 md:px-4 md:mx-auto">
            {isBreaking && (
              <a href="/breaking"
                className="shrink-0 px-2.5 py-1.5 text-[11px] md:text-[13px] font-semibold rounded-full transition-colors"
                style={{ background: 'rgba(220,38,38,0.15)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 animate-pulse" style={{ background: '#ef4444' }} />
                Breaking
              </a>
            )}
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
            {/* Icons pill — inline after categories */}
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

        {/* LIVE BANNER — inside sticky */}
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

      {/* VIEW TOGGLE + SEARCH PILL — same line */}
      <div className="relative flex items-center px-2 py-2" style={{ background: '#1e2a3a', minHeight: 40 }}>
        <div className="inline-flex items-center gap-1.5 px-1.5 rounded-full shrink-0"
          style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.3)', height: 32 }}>
          <span className="flex items-center p-1.5 rounded-full" style={{ background: 'rgba(184,134,11,0.3)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </span>
          <a href="/onrecord/leaderboard" className="flex items-center p-1.5 rounded-full transition-colors hover:bg-[rgba(184,134,11,0.2)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5 }}>
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/><line x1="3" y1="18" x2="11" y2="18"/>
            </svg>
          </a>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 280 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search leaders, parties, officials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[11px] text-white/80 placeholder-white/25 outline-none"
            style={{ background: 'transparent', border: 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[10px] text-white/30 hover:text-white/60 cursor-pointer" style={{ background: 'none', border: 'none' }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <section style={{ height: 'calc(100vh - 112px)', overflow: 'hidden' }}>
        <div className="h-full grid grid-rows-3 grid-cols-4 gap-1 p-1">

          {/* ROW 1 — tiles 0-3 */}
          {[0, 1, 2, 3].map(tileIdx => (
            <PoliticianTile key={tileIdx} tileIdx={tileIdx}
              politician={search ? filteredScores[tileIdx] : scores[tileOffsets[tileIdx] % scores.length]}
              isSelected={frozenTile === tileIdx} onSelect={() => { setSelected(tileIdx); setFrozenTile(tileIdx); }}
              showAd={adPosition === tileIdx} adKey={adKey} isSearching={!!search} />
          ))}

          {/* ROW 2 — tile 4, CENTER, tile 5 */}
          <PoliticianTile tileIdx={4}
            politician={search ? filteredScores[4] : scores[tileOffsets[4] % scores.length]}
            isSelected={frozenTile === 4} onSelect={() => { setSelected(4); setFrozenTile(4); }}
            showAd={adPosition === 4} adKey={adKey} isSearching={!!search} />

          {/* CENTER — selected politician hero */}
          <div className="col-span-2 rounded-xl overflow-hidden flex" style={{ background: '#0a0f18' }}>
            {current ? (
              <>
                <img src={`/data/politicians/photo_${current.handle}.png`} alt={current.name}
                  className="h-full object-cover" style={{ width: '40%' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="flex-1 p-5 flex flex-col justify-center" style={{ borderLeft: '1px solid #2a3a4a' }}>
                  <h2 className="text-[20px] text-white mb-3" style={serif}>{current.name}</h2>
                  <div className="max-w-[250px]">
                    <ScoreMeter score={current.overall_score} />
                  </div>
                  <div className="flex gap-3 mt-3 text-[10px]">
                    <span style={{ color: '#60a5fa' }}>{current.true_count} true</span>
                    <span style={{ color: '#f59e0b' }}>{current.somewhat_misleading_count} somewhat</span>
                    <span style={{ color: '#daa520' }}>{current.misleading_count} misleading</span>
                    <span style={{ color: '#f87171' }}>{current.false_count} false</span>
                  </div>
                  <p className="text-[11px] text-white/25 mt-2">{current.verified_claims} claims · ±{current.confidence_interval}%</p>
                  <Link href={`/onrecord/${current.name?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') || current.handle}`}
                    className="mt-3 inline-block px-4 py-1.5 rounded-full text-[10px] font-semibold text-white transition-colors hover:opacity-90 self-start"
                    style={{ background: '#b8860b' }}>
                    View records →
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full">
                <p className="text-white/30 text-[13px]" style={serif}>Select a politician</p>
              </div>
            )}
          </div>

          <PoliticianTile tileIdx={5}
            politician={search ? filteredScores[5] : scores[tileOffsets[5] % scores.length]}
            isSelected={frozenTile === 5} onSelect={() => { setSelected(5); setFrozenTile(5); }}
            showAd={adPosition === 5} adKey={adKey} isSearching={!!search} />

          {/* ROW 3 — tiles 6-9 */}
          {[6, 7, 8, 9].map(tileIdx => (
            <PoliticianTile key={tileIdx} tileIdx={tileIdx}
              politician={search ? filteredScores[tileIdx] : scores[tileOffsets[tileIdx] % scores.length]}
              isSelected={frozenTile === tileIdx} onSelect={() => { setSelected(tileIdx); setFrozenTile(tileIdx); }}
              showAd={adPosition === tileIdx} adKey={adKey} isSearching={!!search} />
          ))}
        </div>
      </section>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tileTransition { 0% { opacity: 0; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* ON RECORD TODAY — editorial section */}
      {editorial && (
        <>
          {/* White banner */}
          <div className="px-6 md:px-12 py-3 flex items-center gap-3" style={{ background: '#f5f5f5' }}>
            <span className="text-[10px] font-bold text-[#1e2a3a] bg-[#1e2a3a]/10 px-2 py-0.5 rounded uppercase tracking-[0.1em] shrink-0">On Record Today</span>
            <h2 className="text-[18px] md:text-[22px] text-[#1e2a3a] leading-none tracking-[-0.02em]" style={serif}>
              {editorial.person.name}
            </h2>
          </div>

        <div className="px-6 md:px-12 py-8" style={{ background: '#1e2a3a' }}>

            {/* Editorial card */}
            <div className="rounded-lg overflow-hidden" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>

              {/* Top — photo + headline + meter */}
              <div className="flex flex-col md:flex-row">
                <img src={editorial.person.photo} alt={editorial.person.name}
                  className="w-full md:w-48 h-48 md:h-auto object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="flex-1 p-5" style={{ borderLeft: '1px solid #2a3a4a' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded"
                      style={{ color: '#daa520', background: 'rgba(184,134,11,0.1)' }}>
                      {editorial.story_topic}
                    </span>
                  </div>
                  <h2 className="text-[22px] md:text-[26px] text-white leading-tight tracking-[-0.02em] mb-1" style={serif}>
                    {editorial.search_keyword ? `On ${editorial.search_keyword.charAt(0).toUpperCase() + editorial.search_keyword.slice(1)}: ${editorial.topic_score ?? editorial.overall_score}% Truthful` : editorial.headline}
                  </h2>
                  <p className="text-[11px] text-white/30 mb-3">
                    {editorial.person.role} · {editorial.matching_claims} claims on &ldquo;{editorial.search_keyword}&rdquo; · {editorial.overall_score}% overall
                  </p>

                  {/* Mini meter */}
                  {editorial.topic_score !== null && (
                    <div className="max-w-[200px]">
                      <div className="flex justify-between mb-0.5 text-[7px] uppercase tracking-[0.15em]">
                        <span style={{ color: '#f87171' }}>Less truthful</span>
                        <span style={{ color: '#60a5fa' }}>More truthful</span>
                      </div>
                      <div className="flex items-end gap-[1px] h-5">
                        {Array.from({ length: 40 }).map((_, i) => {
                          const pct = (i / 40) * 100;
                          const color = pct < 35 ? '#f87171' : pct < 55 ? '#daa520' : '#60a5fa';
                          return (
                            <div key={i} className="flex-1 rounded-sm" style={{
                              height: `${30 + Math.random() * 50}%`,
                              background: pct <= (editorial.topic_score || 0) ? color : '#1e2a3a',
                              opacity: pct <= (editorial.topic_score || 0) ? 0.7 : 0.2,
                            }} />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Editorial text */}
              <div className="px-5 py-5" style={{ borderTop: '1px solid #2a3a4a' }}>
                {editorial.editorial.split('\n\n').map((para: string, i: number) => (
                  <p key={i} className="text-[13px] text-[#bbb] leading-[1.75] mb-3 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>

              {/* CTA + Share */}
              <div className="px-5 pb-5 flex items-center gap-3">
                <Link href={`/onrecord/${editorial.person.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}${editorial.search_keyword ? '?q=' + editorial.search_keyword : ''}`}
                  className="inline-block px-4 py-1.5 rounded-full text-[10px] font-semibold text-white transition-colors hover:opacity-90"
                  style={{ background: '#b8860b' }}>
                  View full record →
                </Link>
                <span className="text-[8px] uppercase tracking-[0.12em] text-[#555] ml-auto">Share</span>
                {[
                  { svg: <span className="text-[11px] font-bold text-white/50">𝕏</span>, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${editorial.headline}\n\n${editorial.editorial.split('\n\n')[0].substring(0, 100)}...`)}&url=${encodeURIComponent(`https://cvrdnews.com/onrecord/${editorial.person.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4500" opacity={0.5}><circle cx="12" cy="12" r="12"/></svg>, href: `https://www.reddit.com/submit?title=${encodeURIComponent(editorial.headline)}&url=${encodeURIComponent(`https://cvrdnews.com/onrecord/${editorial.person.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.13 1.6 5.93L0 24l6.26-1.64A11.93 11.93 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>, href: `https://wa.me/?text=${encodeURIComponent(`${editorial.headline}\n\nhttps://cvrdnews.com/onrecord/${editorial.person.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0088cc" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37z"/></svg>, href: `https://t.me/share/url?url=${encodeURIComponent(`https://cvrdnews.com/onrecord/${editorial.person.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`)}&text=${encodeURIComponent(editorial.headline)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#1877F2" opacity={0.5}><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"/></svg>, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://cvrdnews.com/onrecord/${editorial.person.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2" opacity={0.5}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://cvrdnews.com/onrecord/${editorial.person.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" opacity={0.3}><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.083.717 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.281 1.332-3.08.857-.74 2.063-1.182 3.39-1.246.927-.044 1.813.06 2.647.306l.053-.265c.231-1.148.084-2.078-.437-2.762-.544-.715-1.465-1.1-2.593-1.084-1.593.023-2.727.637-3.467 1.033l-.096.053-.924-1.685.122-.067c.928-.51 2.395-1.265 4.39-1.293h.044c1.616-.02 2.95.525 3.855 1.576.753.876 1.133 2.059.96 3.437.792.326 1.476.784 2.036 1.37 1.033 1.08 1.532 2.555 1.443 4.265-.105 2.028-1.066 3.793-2.862 5.254C17.677 23.276 15.252 23.977 12.186 24z"/></svg>, href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${editorial.headline}\n\nhttps://cvrdnews.com/onrecord/${editorial.person.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0085ff" opacity={0.5}><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>, href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${editorial.headline}\n\nhttps://cvrdnews.com/onrecord/${editorial.person.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`)}` },
                ].map((s, j) => (
                  <a key={j} href={s.href} target="_blank" rel="noreferrer" className="p-1.5 rounded transition-opacity hover:opacity-100 opacity-70">{s.svg}</a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
