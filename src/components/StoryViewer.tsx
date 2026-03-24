"use client";

import { useState, useRef, useEffect } from "react";
import { Dashboard } from "./Dashboard";
import { ErrorBoundary } from "./ErrorBoundary";
import { VideoGrid } from "./VideoGrid";
import { Tweet } from 'react-tweet';
import type { NarrativeGap, DailyBrief } from "../lib/data";
import { motion, AnimatePresence } from "framer-motion";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

export function StoryViewer({ stories, videoUrl, videoDate, dailyBrief }: {
  stories: NarrativeGap[];
  videoUrl?: string;
  videoDate?: string;
  dailyBrief?: DailyBrief;
}) {
  // -1 = Daily Brief, 0+ = individual story
  const [currentIdx, setCurrentIdx] = useState(-1);

  if (!stories || stories.length === 0) {
    return <div className="py-20 text-center"><p className="text-[#999]">No stories available.</p></div>;
  }

  const prev = () => setCurrentIdx(p => {
    const n = p - 1;
    return n < -1 ? stories.length - 1 : n;
  });
  const next = () => setCurrentIdx(p => {
    const n = p + 1;
    return n >= stories.length ? -1 : n;
  });

  // Build curated Daily Brief story — best picks from all stories
  const bestYT: { url: string; embed_id: string; channel?: string; duration?: number }[] = [];
  const bestSocial: { platform: 'x' | 'tiktok' | 'reels' | 'reddit' | 'telegram'; url: string; embed_id?: string; title?: string; author?: string; duration?: number }[] = [];

  for (const s of stories) {
    // Best YouTube video per story (first one, already sorted by relevance)
    const ytList = s.youtube_videos || [];
    if (ytList.length > 0) bestYT.push(ytList[0]);

    // Best 2 social clips per story (prefer Telegram/X — no TikTok in daily brief)
    const social = (s.social_clips || []).filter(c => c.embed_id && c.platform !== 'tiktok');
    const videoClips = social.filter(c => c.platform === 'telegram' || (c.platform === 'x' && (c as any).duration));
    const picked = videoClips.slice(0, 2);
    if (picked.length < 2) {
      const remaining = social.filter(c => !picked.includes(c));
      picked.push(...remaining.slice(0, 2 - picked.length));
    }
    bestSocial.push(...picked);
  }

  // Merge all sources from all stories for the brief
  const allSources = stories.flatMap(s => s.sources || []);
  const uniqueSources: typeof allSources = [];
  const seenUrls = new Set<string>();
  for (const src of allSources) {
    if (!seenUrls.has(src.url)) { seenUrls.add(src.url); uniqueSources.push(src); }
  }

  // Handle GPT returning brief as { daily_brief: [...] } or { summary: "..." }
  const resolvedBrief = dailyBrief?.summary ? dailyBrief
    : (dailyBrief as any)?.daily_brief?.[0] ? (dailyBrief as any).daily_brief[0]
    : dailyBrief;

  const briefStory: NarrativeGap = {
    topic: 'Daily Brief',
    summary: resolvedBrief?.summary || `Today's top stories: ${stories.slice(0, 5).map(s => s.topic).join('. ')}. Plus ${stories.length - 5} more stories covering ${[...new Set(stories.map(s => s.category).filter(Boolean))].join(', ')}.`,
    left_narrative: resolvedBrief?.left_narrative || stories.slice(0, 3).map(s => s.left_narrative).filter(Boolean).join(' '),
    right_narrative: resolvedBrief?.right_narrative || stories.slice(0, 3).map(s => s.right_narrative).filter(Boolean).join(' '),
    what_they_arent_telling_you: resolvedBrief?.what_they_arent_telling_you || stories.slice(0, 3).map(s => s.what_they_arent_telling_you).filter(Boolean).join(' '),
    social_summary: resolvedBrief?.social_summary || stories.slice(0, 3).map(s => s.social_summary).filter(Boolean).join(' '),
    image_prompt: '',
    youtube_videos: bestYT,
    social_clips: bestSocial,
    sources: uniqueSources,
  };

  // Curated stories for Daily Brief dashboard — 1 YT + 2 social per story
  const briefStories: NarrativeGap[] = stories.map(s => ({
    ...s,
    youtube_videos: (s.youtube_videos || []).slice(0, 1),
    social_clips: (() => {
      const sc = (s.social_clips || []).filter(c => c.embed_id);
      const vids = sc.filter(c => c.platform === 'tiktok' || (c.platform === 'x' && (c as any).duration));
      const rest = sc.filter(c => !vids.includes(c));
      return [...vids.slice(0, 2), ...rest.slice(0, Math.max(0, 2 - vids.length))];
    })(),
  }));

  const isBrief = currentIdx === -1;
  const story = isBrief ? briefStory : stories[currentIdx];


  const clips = story.social_clips || [];
  const ytVids = story.youtube_videos || [];
  const sources = story.sources || [];
  const xClips = clips.filter(c => c.platform === 'x');
  const tiktokClips = clips.filter(c => c.platform === 'tiktok');
  const reelsClips = clips.filter(c => c.platform === 'reels');
  const redditClips = clips.filter(c => c.platform === 'reddit');
  const telegramClips = clips.filter(c => c.platform === 'telegram');
  const leftSources = sources.filter(s => s.lean === 'left');
  const rightSources = sources.filter(s => s.lean === 'right');
  const centerSources = sources.filter(s => !s.lean || s.lean === 'center');
  const sentences = story.what_they_arent_telling_you
    ?.split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter(s => s.trim().length > 20) || [];

  return (
    <div>
      {/* DASHBOARD with arrows + timeline */}
      <div className="relative" style={{ height: 'calc(100vh - 104px)', display: 'flex', flexDirection: 'column' }}>
        {/* MINI THUMBNAIL TIMELINE — same width as below, shorter height */}
        <div className="flex items-center gap-0 px-1 py-0.5" style={{ background: '#0a0f18' }}>
        <style>{`
          .story-thumb-mini:hover { width: 280px !important; opacity: 1 !important; }
          .story-thumb-mini:hover .story-thumb-mini-img { height: 60px !important; }
          .story-thumb-mini:hover .story-thumb-mini-label { font-size: 11px !important; line-height: 1.3 !important; }
        `}</style>
          <button onClick={() => {
            document.getElementById('story-timeline')?.scrollBy({ left: -200, behavior: 'smooth' });
          }} className="shrink-0 px-1 hover:opacity-70" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[5px] border-r-[#666]" />
          </button>
          <div id="story-timeline" className="flex gap-1 overflow-x-auto flex-1 items-end" style={{ scrollbarWidth: 'none' }}>
            {/* Daily Brief */}
            <button onClick={() => setCurrentIdx(-1)}
              className="story-thumb-mini shrink-0 rounded overflow-hidden cursor-pointer"
              style={{
                width: '100px',
                border: isBrief ? '2px solid #b8860b' : '2px solid transparent',
                opacity: isBrief ? 1 : 0.75,
                transition: 'width 0.3s ease, opacity 0.2s ease',
              }}>
              <div className="story-thumb-mini-img relative overflow-hidden flex items-center justify-center" style={{ height: '36px', transition: 'height 0.3s ease', background: '#1a1a2e' }}>
                <img src="/logo3.png" alt="" style={{ height: '20px', opacity: 0.4 }} />
                <div className="absolute inset-0 flex items-end p-1" style={{ background: 'linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.8) 100%)' }}>
                  <span className="story-thumb-mini-label text-[7px] text-white font-bold leading-tight" style={{ transition: 'font-size 0.3s ease' }}>Daily Brief</span>
                </div>
              </div>
            </button>
            {/* Stories */}
            {stories.map((s, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className="story-thumb-mini shrink-0 rounded overflow-hidden cursor-pointer"
                style={{
                  width: '100px',
                  border: i === currentIdx ? '2px solid #2563eb' : '2px solid transparent',
                  opacity: i === currentIdx ? 1 : 0.75,
                  transition: 'width 0.3s ease, opacity 0.2s ease',
                }}>
                <div className="story-thumb-mini-img relative overflow-hidden" style={{ height: '36px', transition: 'height 0.3s ease',
                  backgroundImage: s.image_file ? `url(${s.image_file})` : 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }}>
                  <div className="absolute inset-0 flex items-end p-1" style={{ background: 'linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.8) 100%)' }}>
                    <span className="story-thumb-mini-label text-[7px] text-white font-medium leading-tight line-clamp-2" style={{ transition: 'font-size 0.3s ease' }}>{s.topic}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => {
            document.getElementById('story-timeline')?.scrollBy({ left: 200, behavior: 'smooth' });
          }} className="shrink-0 px-1 hover:opacity-70" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[5px] border-l-[#666]" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <ErrorBoundary>
              <Dashboard key={`dash-${currentIdx}`} stories={isBrief ? [{ ...briefStory, social_clips: [] }] : [story]} videoUrl={undefined} videoDate={undefined} noAutoPlay />
            </ErrorBoundary>
          </div>
        </div>

        {/* Left arrow with label */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 group">
          <button onClick={prev}
            className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-transform shrink-0"
            style={{ background: 'rgba(0,0,0,0.85)', border: '2px solid rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[14px] border-r-white" style={{ marginRight: '2px' }} />
          </button>
          <span className="text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded max-w-[150px] truncate"
            style={{ background: 'rgba(0,0,0,0.8)' }}>
            {currentIdx === -1 ? stories[stories.length - 1]?.topic : currentIdx === 0 ? 'Daily Brief' : stories[currentIdx - 1]?.topic}
          </span>
        </div>

        {/* Right arrow with label */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 group">
          <span className="text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded max-w-[150px] truncate"
            style={{ background: 'rgba(0,0,0,0.8)' }}>
            {currentIdx === stories.length - 1 ? 'Daily Brief' : stories[currentIdx + 1]?.topic || stories[0]?.topic}
          </span>
          <button onClick={next}
            className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-transform shrink-0"
            style={{ background: 'rgba(0,0,0,0.85)', border: '2px solid rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[14px] border-l-white" style={{ marginLeft: '2px' }} />
          </button>
        </div>

      </div>

      {/* STORY THUMBNAIL STRIP */}
      {(
        <div className="flex items-center gap-0 px-1 py-1.5" style={{ background: '#111' }}>
        <style>{`
          .story-thumb:hover { width: 280px !important; opacity: 1 !important; }
          .story-thumb:hover .story-thumb-img { height: 100px !important; }
          .story-thumb:hover .story-thumb-label { font-size: 11px !important; line-height: 1.3 !important; }
        `}</style>
          <button onClick={() => {
            document.getElementById('story-thumbstrip')?.scrollBy({ left: -200, behavior: 'smooth' });
          }} className="shrink-0 px-1 hover:opacity-70" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[5px] border-r-[#666]" />
          </button>
          <div id="story-thumbstrip" className="flex gap-1 overflow-x-auto flex-1 items-end" style={{ scrollbarWidth: 'none' }}>
            {/* Daily Brief thumbnail */}
            <button onClick={() => setCurrentIdx(-1)}
              className="story-thumb shrink-0 rounded overflow-hidden cursor-pointer"
              style={{
                width: '100px',
                border: isBrief ? '2px solid #b8860b' : '2px solid transparent',
                opacity: isBrief ? 1 : 0.75,
                transition: 'width 0.3s ease, opacity 0.2s ease',
              }}>
              <div className="story-thumb-img relative overflow-hidden flex items-center justify-center" style={{ height: '56px', transition: 'height 0.3s ease', background: '#1a1a2e' }}>
                <img src="/logo3.png" alt="CVRD" style={{ height: '28px', opacity: 0.4 }} />
                <div className="absolute inset-0 flex items-end p-1" style={{ background: 'linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.8) 100%)' }}>
                  <span className="story-thumb-label text-[7px] text-white font-bold leading-tight" style={{ transition: 'font-size 0.3s ease' }}>Daily Brief</span>
                </div>
              </div>
            </button>
            {stories.map((s, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className="story-thumb shrink-0 rounded overflow-hidden cursor-pointer"
                style={{
                  width: '100px',
                  border: i === currentIdx ? '2px solid #2563eb' : '2px solid transparent',
                  opacity: i === currentIdx ? 1 : 0.75,
                  transition: 'width 0.3s ease, opacity 0.2s ease',
                }}>
                <div className="story-thumb-img relative overflow-hidden" style={{ height: '56px', transition: 'height 0.3s ease',
                  backgroundImage: s.image_file ? `url(${s.image_file})` : 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }}>
                  <div className="absolute inset-0 flex items-end p-1" style={{ background: 'linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.8) 100%)' }}>
                    <span className="story-thumb-label text-[7px] text-white font-medium leading-tight line-clamp-2" style={{ transition: 'font-size 0.3s ease' }}>{s.topic}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => {
            document.getElementById('story-thumbstrip')?.scrollBy({ left: 200, behavior: 'smooth' });
          }} className="shrink-0 px-1 hover:opacity-70" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[5px] border-l-[#666]" />
          </button>
        </div>
      )}

      {/* BANNER with navigation — same white style for all */}
      <div className="px-4 md:px-6 py-2.5 flex items-center gap-3" style={{ background: '#f5f5f5' }}>
        {!isBrief && (
          <button onClick={prev} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
            style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-[#1e2a3a]" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!isBrief && (
              <span className="text-[10px] font-bold text-[#1e2a3a] bg-[#1e2a3a]/10 px-2 py-0.5 rounded uppercase tracking-[0.1em] shrink-0">
                {currentIdx + 1}/{stories.length}
              </span>
            )}
            <h1 className="text-[18px] md:text-[22px] text-[#1e2a3a] leading-tight tracking-[-0.02em] truncate" style={serif}>
              {isBrief ? "Daily Brief" : story.topic}
            </h1>
          </div>
        </div>
        <button onClick={next} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
          style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[#1e2a3a]" />
        </button>
      </div>

      {/* IMAGE (story mode only) */}
      {!isBrief && story.image_file && (
        <div className="relative overflow-hidden" style={{
          height: '45vh', minHeight: '320px',
          backgroundImage: `url(${story.image_file})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)' }} />
        </div>
      )}

      {/* FULL CONTENT */}
      <div className="px-6 md:px-12 pb-10 pt-5" style={{ background: '#1e2a3a' }}>

        {/* STORY CARDS — Daily Brief only */}
        {isBrief && (
          <div className="mb-6">
            <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3">Today&apos;s Top Stories</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {stories.map((s, i) => (
                <button key={i} onClick={() => setCurrentIdx(i)}
                  className="text-left rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                  {s.image_file && (
                    <div className="h-24 overflow-hidden" style={{
                      backgroundImage: `url(${s.image_file})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }}>
                      <div className="w-full h-full" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />
                    </div>
                  )}
                  <div className="p-2.5">
                    <span className="text-[8px] font-bold text-[#3b82f6] uppercase tracking-[0.1em]">{s.category || 'News'}</span>
                    <p className="text-[11px] text-white font-medium leading-snug line-clamp-2 mt-0.5 group-hover:text-[#60a5fa] transition-colors">
                      {s.topic}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SUMMARY */}
        <div className="mb-6 p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <p className="text-[15px] text-[#ccc] leading-[1.75] italic">{story.summary}</p>
        </div>

        {/* VIDEO GRID */}
        {(ytVids.length > 0 || clips.filter(c => c.embed_id).length > 0) && (
          <div className="mb-5" data-section="videogrid">
            <VideoGrid youtubeVideos={ytVids} socialClips={clips} storyImage={story.image_file} storyIndex={currentIdx + 1} />
          </div>
        )}

        {/* LEFT vs RIGHT */}
        <div className="grid grid-cols-2 gap-0 rounded-lg mb-6" style={{ background: '#253545' }}>
          <div className="pr-4 py-4 px-4" style={{ borderRight: '1px solid #2a3a4a' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <span className="text-[11px] font-bold text-[#60a5fa] uppercase tracking-[0.12em]">Left</span>
            </div>
            <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.left_narrative}</p>
          </div>
          <div className="pl-4 py-4 pr-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span className="text-[11px] font-bold text-[#f87171] uppercase tracking-[0.12em]">Right</span>
            </div>
            <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.right_narrative}</p>
          </div>
        </div>

        {/* UNFILTERED */}
        <div className="p-5 rounded-lg mb-6" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-[#b8860b] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">!</span>
            </div>
            <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">What They Aren&apos;t Telling You</span>
          </div>
          {sentences.length > 1 ? (
            <div className="space-y-2.5">
              {sentences.map((s, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="text-[12px] font-bold text-[#daa520] mt-0.5 shrink-0 w-4 text-right">{i + 1}.</span>
                  <p className="text-[13px] text-[#ccc] leading-[1.6]">{s}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#ccc] leading-[1.6]">{story.what_they_arent_telling_you}</p>
          )}
          {story.social_summary && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2a3a4a' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[14px]">💬</span>
                <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Social Pulse</span>
              </div>
              <p className="text-[13px] text-[#bbb] leading-[1.6] italic">{story.social_summary}</p>
            </div>
          )}
        </div>

        {/* X POSTS */}
        {xClips.filter(c => !(c as any).duration).length > 0 && (
          <div data-section="x-posts" className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[16px] font-bold text-white">𝕏</span>
              <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">What people are saying</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {xClips.filter(c => !(c as any).duration).map((c, i) => (
                c.embed_id ? (
                  <div key={i} className="rounded-md overflow-hidden relative" style={{ background: '#1e2a3a', height: 320 }}>
                    <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${c.embed_id}&theme=dark&dnt=true`}
                      className="absolute" style={{ border: 'none', top: -8, left: -8, right: -8, bottom: -8, width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }} loading="lazy" />
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}

        {/* TELEGRAM TEXT POSTS (non-video only — videos are in VideoGrid) */}
        {telegramClips.filter(c => c.embed_id && !c.duration).length > 0 && (
          <div data-section="telegram" className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0088cc"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37l-.53-.28z"/></svg>
              <span className="text-[11px] font-bold text-[#0088cc] uppercase tracking-[0.12em]">Telegram</span>
              <span className="text-[10px] text-[#666]">{telegramClips.filter(c => c.embed_id && !c.duration).length} posts</span>
            </div>
            <div className="space-y-0">
              {telegramClips.filter(c => c.embed_id && !c.duration).map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a3a4a] transition-colors group">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="#0088cc" className="shrink-0"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37l-.53-.28z"/></svg>
                  <span className="text-[12px] text-[#bbb] group-hover:text-white truncate flex-1">{c.title}</span>
                  <span className="text-[9px] text-[#0088cc] shrink-0">@{c.author}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* TIKTOK */}
        {tiktokClips.filter(c => c.embed_id).length > 0 && (
          <div className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[16px]">♪</span>
              <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">TikTok</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tiktokClips.filter(c => c.embed_id).map((c, i) => (
                <div key={i} className="rounded-md overflow-hidden flex justify-center" style={{ background: '#1e2a3a' }}>
                  <iframe src={`https://www.tiktok.com/embed/v2/${c.embed_id}`} className="h-[480px]" style={{ border: 'none', width: '100%' }} sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REELS */}
        {reelsClips.filter(c => c.embed_id).length > 0 && (
          <div className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[16px]">◎</span>
              <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">Reels</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {reelsClips.filter(c => c.embed_id).map((c, i) => (
                <div key={i} className="rounded-md overflow-hidden flex justify-center" style={{ background: '#1e2a3a' }}>
                  <iframe src={`https://www.instagram.com/reel/${c.embed_id}/embed`} className="h-[480px]" style={{ border: 'none', width: '100%' }} allowFullScreen />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REDDIT */}
        {redditClips.length > 0 && (() => {
          const seen = new Set<string>();
          const unique = redditClips.filter(c => { if (seen.has(c.url)) return false; seen.add(c.url); return true; });
          return (
            <div className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4500"><circle cx="12" cy="12" r="12"/><path d="M15.7 12.7c0-.6-.5-1-1-1s-1 .4-1 1c0 .5.4 1 1 1 .5 0 1-.5 1-1zm-5.4 0c0-.6-.5-1-1-1-.6 0-1 .4-1 1 0 .5.4 1 1 1 .5 0 1-.5 1-1zm2.7 2.7c-.7.7-2 .8-2.7.8h-.1c-.7 0-1.7-.1-2.4-.8-.1-.1-.3-.1-.4 0-.1.1-.1.3 0 .4.8.8 2 1 2.8 1h.1c.8 0 2-.2 2.8-1 .1-.1.1-.3 0-.4-.1-.1-.3-.1-.4 0z" fill="white"/></svg>
                <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">Reddit discussions</span>
              </div>
              <div className="space-y-0">
                {unique.map((c, i) => {
                  const title = c.title || c.url.replace(/.*\/comments\/\w+\//, '').replace(/\/$/, '').replace(/_/g, ' ').replace(/^\w/, (ch: string) => ch.toUpperCase());
                  return (
                    <a key={i} href={c.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a3a4a] transition-colors group">
                      <span className="w-[5px] h-[5px] rounded-full bg-[#ff4500] shrink-0" />
                      <span className="text-[12px] text-[#bbb] group-hover:text-white truncate flex-1">{title}</span>
                      <span className="text-[9px] text-[#777] shrink-0">r/{c.url.match(/\/r\/(\w+)/)?.[1] || 'reddit'}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ALL ARTICLES */}
        <div className="rounded-lg p-4" style={{ background: '#253545' }}>
          <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
            <span className="text-[10px] font-bold text-[#999] uppercase tracking-[0.12em]">All Articles</span>
            <span className="text-[11px] text-[#777]">{sources.length} sources</span>
            {leftSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#1d4ed8]" /><span className="text-[10px] text-[#1d4ed8]">{leftSources.length} left</span></span>}
            {rightSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#b91c1c]" /><span className="text-[10px] text-[#b91c1c]">{rightSources.length} right</span></span>}
            {centerSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#777]" /><span className="text-[10px] text-[#777]">{centerSources.length} center</span></span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leftSources.length > 0 && (
              <SourceColumn label="Left" sources={leftSources} color="#60a5fa" dotColor="#1d4ed8" />
            )}
            {centerSources.length > 0 && (
              <SourceColumn label="Center" sources={centerSources} color="#999" dotColor="#999" />
            )}
            {rightSources.length > 0 && (
              <SourceColumn label="Right" sources={rightSources} color="#f87171" dotColor="#f87171" />
            )}
          </div>
        </div>

        {/* AD — below all articles */}
        <div className="mt-6 rounded-lg overflow-hidden" style={{ background: '#1a2535', border: '1px solid #2a3a4a' }}>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[7px] text-white/20 uppercase tracking-wider">Sponsored</span>
          </div>
          <div className="w-full flex items-center justify-center p-2" style={{ minHeight: '90px' }}>
            <StoryAdSlot />
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryAdSlot() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch {}
  }, []);
  return (
    <div ref={ref} className="w-full">
      <ins className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-2572735826517528"
        data-ad-slot="8292849831"
        data-ad-format="horizontal"
        data-full-width-responsive="true" />
    </div>
  );
}

function SourceColumn({ label, sources, color, dotColor }: {
  label: string;
  sources: { name: string; url: string; title?: string }[];
  color: string;
  dotColor: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const grouped: Record<string, { name: string; url: string; title?: string }[]> = {};
  for (const s of sources) {
    if (!grouped[s.name]) grouped[s.name] = [];
    grouped[s.name].push(s);
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-[5px] h-[5px] rounded-full" style={{ background: dotColor }} />
        <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color }}>{label}</span>
      </div>
      <div className="space-y-0">
        {Object.entries(grouped).map(([name, articles]) => (
          <div key={name}>
            <button onClick={() => setExpanded(expanded === name ? null : name)}
              className="w-full text-left text-[12px] py-1 transition-colors hover:opacity-70 cursor-pointer flex items-center gap-1.5">
              <span className="text-[10px] text-[#777] shrink-0">{expanded === name ? '−' : '+'}</span>
              <span className="flex-1 text-[#bbb]">{name} {articles.length > 1 && <span className="text-[10px] text-[#777]">({articles.length})</span>}</span>
            </button>
            {expanded === name && (
              <div className="pl-5 mb-1 space-y-0.5">
                {articles.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer"
                    className="block text-[11px] text-[#999] py-0.5 transition-colors truncate hover:text-white">
                    {a.title || a.url.replace(/https?:\/\/(www\.)?/, '').slice(0, 50)} <span className="text-[10px] text-[#666]">&rarr;</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
