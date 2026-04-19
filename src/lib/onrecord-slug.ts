export function editorialSlug(date: string, handle: string, keyword?: string | null): string {
  const h = (handle || '').toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const k = (keyword || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return [date, h, k].filter(Boolean).join('-');
}

export function dateFromSlug(slug: string): string | null {
  const m = slug.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export type ArchiveEntry = {
  slug: string;
  date: string;
  handle: string;
  name: string;
  headline: string;
  story_topic: string;
  search_keyword?: string | null;
  topic_score?: number | null;
  overall_score?: number;
};
