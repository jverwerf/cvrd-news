"use client";

import type { TimelineThread } from "@/lib/timeline-data";
import { ThreadCard } from "../TimelineClient";
import { RidePromo } from "@/components/RidePromo";

export function ThreadDetail({ thread, hasRide }: { thread: TimelineThread; hasRide?: boolean }) {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
      {hasRide && (
        <div className="mb-6">
          <RidePromo slug={thread.id} count={thread.entries.length} />
          <div className="flex items-center justify-between gap-3 px-1 mt-2">
            <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: 'rgba(230,236,239,0.45)', fontFamily: 'ui-monospace, monospace' }}>
              Quick recap · the moments that mattered
            </span>
            <a href={`/timeline/${thread.id}/ride?mode=full`}
               className="text-[10px] uppercase tracking-[0.16em] hover:opacity-80"
               style={{ color: '#F6D9A0', fontFamily: 'ui-monospace, monospace', textDecoration: 'none', border: '1px solid rgba(224,169,78,0.4)', padding: '6px 10px' }}>
              ▶ Full story · all {thread.entries.length} days
            </a>
          </div>
        </div>
      )}

      <ThreadCard
        thread={thread}
        isExpanded={true}
        onToggle={() => {}}
        onHover={() => {}}
      />

      {/* Back */}
      <div className="py-4 mt-4" style={{ borderTop: '1px solid #2a3a4a' }}>
        <a href="/timeline" className="text-[11px] text-[#888] hover:text-white transition-colors">← Back to Timeline</a>
      </div>
    </div>
  );
}
