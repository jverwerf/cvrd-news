import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

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

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...categories.map(cat => ({
      url: `${baseUrl}/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...storyEntries,
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];
}
