"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tweet } from 'react-tweet';
import Image from 'next/image';
import type { NarrativeGap } from "../lib/data";
import { VideoGrid } from "./VideoGrid";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

export function StoryFeed({ stories, startIndex = 0 }: { stories: NarrativeGap[]; startIndex?: number }) {
  const left = stories.filter((_, i) => i % 2 === 0);
  const right = stories.filter((_, i) => i % 2 === 1);

  return (
    <div className="py-2">
      <div className="space-y-4">
        {stories.map((story, i) => (
          <StoryCard key={i} story={story} index={i + startIndex} />
        ))}
      </div>
    </div>
  );
}

function StoryCard({ story, index }: { story: NarrativeGap; index: number }) {
  const [open, setOpen] = useState(false);

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

  // Split on sentence boundaries but not abbreviations like U.S., Dr., Mr., etc.
  const sentences = story.what_they_arent_telling_you
    ?.split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter(s => s.trim().length > 20) || []; // filter out junk fragments

  return (
    <article id={`story-${index + 1}`} className="overflow-hidden">

      {/* IMAGE HEADER — same as hero */}
      <div className="relative h-[40vh] min-h-[280px] overflow-hidden">
        {story.image_file ? (
          <Image src={story.image_file} alt={story.topic} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.7) 100%)' }} />
        <div className="absolute top-4 left-6">
          <span className="text-[10px] font-semibold text-white bg-black/40 backdrop-blur-sm px-3 py-1 rounded-sm uppercase tracking-[0.1em]">
            Story {index + 1}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-6">
          <h2 className="text-[32px] md:text-[40px] text-white leading-[1.05] tracking-[-0.03em]" style={serif}>
            {story.topic}
          </h2>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-10 pt-5" style={{ background: '#1e2a3a' }}>

      {/* SUMMARY */}
      <div className="mb-6 p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
        <p className="text-[15px] text-[#ccc] leading-[1.75] italic">
          {story.summary}
        </p>
      </div>

      {/* VIDEO GRID */}
      {(ytVids.length > 0 || clips.filter(c => c.embed_id).length > 0) && (
        <div className="mb-5">
          <VideoGrid youtubeVideos={ytVids} socialClips={clips} storyImage={story.image_file} storyIndex={index + 1} />
        </div>
      )}

      {/* EXPAND */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-2.5 text-[12px] font-semibold rounded-md mb-2 transition-colors cursor-pointer"
        style={{
          color: open ? '#999' : '#b8860b',
          background: open ? '#253545' : '#253040',
          border: `1px solid ${open ? '#3a4a5a' : 'rgba(184,134,11,0.3)'}`,
        }}>
        {open ? 'Collapse ↑' : 'Cover the news: Left vs Right · Evidence · The People · The Articles ↓'}
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

              {/* LEFT vs RIGHT */}
              <div className="grid grid-cols-2 gap-0 rounded-lg" style={{ background: '#e8e6e2' }}>
                <div className="pr-4 py-4 px-4" style={{ borderRight: '1px solid #d5d3cf' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-[#1d4ed8]" />
                    <span className="text-[11px] font-bold text-[#1d4ed8] uppercase tracking-[0.12em]">Left</span>
                  </div>
                  <p className="text-[13px] text-[#444] leading-[1.65]">{story.left_narrative}</p>
                </div>
                <div className="pl-4 py-4 pr-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-[#b91c1c]" />
                    <span className="text-[11px] font-bold text-[#b91c1c] uppercase tracking-[0.12em]">Right</span>
                  </div>
                  <p className="text-[13px] text-[#444] leading-[1.65]">{story.right_narrative}</p>
                </div>
              </div>

              {/* UNFILTERED */}
              <div className="p-5 rounded-lg" style={{ background: '#0a2518', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-[#047857] flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">!</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#4ade80] uppercase tracking-[0.12em]">What They Aren&apos;t Telling You</span>
                </div>
                {sentences.length > 1 ? (
                  <div className="space-y-2.5">
                    {sentences.map((s, i) => (
                      <div key={i} className="flex gap-2.5">
                        <span className="text-[12px] font-bold text-[#4ade80] mt-0.5 shrink-0 w-4 text-right">{i + 1}.</span>
                        <p className="text-[13px] text-[#d0d0d0] leading-[1.6]">{s}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#d0d0d0] leading-[1.6]">{story.what_they_arent_telling_you}</p>
                )}
                {story.social_summary && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[14px]">💬</span>
                      <span className="text-[11px] font-bold text-[#4ade80] uppercase tracking-[0.12em]">Social Summary</span>
                    </div>
                    <p className="text-[13px] text-[#c0c0c0] leading-[1.6] italic">{story.social_summary}</p>
                  </div>
                )}
              </div>

              {/* X POSTS */}
              {xClips.filter(c => !(c as any).duration).length > 0 && (
                <div className="rounded-lg p-4" style={{ background: '#e8e6e2' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[16px] font-bold">𝕏</span>
                    <span className="text-[11px] font-bold text-[#555] uppercase tracking-[0.12em]">What people are saying</span>
                  </div>
                  <div className="space-y-3">
                    {xClips.filter(c => !(c as any).duration).map((c, i) => (
                      c.embed_id ? (
                        <div key={i} className="rounded-md overflow-hidden">
                          <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${c.embed_id}&theme=light`} className="w-full" style={{ border: 'none', height: 280 }} loading="lazy" />
                        </div>
                      ) : <SocialLink key={i} clip={c} />
                    ))}
                  </div>
                </div>
              )}
              {tiktokClips.map((c, i) => (
                c.embed_id ? (
                  <div key={i} className="rounded-md overflow-hidden border border-[#e5e5e5]">
                    <iframe src={`https://www.tiktok.com/embed/v2/${c.embed_id}`} className="w-full h-[520px] bg-[#111]" allowFullScreen allow="encrypted-media" />
                  </div>
                ) : <SocialLink key={i} clip={c} />
              ))}
              {reelsClips.map((c, i) => (
                c.embed_id ? (
                  <div key={i} className="rounded-md overflow-hidden border border-[#e5e5e5]">
                    <iframe src={`https://www.instagram.com/reel/${c.embed_id}/embed`} className="w-full h-[520px] bg-[#111]" allowFullScreen />
                  </div>
                ) : <SocialLink key={i} clip={c} />
              ))}
              {redditClips.length > 0 && (() => {
                const seen = new Set<string>();
                const unique = redditClips.filter(c => { if (seen.has(c.url)) return false; seen.add(c.url); return true; });
                return (
                <div className="rounded-lg p-4" style={{ background: '#e8e6e2' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4500"><circle cx="12" cy="12" r="12"/><path d="M15.7 12.7c0-.6-.5-1-1-1s-1 .4-1 1c0 .5.4 1 1 1 .5 0 1-.5 1-1zm-5.4 0c0-.6-.5-1-1-1-.6 0-1 .4-1 1 0 .5.4 1 1 1 .5 0 1-.5 1-1zm2.7 2.7c-.7.7-2 .8-2.7.8h-.1c-.7 0-1.7-.1-2.4-.8-.1-.1-.3-.1-.4 0-.1.1-.1.3 0 .4.8.8 2 1 2.8 1h.1c.8 0 2-.2 2.8-1 .1-.1.1-.3 0-.4-.1-.1-.3-.1-.4 0z" fill="white"/></svg>
                    <span className="text-[11px] font-bold text-[#555] uppercase tracking-[0.12em]">Reddit discussions</span>
                  </div>
                  <div className="space-y-0">
                  {unique.map((c, i) => {
                    const title = c.title || c.url.replace(/.*\/comments\/\w+\//, '').replace(/\/$/, '').replace(/_/g, ' ').replace(/^\w/, (ch: string) => ch.toUpperCase());
                    return (
                    <a key={i} href={c.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#d5d3cf] transition-colors group">
                      <span className="w-[5px] h-[5px] rounded-full bg-[#ff4500] shrink-0" />
                      <span className="text-[12px] text-[#444] group-hover:text-[#111] truncate flex-1">{title}</span>
                      <span className="text-[9px] text-[#aaa] shrink-0">r/{c.url.match(/\/r\/(\w+)/)?.[1] || 'reddit'}</span>
                    </a>
                    );
                  })}
                  </div>
                </div>
                );
              })()}

              {/* ALL ARTICLES — grouped by source */}
              <div className="rounded-lg p-4" style={{ background: '#e8e6e2' }}>
                <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #d5d5d5' }}>
                  <span className="text-[10px] font-bold text-[#555] uppercase tracking-[0.12em]">All Articles</span>
                  <span className="text-[11px] text-[#999]">{sources.length} sources</span>
                  {leftSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#1d4ed8]" /><span className="text-[10px] text-[#1d4ed8]">{leftSources.length} left</span></span>}
                  {rightSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#b91c1c]" /><span className="text-[10px] text-[#b91c1c]">{rightSources.length} right</span></span>}
                  {centerSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#777]" /><span className="text-[10px] text-[#777]">{centerSources.length} center</span></span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {leftSources.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#1d4ed8]" />
                        <span className="text-[9px] font-bold text-[#1d4ed8] uppercase tracking-[0.12em]">Left</span>
                      </div>
                      <SourceGroup sources={leftSources} hoverColor="#1d4ed8" />
                    </div>
                  )}
                  {centerSources.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#777]" />
                        <span className="text-[9px] font-bold text-[#777] uppercase tracking-[0.12em]">Center</span>
                      </div>
                      <SourceGroup sources={centerSources} hoverColor="#111" />
                    </div>
                  )}
                  {rightSources.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#b91c1c]" />
                        <span className="text-[9px] font-bold text-[#b91c1c] uppercase tracking-[0.12em]">Right</span>
                      </div>
                      <SourceGroup sources={rightSources} hoverColor="#b91c1c" />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </article>
  );
}

function SourceGroup({ sources, hoverColor }: { sources: { name: string; url: string; title?: string }[]; hoverColor: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const grouped: Record<string, { name: string; url: string; title?: string }[]> = {};
  for (const s of sources) {
    if (!grouped[s.name]) grouped[s.name] = [];
    grouped[s.name].push(s);
  }

  const getTitle = (a: { title?: string; url: string }) => {
    if (a.title) return a.title;
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
            <span className="text-[10px] text-[#bbb] shrink-0">{expanded === name ? '−' : '+'}</span>
            <span className="flex-1">{name} {articles.length > 1 && <span className="text-[10px] text-[#bbb]">({articles.length})</span>}</span>
          </button>
          {expanded === name && (
            <div className="pl-5 mb-1 space-y-0.5">
              {articles.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer"
                  className="block text-[11px] text-[#666] py-0.5 transition-colors truncate hover:opacity-70">
                  {getTitle(a)} <span className="text-[10px] text-[#bbb]">&rarr;</span>
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
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-[#fafafa] transition-colors group border border-transparent hover:border-[#eee]">
      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: colors[clip.platform] || '#999' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[#444] group-hover:text-[#111] truncate">{clip.title || clip.url}</p>
        {clip.author && clip.author !== 'unknown' && <p className="text-[9px] text-[#ccc]">@{clip.author}</p>}
      </div>
      <span className="text-[9px] text-[#ccc] uppercase tracking-wider">{names[clip.platform] || ''}</span>
    </a>
  );
}
