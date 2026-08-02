import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const SITE = 'https://cvrdnews.com';

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toSlug(topic: string): string {
  return topic.toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function imageUrl(blobBase: string, imageFile?: string): string {
  if (!imageFile) return '';
  if (imageFile.startsWith('http')) return imageFile;
  return `${blobBase}/${imageFile.replace(/^\//, '')}`;
}

function para(s?: string): string {
  return s ? `<p>${esc(s)}</p>` : '';
}

export async function GET() {
  const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';
  const items: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    try {
      const resp = await fetch(`${blobBase}/data/daily_gaps_${date}.json`, { next: { revalidate: 86400 } });
      if (!resp.ok) continue;
      const data = await resp.json();
      for (const story of (data.top_narratives || [])) {
        const slug = toSlug(story.topic);
        if (seen.has(slug)) continue;
        seen.add(slug);
        const url = `${SITE}/story/${slug}`;
        const img = imageUrl(blobBase, story.image_file);
        const body = [
          para(story.summary),
          story.left_narrative ? `<h3>What the left is saying</h3>${para(story.left_narrative)}` : '',
          story.center_narrative ? `<h3>What the center is saying</h3>${para(story.center_narrative)}` : '',
          story.right_narrative ? `<h3>What the right is saying</h3>${para(story.right_narrative)}` : '',
          `<p><a href="${url}">Full coverage, every side, on CVRD News</a></p>`,
        ].join('');
        items.push(`
    <item>
      <title>${esc(story.topic)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(date + 'T07:00:00Z').toUTCString()}</pubDate>
      <category>${esc(story.category || 'news')}</category>
      <description>${esc(story.summary || '')}</description>
      <content:encoded><![CDATA[${body}]]></content:encoded>
      ${img ? `<media:content url="${esc(img)}" medium="image"/>` : ''}
    </item>`);
      }
    } catch {}
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CVRD News</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>The news, unfiltered. Daily coverage built from 36+ sources across the political spectrum: what the left, the center, and the right are each saying.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${SITE}/logo_new.jpg</url>
      <title>CVRD News</title>
      <link>${SITE}</link>
    </image>
    ${items.join('\n')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
