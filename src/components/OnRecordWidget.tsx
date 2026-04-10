"use client";

import Link from "next/link";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

type OnRecordMatch = {
  handle: string;
  name: string;
  search_keyword: string;
  matching_claims: number;
  topic_score: number;
  role?: string;
  overall_score?: number;
};

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function OnRecordWidget({ matches }: { matches: OnRecordMatch[] }) {
  if (!matches || matches.length === 0) return null;

  const BLOB = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';

  return (
    <div className="rounded-lg p-4 mb-6" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: 'rgba(184,134,11,0.2)' }}>
          <span className="text-[6px] font-bold" style={{ color: '#b8860b' }}>!</span>
        </div>
        <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em]">On Record</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {matches.map((m, i) => (
          <Link
            key={i}
            href={`/onrecord/${nameToSlug(m.name)}?q=${m.search_keyword}`}
            className="shrink-0 flex flex-col items-center rounded-xl p-4 transition-opacity hover:opacity-80"
            style={{
              background: '#253545',
              border: '1px solid rgba(184,134,11,0.35)',
              width: 140,
            }}
          >
            <div className="relative mb-3">
              <img
                src={`${BLOB}/politicians/photo_${m.handle}.png`}
                alt={m.name}
                className="w-16 h-16 rounded-full object-cover"
                style={{ border: '2px solid rgba(184,134,11,0.5)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo3.png';
                  (e.target as HTMLImageElement).style.opacity = '0.3';
                }}
              />
              {m.overall_score != null && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(184,134,11,0.4)', color: '#daa520' }}>
                  {m.overall_score}
                </div>
              )}
            </div>
            <p className="text-center text-[12px] font-semibold leading-[1.3] mb-1" style={{ ...serif, color: '#daa520' }}>{m.name}</p>
            {m.role && (
              <p className="text-center text-[9px] text-[#666] leading-[1.3]">{m.role}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
