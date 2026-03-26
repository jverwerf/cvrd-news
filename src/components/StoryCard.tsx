"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Tweet } from 'react-tweet';
import Image from 'next/image';
import type { NarrativeGap } from "../lib/data";

export function StoryCard({ story, index }: { story: NarrativeGap; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  const xClips = story.social_clips?.filter(c => c.platform === 'x') || [];
  const tiktokClips = story.social_clips?.filter(c => c.platform === 'tiktok') || [];
  const reelsClips = story.social_clips?.filter(c => c.platform === 'reels') || [];
  const redditClips = story.social_clips?.filter(c => c.platform === 'reddit') || [];
  const ytVids = story.youtube_videos || [];
  const sources = story.sources || [];
  const totalEvidence = xClips.length + tiktokClips.length + reelsClips.length + redditClips.length + ytVids.length;

  const sentences = story.what_they_arent_telling_you
    ?.split(/(?<=\.)\s+/).filter(s => s.trim().length > 0) || [];

  return (
    <div className={`rounded-lg transition-all ${isOpen ? 'bg-[#141414] ring-1 ring-[#222]' : 'hover:bg-[#141414]'}`}>

      {/* COLLAPSED ROW — like a Spotify track */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-4 text-left group"
      >
        {/* Number */}
        <span className="text-sm font-mono text-[#737373] w-6 text-right shrink-0">{index + 1}</span>

        {/* Thumbnail */}
        {story.image_file && (
          <div className="relative w-12 h-12 rounded overflow-hidden shrink-0">
            <Image src={story.image_file} alt="" fill className="object-cover" />
          </div>
        )}

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-medium text-white truncate group-hover:text-white/90">
            {story.topic}
          </h3>
          <p className="text-xs text-[#737373] truncate mt-0.5">
            {story.summary?.substring(0, 100)}...
          </p>
        </div>

        {/* Evidence count */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {sources.length > 0 && (
            <span className="text-[11px] text-[#737373]">{sources.length} sources</span>
          )}
          {totalEvidence > 0 && (
            <span className="text-[11px] text-[#737373]">{totalEvidence} clips</span>
          )}
        </div>

        {/* Arrow */}
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight size={16} className="text-[#737373]" />
        </motion.div>
      </button>

      {/* EXPANDED — full evidence view */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-6 space-y-8">

              {/* SUMMARY */}
              <div className="pl-10">
                <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-3xl">
                  {story.summary}
                </p>
              </div>

              {/* LEFT vs RIGHT (or Media vs Fans for sports/trending) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10">
                <div className="p-4 rounded-lg bg-[#0a0a0a]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={(story.category === 'sports' || story.category === 'trending') ? '#f59e0b' : '#60a5fa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider`} style={{ color: (story.category === 'sports' || story.category === 'trending') ? '#f59e0b' : '#60a5fa' }}>
                      {(story.category === 'sports' || story.category === 'trending') ? 'Media' : 'Left'}
                    </span>
                  </div>
                  <p className="text-sm text-[#a3a3a3] leading-relaxed">{story.left_narrative}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#0a0a0a]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={(story.category === 'sports' || story.category === 'trending') ? '#34d399' : '#f87171'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider`} style={{ color: (story.category === 'sports' || story.category === 'trending') ? '#34d399' : '#f87171' }}>
                      {(story.category === 'sports' || story.category === 'trending') ? 'Fans' : 'Right'}
                    </span>
                  </div>
                  <p className="text-sm text-[#a3a3a3] leading-relaxed">{story.right_narrative}</p>
                </div>
              </div>

              {/* THE UNFILTERED STORY */}
              <div className="pl-10">
                <div className="p-5 rounded-lg bg-green-500/5 border border-green-500/10">
                  <h4 className="text-[11px] font-semibold text-green-400 uppercase tracking-wider mb-3">
                    The Unfiltered Story
                  </h4>
                  {sentences.length > 1 ? (
                    <ol className="space-y-2">
                      {sentences.map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm text-white/80 leading-relaxed">
                          <span className="text-green-500 font-mono text-xs mt-0.5 shrink-0">{i + 1}</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-white/80 leading-relaxed">{story.what_they_arent_telling_you}</p>
                  )}
                </div>
              </div>

              {/* VIDEOS — full width, big */}
              {ytVids.length > 0 && (
                <div className="pl-10">
                  <h4 className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-3">
                    Video Coverage ({ytVids.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ytVids.map((v, i) => (
                      <div key={i}>
                        <div className="rounded-lg overflow-hidden bg-black aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${v.embed_id}`}
                            className="w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1.5 px-0.5">
                          {v.channel && <span className="text-[11px] text-[#737373]">{v.channel}</span>}
                          <a href={v.url} target="_blank" rel="noreferrer" className="text-[11px] text-[#737373] hover:text-white transition-colors">
                            Open ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOCIAL EVIDENCE — X, TikTok, Reels, Reddit */}
              {(xClips.length > 0 || tiktokClips.length > 0 || reelsClips.length > 0 || redditClips.length > 0) && (
                <div className="pl-10">
                  <h4 className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-3">
                    Social Evidence
                  </h4>

                  {/* X Posts — embedded tweets, full width */}
                  {xClips.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[11px] text-[#737373] mb-2 block">𝕏 Posts ({xClips.length})</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {xClips.map((c, i) => (
                          c.embed_id ? (
                            <div key={i} className="light"><Tweet id={c.embed_id} /></div>
                          ) : (
                            <EvidenceLink key={i} platform="𝕏" title={c.title || c.url} url={c.url} author={c.author} />
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TikTok — embedded or links */}
                  {tiktokClips.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[11px] text-[#737373] mb-2 block">TikTok ({tiktokClips.length})</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tiktokClips.map((c, i) => (
                          c.embed_id ? (
                            <div key={i} className="rounded-lg overflow-hidden bg-black">
                              <iframe src={`https://www.tiktok.com/embed/v2/${c.embed_id}`} className="w-full h-[500px]" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" loading="lazy" />
                            </div>
                          ) : (
                            <EvidenceLink key={i} platform="♪" title={c.title || `@${c.author}`} url={c.url} author={c.author} />
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reels */}
                  {reelsClips.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[11px] text-[#737373] mb-2 block">Reels ({reelsClips.length})</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {reelsClips.map((c, i) => (
                          c.embed_id ? (
                            <div key={i} className="rounded-lg overflow-hidden bg-black">
                              <iframe src={`https://www.instagram.com/reel/${c.embed_id}/embed`} className="w-full h-[500px]" allowFullScreen />
                            </div>
                          ) : (
                            <EvidenceLink key={i} platform="◎" title={c.title || 'Reel'} url={c.url} />
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reddit threads */}
                  {redditClips.length > 0 && (
                    <div>
                      <span className="text-[11px] text-[#737373] mb-2 block">Reddit ({redditClips.length})</span>
                      <div className="space-y-1">
                        {redditClips.map((c, i) => (
                          <a key={i} href={c.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors group">
                            <span className="text-orange-500 text-sm">⬡</span>
                            <span className="text-sm text-[#a3a3a3] group-hover:text-white truncate flex-1">{c.title || c.url}</span>
                            <ExternalLink size={12} className="text-[#737373] shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ARTICLE SOURCES for this story */}
              {sources.length > 0 && (
                <div className="pl-10">
                  <h4 className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-3">
                    Sources ({sources.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {sources.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors group">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${s.lean === 'left' ? 'bg-blue-500' : s.lean === 'right' ? 'bg-red-500' : 'bg-[#737373]'}`} />
                        <span className="text-sm text-[#a3a3a3] group-hover:text-white truncate">{s.name}</span>
                        <ExternalLink size={10} className="text-[#737373] shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* KEY PEOPLE */}
              {story.people && story.people.length > 0 && (
                <div className="pl-10">
                  <h4 className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-3">
                    Key People
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {story.people.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a]">
                        <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400">
                          {p.name.charAt(0)}
                        </div>
                        <span className="text-xs text-white">{p.name}</span>
                        {p.role && <span className="text-[10px] text-[#737373]">· {p.role}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EvidenceLink({ platform, title, url, author }: { platform: string; title: string; url: string; author?: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#1a1a1a] transition-colors group">
      <span className="text-sm">{platform}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#a3a3a3] group-hover:text-white truncate">{title}</p>
        {author && author !== 'unknown' && <p className="text-[10px] text-[#737373]">@{author}</p>}
      </div>
      <ExternalLink size={12} className="text-[#737373] shrink-0" />
    </a>
  );
}
