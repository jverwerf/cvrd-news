import { getDailyGaps } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function TVPage() {
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];

  const top10 = allStories.filter(s => s.is_top_story).length >= 10
    ? allStories.filter(s => s.is_top_story)
    : allStories.slice(0, 10);

  const stories = top10;

  if (!data || stories.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#000000' }}>
        <p className="text-[#999]">No stories available.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#000000', height: '100vh', overflow: 'hidden', cursor: 'none' }}>
      {/* Logo */}
      <img src="/logo3.png" alt="CVRD" className="fixed left-1/2 pointer-events-none"
        style={{ top: '8px', transform: 'translateX(-50%)', height: '50px', zIndex: 101, opacity: 0.6, filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }} />

      {/* Ticker bar */}
      <div className="fixed top-0 left-0 right-0 h-10 flex items-center overflow-hidden" style={{ background: '#111', zIndex: 100 }}>
        <div className="flex items-center gap-8 animate-[ticker_180s_linear_infinite] whitespace-nowrap pl-4">
          {[...stories, ...stories, ...stories].map((s, i) => (
            <span key={i} className="flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[12px] text-white/70 font-medium">{s.topic}</span>
              <span className="text-[#333] ml-2">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Dashboard — full screen */}
      <div style={{ paddingTop: '40px', height: '100vh' }}>
        <ErrorBoundary>
          <Dashboard stories={stories} videoUrl={data.video_url} videoDate={data.date} tvMode />
        </ErrorBoundary>
      </div>

      {/* Auto-refresh every 5 minutes to pick up new data */}
      <meta httpEquiv="refresh" content="300" />

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
