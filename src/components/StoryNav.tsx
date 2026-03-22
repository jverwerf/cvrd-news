"use client";

import { useState } from "react";

export function StoryNav({ storyCount }: { storyCount: number }) {
  const [currentStory, setCurrentStory] = useState(0);

  const goToStory = (idx: number) => {
    setCurrentStory(idx);
    const el = document.getElementById(`story-${idx + 1}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Dispatch event to auto-expand the story
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('expand-story', { detail: idx + 1 }));
      }, 500);
    }
  };

  const prev = () => goToStory((currentStory - 1 + storyCount) % storyCount);
  const next = () => goToStory((currentStory + 1) % storyCount);

  return (
    <>
      {/* Left arrow */}
      <button onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer' }}>
        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white/70" />
      </button>

      {/* Right arrow */}
      <button onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer' }}>
        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-white/70" />
      </button>

      {/* Story indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {Array.from({ length: storyCount }, (_, i) => (
          <button key={i} onClick={() => goToStory(i)}
            className="transition-all"
            style={{
              width: i === currentStory ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: i === currentStory ? '#fff' : 'rgba(255,255,255,0.3)',
              border: 'none',
              cursor: 'pointer',
            }} />
        ))}
      </div>
    </>
  );
}
