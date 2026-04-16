import { redirect } from "next/navigation";
import { getBreakingData } from "@/lib/breaking-store";
import { getLiveNowData } from "@/lib/live-now-store";
import BreakingClient from "./BreakingClient";

export const dynamic = 'force-dynamic';

export default async function BreakingPage() {
  const [data, liveNow] = await Promise.all([
    getBreakingData(),
    getLiveNowData(),
  ]);

  if ((!data || data.length === 0) && (!liveNow || liveNow.length === 0)) {
    redirect('/');
  }

  // Sort most recent first
  const sorted = [...(data || [])].sort(
    (a: any, b: any) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
  );

  return <BreakingClient initialData={sorted} initialLiveNow={liveNow || []} />;
}
