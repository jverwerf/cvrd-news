"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tweet } from 'react-tweet';
import Image from 'next/image';
import type { NarrativeGap } from "../lib/data";
import { VideoGrid } from "./VideoGrid";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

export function HeroStory({ story }: { story: NarrativeGap }) {
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

      {/* FULL WIDTH IMAGE HEADER */}
      {story.image_file && (
        <div className="relative w-full h-[55vh] min-h-[380px] overflow-hidden">
          <Image src={story.image_file} alt={story.topic} fill className="object-cover" priority />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(248,247,244,0.4) 60%, #f8f7f4 100%)' }} />
          <div className="absolute top-4 left-6">
            <span className="text-[10px] font-semibold text-white bg-black/40 backdrop-blur-sm px-3 py-1 rounded-sm uppercase tracking-[0.1em]">
              Top Story
            </span>
          </div>
          {/* Title overlaid on the image bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-6">
            <div>
              <h1 className="text-[38px] md:text-[48px] text-[#111] leading-[1.05] tracking-[-0.03em]" style={serif}>
                {story.topic}
              </h1>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 md:px-12 pb-10 pt-5" style={{ background: '#f8f7f4' }}>

      {/* Compact source count */}
      {sources.length > 0 && (
        <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: '1px solid #e8e6e2' }}>
          <span className="text-[11px] text-[#999]">{sources.length} sources</span>
          {uniqueLeft.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#1d4ed8]" /><span className="text-[10px] text-[#1d4ed8]">{uniqueLeft.length} left</span></span>}
          {uniqueRight.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#b91c1c]" /><span className="text-[10px] text-[#b91c1c]">{uniqueRight.length} right</span></span>}
          {uniqueCenter.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#777]" /><span className="text-[10px] text-[#777]">{uniqueCenter.length} center</span></span>}
        </div>
      )}

      {/* 3. SUMMARY */}
      <div className="mb-6 p-5 rounded-md border-l-[3px] border-[#b8860b]" style={{ background: '#f2f0eb' }}>
        <p className="text-[15px] text-[#333] leading-[1.75] italic">
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
          background: open ? '#f0efec' : '#fffbf0',
          border: `1px solid ${open ? '#e5e5e5' : 'rgba(184,134,11,0.2)'}`,
        }}>
        {open ? 'Collapse ↑' : 'Left vs Right · Unfiltered · Social Evidence · All Articles ↓'}
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
              <div className="grid grid-cols-2 gap-0">
                <div className="pr-4 py-4" style={{ borderRight: '1px solid #eee' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-[#1d4ed8]" />
                    <span className="text-[11px] font-bold text-[#1d4ed8] uppercase tracking-[0.12em]">Left</span>
                  </div>
                  <p className="text-[13px] text-[#444] leading-[1.65]">{story.left_narrative}</p>
                </div>
                <div className="pl-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-[#b91c1c]" />
                    <span className="text-[11px] font-bold text-[#b91c1c] uppercase tracking-[0.12em]">Right</span>
                  </div>
                  <p className="text-[13px] text-[#444] leading-[1.65]">{story.right_narrative}</p>
                </div>
              </div>

              {/* UNFILTERED */}
              <div className="p-5 bg-[#f0fdf4] rounded-md relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#047857]" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-[#047857] flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">!</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#047857] uppercase tracking-[0.12em]">What They Aren&apos;t Telling You</span>
                </div>
                {sentences.length > 1 ? (
                  <div className="space-y-2.5">
                    {sentences.map((s, i) => (
                      <div key={i} className="flex gap-2.5">
                        <span className="text-[12px] font-bold text-[#047857] mt-0.5 shrink-0 w-4 text-right">{i + 1}.</span>
                        <p className="text-[13px] text-[#1a1a1a] leading-[1.6]">{s}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#1a1a1a] leading-[1.6]">{story.what_they_arent_telling_you}</p>
                )}
              </div>

              {/* SOCIAL EVIDENCE — masonry 2 columns */}
              <div style={{ columnCount: 2, columnGap: '12px' }}>
                {xClips.filter(c => !(c as any).duration).map((c, i) => (
                  c.embed_id ? <div key={`x-${i}`} className="light rounded-md overflow-hidden mb-3" style={{ breakInside: 'avoid', maxWidth: '100%' }}><div style={{ maxWidth: '100%', overflow: 'hidden' }}><Tweet id={c.embed_id} /></div></div>
                  : <div key={`x-${i}`} style={{ breakInside: 'avoid' }} className="mb-3"><SocialLink clip={c} /></div>
                ))}
                {tiktokClips.map((c, i) => (
                  c.embed_id ? (
                    <div key={`tt-${i}`} className="rounded-md overflow-hidden border border-[#e5e5e5] mb-3" style={{ breakInside: 'avoid' }}>
                      <iframe src={`https://www.tiktok.com/embed/v2/${c.embed_id}`} className="w-full h-[520px] bg-[#111]" allowFullScreen allow="encrypted-media" />
                    </div>
                  ) : <div key={`tt-${i}`} style={{ breakInside: 'avoid' }} className="mb-3"><SocialLink clip={c} /></div>
                ))}
                {reelsClips.map((c, i) => (
                  c.embed_id ? (
                    <div key={`r-${i}`} className="rounded-md overflow-hidden border border-[#e5e5e5] mb-3" style={{ breakInside: 'avoid' }}>
                      <iframe src={`https://www.instagram.com/reel/${c.embed_id}/embed`} className="w-full h-[520px] bg-[#111]" allowFullScreen />
                    </div>
                  ) : <div key={`r-${i}`} style={{ breakInside: 'avoid' }} className="mb-3"><SocialLink clip={c} /></div>
                ))}
              </div>
              {redditClips.length > 0 && (() => {
                // Deduplicate by URL and extract clean titles
                const seen = new Set<string>();
                const unique = redditClips.filter(c => {
                  if (seen.has(c.url)) return false;
                  seen.add(c.url);
                  return true;
                });
                return (
                  <div>
                    <span className="text-[10px] font-bold text-[#555] uppercase tracking-[0.12em] block mb-1.5">Reddit</span>
                    <div className="space-y-0">
                      {unique.map((c, i) => {
                        // Extract readable title from URL if no title
                        const title = c.title || c.url.replace(/.*\/comments\/\w+\//, '').replace(/\/$/, '').replace(/_/g, ' ').replace(/^\w/, (ch: string) => ch.toUpperCase());
                        return (
                          <a key={i} href={c.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#f0efec] transition-colors group">
                            <span className="w-[5px] h-[5px] rounded-full bg-[#ff4500] shrink-0" />
                            <span className="text-[12px] text-[#444] group-hover:text-[#111] truncate flex-1">{title}</span>
                            <span className="text-[9px] text-[#ddd] shrink-0">r/{c.url.match(/\/r\/(\w+)/)?.[1] || 'reddit'}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ALL ARTICLES — grouped by source */}
              <div className="pt-4" style={{ borderTop: '1px solid #eee' }}>
                <span className="text-[10px] font-bold text-[#555] uppercase tracking-[0.12em] block mb-3">All Articles</span>
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

              {/* PEOPLE */}
              {story.people && story.people.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {story.people.map((p, i) => (
                    <span key={i} className="text-[10px] text-[#666] px-2.5 py-1 rounded-full bg-[#f0efec]">
                      {p.name}{p.role ? <span className="text-[#bbb]"> · {p.role}</span> : ''}
                    </span>
                  ))}
                </div>
              )}
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

  // Group by source name
  const grouped: Record<string, { name: string; url: string; title?: string }[]> = {};
  for (const s of sources) {
    if (!grouped[s.name]) grouped[s.name] = [];
    grouped[s.name].push(s);
  }

  return (
    <div className="space-y-0.5">
      {Object.entries(grouped).map(([name, articles]) => (
        <div key={name}>
          {articles.length === 1 ? (
            <a href={articles[0].url} target="_blank" rel="noreferrer"
              className="block text-[12px] text-[#444] py-1 transition-colors hover:opacity-70"
              style={{ ['--hover-color' as string]: hoverColor }}>
              {name} <span className="text-[10px] text-[#bbb]">&rarr;</span>
            </a>
          ) : (
            <>
              <button onClick={() => setExpanded(expanded === name ? null : name)}
                className="w-full text-left text-[12px] text-[#444] py-1 transition-colors hover:opacity-70 cursor-pointer flex items-center justify-between">
                <span>{name} <span className="text-[10px] text-[#bbb]">({articles.length})</span></span>
                <span className="text-[10px] text-[#bbb]">{expanded === name ? '−' : '+'}</span>
              </button>
              {expanded === name && (
                <div className="pl-3 border-l border-[#e5e5e5] ml-1 mb-1">
                  {articles.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer"
                      className="block text-[11px] text-[#666] py-0.5 transition-colors truncate hover:opacity-70">
                      {a.title || a.url.replace(/https?:\/\/(www\.)?/, '').slice(0, 60)} <span className="text-[10px] text-[#bbb]">&rarr;</span>
                    </a>
                  ))}
                </div>
              )}
            </>
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
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-[#f0efec] transition-colors group border border-transparent hover:border-[#e5e5e5]">
      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: colors[clip.platform] || '#999' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[#444] group-hover:text-[#111] truncate">{clip.title || clip.url}</p>
        {clip.author && clip.author !== 'unknown' && <p className="text-[9px] text-[#ccc]">@{clip.author}</p>}
      </div>
      <span className="text-[9px] text-[#ccc] uppercase tracking-wider">{names[clip.platform] || ''}</span>
    </a>
  );
}
