"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LiveBanner } from "@/components/LiveBanner";

type ScoredClaim = {
  tweet_id: string; tweet_text: string; tweet_date: string; tweet_url: string;
  claim: string; claim_type: string; domain: string; score: number; verdict: string;
  reasoning: string; used_web_search: boolean;
};
type PendingClaim = {
  tweet_id: string; tweet_text: string; tweet_date: string; tweet_url: string;
  claim: string; domain: string; deadline: string;
};

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

function verdictLabel(v: string) { return v === 'TRUE' ? 'True' : v === 'SOMEWHAT MISLEADING' ? 'Somewhat Misleading' : v === 'MISLEADING' ? 'Misleading' : 'False'; }
function verdictColor(v: string) { return v === 'TRUE' ? '#60a5fa' : v === 'SOMEWHAT MISLEADING' ? '#f59e0b' : v === 'MISLEADING' ? '#daa520' : '#f87171'; }
function fmtDate(d: string) { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; } }
function nameToSlug(name: string) { return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''); }

function AdBanner() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch {} }, []);
  return (
    <div ref={ref} className="w-full">
      <ins className="adsbygoogle" style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-2572735826517528" data-ad-slot="8292849831"
        data-ad-format="horizontal" data-full-width-responsive="true" />
    </div>
  );
}

function ScoreMeter({ score }: { score: number }) {
  const lines = 80;
  return (
    <div>
      <div className="mb-1 text-center">
        <span className="text-[28px] text-white font-bold" style={serif}>{score}</span>
        <span className="text-[10px] text-[#777]">%</span>
      </div>
      <div className="flex justify-between mb-1 text-[8px] uppercase tracking-[0.15em]">
        <span style={{ color: '#f87171' }}>Less truthful</span>
        <span style={{ color: '#60a5fa' }}>More truthful</span>
      </div>
      <div className="relative h-10 flex items-end gap-[2px]">
        {Array.from({ length: lines }).map((_, i) => {
          const pct = (i / lines) * 100;
          const isMarker = Math.abs(pct - score) < (100 / lines);
          const color = pct < 35 ? '#f87171' : pct < 55 ? '#daa520' : '#60a5fa';
          return (
            <div key={i} className="flex-1 rounded-sm" style={{
              height: isMarker ? '100%' : `${40 + Math.random() * 40}%`,
              background: isMarker ? '#fff' : pct <= score ? color : '#3a4a5a',
              opacity: isMarker ? 1 : pct <= score ? 0.7 : 0.35,
            }} />
          );
        })}
      </div>
    </div>
  );
}

