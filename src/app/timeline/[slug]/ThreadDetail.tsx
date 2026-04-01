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

      {/* Back + Share */}
      <div className="flex items-center gap-3 py-4 mt-4" style={{ borderTop: '1px solid #2a3a4a' }}>
        <a href="/timeline" className="text-[11px] text-[#888] hover:text-white transition-colors">← Back to Timeline</a>
        <span className="ml-auto text-[9px] text-[#555] uppercase tracking-[0.12em]">Share</span>
        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(thread.title)}&url=${encodeURIComponent(`https://cvrdnews.com/timeline/${thread.id}`)}`}
          target="_blank" rel="noreferrer" className="text-[11px] font-bold text-white/50 hover:text-white">𝕏</a>
        <a href={`https://www.reddit.com/submit?title=${encodeURIComponent(thread.title)}&url=${encodeURIComponent(`https://cvrdnews.com/timeline/${thread.id}`)}`}
          target="_blank" rel="noreferrer" className="opacity-50 hover:opacity-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4500"><circle cx="12" cy="12" r="12"/></svg>
        </a>
      </div>
    </div>
  );
}
