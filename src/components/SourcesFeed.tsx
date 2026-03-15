"use client";

import { ExternalLink } from "lucide-react";

type Source = {
  name: string;
  url: string;
  lean?: string;
  storyTopic: string;
  storyIndex: number;
};

export function SourcesFeed({ sources }: { sources: Source[] }) {
  // Group by lean
  const left = sources.filter(s => s.lean === 'left');
  const right = sources.filter(s => s.lean === 'right');
  const center = sources.filter(s => !s.lean || s.lean === 'center');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SourceColumn label="Left-Leaning" color="blue" sources={left} />
      <SourceColumn label="Center / Wire" color="gray" sources={center} />
      <SourceColumn label="Right-Leaning" color="red" sources={right} />
    </div>
  );
}

function SourceColumn({ label, color, sources }: { label: string; color: string; sources: Source[] }) {
  const dotColor = color === 'blue' ? 'bg-blue-500' : color === 'red' ? 'bg-red-500' : 'bg-[#737373]';
  const labelColor = color === 'blue' ? 'text-blue-400' : color === 'red' ? 'text-red-400' : 'text-[#737373]';

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>{label}</span>
        <span className="text-[11px] text-[#737373]">({sources.length})</span>
      </div>
      <div className="space-y-0.5">
        {sources.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#141414] transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#a3a3a3] group-hover:text-white font-medium">{s.name}</p>
              <p className="text-[11px] text-[#737373] mt-0.5 truncate">
                re: {s.storyTopic}
              </p>
            </div>
            <ExternalLink size={12} className="text-[#737373] shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
        {sources.length === 0 && (
          <p className="text-xs text-[#737373] p-3">No sources</p>
        )}
      </div>
    </div>
  );
}
