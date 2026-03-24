import { MetadataRoute } from 'next';
import { getAllStorySlugs } from '@/lib/stories';

export default function sitemap(): MetadataRoute.Sitemap {
  const categories = ['world', 'politics', 'markets-crypto', 'tech-ai', 'culture', 'unfiltered'];
  const baseUrl = 'https://cvrdnews.com';

  const storySlugs = getAllStorySlugs();

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...categories.map(cat => ({
      url: `${baseUrl}/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...storySlugs.map(s => ({
      url: `${baseUrl}/story/${s.slug}`,
      lastModified: new Date(s.date),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
