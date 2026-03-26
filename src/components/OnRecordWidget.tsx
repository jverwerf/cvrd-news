"use client";

import Link from "next/link";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

type OnRecordMatch = {
  handle: string;
  name: string;
  search_keyword: string;
  matching_claims: number;
  topic_score: number;
};

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function MiniMeter({ score }: { score: number }) {
  const lines = 20;
  return (
    <div className="flex items-end gap-[1px] h-3">
      {Array.from({ length: lines }).map((_, i) => {
        const pct = (i / lines) * 100;
        const color = pct < 35 ? '#f87171' : pct < 55 ? '#daa520' : '#60a5fa';
        return (
          <div key={i} className="flex-1 rounded-sm" style={{
            height: `${30 + Math.random() * 50}%`,
            background: pct <= score ? color : '#2a3a4a',
            opacity: pct <= score ? 0.7 : 0.2,
          }} />
        );
      })}
    </div>
  );
}

export function OnRecordWidget({ matches }: { matches: OnRecordMatch[] }) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="rounded-lg p-4 mb-6" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(184,134,11,0.2)' }}>
          <span className="text-[7px] font-bold" style={{ color: '#b8860b' }}>!</span>
        </div>
        <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">On Record</span>
      </div>

      <div className="space-y-2">
        {matches.map((m, i) => (
          <Link key={i} href={`/onrecord/${nameToSlug(m.name)}?q=${m.search_keyword}`}
            className="flex items-center gap-3 p-2.5 rounded-md transition-colors hover:opacity-80"
            style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
            <img src={`/data/politicians/photo_${m.handle}.png`} alt={m.name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[12px] text-white font-semibold" style={serif}>{m.name}</span>
                <span className="text-[9px] text-[#777]">on &ldquo;{m.search_keyword}&rdquo;</span>
              </div>
              <MiniMeter score={m.topic_score} />
            </div>
            <div className="text-right shrink-0">
              <span className="text-[16px] font-bold" style={{ ...serif, color: m.topic_score >= 60 ? '#60a5fa' : m.topic_score >= 40 ? '#daa520' : '#f87171' }}>
                {m.topic_score}%
              </span>
              <p className="text-[8px] text-[#666]">{m.matching_claims} claims</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
