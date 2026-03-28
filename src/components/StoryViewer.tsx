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

  // For sports/trending: include TikTok and prioritize it. For other categories: exclude TikTok.
  const isFanCategory = stories.some(s => s.category === 'sports' || s.category === 'trending');

  for (const s of stories) {
    // Best YouTube video per story (first one, already sorted by relevance)
    const ytList = s.youtube_videos || [];
    if (ytList.length > 0) bestYT.push(ytList[0]);

    // Best 2 social clips per story
    const social = (s.social_clips || []).filter(c => c.embed_id && (isFanCategory || c.platform !== 'tiktok'));
    const videoClips = isFanCategory
      ? social.filter(c => c.platform === 'tiktok' || c.platform === 'telegram' || (c.platform === 'x' && (c as any).duration))
      : social.filter(c => c.platform === 'telegram' || (c.platform === 'x' && (c as any).duration));
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

  // If all stories share the same category, inherit it for the brief (so Media/Fans labels work)
  const sharedCategory = stories.every(s => s.category === stories[0]?.category) ? stories[0]?.category : undefined;

  const briefStory: NarrativeGap = {
    topic: 'Daily Brief',
    category: sharedCategory,
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

  const [dashExpanded, setDashExpanded] = useState(false);
  const [tweetsExpanded, setTweetsExpanded] = useState(false);
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
      {/* BRIEF MODE: cards → brief banner → summary → dashboard → video picks */}
      {isBrief ? (
        <>
          {/* 1. TODAY'S TOP STORIES — cards grid */}
          <div className="px-6 md:px-12 pt-6 pb-4" style={{ background: '#1e2a3a' }}>
            <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-4">Today&apos;s Top Stories</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {stories.map((s, i) => (
                <button key={i} onClick={() => setCurrentIdx(i)}
                  className="text-left rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                  {s.image_file && (
                    <div className="h-28 overflow-hidden" style={{
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

          {/* 2. ON AIR BANNER */}
          <div className="px-4 md:px-6 py-2.5 flex items-center gap-3" style={{ background: '#f5f5f5' }}>
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] md:text-[22px] text-[#1e2a3a] leading-tight tracking-[-0.02em]" style={serif}>
                On Air
              </h1>
            </div>
            <button onClick={() => setCurrentIdx(0)}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
              style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[#1e2a3a]" />
            </button>
          </div>

          {/* 3. ON AIR — COMPACT DASHBOARD */}
          <div className="px-6 md:px-12 pt-4 pb-4" style={{ background: '#1e2a3a' }}>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a3a4a' }}>
              <div className="relative" style={{ height: dashExpanded ? 'calc(100vh - 120px)' : '420px', transition: 'height 0.4s ease' }}>
                <ErrorBoundary>
                  <Dashboard key="dash-brief" stories={[briefStory]} videoUrl={undefined} videoDate={undefined} />
                </ErrorBoundary>
                {!dashExpanded && (
                  <div className="absolute inset-x-0 bottom-0 h-20 flex items-end justify-center pb-3" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))' }}>
                    <button onClick={() => setDashExpanded(true)}
                      className="px-4 py-2 rounded-full text-[11px] font-semibold text-white transition-all hover:scale-105"
                      style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                      Expand Dashboard
                    </button>
                  </div>
                )}
                {dashExpanded && (
                  <div className="absolute top-3 right-3 z-40">
                    <button onClick={() => setDashExpanded(false)}
                      className="px-4 py-2 rounded-full text-[11px] font-semibold text-white transition-all hover:scale-105"
                      style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                      Collapse Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. DAILY BRIEF BANNER */}
          <div className="px-4 md:px-6 py-2.5 flex items-center gap-3" style={{ background: '#f5f5f5' }}>
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] md:text-[22px] text-[#1e2a3a] leading-tight tracking-[-0.02em]" style={serif}>
                {sharedCategory ? `${sharedCategory.charAt(0).toUpperCase() + sharedCategory.slice(1)} Brief` : 'Daily Brief'}
              </h1>
            </div>
            <button onClick={() => setCurrentIdx(0)}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
              style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[#1e2a3a]" />
            </button>
          </div>

          {/* 5. SUMMARY + LEFT/RIGHT + MISSING + SOCIAL PULSE */}
          <div className="px-6 md:px-12 pt-5 pb-4" style={{ background: '#1e2a3a' }}>
            <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3">Summary</h2>
            <div className="mb-5 p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
              <p className="text-[15px] text-[#ccc] leading-[1.75] italic">{story.summary}</p>
            </div>

            <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3">Our Pick of Videos</h2>
            <div className="mb-5">
              <VideoGrid youtubeVideos={bestYT} socialClips={bestSocial} storyImage={undefined} storyIndex={0} />
            </div>

            <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3">The Narrative Gap</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-lg mb-5" style={{ background: '#253545' }}>
              <div className="py-4 px-4 md:border-r md:border-b-0 border-b" style={{ borderColor: '#2a3a4a' }}>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={(story.category === 'sports' || story.category === 'trending') ? '#f59e0b' : '#60a5fa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: (story.category === 'sports' || story.category === 'trending') ? '#f59e0b' : '#60a5fa' }}>
                    {(story.category === 'sports' || story.category === 'trending') ? 'Media' : 'Left'}
                  </span>
                </div>
                <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.left_narrative}</p>
              </div>
              <div className="py-4 px-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={(story.category === 'sports' || story.category === 'trending') ? '#34d399' : '#f87171'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: (story.category === 'sports' || story.category === 'trending') ? '#34d399' : '#f87171' }}>
                    {(story.category === 'sports' || story.category === 'trending') ? 'Fans' : 'Right'}
                  </span>
                </div>
                <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.right_narrative}</p>
              </div>
            </div>

            {story.what_they_arent_telling_you && (
              <div className="p-5 rounded-lg mb-5" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#daa520] font-bold text-[13px] leading-none mr-1">—</span>
                  <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Missing in the Media</span>
                </div>
                <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.what_they_arent_telling_you}</p>
              </div>
            )}

            {story.social_summary && (
              <div className="p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Social Pulse</span>
                </div>
                <p className="text-[13px] text-[#bbb] leading-[1.6] italic">{story.social_summary}</p>
              </div>
            )}
          </div>

          {/* CURATED SOCIAL — GPT-picked best tweets/reddit/telegram */}
          {resolvedBrief?.curated_social && resolvedBrief.curated_social.length > 0 && (
            <div className="px-6 md:px-12 pb-3" style={{ background: '#1e2a3a' }}>
              <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3">The Social Wire</h2>

              {/* Tweets */}
              {resolvedBrief.curated_social.filter((p: any) => p.platform === 'x' && p.embed_id).length > 0 && (
                <div className="rounded-lg p-4 mb-4" style={{ background: '#253545' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[16px] font-bold text-white">𝕏</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {resolvedBrief.curated_social.filter((p: any) => p.platform === 'x' && p.embed_id).map((c: any, i: number) => (
                      <div key={i} className="rounded-md overflow-hidden relative" style={{ background: '#1e2a3a', height: 160 }}>
                        <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${c.embed_id}&theme=dark&dnt=true`}
                          className="absolute" style={{ border: 'none', top: -8, left: -8, right: -8, bottom: -8, width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }} loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Telegram */}
              {resolvedBrief.curated_social.filter((p: any) => p.platform === 'telegram').length > 0 && (
                <div className="rounded-lg p-4 mb-4" style={{ background: '#253545' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0088cc"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37l-.53-.28z"/></svg>
                    <span className="text-[11px] font-bold text-[#0088cc] uppercase tracking-[0.12em]">Telegram</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resolvedBrief.curated_social.filter((p: any) => p.platform === 'telegram').map((c: any, i: number) => (
                      <a key={i} href={c.url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity min-w-0"
                        style={{ background: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)' }}>
                        <span className="text-[11px] text-[#bbb] truncate">{c.title}</span>
                        <span className="text-[9px] text-[#0088cc] shrink-0">@{c.author}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reddit */}
              {resolvedBrief.curated_social.filter((p: any) => p.platform === 'reddit').length > 0 && (
                <div className="rounded-lg p-4" style={{ background: '#253545' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4500"><circle cx="12" cy="12" r="12"/><path d="M15.7 12.7c0-.6-.5-1-1-1s-1 .4-1 1c0 .5.4 1 1 1 .5 0 1-.5 1-1zm-5.4 0c0-.6-.5-1-1-1-.6 0-1 .4-1 1 0 .5.4 1 1 1 .5 0 1-.5 1-1zm2.7 2.7c-.7.7-2 .8-2.7.8h-.1c-.7 0-1.7-.1-2.4-.8-.1-.1-.3-.1-.4 0-.1.1-.1.3 0 .4.8.8 2 1 2.8 1h.1c.8 0 2-.2 2.8-1 .1-.1.1-.3 0-.4-.1-.1-.3-.1-.4 0z" fill="white"/></svg>
                    <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">Reddit</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resolvedBrief.curated_social.filter((p: any) => p.platform === 'reddit').map((c: any, i: number) => (
                      <a key={i} href={c.url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity min-w-0"
                        style={{ background: 'rgba(255,69,0,0.15)', border: '1px solid rgba(255,69,0,0.3)' }}>
                        <span className="text-[11px] text-[#bbb] truncate">{c.title}</span>
                        <span className="text-[9px] text-[#ff4500] shrink-0">r/{c.url?.match(/\/r\/(\w+)/)?.[1] || 'reddit'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* STORY MODE: Picture → On Air → Dashboard → Topic Banner → Content */
        <>
          {/* 1. PICTURE HEADER */}
          {story.image_file && (
            <div className="relative overflow-hidden" style={{
              height: '35vh', minHeight: '250px',
              backgroundImage: `url(${story.image_file})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 60%, rgba(0,0,0,0.3) 100%)' }} />
              <div className="absolute top-0 left-0 px-6 md:px-12 pt-5">
                {story.category && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded mb-2 inline-block" style={{ background: 'rgba(37,99,235,0.5)', color: '#fff' }}>
                    {story.category}
                  </span>
                )}
                <h1 className="text-[24px] md:text-[28px] text-white leading-tight tracking-[-0.02em]" style={serif}>
                  {story.topic}
                </h1>
              </div>
            </div>
          )}

          {/* 2. STORY THUMBNAIL STRIP */}
          <div className="flex items-center gap-0 px-1 py-1.5" style={{ background: '#111' }}>
          <style>{`
            .story-thumb-nav:hover { width: 280px !important; opacity: 1 !important; }
            .story-thumb-nav:hover .story-thumb-nav-img { height: 100px !important; }
            .story-thumb-nav:hover .story-thumb-nav-label { font-size: 11px !important; line-height: 1.3 !important; }
          `}</style>
            <button onClick={() => {
              document.getElementById('story-nav-strip')?.scrollBy({ left: -200, behavior: 'smooth' });
            }} className="shrink-0 px-1 hover:opacity-70" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[5px] border-r-[#666]" />
            </button>
            <div id="story-nav-strip" className="flex gap-1 overflow-x-auto flex-1 items-end" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => setCurrentIdx(-1)}
                className="story-thumb-nav shrink-0 rounded overflow-hidden cursor-pointer"
                style={{ width: '100px', border: '2px solid transparent', opacity: 0.75, transition: 'width 0.3s ease, opacity 0.2s ease' }}>
                <div className="story-thumb-nav-img relative overflow-hidden flex items-center justify-center" style={{ height: '56px', transition: 'height 0.3s ease', background: '#1a1a2e' }}>
                  <img src="/logo3.png" alt="" style={{ height: '28px', opacity: 0.4 }} />
                  <div className="absolute inset-0 flex items-end p-1" style={{ background: 'linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.8) 100%)' }}>
                    <span className="story-thumb-nav-label text-[7px] text-white font-bold leading-tight" style={{ transition: 'font-size 0.3s ease' }}>Home</span>
                  </div>
                </div>
              </button>
              {stories.map((s, i) => (
                <button key={i} onClick={() => setCurrentIdx(i)}
                  className="story-thumb-nav shrink-0 rounded overflow-hidden cursor-pointer"
                  style={{
                    width: '100px',
                    border: i === currentIdx ? '2px solid #2563eb' : '2px solid transparent',
                    opacity: i === currentIdx ? 1 : 0.75,
                    transition: 'width 0.3s ease, opacity 0.2s ease',
                  }}>
                  <div className="story-thumb-nav-img relative overflow-hidden" style={{ height: '56px', transition: 'height 0.3s ease',
                    backgroundImage: s.image_file ? `url(${s.image_file})` : 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}>
                    <div className="absolute inset-0 flex items-end p-1" style={{ background: 'linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.8) 100%)' }}>
                      <span className="story-thumb-nav-label text-[7px] text-white font-medium leading-tight line-clamp-2" style={{ transition: 'font-size 0.3s ease' }}>{s.topic}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => {
              document.getElementById('story-nav-strip')?.scrollBy({ left: 200, behavior: 'smooth' });
            }} className="shrink-0 px-1 hover:opacity-70" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[5px] border-l-[#666]" />
            </button>
          </div>

          {/* 3. ON AIR BANNER */}
          <div className="px-4 md:px-6 py-2.5 flex items-center gap-3" style={{ background: '#f5f5f5' }}>
            <button onClick={prev} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
              style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-[#1e2a3a]" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] md:text-[22px] text-[#1e2a3a] leading-tight tracking-[-0.02em]" style={serif}>
                On Air
              </h1>
            </div>
            <button onClick={next} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
              style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[#1e2a3a]" />
            </button>
          </div>

          {/* 3. COMPACT DASHBOARD */}
          <div className="px-6 md:px-12 pt-4 pb-4" style={{ background: '#1e2a3a' }}>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a3a4a' }}>
              <div className="relative" style={{ height: dashExpanded ? 'calc(100vh - 120px)' : '420px', transition: 'height 0.4s ease' }}>
                <ErrorBoundary>
                  <Dashboard key={`dash-${currentIdx}`} stories={[story]} videoUrl={undefined} videoDate={undefined} />
                </ErrorBoundary>
                {!dashExpanded && (
                  <div className="absolute inset-x-0 bottom-0 h-20 flex items-end justify-center pb-3" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))' }}>
                    <button onClick={() => setDashExpanded(true)}
                      className="px-4 py-2 rounded-full text-[11px] font-semibold text-white transition-all hover:scale-105"
                      style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                      Expand Dashboard
                    </button>
                  </div>
                )}
                {dashExpanded && (
                  <div className="absolute top-3 right-3 z-40">
                    <button onClick={() => setDashExpanded(false)}
                      className="px-4 py-2 rounded-full text-[11px] font-semibold text-white transition-all hover:scale-105"
                      style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                      Collapse Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. TOPIC BANNER */}
          <div className="px-4 md:px-6 py-2.5 flex items-center gap-3" style={{ background: '#f5f5f5' }}>
            <button onClick={prev} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
              style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-[#1e2a3a]" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#1e2a3a] bg-[#1e2a3a]/10 px-2 py-0.5 rounded uppercase tracking-[0.1em] shrink-0">
                  {currentIdx + 1}/{stories.length}
                </span>
                <h1 className="text-[18px] md:text-[22px] text-[#1e2a3a] leading-tight tracking-[-0.02em] truncate" style={serif}>
                  {story.topic}
                </h1>
              </div>
            </div>
            <button onClick={next} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
              style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[#1e2a3a]" />
            </button>
          </div>
        </>
      )}

      {/* STORY THUMBNAIL STRIP — hide (navigation is in banners now) */}
      {false && (
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

      {/* BANNER with navigation — hide (now in story mode section above) */}
      {false && <div className="px-4 md:px-6 py-2.5 flex items-center gap-3" style={{ background: '#f5f5f5' }}>
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
      </div>}

      {/* IMAGE — now handled in story mode section above */}

      {/* FULL CONTENT */}
      <div className={`px-6 md:px-12 pb-10 ${isBrief ? 'pt-0' : 'pt-5'}`} style={{ background: '#1e2a3a' }}>

        {/* SUMMARY — hide in brief mode */}
        {!isBrief && <div className="mb-6 p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <p className="text-[15px] text-[#ccc] leading-[1.75] italic">{story.summary}</p>
        </div>}

        {/* VIDEO GRID — hide in brief mode (Our Pick of Videos shown above) */}
        {!isBrief && (ytVids.length > 0 || clips.filter(c => c.embed_id).length > 0) && (
          <div className="mb-5" data-section="videogrid">
            <VideoGrid youtubeVideos={ytVids} socialClips={clips} storyImage={story.image_file} storyIndex={currentIdx + 1} />
          </div>
        )}

        {/* LEFT vs RIGHT + UNFILTERED + SOCIAL PULSE — hide in brief mode */}
        {!isBrief && <><div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-lg mb-6" style={{ background: '#253545' }}>
          <div className="py-4 px-4 md:border-r md:border-b-0 border-b" style={{ borderColor: '#2a3a4a' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={(story.category === 'sports' || story.category === 'trending') ? '#f59e0b' : '#60a5fa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: (story.category === 'sports' || story.category === 'trending') ? '#f59e0b' : '#60a5fa' }}>
                {(story.category === 'sports' || story.category === 'trending') ? 'Media' : 'Left'}
              </span>
            </div>
            <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.left_narrative}</p>
          </div>
          <div className="py-4 px-4">
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={(story.category === 'sports' || story.category === 'trending') ? '#34d399' : '#f87171'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: (story.category === 'sports' || story.category === 'trending') ? '#34d399' : '#f87171' }}>
                {(story.category === 'sports' || story.category === 'trending') ? 'Fans' : 'Right'}
              </span>
            </div>
            <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.right_narrative}</p>
          </div>
        </div>

        {/* UNFILTERED */}
        <div className="p-5 rounded-lg mb-6" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#daa520] font-bold text-[13px] leading-none mr-1">—</span>
            <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Missing in the Media</span>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Social Pulse</span>
              </div>
              <p className="text-[13px] text-[#bbb] leading-[1.6] italic">{story.social_summary}</p>
            </div>
          )}
        </div></>}

        {/* X POSTS — hide in brief mode (The Social Wire shown above) */}
        {!isBrief && (() => {
          const textTweets = xClips.filter(c => !(c as any).duration && c.embed_id);
          if (textTweets.length === 0) return null;
          const visibleTweets = tweetsExpanded ? textTweets : textTweets.slice(0, 6);
          return (
            <div data-section="x-posts" className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[16px] font-bold text-white">𝕏</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {visibleTweets.map((c, i) => (
                  <div key={i} className="rounded-md overflow-hidden relative" style={{ background: '#1e2a3a', height: 160 }}>
                    <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${c.embed_id}&theme=dark&dnt=true`}
                      className="absolute" style={{ border: 'none', top: -8, left: -8, right: -8, bottom: -8, width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }} loading="lazy" />
                  </div>
                ))}
              </div>
              {textTweets.length > 6 && !tweetsExpanded && (
                <button onClick={() => setTweetsExpanded(true)}
                  className="w-full mt-3 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
                  style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
                  Show {textTweets.length - 6} more tweets
                </button>
              )}
            </div>
          );
        })()}

        {/* TIKTOK — before Telegram */}
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

        {/* TELEGRAM TEXT POSTS — hide in brief mode */}
        {!isBrief && telegramClips.filter(c => c.embed_id && !c.duration).length > 0 && (
          <div data-section="telegram" className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0088cc"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37l-.53-.28z"/></svg>
              <span className="text-[11px] font-bold text-[#0088cc] uppercase tracking-[0.12em]">Telegram</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {telegramClips.filter(c => c.embed_id && !c.duration).map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer"
                  className="rounded-lg p-3 hover:opacity-80 transition-opacity block"
                  style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                  <div className="flex items-start gap-2">
                    <span className="w-[6px] h-[6px] rounded-full mt-1.5 shrink-0" style={{ background: '#0088cc' }} />
                    <div className="min-w-0">
                      <p className="text-[12px] text-[#ccc] leading-snug line-clamp-2">{c.title}</p>
                      <span className="text-[10px] text-[#0088cc] mt-1 block">@{c.author}</span>
                    </div>
                  </div>
                </a>
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

        {/* REDDIT — hide in brief mode */}
        {!isBrief && redditClips.length > 0 && (() => {
          const seen = new Set<string>();
          const unique = redditClips.filter(c => { if (seen.has(c.url)) return false; seen.add(c.url); return true; });
          return (
            <div className="rounded-lg p-4 mb-3" style={{ background: '#253545' }}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4500"><circle cx="12" cy="12" r="12"/><path d="M15.7 12.7c0-.6-.5-1-1-1s-1 .4-1 1c0 .5.4 1 1 1 .5 0 1-.5 1-1zm-5.4 0c0-.6-.5-1-1-1-.6 0-1 .4-1 1 0 .5.4 1 1 1 .5 0 1-.5 1-1zm2.7 2.7c-.7.7-2 .8-2.7.8h-.1c-.7 0-1.7-.1-2.4-.8-.1-.1-.3-.1-.4 0-.1.1-.1.3 0 .4.8.8 2 1 2.8 1h.1c.8 0 2-.2 2.8-1 .1-.1.1-.3 0-.4-.1-.1-.3-.1-.4 0z" fill="white"/></svg>
                <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">Reddit Discussions</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {unique.map((c, i) => {
                  const title = c.title || c.url.replace(/.*\/comments\/\w+\//, '').replace(/\/$/, '').replace(/_/g, ' ').replace(/^\w/, (ch: string) => ch.toUpperCase());
                  return (
                    <a key={i} href={c.url} target="_blank" rel="noreferrer"
                      className="rounded-lg p-3 hover:opacity-80 transition-opacity block"
                      style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                      <div className="flex items-start gap-2">
                        <span className="w-[6px] h-[6px] rounded-full mt-1.5 shrink-0" style={{ background: '#ff4500' }} />
                        <div className="min-w-0">
                          <p className="text-[12px] text-[#ccc] leading-snug line-clamp-2">{title}</p>
                          <span className="text-[10px] text-[#666] mt-1 block">r/{c.url.match(/\/r\/(\w+)/)?.[1] || 'reddit'}</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* DIVE DEEPER */}
        <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3 mt-1">Dive Deeper</h2>
        <div className="rounded-lg p-4" style={{ background: '#253545' }}>
          <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
            <span className="text-[10px] font-bold text-[#999] uppercase tracking-[0.12em]">All Articles</span>
            <span className="text-[11px] text-[#777]">{sources.length} sources</span>
            {!(story.category === 'sports' || story.category === 'trending') && <>
              {leftSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#1d4ed8]" /><span className="text-[10px] text-[#1d4ed8]">{leftSources.length} left</span></span>}
              {rightSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#b91c1c]" /><span className="text-[10px] text-[#b91c1c]">{rightSources.length} right</span></span>}
              {centerSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#777]" /><span className="text-[10px] text-[#777]">{centerSources.length} center</span></span>}
            </>}
          </div>
          {(story.category === 'sports' || story.category === 'trending') ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(() => {
                const allSrc = [...leftSources, ...centerSources, ...rightSources];
                const grouped: Record<string, typeof allSrc> = {};
                for (const s of allSrc) { if (!grouped[s.name]) grouped[s.name] = []; grouped[s.name].push(s); }
                const entries = Object.entries(grouped);
                const third = Math.ceil(entries.length / 3);
                return [entries.slice(0, third), entries.slice(third, third * 2), entries.slice(third * 2)].map((col, ci) => (
                  <div key={ci} className="space-y-0">
                    {col.map(([name, articles]) => (
                      <div key={name} className="text-[12px] py-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-[#777] shrink-0">+</span>
                        <span className="text-[#bbb]">{name} {articles.length > 1 && <span className="text-[10px] text-[#777]">({articles.length})</span>}</span>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          ) : (
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
          </div>)}
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
