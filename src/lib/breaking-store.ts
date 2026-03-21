import { put, list, del } from '@vercel/blob';

const BLOB_KEY = 'breaking.json';

export async function getBreakingData(): Promise<any[] | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    const blob = blobs.find(b => b.pathname === BLOB_KEY);
    if (!blob) return null;

    const resp = await fetch(blob.url, { cache: 'no-store' });
    if (!resp.ok) return null;

    const data = await resp.json();
    const items = Array.isArray(data) ? data : [data];

    // Filter out expired (>12h)
    const valid = items.filter(
      (s: any) => Date.now() - new Date(s.last_updated).getTime() < 12 * 60 * 60 * 1000
    );

    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

export async function saveBreakingData(stories: any[]): Promise<void> {
  // Sort most recent first, cap at 5
  const sorted = stories
    .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
    .slice(0, 5);

  await put(BLOB_KEY, JSON.stringify(sorted), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
}

export async function deleteBreakingData(): Promise<void> {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    for (const blob of blobs) {
      await del(blob.url);
    }
  } catch {}
}

export async function hasBreakingData(): Promise<boolean> {
  const data = await getBreakingData();
  return data !== null && data.length > 0;
}
