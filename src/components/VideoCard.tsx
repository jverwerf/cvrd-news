"use client";

import { useRef, useState } from "react";

export function VideoCard({ videoUrl, date }: { videoUrl: string; date: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggle = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video cursor-pointer group"
      onClick={!isPlaying ? toggle : undefined}>
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        playsInline
        onEnded={() => setIsPlaying(false)}
        controls={isPlaying}
      />
      {!isPlaying && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e] animate-pulse" />
            <span className="text-[11px] font-medium text-green-400 uppercase tracking-wider">Daily Brief</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">Today&apos;s Intelligence Briefing</h3>
          <p className="text-sm text-white/50 mb-4">
            {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — 7 stories, 5 minutes
          </p>
          <button className="self-start px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
            ▶ Play
          </button>
        </div>
      )}
    </div>
  );
}