export function OnRecordDetail({ score, verified, allPoliticians, slug }: {
  score: any; verified: any; allPoliticians: any[]; slug: string;
}) {
  const [filter, setFilter] = useState<'all' | 'TRUE' | 'SOMEWHAT MISLEADING' | 'MISLEADING' | 'FALSE'>('all');
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [claimSearch, setClaimSearch] = useState('');
  const [stories, setStories] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<any[]>();

  // Pre-fill search from URL ?q= parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setClaimSearch(q);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/data/daily_gaps_${today}.json`).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.top_narratives) setStories(data.top_narratives);
      if (data?.live_data) setLiveData(data.live_data);
    }).catch(() => {});
    fetch('/api/live').then(r => r.ok ? r.json() : null).then(data => {
      if (data) setLiveData(data);
    }).catch(() => {});
  }, []);

  const claims: ScoredClaim[] = verified?.scored_claims || [];
  const pending: PendingClaim[] = verified?.pending_claims || [];

  const searchFiltered = claims.filter(c => {
    if (domainFilter && c.domain !== domainFilter) return false;
    if (claimSearch) {
      const q = claimSearch.toLowerCase();
      const searchable = `${c.claim} ${c.tweet_text} ${c.reasoning} ${c.domain}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

  const filtered = searchFiltered.filter(c => {
    if (filter !== 'all' && c.verdict !== filter) return false;
    return true;
  });

  const searchScore = claimSearch && searchFiltered.length > 0
    ? Math.round((searchFiltered.reduce((sum, c) => sum + c.score, 0) / searchFiltered.length) * 1000) / 10
    : null;

  const domainEntries: [string, { score: number; count: number; true: number; somewhat_misleading: number; misleading: number; false: number }][] = [
    ['all', { score: score.overall_score, count: score.verified_claims, true: score.true_count, somewhat_misleading: score.somewhat_misleading_count || 0, misleading: score.misleading_count, false: score.false_count }],
    ...Object.entries(score.domains || {}).sort((a, b) => {
      if (a[0] === 'other') return 1;
      if (b[0] === 'other') return -1;
      return a[0].localeCompare(b[0]);
    }) as [string, { score: number; count: number; true: number; somewhat_misleading: number; misleading: number; false: number }][],
  ];

  const shareUrl = `https://cvrdnews.com/onrecord/${slug}`;

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      {/* NAV */}
      <div className="sticky top-0" style={{ zIndex: 100, background: '#1e2a3a' }}>
        <div className="h-12 flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 px-3 md:gap-3 md:px-4 md:mx-auto">
            {[
              { label: 'Daily Pick', slug: '/' },
              { label: 'On Record', slug: '/onrecord' },
              { label: 'World', slug: '/world' }, { label: 'Politics', slug: '/politics' },
              { label: 'Markets', slug: '/markets' }, { label: 'Sports', slug: '/sports' },
              { label: 'Trending', slug: '/trending' },
            ].map((cat) => (
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

      <div className="px-6 md:px-12 pb-10 pt-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-3">
          <Link href="/onrecord" className="text-[11px] transition-colors hover:text-white/60" style={{ color: '#daa520' }}>On Record</Link>
          <span className="text-[10px] text-white/20">/</span>
          <span className="text-[11px] text-white/50">{score.name}</span>
          <span className="text-[10px] text-white/15 ml-auto">{score.verified_claims} claims verified</span>
        </div>

        {/* HERO CARD */}
        <div className="flex items-center gap-3 max-w-3xl mx-auto mb-6">
          {/* Prev arrow */}
          {(() => {
            const currentIdx = allPoliticians.findIndex((p: any) => p.handle === score.handle);
            const prev = allPoliticians[currentIdx - 1] || allPoliticians[allPoliticians.length - 1];
            const next = allPoliticians[currentIdx + 1] || allPoliticians[0];
            return (
              <>
                {prev && prev.handle !== score.handle ? (
                  <Link href={`/onrecord/${nameToSlug(prev.name)}`}
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-100"
                    style={{ background: '#253545', border: '1px solid #2a3a4a', opacity: 0.6 }} title={prev.name}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </Link>
                ) : <div className="shrink-0 w-8" />}
              </>
            );
          })()}
          <div className="flex-1 flex flex-col md:flex-row rounded-lg overflow-hidden" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
            <img src={`/data/politicians/photo_${score.handle}.png`} alt={score.name}
              className="w-full md:w-auto md:max-w-[320px]" style={{ display: 'block', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="p-6 flex flex-col justify-center flex-1" style={{ borderLeft: '1px solid #2a3a4a' }}>
            <div className="max-w-[300px] mx-auto w-full">
              <ScoreMeter score={score.overall_score} />
            </div>
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid #2a3a4a' }}>
              <p className="text-[13px] text-[#bbb] leading-[1.75] italic">
                {score.name} scores {score.overall_score}% (±{score.confidence_interval}%) based on {score.verified_claims} verifiable claims
                from their last 1,000 tweets. {score.true_count} true, {score.somewhat_misleading_count || 0} somewhat misleading, {score.misleading_count} misleading, {score.false_count} false.
                {score.pending_count > 0 ? ` ${score.pending_count} claims are pending verification.` : ''}
              </p>
            </div>
            {/* Share row */}
            <div className="mt-4 pt-3 flex items-center gap-1.5" style={{ borderTop: '1px solid #2a3a4a' }}>
              <span className="text-[8px] uppercase tracking-[0.12em] text-[#555] shrink-0 mr-1">Share</span>
              {[
                { svg: <span className="text-[11px] font-bold text-white/50">𝕏</span>, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${score.name} scores ${score.overall_score}% on CVRD On Record`)}&url=${encodeURIComponent(shareUrl)}` },
                { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4500" opacity={0.5}><circle cx="12" cy="12" r="12"/></svg>, href: `https://www.reddit.com/submit?title=${encodeURIComponent(`${score.name}: ${score.overall_score}% Truthful`)}&url=${encodeURIComponent(shareUrl)}` },
                { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.13 1.6 5.93L0 24l6.26-1.64A11.93 11.93 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>, href: `https://wa.me/?text=${encodeURIComponent(`${score.name} scores ${score.overall_score}%\n\n${shareUrl}`)}` },
                { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0088cc" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37z"/></svg>, href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${score.name}: ${score.overall_score}%`)}` },
                { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#1877F2" opacity={0.5}><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"/></svg>, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2" opacity={0.5}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
              ].map((s, j) => (
                <a key={j} href={s.href} target="_blank" rel="noreferrer" className="p-1.5 rounded transition-opacity hover:opacity-100 opacity-70">{s.svg}</a>
              ))}
            </div>
          </div>
        </div>
          {/* Next arrow */}
          {(() => {
            const currentIdx = allPoliticians.findIndex((p: any) => p.handle === score.handle);
            const next = allPoliticians[currentIdx + 1] || allPoliticians[0];
            return next && next.handle !== score.handle ? (
              <Link href={`/onrecord/${nameToSlug(next.name)}`}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-100"
                style={{ background: '#253545', border: '1px solid #2a3a4a', opacity: 0.6 }} title={next.name}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ) : <div className="shrink-0 w-8" />;
          })()}
        </div>

        {/* TRUE / SOMEWHAT MISLEADING / MISLEADING / FALSE */}
        <div className="grid grid-cols-4 gap-0 rounded-lg mb-6" style={{ background: '#253545' }}>
          <div className="py-4 px-3 text-center" style={{ borderRight: '1px solid #2a3a4a' }}>
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#60a5fa' }}>True</span>
            <p className="text-[22px] text-white font-bold mt-1" style={serif}>{score.true_count}</p>
          </div>
          <div className="py-4 px-3 text-center" style={{ borderRight: '1px solid #2a3a4a' }}>
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#f59e0b' }}>Somewhat</span>
            <p className="text-[22px] text-white font-bold mt-1" style={serif}>{score.somewhat_misleading_count || 0}</p>
          </div>
          <div className="py-4 px-3 text-center" style={{ borderRight: '1px solid #2a3a4a' }}>
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#daa520' }}>Misleading</span>
            <p className="text-[22px] text-white font-bold mt-1" style={serif}>{score.misleading_count}</p>
          </div>
          <div className="py-4 px-3 text-center">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#f87171' }}>False</span>
            <p className="text-[22px] text-white font-bold mt-1" style={serif}>{score.false_count}</p>
          </div>
        </div>

        {/* AD */}
        <div className="relative mb-6 rounded-lg overflow-hidden" style={{ background: '#1a2535', minHeight: 90 }}>
          <div className="absolute top-1.5 right-2 z-10">
            <span className="text-[7px] font-medium text-white/20 uppercase tracking-wider">Sponsored</span>
          </div>
          <div className="w-full flex items-center justify-center p-1"><AdBanner /></div>
        </div>

        {/* DOMAIN BREAKDOWN */}
        <div className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
          <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
            <span className="text-[10px] font-bold text-[#999] uppercase tracking-[0.12em]">By Topic</span>
            <span className="text-[11px] text-[#777]">{domainEntries.length - 1} categories</span>
            {domainFilter && (
              <button onClick={() => setDomainFilter(null)} className="text-[9px] ml-auto cursor-pointer hover:text-[#999] transition-colors" style={{ color: '#daa520', background: 'none', border: 'none' }}>Clear filter ×</button>
            )}
          </div>
          <div className="space-y-0">
            {domainEntries.map(([domain, d]) => (
              <button key={domain} onClick={() => setDomainFilter(domain === 'all' ? null : domainFilter === domain ? null : domain)}
                className="flex items-center py-1.5 gap-3 w-full text-left cursor-pointer transition-colors rounded px-1 -mx-1"
                style={{ background: (domainFilter === domain || (domain === 'all' && !domainFilter)) ? 'rgba(184,134,11,0.1)' : 'transparent', border: 'none' }}>
                <span className="text-[12px] capitalize flex-1" style={{ color: (domainFilter === domain || (domain === 'all' && !domainFilter)) ? '#daa520' : '#bbb' }}>{domain.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-[#777]">{d.count} claims</span>
                <span className="text-[12px] font-semibold w-12 text-right" style={{ color: d.score >= 60 ? '#60a5fa' : d.score >= 40 ? '#daa520' : '#f87171' }}>{d.score}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* VERIFIED CLAIMS */}
        <div className="p-5 rounded-lg mb-6" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Verified Claims</span>
            <span className="text-[11px] text-[#777] ml-auto">{filtered.length} shown</span>
          </div>

          {/* Claim search */}
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-md" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search claims... e.g. iran, economy, border" value={claimSearch}
              onChange={(e) => setClaimSearch(e.target.value)}
              className="flex-1 text-[11px] text-white/80 placeholder-white/20 outline-none"
              style={{ background: 'transparent', border: 'none' }} />
            {claimSearch && (
              <button onClick={() => setClaimSearch('')} className="text-[10px] text-white/30 hover:text-white/60 cursor-pointer" style={{ background: 'none', border: 'none' }}>×</button>
            )}
          </div>

          {/* Search results summary */}
          {claimSearch && searchFiltered.length > 0 && (() => {
            const trueC = searchFiltered.filter(c => c.verdict === 'TRUE').length;
            const misleadC = searchFiltered.filter(c => c.verdict === 'MISLEADING').length;
            const falseC = searchFiltered.filter(c => c.verdict === 'FALSE').length;
            return (
              <div className="mb-4 p-4 rounded-lg" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[12px] text-white/70">&ldquo;{claimSearch}&rdquo; — <span style={{ color: '#daa520' }}>{searchScore}% truthful</span> across {searchFiltered.length} claims</span>
                </div>
                <div className="max-w-[300px] mx-auto mb-3"><ScoreMeter score={searchScore!} /></div>
                <div className="grid grid-cols-3 gap-0 rounded-md overflow-hidden" style={{ background: '#253545' }}>
                  <div className="py-2 px-3 text-center" style={{ borderRight: '1px solid #2a3a4a' }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#60a5fa' }}>True</span>
                    <p className="text-[18px] text-white font-bold" style={serif}>{trueC}</p>
                  </div>
                  <div className="py-2 px-3 text-center" style={{ borderRight: '1px solid #2a3a4a' }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#daa520' }}>Misleading</span>
                    <p className="text-[18px] text-white font-bold" style={serif}>{misleadC}</p>
                  </div>
                  <div className="py-2 px-3 text-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#f87171' }}>False</span>
                    <p className="text-[18px] text-white font-bold" style={serif}>{falseC}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {(['all', 'TRUE', 'SOMEWHAT MISLEADING', 'MISLEADING', 'FALSE'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                style={{
                  background: filter === f ? 'rgba(184,134,11,0.15)' : 'transparent',
                  color: filter === f ? '#daa520' : '#777',
                  border: filter === f ? '1px solid rgba(184,134,11,0.3)' : '1px solid transparent',
                }}>
                {f === 'all' ? `All (${searchFiltered.length})` : `${verdictLabel(f)} (${searchFiltered.filter(c => c.verdict === f).length})`}
              </button>
            ))}
          </div>

          {/* Claims list */}
          <div className="space-y-3">
            {filtered.map((c, i) => (
              <div key={c.tweet_id + '-' + i} className="rounded-lg p-4" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                <div className="flex gap-2.5">
                  <span className="text-[12px] font-bold mt-0.5 shrink-0 w-5 text-right" style={{ color: verdictColor(c.verdict) }}>{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: verdictColor(c.verdict) }}>{verdictLabel(c.verdict)}</span>
                    <p className="text-[13px] text-[#ccc] leading-[1.6] mt-0.5">{c.claim}</p>
                    <p className="text-[12px] text-[#888] leading-[1.6] mt-1.5">{c.reasoning}</p>

                    {c.tweet_id && (
                      <div className="mt-2 flex gap-3 items-start flex-wrap md:flex-nowrap">
                        <div className="shrink-0 rounded-md overflow-hidden relative" style={{ background: '#253545', border: '1px solid #2a3a4a', height: 200, width: 350, maxWidth: '100%' }}>
                          <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${c.tweet_id}&theme=dark&dnt=true`}
                            className="absolute" style={{ border: 'none', top: -8, left: -8, right: -8, bottom: -8, width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }} loading="lazy" />
                        </div>
                        <div className="shrink-0">
                          <span className="text-[8px] uppercase tracking-[0.12em] text-[#555] block mb-2">Share</span>
                          <div className="flex flex-wrap gap-1.5" style={{ maxWidth: 160 }}>
                            {[
                              { label: '𝕏', svg: null, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${score.name}: "${c.claim}" — ${c.verdict}`)}&url=${encodeURIComponent(shareUrl)}` },
                              { label: 'Reddit', svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="#ff4500"><circle cx="12" cy="12" r="12"/></svg>, href: `https://www.reddit.com/submit?title=${encodeURIComponent(`${score.name}: "${c.claim}" — ${c.verdict}`)}&url=${encodeURIComponent(shareUrl)}` },
                              { label: 'WA', svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="#25D366"><path d="M12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.13 1.6 5.93L0 24l6.26-1.64A11.93 11.93 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>, href: `https://wa.me/?text=${encodeURIComponent(`${score.name}: "${c.claim}" — ${c.verdict}\n\n${shareUrl}`)}` },
                              { label: 'TG', svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="#0088cc"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37z"/></svg>, href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${score.name}: "${c.claim}" — ${c.verdict}`)}` },
                              { label: 'FB', svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"/></svg>, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                              { label: 'LI', svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
                              { label: 'Threads', svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff" opacity={0.5}><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.083.717 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.281 1.332-3.08.857-.74 2.063-1.182 3.39-1.246.927-.044 1.813.06 2.647.306l.053-.265c.231-1.148.084-2.078-.437-2.762-.544-.715-1.465-1.1-2.593-1.084-1.593.023-2.727.637-3.467 1.033l-.096.053-.924-1.685.122-.067c.928-.51 2.395-1.265 4.39-1.293h.044c1.616-.02 2.95.525 3.855 1.576.753.876 1.133 2.059.96 3.437.792.326 1.476.784 2.036 1.37 1.033 1.08 1.532 2.555 1.443 4.265-.105 2.028-1.066 3.793-2.862 5.254C17.677 23.276 15.252 23.977 12.186 24z"/></svg>, href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${score.name}: "${c.claim}" — ${c.verdict}\n\n${shareUrl}`)}` },
                              { label: 'Bluesky', svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="#0085ff"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>, href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${score.name}: "${c.claim}" — ${c.verdict}\n\n${shareUrl}`)}` },
                            ].map((s, j) => (
                              <a key={j} href={s.href} target="_blank" rel="noreferrer"
                                className="flex items-center justify-center w-8 h-8 rounded transition-opacity hover:opacity-100"
                                style={{ background: '#253545', border: '1px solid #2a3a4a', opacity: 0.7 }} title={s.label}>
                                {s.svg || <span className="text-[11px] font-bold text-white">{s.label}</span>}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-[9px] text-[#555]">
                      <span>{fmtDate(c.tweet_date)}</span>
                      <span>&middot;</span>
                      <span className="capitalize">{c.domain?.replace(/_/g, ' ')}</span>
                      {c.used_web_search && <><span>&middot;</span><span style={{ color: '#daa520' }}>web verified</span></>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PENDING */}
        {pending.length > 0 && (
          <div className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
            <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
              <span className="text-[10px] font-bold text-[#999] uppercase tracking-[0.12em]">Pending Verification</span>
              <span className="text-[11px] text-[#777]">{pending.length} awaiting deadline</span>
            </div>
            <div className="space-y-0">
              {pending.map((c, i) => (
                <div key={c.tweet_id + '-' + i} className="py-2">
                  <p className="text-[12px] text-[#bbb]">{c.claim}</p>
                  <div className="flex items-center gap-2 mt-1 text-[9px] text-[#555]">
                    <span>{fmtDate(c.tweet_date)}</span>
                    <span>&middot;</span>
                    <span>Deadline: {c.deadline || 'TBD'}</span>
                    <span>&middot;</span>
                    <a href={c.tweet_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#999]" style={{ color: '#777' }}>view tweet &rarr;</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* METHODOLOGY */}
        <div className="p-5 rounded-lg text-center" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <p className="text-[11px] text-[#777] leading-relaxed">
            Score based on {score.verified_claims} verifiable claims from the last 1,000 tweets. Each claim verified using AI with web search.
            TRUE = 100% · MISLEADING = 50% · FALSE = 0%. Confidence: ±{score.confidence_interval}%.
          </p>
          <Link href="/onrecord" className="inline-block px-5 py-2 rounded-full text-[12px] font-semibold text-white transition-colors hover:opacity-90 mt-3" style={{ background: '#b8860b' }}>
            View all records
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-10 text-center" style={{ borderTop: '1px solid #2a3a4a' }}>
        <img src="/logo3.png" alt="CVRD News" className="h-36 mx-auto mb-4 opacity-30" />
        <span className="text-[11px] text-[#666] block mb-3">Your streaming platform to cover the news</span>
        <div className="flex items-center justify-center gap-4">
          <a href="/terms" className="text-[11px] text-[#888] hover:text-white transition-colors">Terms of Service</a>
          <span className="text-[#555]">&middot;</span>
          <a href="/privacy" className="text-[11px] text-[#888] hover:text-white transition-colors">Privacy Policy</a>
          <span className="text-[#555]">&middot;</span>
          <span className="text-[11px] text-[#666]">info@cvrdnews.com</span>
        </div>
      </footer>
    </div>
  );
}
