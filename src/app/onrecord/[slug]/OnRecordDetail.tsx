"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { HorizontalAdBanner } from "@/components/AdBanners";
import { SiteNav } from "@/components/SiteNav";
import type { ArchiveEntry } from "@/lib/onrecord-slug";

type ScoredClaim = {
  tweet_id: string; tweet_text: string; tweet_date: string; tweet_url: string;
  claim: string; claim_type: string; domain: string; score: number; verdict: string;
  reasoning: string; used_web_search: boolean; resolved_from_pending?: boolean; verified_at?: string;
};
type PendingClaim = {
  tweet_id: string; tweet_text: string; tweet_date: string; tweet_url: string;
  claim: string; domain: string; deadline: string;
};

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

function verdictLabel(v: string) { return v === 'TRUE' ? 'True' : v === 'SOMEWHAT MISLEADING' ? 'Somewhat Misleading' : v === 'MISLEADING' ? 'Misleading' : 'False'; }
function verdictColor(v: string) { return v === 'TRUE' ? '#60a5fa' : v === 'SOMEWHAT MISLEADING' ? '#f59e0b' : v === 'MISLEADING' ? '#daa520' : '#f87171'; }
function fmtDate(d: string) { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; } }
function nameToSlug(name: string) { return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''); }

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

