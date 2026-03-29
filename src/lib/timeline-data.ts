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

// ── Data Loading ──

export async function getTimelineThreads(): Promise<TimelineThreadsOutput | null> {
  // Try engine output first (local dev), then public/data fallback (Vercel)
  const enginePath = path.resolve(process.cwd(), '../intelligence-engine/output/timeline_threads.json');
  const publicPath = path.resolve(process.cwd(), 'public/data/timeline_threads.json');

  let dataPath: string | null = null;
  if (fs.existsSync(enginePath)) {
    dataPath = enginePath;
  } else if (fs.existsSync(publicPath)) {
    dataPath = publicPath;
  }

  if (!dataPath) return null;

  try {
    const fileContents = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContents) as TimelineThreadsOutput;

    // Filter out threads with no entries
    data.threads = data.threads.filter(t => t.entries.length >= 2);

    return data;
  } catch (error) {
    console.error('Error reading timeline data:', error);
    return null;
  }
}
