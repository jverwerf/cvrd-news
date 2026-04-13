"use client";

import { useState } from "react";
import { HorizontalAdBanner } from "./AdBanners";
import { Dashboard } from "./Dashboard";
import { ErrorBoundary } from "./ErrorBoundary";
import { VideoGrid } from "./VideoGrid";
import { OnRecordWidget } from "./OnRecordWidget";
import type { NarrativeGap } from "../lib/data";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

function topicToSlug(topic: string): string {
  return topic.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function toBullets(text: string): string[] {
  const raw = text.split(/\.\s+(?=[A-Z])/).map((s, i, arr) => i < arr.length - 1 ? s + '.' : s).filter(Boolean);
  const merged: string[] = [];
  let acc = '';
  for (const part of raw) {
    acc = acc ? acc + ' ' + part : part;
    if (acc.length >= 80) { merged.push(acc); acc = ''; }
  }
  if (acc) merged.push(acc);
  return merged;
}

export function StoryPage({ story, date, otherStories, matchedTimelines }: {
  story: NarrativeGap;
  date: string;
  otherStories: NarrativeGap[];
  matchedTimelines?: { id: string; title: string; image_file?: string }[];
}) {
  const [dashExpanded, setDashExpanded] = useState(false);
  const [tweetsExpanded, setTweetsExpanded] = useState(false);
  const [tiktoksExpanded, setTiktoksExpanded] = useState(false);
  const [telegramExpanded, setTelegramExpanded] = useState(false);
  const [redditExpanded, setRedditExpanded] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleSubscribe = async () => {
    if (!subEmail.includes('@') || subStatus !== 'idle') return;
    setSubStatus('loading');
    try {
      await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: subEmail }) });
      setSubStatus('done');
    } catch {
      setSubStatus('idle');
    }
  };

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

  const prev = () => {
    if (otherStories.length > 0) {
      window.location.href = `/story/${topicToSlug(otherStories[otherStories.length - 1].topic)}`;
    }
  };
  const next = () => {
    if (otherStories.length > 0) {
      window.location.href = `/story/${topicToSlug(otherStories[0].topic)}`;
    }
  };

  return (
    <div>
      {/* 1. Story cards — horizontal scroll row */}
      <div className="pt-6 pb-4" style={{ background: '#1e2a3a' }}>
        <div className="relative flex items-center gap-0">
          <button onClick={() => document.getElementById('story-cards')?.scrollBy({ left: -220, behavior: 'smooth' })}
            className="shrink-0 px-2 hover:opacity-70" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-white" />
          </button>
          <div id="story-cards" className="flex gap-3 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth' }}>
            <a href="/"
              className="shrink-0 w-[180px] md:w-[200px] text-left rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] block"
              style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
              <div className="h-28 flex items-center justify-center" style={{ background: '#1a1a2e' }}>
                <img src="/logo3.png" alt="" style={{ height: '32px', opacity: 0.5 }} />
              </div>
              <div className="p-2.5">
                <span className="text-[8px] font-bold text-[#daa520] uppercase tracking-[0.1em]">Daily</span>
                <p className="text-[11px] text-white font-medium leading-snug mt-0.5 group-hover:text-[#60a5fa] transition-colors">
                  Daily Pick
                </p>
              </div>
            </a>
            <a href="#"
              className="shrink-0 w-[180px] md:w-[200px] text-left rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] block"
              style={{ background: '#253545', border: '2px solid #2563eb' }}>
              <div className="h-28 overflow-hidden" style={{
                backgroundImage: story.image_file ? `url(${story.image_file})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                background: story.image_file ? undefined : '#152030',
              }}>
                {story.image_file
                  ? <div className="w-full h-full" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />
                  : <div className="w-full h-full flex items-center justify-center"><img src="/logo3.png" alt="" style={{ height: '28px', opacity: 0.2 }} /></div>
                }
              </div>
              <div className="p-2.5">
                <span className="text-[8px] font-bold text-[#3b82f6] uppercase tracking-[0.1em]">{story.category || 'News'}</span>
                <p className="text-[11px] text-white font-medium leading-snug line-clamp-2 mt-0.5 group-hover:text-[#60a5fa] transition-colors">
                  {story.topic}
                </p>
              </div>
            </a>
            {otherStories.map((s, i) => (
              <a key={i} href={`/story/${topicToSlug(s.topic)}`}
                className="shrink-0 w-[180px] md:w-[200px] text-left rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] block"
                style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                <div className="h-28 overflow-hidden" style={{
                  backgroundImage: s.image_file ? `url(${s.image_file})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  background: s.image_file ? undefined : '#152030',
                }}>
                  {s.image_file
                    ? <div className="w-full h-full" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />
                    : <div className="w-full h-full flex items-center justify-center"><img src="/logo3.png" alt="" style={{ height: '28px', opacity: 0.2 }} /></div>
                  }
                </div>
                <div className="p-2.5">
                  <span className="text-[8px] font-bold text-[#3b82f6] uppercase tracking-[0.1em]">{s.category || 'News'}</span>
                  <p className="text-[11px] text-white font-medium leading-snug line-clamp-2 mt-0.5 group-hover:text-[#60a5fa] transition-colors">
                    {s.topic}
                  </p>
                </div>
              </a>
            ))}
          </div>
          <button onClick={() => document.getElementById('story-cards')?.scrollBy({ left: 220, behavior: 'smooth' })}
            className="shrink-0 px-2 hover:opacity-70" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-white" />
          </button>
        </div>
      </div>

      {/* 2. ON AIR BANNER */}
      <div className="px-4 md:px-6 py-1 flex items-center gap-2" style={{ background: '#f5f5f5' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] md:text-[17px] text-[#1e2a3a] leading-tight tracking-[-0.02em]" style={serif}>
            On Air: <span className="text-[#666]">{story.topic}</span>
          </h1>
        </div>
        <a href="https://ko-fi.com/cvrdnews" target="_blank" rel="noreferrer"
          className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-medium hover:opacity-70 transition-opacity whitespace-nowrap"
          style={{ background: 'white', color: '#1e2a3a', border: '1px solid #e5e5e5' }}>
          ♥ Buy us a coffee
        </a>
        <button onClick={prev} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
          style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-[#1e2a3a]" />
        </button>
        <button onClick={next} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
          style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#1e2a3a]" />
        </button>
      </div>

      {/* 3. COMPACT DASHBOARD */}
      <div className="px-6 md:px-12 pt-4 pb-4" style={{ background: '#1e2a3a' }}>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a3a4a' }}>
          <div className="relative" style={{ height: dashExpanded ? 'calc(100vh - 120px)' : '420px', transition: 'height 0.4s ease' }}>
            <ErrorBoundary>
              <Dashboard key="dash-story" stories={[story]} videoUrl={undefined} videoDate={undefined} compact={!dashExpanded} />
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
          </div>
        </div>
        {dashExpanded && (
          <button onClick={() => setDashExpanded(false)}
            className="w-full mt-2 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
            style={{ background: '#253545', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
            Collapse Dashboard
          </button>
        )}
      </div>

      {/* 4. COVER THE NEWS BANNER */}
      <div className="px-4 md:px-6 py-1 flex items-center gap-2" style={{ background: '#f5f5f5' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] md:text-[17px] text-[#1e2a3a] leading-tight tracking-[-0.02em]" style={serif}>
            Cover The News
          </h1>
        </div>
        {subStatus === 'done' ? (
          <span className="shrink-0 text-[10px] font-medium text-[#1e2a3a]">Subscribed ✓</span>
        ) : (
          <div className="shrink-0 hidden sm:flex items-center gap-1">
            <input type="email" placeholder="your@email.com" value={subEmail} onChange={e => setSubEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
              className="text-[10px] px-2 py-1 rounded-full outline-none"
              style={{ background: 'white', border: '1px solid #e5e5e5', color: '#1e2a3a', width: 130 }} />
            <button onClick={handleSubscribe} disabled={subStatus === 'loading'}
              className="px-3 py-1 rounded-full text-[10px] font-medium hover:opacity-70 transition-opacity whitespace-nowrap"
              style={{ background: '#1e2a3a', color: 'white', border: 'none', cursor: 'pointer' }}>
              {subStatus === 'loading' ? '…' : 'Subscribe'}
            </button>
          </div>
        )}
        <button onClick={prev}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
          style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-[#1e2a3a]" />
        </button>
        <button onClick={next} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
          style={{ border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#1e2a3a]" />
        </button>
      </div>

      {/* 5. PICTURE HEADER */}
      {story.image_file && (
        <div className="relative overflow-hidden" style={{
          height: '30vh', minHeight: '220px',
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

      {/* FULL CONTENT */}
      <div className="px-6 md:px-12 pb-10 pt-5" style={{ background: '#1e2a3a' }}>

        {/* SUMMARY */}
        <div className="mb-6">
          <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3">Summary</h2>
          <div className="p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
            <p className="text-[13px] text-[#ccc] leading-[1.65]">{story.summary}</p>
          </div>
        </div>

        {/* VIDEO GRID */}
        {(ytVids.length > 0 || clips.filter(c => c.embed_id).length > 0) && (
          <div className="mb-5" data-section="videogrid">
            <VideoGrid youtubeVideos={ytVids} socialClips={clips} storyImage={story.image_file} storyIndex={1} />
          </div>
        )}

        {/* LEFT vs CENTER vs RIGHT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-lg mb-6" style={{ background: '#253545' }}>
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
          {story.center_narrative && (
            <div className="py-4 px-4 md:border-r md:border-b-0 border-b" style={{ borderColor: '#2a3a4a' }}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={(story.category === 'sports' || story.category === 'trending') ? '#c084fc' : '#a3a3a3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: (story.category === 'sports' || story.category === 'trending') ? '#c084fc' : '#a3a3a3' }}>
                  {(story.category === 'sports' || story.category === 'trending') ? 'Analysts' : 'Center'}
                </span>
              </div>
              <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.center_narrative}</p>
            </div>
          )}
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

        {/* BLINDSPOTS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#daa520] font-bold text-[13px] leading-none mr-1">—</span>
            <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Blindspots</span>
          </div>
          <div className="p-5 rounded-lg mb-6" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
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
          </div>
        </div>

        {/* SOCIAL PULSE */}
        {story.social_summary && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Social Pulse</span>
            </div>
            <div className="p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
              {(() => {
                const bullets = story.social_summary.split(/\.\s+(?=[A-Z])/).map((s: string, i: number, arr: string[]) => i < arr.length - 1 ? s + '.' : s).filter(Boolean);
                return bullets.length > 1 ? (
                  <ul className="space-y-1.5 list-none pl-0 m-0">
                    {bullets.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-[13px] text-[#bbb] leading-[1.6]">
                        <span className="text-[#daa520] shrink-0">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-[#bbb] leading-[1.6]">{story.social_summary}</p>
                );
              })()}
            </div>
          </div>
        )}

        {/* TIMELINE — thread this story belongs to */}
        {matchedTimelines && matchedTimelines.length > 0 && (() => {
          const thread = matchedTimelines[0];
          return (
            <div className="rounded-lg p-4 mb-6" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Timeline</span>
              </div>
              <a href={`/timeline?thread=${thread.id}`}
                className="flex items-center gap-3 p-2.5 rounded-md transition-opacity hover:opacity-80"
                style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                {thread.image_file && <img src={thread.image_file} alt={thread.title} className="w-10 h-10 rounded object-cover shrink-0" />}
                <span className="text-[12px] text-white font-semibold leading-[1.3]">{thread.title}</span>
                <svg className="ml-auto shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
          );
        })()}

        {/* ON RECORD — politician matches */}
        {(story as any).onrecord_matches?.length > 0 && (
          <OnRecordWidget matches={(story as any).onrecord_matches} />
        )}

        {/* X POSTS */}
        {(() => {
          const textTweets = xClips.filter(c => !(c as any).duration && c.embed_id);
          if (textTweets.length === 0) return null;
          const visibleTweets = tweetsExpanded ? textTweets : textTweets.slice(0, 6);
          return (
            <div data-section="x-posts" className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[16px] font-bold text-white">𝕏</span>
              </div>
              <div className="rounded-lg p-4" style={{ background: '#253545' }}>
                <div className="grid grid-cols-4 gap-2">
                  {visibleTweets.map((c, i) => (
                    <div key={i} className="rounded overflow-hidden relative" style={{ background: '#1e2a3a', height: 90 }}>
                      <div className="absolute" style={{ top: 0, left: 0, width: '125%', height: '125%', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                        <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${c.embed_id}&theme=dark&dnt=true`}
                          style={{ border: 'none', width: '100%', height: '100%' }} loading="lazy" />
                      </div>
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
                {tweetsExpanded && textTweets.length > 6 && (
                  <button onClick={() => setTweetsExpanded(false)}
                    className="w-full mt-3 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
                    style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
                    Show less
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* TIKTOK */}
        {(() => {
          const allTiktoks = tiktokClips.filter(c => c.embed_id);
          if (allTiktoks.length === 0) return null;
          const visibleTiktoks = tiktoksExpanded ? allTiktoks : allTiktoks.slice(0, 6);
          return (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[16px]">♪</span>
                <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">TikTok</span>
              </div>
              <div className="rounded-lg p-4" style={{ background: '#253545' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {visibleTiktoks.map((c, i) => (
                    <div key={i} className="rounded-md overflow-hidden flex justify-center" style={{ background: '#1e2a3a' }}>
                      <iframe src={`https://www.tiktok.com/embed/v2/${c.embed_id}`} className="h-[480px]" style={{ border: 'none', width: '100%' }} sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" loading="lazy" />
                    </div>
                  ))}
                </div>
                {allTiktoks.length > 6 && !tiktoksExpanded && (
                  <button onClick={() => setTiktoksExpanded(true)}
                    className="w-full mt-3 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
                    style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
                    Show {allTiktoks.length - 6} more TikToks
                  </button>
                )}
                {tiktoksExpanded && allTiktoks.length > 6 && (
                  <button onClick={() => setTiktoksExpanded(false)}
                    className="w-full mt-3 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
                    style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
                    Show less
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* TELEGRAM TEXT POSTS */}
        {(() => {
          const tgClips = telegramClips.filter(c => c.embed_id && !c.duration);
          if (tgClips.length === 0) return null;
          const visibleTg = telegramExpanded ? tgClips : tgClips.slice(0, 9);
          return (
            <div data-section="telegram">
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0088cc"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37l-.53-.28z"/></svg>
                <span className="text-[11px] font-bold text-[#0088cc] uppercase tracking-[0.12em]">Telegram</span>
              </div>
              <div className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {visibleTg.map((c, i) => (
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
                {tgClips.length > 9 && !telegramExpanded && (
                  <button onClick={() => setTelegramExpanded(true)}
                    className="w-full mt-3 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
                    style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
                    Show {tgClips.length - 9} more
                  </button>
                )}
                {telegramExpanded && tgClips.length > 9 && (
                  <button onClick={() => setTelegramExpanded(false)}
                    className="w-full mt-3 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
                    style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
                    Show less
                  </button>
                )}
              </div>
            </div>
          );
        })()}

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
          const visibleReddit = redditExpanded ? unique : unique.slice(0, 9);
          return (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4500"><circle cx="12" cy="12" r="12"/><path d="M15.7 12.7c0-.6-.5-1-1-1s-1 .4-1 1c0 .5.4 1 1 1 .5 0 1-.5 1-1zm-5.4 0c0-.6-.5-1-1-1-.6 0-1 .4-1 1 0 .5.4 1 1 1 .5 0 1-.5 1-1zm2.7 2.7c-.7.7-2 .8-2.7.8h-.1c-.7 0-1.7-.1-2.4-.8-.1-.1-.3-.1-.4 0-.1.1-.1.3 0 .4.8.8 2 1 2.8 1h.1c.8 0 2-.2 2.8-1 .1-.1.1-.3 0-.4-.1-.1-.3-.1-.4 0z" fill="white"/></svg>
                <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">Reddit Discussions</span>
              </div>
              <div className="rounded-lg p-4 mb-3" style={{ background: '#253545' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {visibleReddit.map((c, i) => {
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
                {unique.length > 9 && !redditExpanded && (
                  <button onClick={() => setRedditExpanded(true)}
                    className="w-full mt-3 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
                    style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
                    Show {unique.length - 9} more
                  </button>
                )}
                {redditExpanded && unique.length > 9 && (
                  <button onClick={() => setRedditExpanded(false)}
                    className="w-full mt-3 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
                    style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
                    Show less
                  </button>
                )}
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
              {centerSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#777]" /><span className="text-[10px] text-[#777]">{centerSources.length} center</span></span>}
              {rightSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#b91c1c]" /><span className="text-[10px] text-[#b91c1c]">{rightSources.length} right</span></span>}
            </>}
          </div>
          {(story.category === 'sports' || story.category === 'trending') ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(() => {
                const allSrc = [...leftSources, ...centerSources, ...rightSources];
                const third = Math.ceil(allSrc.length / 3);
                return [allSrc.slice(0, third), allSrc.slice(third, third * 2), allSrc.slice(third * 2)].map((col, ci) => (
                  <SourceColumn key={ci} label={ci === 0 ? 'Media' : ci === 1 ? 'Coverage' : 'More'} sources={col} color="#999" dotColor="#999" />
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
            </div>
          )}
        </div>

        {/* AD — below all articles */}
        <div className="mt-6">
          <p className="text-[7px] text-white/25 uppercase tracking-widest mb-1.5">Sponsored</p>
          <div style={{ height: 90, borderRadius: 8, overflow: 'hidden' }}>
            <HorizontalAdBanner />
          </div>
        </div>
      </div>
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
    // Extract outlet name — strip article title after " — " or " - "
    const outlet = s.name.split(/\s[—–-]\s/)[0].trim() || s.name;
    if (!grouped[outlet]) grouped[outlet] = [];
    grouped[outlet].push(s);
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
