import fs from 'fs';
import path from 'path';
import type { NarrativeGap, DailyReport } from './data';

/**
 * Convert a story topic to a URL-safe slug
 */
export function topicToSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * Load all daily reports from public/data (and engine output for local dev)
 * Returns newest first
 */
export function getAllDailyReports(): { date: string; report: DailyReport }[] {
  const results: { date: string; report: DailyReport }[] = [];
  const seen = new Set<string>();

  const dirs = [
    path.resolve(process.cwd(), 'public/data'),
    path.resolve(process.cwd(), '../intelligence-engine/output'),
  ];

  // Only load last 7 days to keep serverless function size manageable
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.startsWith('daily_gaps_') && f.endsWith('.json') && f.replace('daily_gaps_', '').replace('.json', '') >= cutoff);
    for (const f of files) {
      const date = f.replace('daily_gaps_', '').replace('.json', '');
      if (seen.has(date)) continue;
      seen.add(date);
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as DailyReport;
        results.push({ date, report: data });
      } catch {}
    }
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Find a story by its slug across all dates
 * Returns newest match
 */
export function findStoryBySlug(slug: string): { story: NarrativeGap; date: string } | null {
  const reports = getAllDailyReports();
  for (const { date, report } of reports) {
    for (const story of (report.top_narratives || [])) {
      if (topicToSlug(story.topic) === slug) {
        return { story, date };
      }
    }
  }
  return null;
}

/**
 * Get all story slugs for sitemap generation
 */
export function getAllStorySlugs(): { slug: string; date: string; topic: string }[] {
  const reports = getAllDailyReports();
  const slugs: { slug: string; date: string; topic: string }[] = [];
  const seen = new Set<string>();

  for (const { date, report } of reports) {
    for (const story of (report.top_narratives || [])) {
      const slug = topicToSlug(story.topic);
      if (!seen.has(slug)) {
        seen.add(slug);
        slugs.push({ slug, date, topic: story.topic });
      }
    }
  }

  return slugs;
}
