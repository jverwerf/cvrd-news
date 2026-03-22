import fs from 'fs';
import path from 'path';
import { ShowClient } from './ShowClient';

type Episode = {
  date: string;
  videoUrl: string;
  embedId: string;
  topics: string[];
};

export default async function ShowPage() {
  // Collect all daily briefing videos from data files
  const dataDir = path.resolve(process.cwd(), 'public/data');
  const episodes: Episode[] = [];

  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir)
      .filter(f => f.startsWith('daily_gaps_'))
      .sort()
      .reverse(); // newest first

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
        if (data.video_url) {
          const embedMatch = data.video_url.match(/embed\/([^?]+)/);
          const embedId = embedMatch ? embedMatch[1] : '';
          if (embedId) {
            const topStories = (data.top_narratives || [])
              .filter((s: any) => s.is_top_story)
              .slice(0, 5)
              .map((s: any) => s.topic);
            episodes.push({
              date: data.date,
              videoUrl: data.video_url,
              embedId,
              topics: topStories,
            });
          }
        }
      } catch {}
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0f18' }}>
      <ShowClient episodes={episodes} />
    </div>
  );
}
