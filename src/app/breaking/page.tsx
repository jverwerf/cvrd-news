import fs from 'fs';
import path from 'path';
import { redirect } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';
import { LiveBanner } from '@/components/LiveBanner';
import { getDailyGaps } from '@/lib/data';

export const dynamic = 'force-dynamic';

type BreakingStory = {
  topic: string;
  summary: string;
  severity: 'critical' | 'major';
  detected_at: string;
  last_updated: string;
  sources: { name: string; url: string }[];
  clips: { platform: string; url: string; embed_id?: string; title?: string }[];
};

function getBreakingData(): BreakingStory | null {
  try {
    const breakingPath = path.resolve(process.cwd(), 'public/data/breaking.json');
    if (!fs.existsSync(breakingPath)) return null;
    const data = JSON.parse(fs.readFileSync(breakingPath, 'utf8'));
    const lastUpdate = new Date(data.last_updated).getTime();
    if (Date.now() - lastUpdate > 12 * 60 * 60 * 1000) return null;
    return data;
  } catch { return null; }
}

export default async function BreakingPage() {
  const breaking = getBreakingData();
  if (!breaking) redirect('/');

  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];

  // Convert breaking clips to story format for Dashboard
  const breakingStory = {
    topic: breaking.topic,
    summary: breaking.summary,
    is_top_story: true,
    left_narrative: '',
    right_narrative: '',
    what_they_arent_telling_you: '',
    sources: breaking.sources,
    youtube_videos: breaking.clips
      .filter(c => c.platform === 'youtube')
      .map(c => ({ url: c.url, embed_id: c.embed_id || '', channel: c.title || '', title: c.title })),
    social_clips: breaking.clips
      .filter(c => c.platform !== 'youtube')
      .map(c => ({ platform: c.platform as 'x' | 'tiktok' | 'reels' | 'reddit', url: c.url, embed_id: c.embed_id, title: c.title })),
  };

  const timeSince = Math.round((Date.now() - new Date(breaking.detected_at).getTime()) / 60000);
  const timeLabel = timeSince < 60 ? `${timeSince}m ago` : `${Math.round(timeSince / 60)}h ago`;

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>
      <div className="sticky top-0" style={{ zIndex: 100 }}>
        <div className="overflow-x-auto" style={{ background: '#1e2a3a' }}>
          <div className="h-12 flex items-center justify-center gap-6 px-8">
            <a href="/breaking"
              className="shrink-0 px-5 py-2 text-[14px] font-bold rounded-full animate-pulse"
              style={{ background: '#dc2626', color: '#fff' }}>
              🔴 BREAKING
            </a>
            <a href="/" className="shrink-0 px-5 py-2 text-[14px] font-semibold rounded-full transition-colors"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)' }}>
              Daily Pick
            </a>
          </div>
        </div>
      </div>

      {/* Breaking header */}
      <div className="px-4 md:px-8 py-6" style={{ background: 'linear-gradient(to bottom, #7f1d1d, #1e2a3a)' }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[12px] font-bold text-white bg-red-600 px-3 py-1 rounded animate-pulse">BREAKING</span>
          <span className="text-[11px] text-white/60">{timeLabel}</span>
          <span className="text-[11px] text-white/40">Last updated: {new Date(breaking.last_updated).toLocaleTimeString()}</span>
        </div>
        <h1 className="text-[32px] md:text-[42px] text-white font-bold leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
          {breaking.topic}
        </h1>
        <p className="text-[15px] text-white/70 mt-3 max-w-3xl leading-relaxed">{breaking.summary}</p>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[10px] text-white/50">{breaking.clips.length} clips</span>
          <span className="text-white/30">·</span>
          <span className="text-[10px] text-white/50">{breaking.sources.length} sources</span>
        </div>
      </div>

      {/* Dashboard with breaking clips */}
      <Dashboard stories={[breakingStory as any]} videoUrl={undefined} videoDate={undefined} />

      {/* Sources */}
      <div className="px-4 md:px-8 py-6">
        <h2 className="text-[14px] font-bold text-white/60 uppercase tracking-wider mb-3">Sources</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {breaking.sources.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer"
              className="text-[12px] text-white/50 hover:text-white truncate px-3 py-2 rounded" style={{ background: '#253545' }}>
              {s.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
