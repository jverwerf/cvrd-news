"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { TileAdBanner } from "@/components/AdBanners";
import { SiteNav } from "@/components/SiteNav";
import { editorialSlug } from "@/lib/onrecord-slug";

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

function nameToSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

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
  return <TileAdBanner key={adKey} />;
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
          <img src={`${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/politicians/photo_${p.handle}.png`} alt={p.name}
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
        <div className="absolute inset-0 z-30 rounded-lg overflow-hidden animate-[fadeIn_1s_ease-in-out]">
          <span className="absolute top-1.5 right-2 z-10 text-[7px] font-medium uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.3)', pointerEvents: 'none' }}>Sponsored</span>
          <div className="w-full h-full">
            <AdSlot adKey={adKey} />
          </div>
        </div>
      )}
    </button>
  );
}

export default function PoliticiansPage() {
  const [scores, setScores] = useState<PoliticianScore[]>([]);
  const [selected, setSelected] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [isBreaking, setIsBreaking] = useState(true);
  const [editorial, setEditorial] = useState<any>(null);
  const [editorialHandle, setEditorialHandle] = useState<string | null>(null);

  useEffect(() => {
    // Load all politicians from manifest
    fetch(`${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/politicians/manifest.json`).then(r => r.ok ? r.json() : null).then(manifest => {
      const handles: string[] = manifest?.handles || [];
      return Promise.all(handles.map(h =>
        fetch(`${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/politicians/score_${h}.json`).then(r => r.ok ? r.json() : null).catch(() => null)
      ));
    }).then(results => {
      const valid = (results || []).filter(Boolean);
      setScores(valid);
      // Set tile 0 to the On Record Today politician
      if (editorialHandle && valid.length > 0) {
        const idx = valid.findIndex((s: any) => s.handle === editorialHandle);
        if (idx >= 0) {
          setTileOffsets(prev => { const next = [...prev]; next[0] = idx; return next; });
        }
      }
    });
    // Load editorial — no-store so we always get today's version, not a CDN-cached copy
    const todayKey = new Date().toISOString().split('T')[0];
    fetch(`${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/politicians/onrecord_today.json?d=${todayKey}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(data => {
      setEditorial(data);
      if (data?.person?.handle) setEditorialHandle(data.person.handle);
    }).catch(() => {});

    // Check breaking — same 3-clip minimum as homepage
    fetch('/api/breaking/data').then(r => r.ok ? r.json() : null).then(data => {
      if (data && Array.isArray(data) && data.length > 0) {
        const hasEnoughClips = data.some((s: any) => {
          const videoCount = (s.youtube_videos || []).length +
            (s.social_clips || []).filter((c: any) => c.platform !== 'reddit' && c.duration).length;
          return videoCount >= 3;
        });
        setIsBreaking(hasEnoughClips);
      } else {
        setIsBreaking(false);
      }
    }).catch(() => setIsBreaking(false));
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

      <SiteNav isBreaking={isBreaking} />

      {/* EDITORIAL HERO — compact bar at top */}
      {editorial && (() => {
        const edDate = (editorial.generated_at || '').slice(0, 10);
        const edSlug = edDate && editorial.person?.handle
          ? editorialSlug(edDate, editorial.person.handle, editorial.search_keyword)
          : null;
        const edHref = edSlug ? `/onrecord/today/${edSlug}` : '/onrecord/today';
        return (
        <div className="px-3 pb-2">
          <Link href={edHref}
            className="flex items-center gap-4 rounded-xl overflow-hidden hover:opacity-95 transition-opacity"
            style={{ background: '#253545', border: '1px solid #2a3a4a', textDecoration: 'none' }}>
            <img src={editorial.person.photo} alt={editorial.person.name}
              className="h-20 w-20 object-cover object-top shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="flex-1 min-w-0 py-2 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-bold text-[#daa520] uppercase tracking-[0.14em]">On Record Today</span>
                <span className="text-[#2a3a4a]">·</span>
                <span className="text-[10px] text-white/60">{editorial.person.name}</span>
                {editorial.story_topic && (
                  <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                    style={{ color: '#daa520', background: 'rgba(184,134,11,0.1)' }}>
                    {editorial.story_topic}
                  </span>
                )}
              </div>
              <h2 className="text-[14px] md:text-[16px] text-white leading-tight tracking-[-0.01em] line-clamp-1" style={serif}>
                {editorial.search_keyword
                  ? `On ${editorial.search_keyword.charAt(0).toUpperCase() + editorial.search_keyword.slice(1)}: ${editorial.topic_score ?? editorial.overall_score}% Truthful`
                  : editorial.headline}
              </h2>
              <p className="text-[11px] text-[#bbb] leading-[1.5] line-clamp-1 mt-0.5">
                {editorial.editorial?.split('\n\n')[0] || ''}
              </p>
            </div>
            <span className="shrink-0 mr-4 px-3 py-1.5 rounded-full text-[10px] font-semibold text-white" style={{ background: '#b8860b' }}>
              Read more →
            </span>
          </Link>
        </div>
        );
      })()}

      {/* VIEW TOGGLE + SEARCH PILL — same row, below the hero card */}
      <div className="or-pills-row relative flex items-center gap-2 px-3 py-2" style={{ background: '#1e2a3a', minHeight: 40 }}>
        <div className="or-toggle-pill inline-flex items-center gap-1.5 px-1.5 rounded-full shrink-0"
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
        <div className="or-search-pill flex items-center gap-2 px-4 py-1.5 rounded-full flex-1"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', height: 32 }}>
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
      <section style={{ height: 'calc(100vh - 220px)', overflow: 'hidden', borderBottom: '1px solid #2a3a4a' }}>
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
                <img src={`${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/politicians/photo_${current.handle}.png`} alt={current.name}
                  className="h-full object-cover or-center-img" style={{ width: '40%' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="flex-1 p-5 flex flex-col justify-center or-center-content" style={{ borderLeft: '1px solid #2a3a4a' }}>
                  <h2 className="text-[20px] text-white mb-3 or-center-name" style={serif}>{current.name}</h2>
                  <div className="max-w-[250px]">
                    <ScoreMeter score={current.overall_score} />
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-3 text-[10px]">
                    {current.true_count > 0 && <span style={{ color: '#60a5fa' }}>{current.true_count} true</span>}
                    {current.somewhat_misleading_count > 0 && <span style={{ color: '#f59e0b' }}>{current.somewhat_misleading_count} somewhat</span>}
                    {current.misleading_count > 0 && <span style={{ color: '#daa520' }}>{current.misleading_count} misleading</span>}
                    {current.false_count > 0 && <span style={{ color: '#f87171' }}>{current.false_count} false</span>}
                  </div>
                  <p className="text-[10px] text-white/25 mt-1 or-center-vclaims">{current.verified_claims} claims</p>
                  <Link href={`/onrecord/${current.name ? nameToSlug(current.name) : current.handle}`}
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
        @media (max-width: 600px) {
          .or-center-img { display: none !important; }
          .or-center-content { padding: 10px !important; border-left: none !important; justify-content: flex-start !important; }
          .or-center-name { font-size: 14px !important; margin-bottom: 6px !important; }
          .or-center-vclaims { display: none !important; }
        }
      `}</style>

      {/* FOOTER */}
      <footer className="py-10 text-center" style={{ borderTop: '1px solid #2a3a4a' }}>
        <img src="/logo3.png" alt="CVRD News" className="h-36 mx-auto mb-4 opacity-30" />
        <span className="text-[11px] text-[#666] block mb-3">Your streaming platform to cover the news</span>
        <div className="flex items-center justify-center gap-4">
          <a href="/about" className="text-[11px] text-[#888] hover:text-white transition-colors">About</a>
          <span className="text-[#555]">·</span>
          <a href="/contact" className="text-[11px] text-[#888] hover:text-white transition-colors">Contact</a>
          <span className="text-[#555]">·</span>
          <a href="/terms" className="text-[11px] text-[#888] hover:text-white transition-colors">Terms of Service</a>
          <span className="text-[#555]">·</span>
          <a href="/privacy" className="text-[11px] text-[#888] hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
