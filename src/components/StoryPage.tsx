"use client";

import { useState, useRef, useEffect } from "react";
import { VideoGrid } from "./VideoGrid";
import { Tweet } from 'react-tweet';
import { OnRecordWidget } from "./OnRecordWidget";
import type { NarrativeGap } from "../lib/data";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

export function StoryPage({ story, date, otherStories }: {
  story: NarrativeGap;
  date: string;
  otherStories: NarrativeGap[];
}) {
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

  const topicToSlug = (t: string) => t.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

  return (
    <div>
      {/* HERO IMAGE */}
      {story.image_file && (
        <div className="relative overflow-hidden" style={{
          height: '45vh', minHeight: '320px',
          backgroundImage: `url(${story.image_file})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)' }} />
        </div>
      )}

      {/* TITLE BAR */}
      <div className="px-4 md:px-6 py-3" style={{ background: '#f5f5f5' }}>
        <div className="flex items-center gap-2 mb-1">
          {story.category && (
            <a href={`/${story.category}`}
              className="text-[10px] font-bold text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded uppercase tracking-[0.1em] shrink-0 hover:bg-[#3b82f6]/20 transition-colors">
              {story.category}
            </a>
          )}
          <span className="text-[10px] text-[#999]">{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <h1 className="text-[22px] md:text-[28px] text-[#1e2a3a] leading-tight tracking-[-0.02em]" style={serif}>
          {story.topic}
        </h1>
      </div>

      {/* CONTENT */}
      <div className="px-6 md:px-12 pb-10 pt-5" style={{ background: '#1e2a3a' }}>

        {/* SUMMARY */}
        <div className="mb-6 p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <p className="text-[15px] text-[#ccc] leading-[1.75] italic">{story.summary}</p>
        </div>

        {/* VIDEO GRID */}
        {(ytVids.length > 0 || clips.filter(c => c.embed_id).length > 0) && (
          <div className="mb-5" data-section="videogrid">
            <VideoGrid youtubeVideos={ytVids} socialClips={clips} storyImage={story.image_file} storyIndex={1} />
          </div>
        )}

        {/* LEFT vs RIGHT (or Media vs Fans for sports) */}
        {(story.left_narrative || story.right_narrative) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-lg mb-6" style={{ background: '#253545' }}>
            {story.left_narrative && (
              <div className="pr-4 py-4 px-4" style={{ borderRight: '1px solid #2a3a4a' }}>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={((story as any).category === 'sports' || (story as any).category === 'trending') ? '#f59e0b' : '#60a5fa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: ((story as any).category === 'sports' || (story as any).category === 'trending') ? '#f59e0b' : '#60a5fa' }}>
                    {((story as any).category === 'sports' || (story as any).category === 'trending') ? 'Media' : 'Left'}
                  </span>
                </div>
                <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.left_narrative}</p>
              </div>
            )}
            {story.right_narrative && (
              <div className="pl-4 py-4 pr-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={((story as any).category === 'sports' || (story as any).category === 'trending') ? '#34d399' : '#f87171'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: ((story as any).category === 'sports' || (story as any).category === 'trending') ? '#34d399' : '#f87171' }}>
                    {((story as any).category === 'sports' || (story as any).category === 'trending') ? 'Fans' : 'Right'}
                  </span>
                </div>
                <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.right_narrative}</p>
              </div>
            )}
          </div>
        )}

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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Social Pulse</span>
              </div>
              <p className="text-[13px] text-[#bbb] leading-[1.6] italic">{story.social_summary}</p>
            </div>
          )}
        </div>

        {/* ON RECORD — politician matches */}
        {(story as any).onrecord_matches?.length > 0 && (
          <OnRecordWidget matches={(story as any).onrecord_matches} />
        )}

        {/* X POSTS */}
        {xClips.filter(c => !(c as any).duration).length > 0 && (
          <div className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[16px] font-bold text-white">𝕏</span>
              <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]"></span>
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

        {/* TELEGRAM TEXT POSTS */}
        {telegramClips.filter(c => c.embed_id && !c.duration).length > 0 && (
          <div className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0088cc"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37l-.53-.28z"/></svg>
              <span className="text-[11px] font-bold text-[#0088cc] uppercase tracking-[0.12em]">Telegram</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {telegramClips.filter(c => c.embed_id && !c.duration).map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)' }}>
                  <span className="text-[11px] text-[#bbb] truncate max-w-[250px]">{c.title}</span>
                  <span className="text-[9px] text-[#0088cc] shrink-0">@{c.author}</span>
                </a>
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
              <div className="flex flex-wrap gap-2">
                {unique.map((c, i) => {
                  const title = c.title || c.url.replace(/.*\/comments\/\w+\//, '').replace(/\/$/, '').replace(/_/g, ' ');
                  return (
                    <a key={i} href={c.url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
                      style={{ background: 'rgba(255,69,0,0.15)', border: '1px solid rgba(255,69,0,0.3)' }}>
                      <span className="text-[11px] text-[#bbb] truncate max-w-[250px]">{title}</span>
                      <span className="text-[9px] text-[#ff4500] shrink-0">r/{c.url.match(/\/r\/(\w+)/)?.[1] || 'reddit'}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ALL ARTICLES */}
        <div className="rounded-lg p-4 mb-6" style={{ background: '#253545' }}>
          <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
            <span className="text-[10px] font-bold text-[#999] uppercase tracking-[0.12em]">All Articles</span>
            <span className="text-[11px] text-[#777]">{sources.length} sources</span>
            {leftSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#1d4ed8]" /><span className="text-[10px] text-[#1d4ed8]">{leftSources.length} left</span></span>}
            {rightSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#b91c1c]" /><span className="text-[10px] text-[#b91c1c]">{rightSources.length} right</span></span>}
            {centerSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#777]" /><span className="text-[10px] text-[#777]">{centerSources.length} center</span></span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leftSources.length > 0 && <SourceColumn label="Left" sources={leftSources} color="#60a5fa" dotColor="#1d4ed8" />}
            {centerSources.length > 0 && <SourceColumn label="Center" sources={centerSources} color="#999" dotColor="#999" />}
            {rightSources.length > 0 && <SourceColumn label="Right" sources={rightSources} color="#f87171" dotColor="#f87171" />}
          </div>
        </div>

        {/* MORE STORIES */}
        {otherStories.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3">More from {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {otherStories.map((s, i) => (
                <a key={i} href={`/story/${topicToSlug(s.topic)}`}
                  className="text-left rounded-lg overflow-hidden group transition-transform hover:scale-[1.02] block"
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
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 p-5 rounded-lg text-center" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
          <p className="text-[13px] text-[#999] mb-2">Want the full picture on every story?</p>
          <a href="/" className="inline-block px-5 py-2 rounded-full text-[12px] font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: '#b8860b' }}>
            Stream all stories at CVRD
          </a>
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
