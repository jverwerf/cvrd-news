import { getDailyGaps } from "@/lib/data";
import { TVClient } from "./TVClient";

export default async function TVPage() {
  const data = await getDailyGaps();
  const allStories = data?.top_narratives || [];

  if (!data || allStories.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#000000' }}>
        <p className="text-[#999]">No stories available.</p>
      </div>
    );
  }

  return <TVClient allStories={allStories} videoUrl={data.video_url} videoDate={data.date} />;
}