function DonutChart({ score }: { score: any }) {
  const r = 90, strokeW = 34, cx = 140, cy = 110;
  const circ = 2 * Math.PI * r;
  const segments = [
    { key: 'true', label: 'True', count: score.true_count || 0, color: '#60a5fa' },
    { key: 'somewhat', label: 'Somewhat', count: score.somewhat_misleading_count || 0, color: '#f59e0b' },
    { key: 'misleading', label: 'Misleading', count: score.misleading_count || 0, color: '#daa520' },
    { key: 'false', label: 'False', count: score.false_count || 0, color: '#f87171' },
  ];
  const total = segments.reduce((s, x) => s + x.count, 0) || 1;
  let offset = 0;
  const arcs = segments.map(seg => {
    const frac = seg.count / total;
    const arc = { ...seg, offset, frac, dash: frac * circ, gap: (1 - frac) * circ };
    offset += frac;
    return arc;
  });

  return (
    <div className="flex flex-col items-center w-full">
      <svg width="280" height="220" viewBox="0 0 280 220">
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2a3a" strokeWidth={strokeW} />
        {arcs.map(seg => (
          <circle key={seg.key} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={strokeW}
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={-(seg.offset * circ - circ / 4)}
            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="28" fontWeight="700" fontFamily="Georgia, serif">{score.overall_score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#777" fontSize="9" letterSpacing="0.08em">% truthful</text>
      </svg>
      {/* Legend with bars */}
      <div className="w-full space-y-2.5 px-2 mt-2">
        {segments.map(seg => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
          return (
            <div key={seg.key}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                <span className="text-[11px] text-[#bbb] flex-1">{seg.label}</span>
                <span className="text-[10px] text-[#777]">{pct}%</span>
                <span className="text-[12px] font-bold text-white w-8 text-right" style={serif}>{seg.count}</span>
              </div>
              <div className="h-1.5 rounded-full w-full" style={{ background: '#1e2a3a' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: seg.color, opacity: 0.8 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineChart({ claims, overallScore }: { claims: ScoredClaim[]; overallScore: number }) {
  const barH = 240;
  const lineH = 150;
  const gapH = 65;
  const bottomPad = 14;
  const totalSvgH = barH + gapH + lineH + bottomPad;
  const MIN_BAR_SLOT = 44;

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(900);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(e => setContainerW(e[0].contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Group by month
  const byMonth: Record<string, ScoredClaim[]> = {};
  for (const c of claims) {
    const m = (c.tweet_date || '').substring(0, 7);
    if (!m) continue;
    (byMonth[m] = byMonth[m] || []).push(c);
  }
  const months = Object.keys(byMonth).sort();
  if (months.length === 0) return null;

  const minChartW = months.length * MIN_BAR_SLOT + 30;
  const viewW = Math.max(containerW, minChartW);
  const needsScroll = minChartW > containerW;
  const barSpacing = (viewW - 30) / months.length;
  const barW = Math.min(36, barSpacing - 6);
  const barCenters = months.map((_, i) => 10 + i * barSpacing + barSpacing / 2);
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });

  const verdictOrder = ['TRUE', 'SOMEWHAT MISLEADING', 'MISLEADING', 'FALSE'];
  const verdictColors: Record<string, string> = { TRUE: '#60a5fa', 'SOMEWHAT MISLEADING': '#f59e0b', MISLEADING: '#daa520', FALSE: '#f87171' };

  const maxCount = Math.max(...months.map(m => byMonth[m].length), 1);

  // Bar chart
  const bars = months.map((m, i) => {
    const cls = byMonth[m];
    const total = cls.length;
    const x = barCenters[i] - barW / 2;
    let curY = barH;
    const stacks = verdictOrder.map(v => {
      const count = cls.filter(c => c.verdict === v).length;
      const h = (count / maxCount) * (barH - 10);
      curY -= h;
      return { v, count, h, y: curY };
    }).filter(s => s.h > 0);
    const barTop = stacks.length > 0 ? stacks[stacks.length - 1].y : barH;
    return { m, x, total, stacks, barTop };
  });

  // % truthful per month
  const monthScores = months.map(m => {
    const cls = byMonth[m];
    if (!cls.length) return 0;
    return Math.round((cls.reduce((s, c) => s + c.score, 0) / cls.length) * 100);
  });

  const lineTop = barH + gapH;
  const lineBottom = lineTop + lineH - 10;
  const scoreToY = (s: number) => lineBottom - (s / 100) * (lineBottom - lineTop);

  const linePoints = months.map((_, i) => `${barCenters[i]},${scoreToY(monthScores[i])}`).join(' ');
  const areaPoints = [
    `${barCenters[0]},${lineBottom}`,
    ...months.map((_, i) => `${barCenters[i]},${scoreToY(monthScores[i])}`),
    `${barCenters[months.length - 1]},${lineBottom}`,
  ].join(' ');

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: totalSvgH }}>
      {needsScroll && <>
        <button onClick={() => scroll(-1)} style={{ position: 'absolute', left: 0, top: '40%', zIndex: 10, background: 'rgba(30,42,58,0.9)', border: '1px solid #2a3a4a', borderRadius: 6, color: '#aaa', width: 26, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>‹</button>
        <button onClick={() => scroll(1)} style={{ position: 'absolute', right: 0, top: '40%', zIndex: 10, background: 'rgba(30,42,58,0.9)', border: '1px solid #2a3a4a', borderRadius: 6, color: '#aaa', width: 26, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>›</button>
      </>}
      <div ref={scrollRef} style={{ overflowX: needsScroll ? 'auto' : 'visible', scrollbarWidth: 'none', marginLeft: needsScroll ? 30 : 0, marginRight: needsScroll ? 30 : 0, height: totalSvgH }}>
        <div style={{ position: 'relative', width: viewW, height: totalSvgH }}>
          <svg style={{ position: 'absolute', top: 0, left: 0 }} width="100%" height={totalSvgH}
            viewBox={`0 0 ${viewW} ${totalSvgH}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="truthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#daa520" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#daa520" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Bar chart */}
          {bars.map((d, i) => (
            <g key={d.m}>
              {d.stacks.map(s => (
                <rect key={s.v} x={d.x} y={s.y} width={barW} height={s.h} fill={verdictColors[s.v]} rx={1} opacity={0.85} />
              ))}
              {/* Count label on top of bar */}
              <text x={d.x + barW / 2} y={Math.max(d.barTop - 4, 12)} textAnchor="middle" fill="#888" fontSize="11">{d.total}</text>
              {/* Month label */}
              {(months.length <= 12 || i % Math.ceil(months.length / 12) === 0 || i === months.length - 1) && (
                <text x={barCenters[i]} y={barH + 16} textAnchor="middle" fill="#4a5a6a" fontSize="11">
                  {new Date(d.m + '-02').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </text>
              )}
            </g>
          ))}

          {/* Legend */}
          {verdictOrder.map((v, i) => (
            <g key={v} transform={`translate(${i * Math.min(95, Math.floor((viewW - 10) / 4)) + 10}, ${barH + 22})`}>
              <circle cx={5} cy={5} r={5} fill={verdictColors[v]} />
              <text x={14} y={9} fill="#6a7a8a" fontSize="11">{v === 'SOMEWHAT MISLEADING' ? 'Somewhat' : v === 'TRUE' ? 'True' : v === 'MISLEADING' ? 'Misleading' : 'False'}</text>
            </g>
          ))}

          {/* % TRUTHFUL label */}
          <text x={0} y={lineTop - 10} fill="#666" fontSize="11" fontWeight="600" letterSpacing="0.10em">% TRUTHFUL</text>

          {/* 50% reference */}
          <line x1={0} y1={scoreToY(50)} x2={viewW} y2={scoreToY(50)} stroke="#253545" strokeWidth={1.5} strokeDasharray="5 4" />
          <text x={4} y={scoreToY(50) - 5} fill="#4a5a6a" fontSize="11" textAnchor="start">50%</text>

          {/* All-time reference */}
          <line x1={0} y1={scoreToY(overallScore)} x2={viewW} y2={scoreToY(overallScore)} stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.5} />
          <text x={4} y={scoreToY(overallScore) - 5} fill="#60a5fa" fontSize="11" textAnchor="start" opacity={0.8}>All-time {overallScore}%</text>

          {/* Area + line */}
          {months.length > 1 && <polygon points={areaPoints} fill="url(#truthGrad)" />}
          {months.length > 1 && (
            <polyline points={linePoints} fill="none" stroke="#daa520" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          )}

          {/* Dots + per-point % labels */}
          {months.map((_, i) => (
            <g key={i}>
              <circle cx={barCenters[i]} cy={scoreToY(monthScores[i])} r={4} fill="#daa520" stroke="#1e2a3a" strokeWidth={1.5} />
              {i !== months.length - 1 && (
                <text x={barCenters[i]} y={scoreToY(monthScores[i]) - 8} textAnchor="middle"
                  fill="#daa520" fontSize="10" fontWeight="600" opacity={0.75}>
                  {monthScores[i]}%
                </text>
              )}
            </g>
          ))}

          {/* Latest score label */}
          <text
            x={Math.min(barCenters[months.length - 1], viewW - 20)}
            y={scoreToY(monthScores[months.length - 1]) - 8}
            textAnchor="end"
            fill="#daa520" fontSize="12" fontWeight="600" letterSpacing="0.04em">
            {monthScores[months.length - 1]}%
          </text>

          {/* X-axis labels on line chart */}
          {months.map((m, i) => {
            const showLabel = months.length <= 12 || i % Math.ceil(months.length / 12) === 0 || i === months.length - 1;
            if (!showLabel) return null;
            return (
              <text key={m} x={barCenters[i]} y={lineBottom + 14} textAnchor="middle" fill="#4a5a6a" fontSize="11">
                {new Date(m + '-02').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </text>
            );
          })}
          </svg>
        </div>
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
  const [resolvedLimit, setResolvedLimit] = useState(3);
  const [pendingLimit, setPendingLimit] = useState(3);
  const [claimLimit, setClaimLimit] = useState(5);
  const [isBreaking, setIsBreaking] = useState(false);
  const [featuredEditorials, setFeaturedEditorials] = useState<ArchiveEntry[]>([]);

  useEffect(() => {
    fetch('/api/breaking/data').then(r => r.ok ? r.json() : null).then(data => {
      if (data && Array.isArray(data) && data.length > 0) setIsBreaking(true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';
    if (!blobBase || !score?.handle) return;
    fetch(`${blobBase}/politicians/onrecord_archive.json?t=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then((entries: ArchiveEntry[] | null) => {
        if (!Array.isArray(entries)) return;
        const mine = entries.filter(e => e.handle === score.handle)
          .sort((a, b) => b.date.localeCompare(a.date));
        setFeaturedEditorials(mine);
      }).catch(() => {});
  }, [score?.handle]);

  const claims: ScoredClaim[] = verified?.scored_claims || [];
  const pending: PendingClaim[] = verified?.pending_claims || [];
  const resolved = claims.filter(c => c.resolved_from_pending);

  const searchFiltered = claims.filter(c => {
    if (domainFilter && c.domain !== domainFilter) return false;
    if (claimSearch) {
      const q = claimSearch.toLowerCase();
      if (!`${c.claim} ${c.tweet_text} ${c.reasoning} ${c.domain}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filtered = searchFiltered.filter(c => filter === 'all' || c.verdict === filter);

  const searchScore = claimSearch && searchFiltered.length > 0
    ? Math.round((searchFiltered.reduce((sum, c) => sum + c.score, 0) / searchFiltered.length) * 1000) / 10
    : null;

  const domainEntries: [string, { score: number; count: number }][] = [
    ['all', { score: score.overall_score, count: score.verified_claims }],
    ...Object.entries(score.domains || {}).sort((a, b) => {
      if (a[0] === 'other') return 1;
      if (b[0] === 'other') return -1;
      return a[0].localeCompare(b[0]);
    }) as [string, { score: number; count: number }][],
  ];

  const shareUrl = `https://cvrdnews.com/onrecord/${slug}`;

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      <SiteNav isBreaking={isBreaking} />

      <div className="px-4 md:px-8 pb-10 pt-5 max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-3">
          <Link href="/onrecord" className="text-[11px] transition-colors hover:text-white/60" style={{ color: '#daa520' }}>On Record</Link>
          <span className="text-[10px] text-white/20">/</span>
          <span className="text-[11px] text-white/50">{score.name}</span>
          <span className="text-[10px] text-white/15 ml-auto">{score.verified_claims} claims verified</span>
        </div>

        {/* HERO CARD */}
        <div className="flex items-center gap-3 mb-6">
          {(() => {
            const currentIdx = allPoliticians.findIndex((p: any) => p.handle === score.handle);
            const prev = allPoliticians[currentIdx - 1] || allPoliticians[allPoliticians.length - 1];
            return prev && prev.handle !== score.handle ? (
              <Link href={`/onrecord/${prev.name ? nameToSlug(prev.name) : prev.handle}`}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-100"
                style={{ background: '#253545', border: '1px solid #2a3a4a', opacity: 0.6 }} title={prev.name}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </Link>
            ) : <div className="shrink-0 w-8" />;
          })()}
          <div data-section="top-card" className="flex-1 flex flex-col md:flex-row rounded-lg overflow-hidden" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
            <img src={`${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/politicians/photo_${score.handle}.png`} alt={score.name}
              className="w-full md:w-auto md:max-w-[280px]" style={{ display: 'block', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="p-6 flex flex-col justify-center flex-1" style={{ borderLeft: '1px solid #2a3a4a' }}>
              <div className="max-w-[300px] mx-auto w-full">
                <ScoreMeter score={score.overall_score} />
              </div>
              <div className="mt-5 pt-5" style={{ borderTop: '1px solid #2a3a4a' }}>
                <p className="text-[13px] text-[#bbb] leading-[1.75] italic">
                  {(() => {
                    const s = score;
                    const total = s.verified_claims;
                    const topDomain = Object.entries(s.domains || {}).sort((a: any, b: any) => b[1].count - a[1].count)[0];
                    const wildest = claims.filter(c => c.verdict === 'FALSE' || c.verdict === 'MISLEADING').sort((a, b) => a.score - b.score)[0];
                    const counts = [
                      { label: 'true', n: s.true_count },
                      { label: 'somewhat misleading', n: s.somewhat_misleading_count || 0 },
                      { label: 'misleading', n: s.misleading_count },
                      { label: 'false', n: s.false_count },
                    ].filter(c => c.n > 0).sort((a, b) => b.n - a.n);
                    const top = counts[0];
                    if (!top) return '';
                    const majorityPct = Math.round((top.n / total) * 100);
                    let text = `Out of ${total} verifiable claims, `;
                    text += majorityPct >= 50 ? `the majority (${majorityPct}%) were rated ${top.label}` : `${top.n} were rated ${top.label}`;
                    if (counts.length > 1) text += `, with ${counts.slice(1).map(c => `${c.n} ${c.label}`).join(' and ')}`;
                    text += '.';
                    if (topDomain) {
                      const d = topDomain[1] as any;
                      text += ` ${(s.name?.split(' ')[0] || s.name)} talks most about ${topDomain[0].replace(/_/g, ' ')}, where ${d.score}% of ${d.count} claims held up.`;
                    }
                    if (wildest) text += ` ${(s.name?.split(' ')[0] || 'Their')}'s wildest miss? "${wildest.claim}"`;
                    return text;
                  })()}
                </p>
              </div>
              <div className="mt-4 pt-3 flex items-center gap-1.5" style={{ borderTop: '1px solid #2a3a4a' }}>
                <span className="text-[8px] uppercase tracking-[0.12em] text-[#555] shrink-0 mr-1">Share</span>
                {[
                  { svg: <span className="text-[11px] font-bold text-white/50">𝕏</span>, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${score.name} scores ${score.overall_score}% on CVRD On Record`)}&url=${encodeURIComponent(shareUrl)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4500" opacity={0.5}><circle cx="12" cy="12" r="12"/></svg>, href: `https://www.reddit.com/submit?title=${encodeURIComponent(`${score.name}: ${score.overall_score}% Truthful`)}&url=${encodeURIComponent(shareUrl)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.13 1.6 5.93L0 24l6.26-1.64A11.93 11.93 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>, href: `https://wa.me/?text=${encodeURIComponent(`${score.name}: ${score.overall_score}%\n\n${shareUrl}`)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0088cc" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37z"/></svg>, href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${score.name}: ${score.overall_score}%`)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#1877F2" opacity={0.5}><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"/></svg>, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                  { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2" opacity={0.5}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
                ].map((s, j) => (
                  <a key={j} href={s.href} target="_blank" rel="noreferrer" className="p-1.5 rounded transition-opacity hover:opacity-100 opacity-70">{s.svg}</a>
                ))}
              </div>
            </div>
          </div>
          {(() => {
            const currentIdx = allPoliticians.findIndex((p: any) => p.handle === score.handle);
            const next = allPoliticians[currentIdx + 1] || allPoliticians[0];
            return next && next.handle !== score.handle ? (
              <Link href={`/onrecord/${next.name ? nameToSlug(next.name) : next.handle}`}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-100"
                style={{ background: '#253545', border: '1px solid #2a3a4a', opacity: 0.6 }} title={next.name}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ) : <div className="shrink-0 w-8" />;
          })()}
        </div>

        {/* TRUE / SOMEWHAT / MISLEADING / FALSE counts */}
        <div className="grid grid-cols-4 gap-0 rounded-lg mb-6" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          {[
            { label: 'True', count: score.true_count, color: '#60a5fa' },
            { label: 'Somewhat', count: score.somewhat_misleading_count || 0, color: '#f59e0b' },
            { label: 'Misleading', count: score.misleading_count, color: '#daa520' },
            { label: 'False', count: score.false_count, color: '#f87171' },
          ].map((item, i) => (
            <div key={item.label} className="py-4 px-3 text-center" style={{ borderRight: i < 3 ? '1px solid #2a3a4a' : 'none' }}>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: item.color }}>{item.label}</span>
              <p className="text-[22px] text-white font-bold mt-1" style={serif}>{item.count}</p>
            </div>
          ))}
        </div>

        {/* FEATURED ON RECORD */}
        {featuredEditorials.length > 0 && (
          <div className="rounded-lg mb-6 overflow-hidden" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
            <div className="flex items-center gap-2 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.39 7.36H22l-6.2 4.5L18.18 21 12 16.5 5.82 21l2.38-7.14L2 9.36h7.61L12 2z"/>
              </svg>
              <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Featured On Record</span>
              <span className="text-[11px] text-[#777]">{featuredEditorials.length} editorial{featuredEditorials.length > 1 ? 's' : ''}</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredEditorials.slice(0, 6).map(ed => (
                <Link key={ed.slug} href={`/onrecord/today/${ed.slug}`}
                  className="block rounded-md p-3 transition-opacity hover:opacity-90"
                  style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', textDecoration: 'none' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-bold uppercase tracking-[0.12em]" style={{ color: '#daa520' }}>
                      {fmtDate(ed.date)}
                    </span>
                    {ed.story_topic && (
                      <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                        style={{ color: '#daa520', background: 'rgba(184,134,11,0.1)' }}>
                        {ed.story_topic}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[14px] text-white leading-tight tracking-[-0.01em] line-clamp-2" style={serif}>
                    {ed.search_keyword
                      ? `On ${ed.search_keyword.charAt(0).toUpperCase() + ed.search_keyword.slice(1)}: ${ed.topic_score ?? ed.overall_score}% Truthful`
                      : ed.headline}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AD */}
        <div className="mb-6">
          <p className="text-[7px] text-white/25 uppercase tracking-widest mb-1.5">Sponsored</p>
          <div style={{ height: 90, borderRadius: 8, overflow: 'hidden' }}>
            <HorizontalAdBanner />
          </div>
        </div>

        {/* ANALYTICS — Claims Over Time + Verdict Breakdown */}
        {claims.length > 0 && (
          <div className="rounded-lg mb-6 overflow-hidden" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
            <div className="flex items-center gap-2 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span className="text-[10px] font-bold text-[#777] uppercase tracking-[0.12em]">Analytics</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-stretch">
              <div className="flex-1 min-w-0 p-5 flex flex-col" style={{ borderRight: '1px solid #2a3a4a' }}>
                <p className="text-[9px] font-semibold text-[#555] uppercase tracking-[0.12em] mb-4">Claims Over Time</p>
                <div className="flex-1 min-h-0"><TimelineChart claims={claims} overallScore={score.overall_score} /></div>
              </div>
              <div className="flex-1 p-5 flex flex-col">
                <p className="text-[9px] font-semibold text-[#555] uppercase tracking-[0.12em] mb-4">Verdict Breakdown</p>
                <div className="flex-1 flex items-center justify-center"><DonutChart score={score} /></div>
              </div>
            </div>
          </div>
        )}

        {/* RECENTLY VERIFIED PROMISES */}
        {resolved.length > 0 && (() => (
          <div className="rounded-lg p-4 mb-6" style={{ background: '#253545', border: '1px solid rgba(96,165,250,0.2)' }}>
            <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span className="text-[10px] font-bold text-[#60a5fa] uppercase tracking-[0.12em]">Verified Promises</span>
              <span className="text-[11px] text-[#777]">{resolved.length} resolved</span>
            </div>
            <div className="space-y-2">
              {resolved.slice(0, resolvedLimit).map((c, i) => (
                <div key={c.tweet_id + '-' + i} className="p-3 rounded-md" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider shrink-0 mt-0.5" style={{ color: verdictColor(c.verdict) }}>{verdictLabel(c.verdict)}</span>
                  </div>
                  <p className="text-[13px] text-[#ccc] leading-[1.6] mt-1">{c.claim}</p>
                  <p className="text-[12px] text-[#888] leading-[1.5] mt-1">{c.reasoning}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[9px] text-[#555]">
                    <span>{fmtDate(c.tweet_date)}</span>
                    {c.verified_at && <><span>&middot;</span><span style={{ color: '#60a5fa' }}>Resolved {fmtDate(c.verified_at)}</span></>}
                  </div>
                </div>
              ))}
            </div>
            {resolved.length > resolvedLimit && (
              <button onClick={() => setResolvedLimit(resolved.length)} className="mt-3 w-full py-2 text-[11px] font-semibold rounded-md cursor-pointer transition-colors hover:opacity-80" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', color: '#60a5fa' }}>
                Show {resolved.length - resolvedLimit} more
              </button>
            )}
            {resolvedLimit > 3 && (
              <button onClick={() => setResolvedLimit(3)} className="mt-1 w-full py-1.5 text-[10px] cursor-pointer transition-colors hover:opacity-70" style={{ background: 'none', border: 'none', color: '#444' }}>
                Show less
              </button>
            )}
          </div>
        ))()}

        {/* OPEN PROMISES */}
        {pending.length > 0 && (
          <div className="rounded-lg p-4 mb-6" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
            <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Open Promises</span>
              <span className="text-[11px] text-[#777]">{pending.length} being tracked</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pending.slice(0, pendingLimit).map((c, i) => (
                <div key={c.tweet_id + '-' + i} className="rounded-md overflow-hidden flex flex-col" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                  <div className="p-3 flex flex-col gap-2">
                    <p className="text-[12px] text-[#ccc] leading-[1.5]">{c.claim}</p>
                    <div className="flex items-center gap-2 text-[9px] text-[#555]">
                      <span>{fmtDate(c.tweet_date)}</span>
                      {c.deadline && c.deadline !== 'TBD' && <><span>&middot;</span><span style={{ color: '#daa520' }}>Due {c.deadline}</span></>}
                    </div>
                  </div>
                  {c.tweet_id && (
                    <div className="relative w-full mt-auto" style={{ height: 220 }}>
                      <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${c.tweet_id}&theme=dark&dnt=true`}
                        className="absolute" style={{ border: 'none', top: -8, left: -8, right: -8, bottom: -8, width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }} loading="lazy" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {pending.length > pendingLimit && (
              <button onClick={() => setPendingLimit(pending.length)} className="mt-3 w-full py-2 text-[11px] font-semibold rounded-md cursor-pointer transition-colors hover:opacity-80" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', color: '#daa520' }}>
                Show {pending.length - pendingLimit} more
              </button>
            )}
            {pendingLimit > 3 && (
              <button onClick={() => setPendingLimit(3)} className="mt-1 w-full py-1.5 text-[10px] cursor-pointer transition-colors hover:opacity-70" style={{ background: 'none', border: 'none', color: '#444' }}>
                Show less
              </button>
            )}
          </div>
        )}

        {/* VERIFIED CLAIMS */}
        <div className="p-5 rounded-lg mb-6" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Verified Claims</span>
            <span className="text-[11px] text-[#777] ml-auto">{filtered.length} shown</span>
          </div>

          {/* Domain filter */}
          <div className="rounded-md p-3 mb-4" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] font-bold text-[#666] uppercase tracking-[0.1em]">By Topic</span>
              <span className="text-[10px] text-[#555]">{domainEntries.length - 1} categories</span>
              {domainFilter && (
                <button onClick={() => { setDomainFilter(null); setClaimLimit(5); }} className="text-[9px] ml-auto cursor-pointer hover:text-[#999] transition-colors" style={{ color: '#daa520', background: 'none', border: 'none' }}>Clear filter ×</button>
              )}
            </div>
            <div className="space-y-0">
              {domainEntries.map(([domain, d]) => (
                <button key={domain} onClick={() => { setDomainFilter(domain === 'all' ? null : domainFilter === domain ? null : domain); setClaimLimit(5); }}
                  className="flex items-center py-1.5 gap-3 w-full text-left cursor-pointer transition-colors rounded px-1 -mx-1"
                  style={{ background: (domainFilter === domain || (domain === 'all' && !domainFilter)) ? 'rgba(184,134,11,0.1)' : 'transparent', border: 'none' }}>
                  <span className="text-[12px] capitalize flex-1" style={{ color: (domainFilter === domain || (domain === 'all' && !domainFilter)) ? '#daa520' : '#bbb' }}>{domain.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-[#777]">{d.count} claims</span>
                  <span className="text-[12px] font-semibold w-12 text-right" style={{ color: d.score >= 60 ? '#60a5fa' : d.score >= 40 ? '#daa520' : '#f87171' }}>{d.score}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Claim search */}
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-md" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search claims... e.g. iran, economy, border" value={claimSearch}
              onChange={(e) => { setClaimSearch(e.target.value); setClaimLimit(5); }}
              className="flex-1 text-[11px] text-white/80 placeholder-white/20 outline-none"
              style={{ background: 'transparent', border: 'none' }} />
            {claimSearch && (
              <button onClick={() => setClaimSearch('')} className="text-[10px] text-white/30 hover:text-white/60 cursor-pointer" style={{ background: 'none', border: 'none' }}>×</button>
            )}
          </div>

          {/* Search results summary */}
          {claimSearch && searchFiltered.length > 0 && (() => {
            const trueC = searchFiltered.filter(c => c.verdict === 'TRUE').length;
            const somewhatC = searchFiltered.filter(c => c.verdict === 'SOMEWHAT MISLEADING').length;
            const misleadC = searchFiltered.filter(c => c.verdict === 'MISLEADING').length;
            const falseC = searchFiltered.filter(c => c.verdict === 'FALSE').length;
            return (
              <div className="mb-4 p-4 rounded-lg" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[12px] text-white/70">&ldquo;{claimSearch}&rdquo; — <span style={{ color: '#daa520' }}>{searchScore}% truthful</span> across {searchFiltered.length} claims</span>
                </div>
                <div className="max-w-[300px] mx-auto mb-3"><ScoreMeter score={searchScore!} /></div>
                <div className="grid grid-cols-4 gap-0 rounded-md overflow-hidden" style={{ background: '#253545' }}>
                  {[{ label: 'True', count: trueC, color: '#60a5fa' }, { label: 'Somewhat', count: somewhatC, color: '#f59e0b' }, { label: 'Misleading', count: misleadC, color: '#daa520' }, { label: 'False', count: falseC, color: '#f87171' }].map((item, idx) => (
                    <div key={item.label} className="py-2 px-3 text-center" style={{ borderRight: idx < 3 ? '1px solid #2a3a4a' : 'none' }}>
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.label}</span>
                      <p className="text-[18px] text-white font-bold" style={serif}>{item.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['all', 'TRUE', 'SOMEWHAT MISLEADING', 'MISLEADING', 'FALSE'] as const).map(f => (
              <button key={f} onClick={() => { setFilter(f); setClaimLimit(5); }}
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
            {filtered.slice(0, claimLimit).map((c, i) => (
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
          {filtered.length > claimLimit && (
            <button onClick={() => setClaimLimit(c => c + 10)} className="mt-4 w-full py-2 text-[11px] font-semibold rounded-md cursor-pointer transition-colors hover:opacity-80" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', color: '#daa520' }}>
              Show {Math.min(10, filtered.length - claimLimit)} more of {filtered.length - claimLimit} remaining
            </button>
          )}
          {claimLimit > 5 && (
            <button onClick={() => setClaimLimit(5)} className="mt-1 w-full py-1.5 text-[10px] cursor-pointer transition-colors hover:opacity-70" style={{ background: 'none', border: 'none', color: '#444' }}>
              Show less
            </button>
          )}
        </div>

      </div>

      {/* FOOTER */}
      <footer className="py-10 text-center" style={{ borderTop: '1px solid #2a3a4a' }}>
        <img src="/logo3.png" alt="CVRD News" className="h-36 mx-auto mb-4 opacity-30" />
        <span className="text-[11px] text-[#666] block mb-3">Your streaming platform to cover the news</span>
        <div className="flex items-center justify-center gap-4">
          <a href="/about" className="text-[11px] text-[#888] hover:text-white transition-colors">About</a>
          <span className="text-[#555]">&middot;</span>
          <a href="/contact" className="text-[11px] text-[#888] hover:text-white transition-colors">Contact</a>
          <span className="text-[#555]">&middot;</span>
          <a href="/terms" className="text-[11px] text-[#888] hover:text-white transition-colors">Terms of Service</a>
          <span className="text-[#555]">&middot;</span>
          <a href="/privacy" className="text-[11px] text-[#888] hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
