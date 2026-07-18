import fs from 'fs';
import path from 'path';

// ── Types ──

export type ThreadEntry = {
  date: string;
  story_index: number;
  topic: string;
  summary: string;
  category: string;
  left_narrative?: string;
  right_narrative?: string;
  what_they_arent_telling_you: string;
  image_file?: string;
  social_clips?: { platform: 'x' | 'tiktok' | 'reels' | 'telegram'; url: string; embed_id?: string; title?: string; author?: string; duration?: number }[];
  youtube_videos?: { url: string; embed_id: string; channel?: string; duration?: number }[];
  sources?: { name: string; url: string; lean?: 'left' | 'right' | 'center'; title?: string }[];
  short_video?: string;
  best_video_id?: string;
  best_video_platform?: string;
};

export type GapDay = {
  date: string;
  bridge_text: string;
};

export type TimelineThread = {
  id: string;
  title: string;
  category: string;
  summary: string;
  image_file?: string;
  entries: ThreadEntry[];
  gap_days: GapDay[];
  first_seen: string;
  last_seen: string;
  is_active: boolean;
  total_days_span: number;
  days_covered: number;
};

export type TimelineThreadsOutput = {
  generated_at: string;
  threads: TimelineThread[];
};

// ── Today Last Year types ──

export type LastYearVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
};

export type TodayLastYearData = {
  date_last_year: string;
  date_generated: string;
  summary: string;
  title?: string;
  image_file?: string;
  stories?: { headline: string; summary: string; category?: string }[];
  videos: LastYearVideo[];
};

// ── Data Loading ──

const BLOB_BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';

/** Load a JSON file: try engine output first, then Blob, then public/data fallback */
async function loadTimelineFile(filename: string): Promise<TimelineThreadsOutput | null> {
  // 1. Local engine output (for dev / pipeline runs)
  const enginePath = path.resolve(process.cwd(), `../intelligence-engine/output/${filename}`);
  if (fs.existsSync(enginePath)) {
    try {
      return JSON.parse(fs.readFileSync(enginePath, 'utf8')) as TimelineThreadsOutput;
    } catch { /* fall through */ }
  }

  // 2. Blob (production)
  if (BLOB_BASE) {
    try {
      const resp = await fetch(`${BLOB_BASE}/data/${filename}`, { next: { revalidate: 86400 } });
      if (resp.ok) return await resp.json() as TimelineThreadsOutput;
    } catch { /* fall through */ }
  }

  // 3. Local public/data fallback
  const publicPath = path.resolve(process.cwd(), `public/data/${filename}`);
  if (fs.existsSync(publicPath)) {
    try {
      return JSON.parse(fs.readFileSync(publicPath, 'utf8')) as TimelineThreadsOutput;
    } catch { /* fall through */ }
  }

  return null;
}

export async function getTimelineThreads(): Promise<TimelineThreadsOutput | null> {
  // Thread detector now merges archive into timeline_threads.json — single source of truth
  const data = await loadTimelineFile('timeline_threads.json');
  if (!data) return null;

  // Filter out threads with no entries
  const threads = data.threads.filter(t => t.entries.length >= 2);

  return {
    generated_at: data.generated_at,
    threads,
  };
}

export async function getTimelineThread(slug: string): Promise<TimelineThread | null> {
  const data = await getTimelineThreads();
  if (!data) return null;
  return data.threads.find(t => t.id === slug) || null;
}

async function loadLastYearFile(filename: string): Promise<TodayLastYearData | null> {
  const enginePath = path.resolve(process.cwd(), `../intelligence-engine/output/${filename}`);
  if (fs.existsSync(enginePath)) {
    try { return JSON.parse(fs.readFileSync(enginePath, 'utf8')) as TodayLastYearData; } catch {}
  }

  if (BLOB_BASE) {
    try {
      const resp = await fetch(`${BLOB_BASE}/data/${filename}`, { next: { revalidate: 86400 } });
      if (resp.ok) return await resp.json() as TodayLastYearData;
    } catch {}
  }

  const publicPath = path.resolve(process.cwd(), `public/data/${filename}`);
  if (fs.existsSync(publicPath)) {
    try { return JSON.parse(fs.readFileSync(publicPath, 'utf8')) as TodayLastYearData; } catch {}
  }

  return null;
}

export async function getTodayLastYear(): Promise<TodayLastYearData | null> {
  return loadLastYearFile('today_last_year.json');
}

export async function getTodayTenYearsAgo(): Promise<TodayLastYearData | null> {
  return loadLastYearFile('today_ten_years_ago.json');
}
