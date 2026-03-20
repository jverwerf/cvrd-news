import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type BreakingStory = {
  topic: string;
  summary: string;
  severity: 'critical' | 'major';
  detected_at: string;
  last_updated: string;
  sources: { name: string; url: string }[];
  clips: { platform: string; url: string; embed_id?: string; title?: string }[];
};

const BREAKING_PATH = path.resolve(process.cwd(), 'public/data/breaking.json');

async function fetchBreakingCandidates(): Promise<{ title: string; url: string; source: string }[]> {
  const breakingKeywords = /\b(BREAKING|JUST IN|ALERT|DEVELOPING|URGENT|FLASH)\b/i;
  const feeds = [
    { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
    { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'Reuters', url: 'https://www.yahoo.com/news/rss' },
  ];

  const candidates: { title: string; url: string; source: string }[] = [];
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const feed of feeds) {
    try {
      const resp = await fetch(feed.url, { signal: AbortSignal.timeout(8000) });
      const text = await resp.text();
      const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 10)) {
        const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        const date = new Date(pubDate);
        if (date.getTime() < oneHourAgo) continue;
        if (breakingKeywords.test(title)) {
          candidates.push({ title, url: link, source: feed.name });
        }
      }
    } catch {}
  }
  return candidates;
}

async function judgeBreaking(
  candidates: { title: string; url: string; source: string }[],
  currentBreaking: BreakingStory | null
): Promise<BreakingStory | null> {
  if (candidates.length === 0) return null;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `You determine if news is genuinely BREAKING — a major unexpected event.

STRICT CRITERIA — only return breaking for:
- War escalations (new strikes, invasions, declarations of war)
- Major terror attacks
- Assassination or death of a world leader
- Natural disasters with mass casualties
- Major economic crashes (>5% market drop)
- Unprecedented political events (coup, impeachment, resignation)

NOT breaking: gradual developments, market fluctuations <5%, crypto <10%, celebrity news, sports, policy announcements.

${currentBreaking ? `Currently tracking: "${currentBreaking.topic}" — only flag something NEW.` : ''}

Output JSON: { "is_breaking": true/false, "topic": "...", "summary": "...", "severity": "critical"/"major" }` },
      { role: 'user', content: JSON.stringify(candidates.slice(0, 15)) }
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const result = JSON.parse(resp.choices[0].message.content || '{}');
  if (!result.is_breaking) return null;

  return {
    topic: result.topic,
    summary: result.summary,
    severity: result.severity || 'major',
    detected_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    sources: candidates.slice(0, 10).map(c => ({ name: c.source, url: c.url })),
    clips: [],
  };
}

export async function GET() {
  try {
    // Load current breaking
    let currentBreaking: BreakingStory | null = null;
    if (fs.existsSync(BREAKING_PATH)) {
      currentBreaking = JSON.parse(fs.readFileSync(BREAKING_PATH, 'utf8'));
      // Auto-expire after 12h
      if (currentBreaking && Date.now() - new Date(currentBreaking.last_updated).getTime() > 12 * 60 * 60 * 1000) {
        try { fs.unlinkSync(BREAKING_PATH); } catch {}
        currentBreaking = null;
      }
    }

    const candidates = await fetchBreakingCandidates();
    const breaking = await judgeBreaking(candidates, currentBreaking);

    if (breaking) {
      fs.writeFileSync(BREAKING_PATH, JSON.stringify(breaking, null, 2));
      return NextResponse.json({ status: 'BREAKING', topic: breaking.topic });
    }

    return NextResponse.json({ status: 'none', candidates: candidates.length });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: e.message?.substring(0, 80) });
  }
}
