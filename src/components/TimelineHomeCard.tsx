"use client";

import { useEffect, useRef, useState } from "react";
import type { TimelineThread } from "@/lib/timeline-data";
import { RideInline } from "@/components/RideInline";

/**
 * The Timeline block on the landing page: one card at a time, moving through
 * the recently active threads. Rotation stops the moment someone presses play
 * or reaches for the dots.
 */
export function TimelineHomeCard({ threads, rideSlugs = [] }: {
  threads: TimelineThread[];
  rideSlugs?: string[];
}) {
  const list = threads.slice(0, 8);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  const [held, setHeld] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (playing || held || list.length < 2) return;
    timer.current = setTimeout(() => setIdx(i => (i + 1) % list.length), 8000);
    return () => clearTimeout(timer.current);
  }, [idx, playing, held, list.length]);

  if (!list.length) return null;
  const thread = list[idx];
  const latest = thread.entries[thread.entries.length - 1];
  const clips = thread.entries
    .flatMap(e => e.youtube_videos || [])
    .map((v: any) => v.embed_id || v.id)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}>
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a3a4a' }}>
        <RideInline
          key={thread.id}
          slug={thread.id}
          title={thread.title}
          count={thread.entries.length}
          active={playing === thread.id}
          onPlay={() => setPlaying(thread.id)}
          height={300}
          narrow
          canPlay={rideSlugs.includes(thread.id)}
          image={thread.image_file || latest?.image_file}
          clips={clips}
          dates={thread.entries.map(e => e.date)}
          summary={thread.summary}
        />
      </div>

      <div className="flex gap-1.5 mt-2 justify-center">
        {list.map((t, i) => (
          <button key={t.id} onClick={() => { setIdx(i); setPlaying(null); }}
            aria-label={t.title}
            style={{
              width: i === idx ? 18 : 8, height: 3, padding: 0, cursor: 'pointer', border: 0,
              background: i === idx ? '#daa520' : 'rgba(230,236,239,0.22)',
              transition: 'width 300ms ease, background 300ms ease',
            }} />
        ))}
      </div>
    </div>
  );
}
