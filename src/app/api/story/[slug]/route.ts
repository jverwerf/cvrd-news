import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function topicToSlug(topic: string): string {
  return topic.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dataDir = path.resolve(process.cwd(), 'public/data');

  if (!fs.existsSync(dataDir)) return NextResponse.json(null, { status: 404 });

  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith('daily_gaps_') && f.endsWith('.json'))
    .sort()
    .reverse();

  for (const f of files) {
    const date = f.replace('daily_gaps_', '').replace('.json', '');
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
      for (const story of (data.top_narratives || [])) {
        if (topicToSlug(story.topic) === slug) {
          const otherStories = (data.top_narratives || [])
            .filter((s: any) => topicToSlug(s.topic) !== slug)
            .slice(0, 5);
          return NextResponse.json({ story, date, otherStories });
        }
      }
    } catch {}
  }

  return NextResponse.json(null, { status: 404 });
}
