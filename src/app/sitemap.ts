import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const categories = ['world', 'politics', 'markets-crypto', 'tech-ai', 'culture', 'unfiltered'];
  const baseUrl = 'https://cvrdnews.com';

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
