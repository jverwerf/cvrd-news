"use client";

import type { TimelineThread } from "@/lib/timeline-data";
import { ThreadCard } from "../TimelineClient";

export function ThreadDetail({ thread }: { thread: TimelineThread }) {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
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
