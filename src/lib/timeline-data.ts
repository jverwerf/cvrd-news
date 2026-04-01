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
  social_clips?: { platform: 'x' | 'tiktok' | 'reels' | 'reddit' | 'telegram'; url: string; embed_id?: string; title?: string; author?: string; duration?: number }[];
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
  videos: LastYearVideo[];
};

// ── Data Loading ──

/** Load a JSON file from engine output or public/data fallback */
function loadTimelineFile(filename: string): TimelineThreadsOutput | null {
  const enginePath = path.resolve(process.cwd(), `../intelligence-engine/output/${filename}`);
  const publicPath = path.resolve(process.cwd(), `public/data/${filename}`);

  const dataPath = fs.existsSync(enginePath) ? enginePath
    : fs.existsSync(publicPath) ? publicPath
    : null;

  if (!dataPath) return null;

  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8')) as TimelineThreadsOutput;
  } catch {
    return null;
  }
}

export async function getTimelineThreads(): Promise<TimelineThreadsOutput | null> {
  const detected = loadTimelineFile('timeline_threads.json');
  const archive = loadTimelineFile('timeline_archive.json');

  if (!detected && !archive) return null;

  // Merge: archive threads take precedence over detected threads on ID conflicts
  const archiveIds = new Set((archive?.threads || []).map(t => t.id));
  const detectedFiltered = (detected?.threads || []).filter(t => !archiveIds.has(t.id));
  const merged = [...(archive?.threads || []), ...detectedFiltered];

  // Filter out threads with no entries
  const threads = merged.filter(t => t.entries.length >= 2);

  return {
    generated_at: detected?.generated_at || archive?.generated_at || new Date().toISOString(),
    threads,
  };
}

export async function getTimelineThread(slug: string): Promise<TimelineThread | null> {
  const data = await getTimelineThreads();
  if (!data) return null;
  return data.threads.find(t => t.id === slug) || null;
}

export async function getTodayLastYear(): Promise<TodayLastYearData | null> {
  const enginePath = path.resolve(process.cwd(), '../intelligence-engine/output/today_last_year.json');
  const publicPath = path.resolve(process.cwd(), 'public/data/today_last_year.json');

  let dataPath: string | null = null;
  if (fs.existsSync(enginePath)) dataPath = enginePath;
  else if (fs.existsSync(publicPath)) dataPath = publicPath;

  if (!dataPath) return null;

  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8')) as TodayLastYearData;
  } catch { return null; }
}
