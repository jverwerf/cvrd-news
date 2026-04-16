const BLOB_KEY = 'live-now.json';

function liveNowUrl() {
  return `${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/${BLOB_KEY}`;
}

export async function getLiveNowData(): Promise<any[] | null> {
  try {
    const resp = await fetch(liveNowUrl(), { cache: 'no-store' });
    if (!resp.ok) return null;

    const data = await resp.json();
    const items = Array.isArray(data) ? data : [data];
    const valid = items.filter(
      (s: any) => Date.now() - new Date(s.detected_at).getTime() < 12 * 60 * 60 * 1000
    );
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}
