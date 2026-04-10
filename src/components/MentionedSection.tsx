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
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function MentionedSection({ people, timelines }: { people?: Person[]; timelines?: TimelineMatch[] }) {
  const hasPeople = people && people.length > 0;
  const hasTimelines = timelines && timelines.length > 0;
  if (!hasPeople && !hasTimelines) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full" style={{ background: '#daa520' }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: '#8a9aaa' }}>Mentioned</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasPeople && people.map((p, i) => {
          const slug = nameToSlug(p.name);
          const hasOnRecord = !!p.handle;
          const Wrapper = hasOnRecord ? Link : 'div' as any;
          const wrapperProps = hasOnRecord ? { href: `/onrecord/${slug}` } : {};

          return (
            <Wrapper key={i} {...wrapperProps}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
              {p.handle ? (
                <img
                  src={`${BLOB_BASE}/politicians/photo_${p.handle}.png`}
                  alt={p.name}
                  className="w-5 h-5 rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: '#1e2a3a', color: '#8a9aaa' }}>
                  {p.name.charAt(0)}
                </div>
              )}
              <span className="text-[11px] text-[#e0e0e0]">{p.name}</span>
              {p.role && <span className="text-[9px] text-[#666] hidden sm:inline">{p.role}</span>}
            </Wrapper>
          );
        })}

        {hasTimelines && timelines.map((t, i) => (
          <Link key={`tl-${i}`} href={`/timeline/${t.id}`}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-opacity hover:opacity-80"
            style={{ background: '#253545', border: '1px solid #daa52040' }}>
            {t.image_file && (
              <img src={t.image_file} alt="" className="w-5 h-5 rounded object-cover" />
            )}
            <span className="text-[10px] font-semibold" style={{ color: '#daa520' }}>📅</span>
            <span className="text-[11px] text-[#e0e0e0]">{t.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
