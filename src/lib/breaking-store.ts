import { put, del } from '@vercel/blob';

const BLOB_KEY = 'breaking.json';

// URL is deterministic — addRandomSuffix: false means no list() needed
function breakingUrl() {
  return `${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/${BLOB_KEY}`;
}

export async function getBreakingData(): Promise<any[] | null> {
  try {
    const resp = await fetch(breakingUrl(), { cache: 'no-store' });
    if (!resp.ok) return null;

    const data = await resp.json();
    const items = Array.isArray(data) ? data : [data];

    // Filter out expired (>12h from detection)
    const valid = items.filter(
      (s: any) => Date.now() - new Date(s.detected_at).getTime() < 12 * 60 * 60 * 1000
    );

    // Clean up Blob if some stories expired
    if (valid.length !== items.length) {
      if (valid.length === 0) {
        await deleteBreakingData();
      } else {
        await saveBreakingData(valid);
      }
    }

    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

export async function saveBreakingData(stories: any[]): Promise<void> {
  const sorted = stories
    .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
    .slice(0, 5);

  await put(BLOB_KEY, JSON.stringify(sorted), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

export async function deleteBreakingData(): Promise<void> {
  try {
    await del(breakingUrl());
  } catch {}
}

export async function hasBreakingData(): Promise<boolean> {
  const data = await getBreakingData();
  if (!data || data.length === 0) return false;
  return data.some((s: any) => {
    const videoCount = (s.youtube_videos || []).length + (s.social_clips || []).length;
    return videoCount >= 3;
  });
}
