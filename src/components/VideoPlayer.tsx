"use client";

import { useRef, useState, useEffect } from "react";

export function VideoPlayer({ url, date }: { url: string; date: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [unmuted, setUnmuted] = useState(false);

  // Autoplay muted on mount
  useEffect(() => {
    if (ref.current) {
      ref.current.play().catch(() => {});
    }
  }, []);

  const toggleSound = () => {
    if (ref.current) {
      ref.current.muted = !ref.current.muted;
      setUnmuted(!unmuted);
      if (!unmuted) {
        ref.current.currentTime = 0;
        ref.current.play();
      }
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: '#0a0a0a', border: '1px solid rgba(42,31,20,0.1)' }}
      onClick={toggleSound}>
      <div className="aspect-[9/16] max-h-[480px] mx-auto relative">
        <video
          ref={ref}
          src={url}
          className="w-full h-full object-contain"
          playsInline
          muted
          loop
          controls={unmuted}
        />
        {!unmuted && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 bg-gradient-to-t from-black/50 via-transparent to-transparent">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white" />
              <span className="text-[12px] font-medium text-white">Tap for sound</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-[#1a1610]">Daily Intelligence Briefing</p>
          <p className="text-[11px] text-[#9a8b78]">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-[5px] h-[5px] rounded-full bg-[#16a34a] shadow-[0_0_6px_#4ade80] animate-pulse" />
          <span className="text-[10px] font-medium text-[#16a34a] uppercase tracking-wider">Live</span>
        </div>
      </div>
    </div>
  );
}
