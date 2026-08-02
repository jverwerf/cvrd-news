export const revalidate = 600;

import { redirect, notFound } from 'next/navigation';
import { editorialSlug, type ArchiveEntry } from '@/lib/onrecord-slug';

export const metadata = { alternates: { canonical: "/onrecord/today" } };

const BLOB_BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';

async function getLatestSlug(): Promise<string | null> {
  // Prefer the archive manifest
  try {
    const resp = await fetch(`${BLOB_BASE}/politicians/onrecord_archive.json`, { next: { revalidate: 600 } });
    if (resp.ok) {
      const entries: ArchiveEntry[] = await resp.json();
      if (Array.isArray(entries) && entries.length > 0) {
        const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
        return sorted[0].slug;
      }
    }
  } catch {}

  // Fallback: read the latest editorial blob directly
  try {
    const resp = await fetch(`${BLOB_BASE}/politicians/onrecord_today.json`, { next: { revalidate: 600 } });
    if (!resp.ok) return null;
    const data = await resp.json();
    const date = (data.generated_at || '').slice(0, 10);
    if (!date || !data.person?.handle) return null;
    return editorialSlug(date, data.person.handle, data.search_keyword);
  } catch { return null; }
}

export default async function OnRecordTodayIndex() {
  const slug = await getLatestSlug();
  if (!slug) notFound();
  redirect(`/onrecord/today/${slug}`);
}
