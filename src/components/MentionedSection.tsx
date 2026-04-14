"use client";

import Link from "next/link";

const BLOB_BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';

type Person = {
  name: string;
  role?: string;
  handle?: string;
};

type TimelineMatch = {
  id: string;
  title: string;
  image_file?: string;
};

function nameToSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function MentionedSection({ people, timelines }: { people?: Person[]; timelines?: TimelineMatch[] }) {
  const onRecordPeople = (people || []).filter(p => p.handle);
  const hasOnRecord = onRecordPeople.length > 0;
  const hasTimelines = timelines && timelines.length > 0;
  if (!hasOnRecord && !hasTimelines) return null;

  return (
    <div className="space-y-4 mb-6">
      {hasOnRecord && (
        <div className="rounded-lg p-4" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(184,134,11,0.2)' }}>
              <span className="text-[7px] font-bold" style={{ color: '#b8860b' }}>!</span>
            </div>
            <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">On Record</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {onRecordPeople.map((p, i) => (
              <Link key={i} href={`/onrecord/${nameToSlug(p.name)}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors hover:opacity-80"
                style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                <img
                  src={`${BLOB_BASE}/politicians/photo_${p.handle}.png`}
                  alt={p.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    el.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-8 h-8 rounded-full items-center justify-center text-[13px] font-bold hidden shrink-0"
                  style={{ background: '#253545', color: '#daa520', display: 'none' }}>
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <span className="text-[12px] text-white font-semibold block" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{p.name}</span>
                  {p.role && <span className="text-[9px] text-[#777] block">{p.role}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasTimelines && (
        <div className="rounded-lg p-4" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px]">📅</span>
            <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Timeline</span>
          </div>

          <div className="space-y-2">
            {timelines!.map((t, i) => (
              <Link key={i} href={`/timeline/${t.id}`}
                className="flex items-center gap-3 p-2.5 rounded-md transition-colors hover:opacity-80"
                style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                {t.image_file && (
                  <img src={t.image_file} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                )}
                <span className="text-[12px] text-white font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{t.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
