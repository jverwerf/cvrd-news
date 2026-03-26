"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tweet } from 'react-tweet';
import Image from 'next/image';
import type { NarrativeGap } from "../lib/data";
import { VideoGrid } from "./VideoGrid";
import { Dashboard } from "./Dashboard";
import { ErrorBoundary } from "./ErrorBoundary";
import { OnRecordWidget } from "./OnRecordWidget";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

export function HeroStory({ story, hideBanner, storyIndex = 1 }: { story: NarrativeGap; hideBanner?: boolean; storyIndex?: number }) {
  const [open, setOpen] = useState(false);

  // Listen for expand-story events from StoryNav
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === storyIndex) setOpen(true);
    };
    window.addEventListener('expand-story', handler);
    return () => window.removeEventListener('expand-story', handler);
  }, [storyIndex]);

  const clips = story.social_clips || [];
  const ytVids = story.youtube_videos || [];
  const sources = story.sources || [];
  const xClips = clips.filter(c => c.platform === 'x');
  const tiktokClips = clips.filter(c => c.platform === 'tiktok');
  const reelsClips = clips.filter(c => c.platform === 'reels');
  const redditClips = clips.filter(c => c.platform === 'reddit');
  const leftSources = sources.filter(s => s.lean === 'left');
  const rightSources = sources.filter(s => s.lean === 'right');
  const centerSources = sources.filter(s => !s.lean || s.lean === 'center');

  // Unique source names for the visible row
  const uniqueLeft = [...new Set(leftSources.map(s => s.name))];
  const uniqueRight = [...new Set(rightSources.map(s => s.name))];
  const uniqueCenter = [...new Set(centerSources.map(s => s.name))];

  // Split on sentence boundaries but not abbreviations like U.S., Dr., Mr., etc.
  const sentences = story.what_they_arent_telling_you
    ?.split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter(s => s.trim().length > 20) || []; // filter out junk fragments

  return (
    <section id="story-1">

      {/* 1. WHITE BANNER — story title (hidden when parent provides its own banner) */}
      {!hideBanner && (
        <div className="px-6 md:px-12 py-3 flex items-center gap-3" style={{ background: '#f5f5f5' }}>
          <span className="text-[10px] font-bold text-[#1e2a3a] bg-[#1e2a3a]/10 px-2 py-0.5 rounded uppercase tracking-[0.1em]">Top Story</span>
          <h1 className="text-[18px] md:text-[22px] text-[#1e2a3a] leading-tight tracking-[-0.02em] flex-1 truncate" style={serif}>
            {story.topic}
          </h1>
        </div>
      )}

      {/* 2. IMAGE */}
      {story.image_file && (
        <div className="relative overflow-hidden" style={{
          height: '45vh', minHeight: '320px',
          backgroundImage: `url(${story.image_file})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)' }} />
        </div>
      )}

      {/* 3. REST — dashboard, summary, video grid, etc */}
      <div className="px-6 md:px-12 pb-10 pt-5" style={{ background: '#1e2a3a' }}>

      {/* SUMMARY */}
      <div className="mb-6 p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
        <p className="text-[15px] text-[#ccc] leading-[1.75] italic">
          {story.summary}
        </p>
      </div>

      {/* 4. VIDEO GRID — dashboard style */}
      {(ytVids.length > 0 || clips.filter(c => c.embed_id).length > 0) && (
        <VideoGrid youtubeVideos={ytVids} socialClips={clips} storyImage={story.image_file} storyIndex={1} />
      )}

      {/* 5. EXPAND */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-2.5 text-[12px] font-semibold rounded-md mb-2 transition-colors cursor-pointer"
        style={{
          color: open ? '#999' : '#b8860b',
          background: open ? '#253545' : '#253040',
          border: `1px solid ${open ? '#3a4a5a' : 'rgba(184,134,11,0.3)'}`,
        }}>
        {open ? 'Collapse ↑' : 'Cover the news ↓'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="space-y-6 pt-4">

              {/* LEFT vs RIGHT (or Media vs Fans for sports) */}
              {(story.left_narrative || story.right_narrative) && (
                <div className="grid grid-cols-2 gap-0 rounded-lg" style={{ background: '#253545' }}>
                  {story.left_narrative && (
                    <div className="pr-4 py-4 px-4" style={{ borderRight: '1px solid #2a3a4a' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={((story as any).category === 'sports' || (story as any).category === 'culture') ? '#f59e0b' : '#60a5fa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: ((story as any).category === 'sports' || (story as any).category === 'culture') ? '#f59e0b' : '#60a5fa' }}>
                          {((story as any).category === 'sports' || (story as any).category === 'culture') ? 'Media' : 'Left'}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.left_narrative}</p>
                    </div>
                  )}
                  {story.right_narrative && (
                    <div className="pl-4 py-4 pr-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={((story as any).category === 'sports' || (story as any).category === 'culture') ? '#34d399' : '#f87171'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: ((story as any).category === 'sports' || (story as any).category === 'culture') ? '#34d399' : '#f87171' }}>
                          {((story as any).category === 'sports' || (story as any).category === 'culture') ? 'Fans' : 'Right'}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.right_narrative}</p>
                    </div>
                  )}
                </div>
              )}

              {/* UNFILTERED */}
              <div className="p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Social Pulse</span>
                    </div>
                    <p className="text-[13px] text-[#bbb] leading-[1.6] italic">{story.social_summary}</p>
                  </div>
                )}
              </div>

              {/* ON RECORD */}
              {(story as any).onrecord_matches?.length > 0 && (
                <OnRecordWidget matches={(story as any).onrecord_matches} />
              )}

              {/* X POSTS + SOCIAL */}
              <div className="rounded-lg p-4" style={{ background: '#253545' }}>
              {xClips.filter(c => !(c as any).duration).length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[16px] font-bold text-white">𝕏</span>
                  <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">What people are saying</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {xClips.filter(c => !(c as any).duration).map((c, i) => (
                  c.embed_id ? (
                    <div key={`x-${i}`} className="rounded-md overflow-hidden relative" style={{ background: '#1e2a3a', height: 320 }}>
                      <iframe
                        src={`https://platform.twitter.com/embed/Tweet.html?id=${c.embed_id}&theme=dark&dnt=true`}
                        className="absolute"
                        style={{ border: 'none', top: -8, left: -8, right: -8, bottom: -8, width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }}
                        loading="lazy"
                      />
                    </div>
                  ) : <div key={`x-${i}`}><SocialLink clip={c} /></div>
                ))}
              </div>
              </div>
              {tiktokClips.filter(c => c.embed_id).length > 0 && (
                <div className="rounded-lg p-4 mt-3" style={{ background: '#253545' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[16px]">♪</span>
                    <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">TikTok</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tiktokClips.filter(c => c.embed_id).map((c, i) => (
                      <div key={`tt-${i}`} className="rounded-md overflow-hidden" style={{ background: '#1e2a3a' }}>
                        <iframe src={`https://www.tiktok.com/embed/v2/${c.embed_id}`} className="h-[480px] w-full" style={{ border: 'none' }} sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {reelsClips.filter(c => c.embed_id).length > 0 && (
                <div className="rounded-lg p-4 mt-3" style={{ background: '#253545' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[16px]">◎</span>
                    <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">Reels</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {reelsClips.filter(c => c.embed_id).map((c, i) => (
                      <div key={`r-${i}`} className="rounded-md overflow-hidden" style={{ background: '#1e2a3a' }}>
                        <iframe src={`https://www.instagram.com/reel/${c.embed_id}/embed`} className="h-[480px] w-full" style={{ border: 'none' }} allowFullScreen />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {redditClips.length > 0 && (() => {
                const seen = new Set<string>();
                const unique = redditClips.filter(c => {
                  if (seen.has(c.url)) return false;
                  seen.add(c.url);
                  return true;
                });
                const valid = unique.filter(c => {
                  const t = (c.title || '').toLowerCase();
                  return !t.includes('removed by') && !t.includes('[deleted]') && !t.includes('[removed]');
                });
                if (valid.length === 0) return null;
                return (
                  <div className="rounded-lg p-4" style={{ background: '#253545' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4500"><circle cx="12" cy="12" r="12"/><path d="M15.7 12.7c0-.6-.5-1-1-1s-1 .4-1 1c0 .5.4 1 1 1 .5 0 1-.5 1-1zm-5.4 0c0-.6-.5-1-1-1-.6 0-1 .4-1 1 0 .5.4 1 1 1 .5 0 1-.5 1-1zm2.7 2.7c-.7.7-2 .8-2.7.8h-.1c-.7 0-1.7-.1-2.4-.8-.1-.1-.3-.1-.4 0-.1.1-.1.3 0 .4.8.8 2 1 2.8 1h.1c.8 0 2-.2 2.8-1 .1-.1.1-.3 0-.4-.1-.1-.3-.1-.4 0z" fill="white"/></svg>
                      <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">Reddit discussions</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {valid.map((c, i) => {
                        const title = c.title || c.url.replace(/.*\/comments\/\w+\//, '').replace(/\/$/, '').replace(/_/g, ' ').replace(/^\w/, (ch: string) => ch.toUpperCase());
                        const subreddit = c.url.match(/\/r\/(\w+)/)?.[1] || 'reddit';
                        return (
                          <a key={i} href={c.url} target="_blank" rel="noreferrer"
                            className="flex items-start gap-2.5 p-3 rounded-md hover:bg-[#2a3a4a] transition-colors group" style={{ background: '#1e2a3a' }}>
                            <span className="w-[8px] h-[8px] rounded-full bg-[#ff4500] shrink-0 mt-1" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-[#bbb] group-hover:text-white leading-[1.4] line-clamp-2 font-medium">{title}</p>
                              <span className="text-[10px] text-[#777] mt-1 block">r/{subreddit}</span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ALL ARTICLES — grouped by source */}
              <div className="rounded-lg p-4" style={{ background: '#253545' }}>
                <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
                  <span className="text-[10px] font-bold text-[#999] uppercase tracking-[0.12em]">All Articles</span>
                  <span className="text-[11px] text-[#777]">{sources.length} sources</span>
                  {uniqueLeft.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#3b82f6]" /><span className="text-[10px] text-[#60a5fa]">{uniqueLeft.length} left</span></span>}
                  {uniqueRight.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#ef4444]" /><span className="text-[10px] text-[#f87171]">{uniqueRight.length} right</span></span>}
                  {uniqueCenter.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#999]" /><span className="text-[10px] text-[#999]">{uniqueCenter.length} center</span></span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {leftSources.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#3b82f6]" />
                        <span className="text-[9px] font-bold text-[#60a5fa] uppercase tracking-[0.12em]">Left</span>
                      </div>
                      <SourceGroup sources={leftSources} hoverColor="#60a5fa" />
                    </div>
                  )}
                  {centerSources.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#999]" />
                        <span className="text-[9px] font-bold text-[#999] uppercase tracking-[0.12em]">Center</span>
                      </div>
                      <SourceGroup sources={centerSources} hoverColor="#ccc" />
                    </div>
                  )}
                  {rightSources.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#ef4444]" />
                        <span className="text-[9px] font-bold text-[#f87171] uppercase tracking-[0.12em]">Right</span>
                      </div>
                      <SourceGroup sources={rightSources} hoverColor="#f87171" />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </section>
  );
}

function SourceGroup({ sources, hoverColor }: { sources: { name: string; url: string; title?: string }[]; hoverColor: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const grouped: Record<string, { name: string; url: string; title?: string }[]> = {};
  for (const s of sources) {
    if (!grouped[s.name]) grouped[s.name] = [];
    grouped[s.name].push(s);
  }

  // Extract title from URL if none provided
  const getTitle = (a: { title?: string; url: string }) => {
    if (a.title) return a.title;
    // Try to extract readable title from URL path
    const path = a.url.replace(/https?:\/\/[^/]+/, '').replace(/[-_]/g, ' ').replace(/\/$/, '');
    const segments = path.split('/').filter(s => s.length > 3);
    const last = segments[segments.length - 1] || '';
    return last.replace(/^\w/, c => c.toUpperCase()).slice(0, 80) || a.url.replace(/https?:\/\/(www\.)?/, '').slice(0, 50);
  };

  return (
    <div className="space-y-0">
      {Object.entries(grouped).map(([name, articles]) => (
        <div key={name}>
          <button onClick={() => setExpanded(expanded === name ? null : name)}
            className="w-full text-left text-[12px] text-[#444] py-1 transition-colors hover:opacity-70 cursor-pointer flex items-center gap-1.5">
            <span className="text-[10px] text-[#777] shrink-0">{expanded === name ? '−' : '+'}</span>
            <span className="flex-1 text-[#bbb]">{name} {articles.length > 1 && <span className="text-[10px] text-[#777]">({articles.length})</span>}</span>
          </button>
          {expanded === name && (
            <div className="pl-5 mb-1 space-y-0.5">
              {articles.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer"
                  className="block text-[11px] text-[#999] py-0.5 transition-colors truncate hover:text-white">
                  {getTitle(a)} <span className="text-[10px] text-[#666]">&rarr;</span>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SocialLink({ clip }: { clip: NonNullable<NarrativeGap['social_clips']>[number] }) {
  const colors: Record<string, string> = { x: '#111', tiktok: '#fe2c55', reels: '#c026d3', reddit: '#ff4500' };
  const names: Record<string, string> = { x: 'X', tiktok: 'tiktok', reels: 'reels', reddit: 'reddit' };
  return (
    <a href={clip.url} target="_blank" rel="noreferrer"
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-[#2a3a4a] transition-colors group border border-transparent hover:border-[#3a4a5a]">
      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: colors[clip.platform] || '#999' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[#bbb] group-hover:text-white truncate">{clip.title || clip.url}</p>
        {clip.author && clip.author !== 'unknown' && <p className="text-[9px] text-[#777]">@{clip.author}</p>}
      </div>
      <span className="text-[9px] text-[#777] uppercase tracking-wider">{names[clip.platform] || ''}</span>
    </a>
  );
}
