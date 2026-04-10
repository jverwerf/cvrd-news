import { MetadataRoute } from 'next';

export const revalidate = 86400; // 24h — sitemap only needs daily refresh

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://cvrdnews.com';

  // Generate story slugs from today's data without importing filesystem-heavy stories.ts
  // This avoids bundling all of public/data into the serverless function
  let storyEntries: MetadataRoute.Sitemap = [];
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataDir = path.resolve(process.cwd(), 'public/data');
    const files = fs.readdirSync(dataDir)
      .filter((f: string) => f.startsWith('daily_gaps_') && f.endsWith('.json'))
      .sort()
      .slice(-7); // last 7 days only

    for (const f of files) {
      const date = f.replace('daily_gaps_', '').replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
      for (const story of (data.top_narratives || [])) {
        const slug = story.topic
          .toLowerCase()
          .replace(/['']/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 80);
        storyEntries.push({
          url: `${baseUrl}/story/${slug}`,
          lastModified: new Date(date),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch {}

  const categories = ['world', 'politics', 'markets', 'sports', 'trending'];

  // Timeline threads (from Blob)
  let threadEntries: MetadataRoute.Sitemap = [];
  try {
    const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';
    for (const file of ['timeline_threads.json', 'timeline_archive.json']) {
      const resp = await fetch(`${blobBase}/data/${file}`, { next: { revalidate: 86400 } });
      if (!resp.ok) continue;
      const data = await resp.json();
      for (const thread of (data.threads || [])) {
        threadEntries.push({
          url: `${baseUrl}/timeline/${thread.id}`,
          lastModified: new Date(thread.last_seen),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch {}

  // On Record politicians (from Blob)
  let politicianEntries: MetadataRoute.Sitemap = [];
  try {
    const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';
    const manifestResp = await fetch(`${blobBase}/politicians/manifest.json`, { next: { revalidate: 86400 } });
    if (manifestResp.ok) {
      const manifest = await manifestResp.json();
      for (const handle of (manifest.handles || [])) {
        const scoreResp = await fetch(`${blobBase}/politicians/score_${handle}.json`, { next: { revalidate: 86400 } });
        if (!scoreResp.ok) continue;
        const data = await scoreResp.json();
        const slug = (data.name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        if (slug) {
          politicianEntries.push({
            url: `${baseUrl}/onrecord/${slug}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
          });
        }
      }
    }
  } catch {}

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...categories.map(cat => ({
      url: `${baseUrl}/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    { url: `${baseUrl}/onrecord`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/onrecord/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/timeline`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    ...storyEntries,
    ...threadEntries,
    ...politicianEntries,
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];
}
