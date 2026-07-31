const BLOB_BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';

// The ride payload is derived once at pipeline time and parked in Blob, one
// small file per thread. The 24MB timeline_threads.json is far too big to put
// anywhere near the browser, so the ride never touches it.
export type RideStop = {
  d: string;          // date
  t: string;          // topic
  v?: string;         // youtube id, present only when the clip is embeddable
};

export type RideChapter = {
  i: number;          // index into stops
  label: string;
  tldr: string;       // what the narrator says
  v?: string;         // may be borrowed from a neighbouring stop
  start: number;      // seconds into the clip: past the anchor, into the footage
  why?: string;       // why that second was chosen
  audio?: string;     // pre-generated narration
};

export type RidePayload = {
  id: string;
  title: string;
  first: string;
  last: string;
  generated_at?: string;
  stops: RideStop[];
  chapters: RideChapter[];
};

export async function getRide(slug: string): Promise<RidePayload | null> {
  if (!BLOB_BASE) return null;
  try {
    const resp = await fetch(`${BLOB_BASE}/data/ride/${slug}.json`, { next: { revalidate: 3600 } });
    if (!resp.ok) return null;
    return (await resp.json()) as RidePayload;
  } catch {
    return null;
  }
}

/**
 * Which threads have a timeline built. One small file rather than a lookup per
 * thread — sixty cached requests were costing the timeline page a minute.
 */
export async function getRideSlugs(): Promise<string[]> {
  if (!BLOB_BASE) return [];
  try {
    const resp = await fetch(`${BLOB_BASE}/data/ride/index.json`, { next: { revalidate: 3600 } });
    if (!resp.ok) return [];
    const json = await resp.json();
    return Array.isArray(json?.slugs) ? json.slugs : [];
  } catch {
    return [];
  }
}

export async function hasRide(slug: string): Promise<boolean> {
  return (await getRideSlugs()).includes(slug);
}
