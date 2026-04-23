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

function nameToSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
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

export function StoryPage({ story, date, allStories, dailyPickImage, prevStory, nextStory, matchedTimelines, slugBase = '/story' }: {
  story: NarrativeGap;
  date: string;
  allStories: NarrativeGap[];
  dailyPickImage?: string;
  prevStory?: NarrativeGap;
  nextStory?: NarrativeGap;
  matchedTimelines?: { id: string; title: string; image_file?: string; summary?: string; days_covered?: number; is_active?: boolean }[];
  slugBase?: string;
}) {
  const [dashExpanded, setDashExpanded] = useState(false);
  const [tweetsExpanded, setTweetsExpanded] = useState(false);
  const [tiktoksExpanded, setTiktoksExpanded] = useState(false);
  const [telegramExpanded, setTelegramExpanded] = useState(false);
  const [redditExpanded, setRedditExpanded] = useState(false);
  const [expandedTweet, setExpandedTweet] = useState<string | null>(null);
  const [expandedTiktok, setExpandedTiktok] = useState<string | null>(null);
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
    if (prevStory) window.location.href = `${slugBase}/${topicToSlug(prevStory.topic)}`;
  };
  const next = () => {
    if (nextStory) window.location.href = `${slugBase}/${topicToSlug(nextStory.topic)}`;
  };

  return (
    <div>
      {/* 1. PICTURE HEADER with coffee/subscribe overlaid at bottom */}
      {story.image_file && (
        <div className="relative overflow-hidden" style={{
          height: '30vh', minHeight: '220px',
          backgroundImage: `url(${story.image_file})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 50%, rgba(0,0,0,0.75) 100%)' }} />
          <div className="absolute top-0 left-0 px-6 md:px-12 pt-5">
            {story.category && (
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded mb-2 inline-block" style={{ background: 'rgba(37,99,235,0.5)', color: '#fff' }}>
                {story.category}
              </span>
            )}
            <h1 className="text-[24px] md:text-[28px] text-white leading-tight tracking-[-0.02em]" style={serif}>
              {story.topic}
            </h1>
            {story.summary && (
              <p className="text-[12px] text-white/70 leading-snug mt-1.5 line-clamp-3" style={{ maxWidth: 480 }}>
                {story.summary.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')}
              </p>
            )}
          </div>
          {/* coffee + subscribe + nav arrows pinned to bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 py-2 flex items-center justify-between gap-2">
            <a href="https://ko-fi.com/cvrdnews" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-semibold hover:opacity-80 transition-opacity"
              style={{ color: '#1e2a3a', textDecoration: 'none', background: '#ffffff', padding: '3px 10px', borderRadius: 999 }}>
              ♥ Buy us a coffee
            </a>
            <div className="flex items-center gap-2 ml-auto">
              {subStatus === 'done' ? (
                <span className="text-[10px] font-medium text-[#daa520]">Subscribed ✓</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input type="email" placeholder="Subscribe to newsletter: verwerft.j@gmail.com" value={subEmail} onChange={e => setSubEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                    className="text-[10px] px-2 py-1 rounded-full outline-none"
                    style={{ background: 'rgba(30,42,58,0.8)', border: '1px solid rgba(42,58,74,0.8)', color: '#e2e8f0', width: 130 }} />
                  <button onClick={handleSubscribe} disabled={subStatus === 'loading'}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ background: '#daa520', border: 'none', cursor: 'pointer' }}>
                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#1e2a3a]" />
                  </button>
                </div>
              )}
              <button onClick={prev}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', background: 'rgba(30,42,58,0.6)' }}>
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-white" />
              </button>
              <button onClick={next}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', background: 'rgba(30,42,58,0.6)' }}>
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPACT DASHBOARD */}
      <div className="px-6 md:px-12 pt-4 pb-4" style={{ background: '#1e2a3a', borderTop: '1px solid #2a3a4a', borderBottom: '1px solid #2a3a4a' }}>
        <div data-section="story-dashboard" className="rounded-xl overflow-hidden">
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

      {/* FULL CONTENT */}
      <div className="px-6 md:px-12 pb-10 pt-5" style={{ background: '#1e2a3a' }}>

        {/* ARTICLE BODY (Across Outlets + Blindspots stacked) | LEFT/CENTER/RIGHT aside */}
        {(() => {
          const summaryParas = (story.summary || '').split(/\n\s*\n/).filter(p => p.trim().length > 0);
          const blindspotParas = sentences.length > 0 ? sentences : (story.what_they_arent_telling_you ? [story.what_they_arent_telling_you] : []);
          const isSportsish = story.category === 'sports' || story.category === 'trending';
          return (
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1 min-w-0">
                <section className="mb-8">
                  <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.18em] mb-4">Across Outlets</h2>
                  {summaryParas.map((p, i) => (
                    <p key={i} className="text-[13px] text-white leading-[1.75] mb-4 last:mb-0">{p}</p>
                  ))}
                </section>
                {story.what_they_arent_telling_you && (
                  <section className="pl-5 mb-8" style={{ borderLeft: '2px solid #daa520' }}>
                    <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.18em] mb-4">Blindspots</h2>
                    {blindspotParas.map((p, i) => (
                      <p key={i} className="text-[13px] text-white leading-[1.75] mb-4 last:mb-0">{p}</p>
                    ))}
                  </section>
                )}
                {story.social_summary && (() => {
                  const paras = story.social_summary.split(/\n\s*\n/).filter(p => p.trim().length > 0);
                  const finalParas = paras.length > 0 ? paras : [story.social_summary];
                  return (
                    <section className="mb-6">
                      <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.18em] mb-4">In Social Media</h2>
                      {finalParas.map((p, i) => (
                        <p key={i} className="text-[13px] text-white leading-[1.75] mb-4 last:mb-0">{p}</p>
                      ))}
                    </section>
                  );
                })()}
                {(ytVids.length > 0 || clips.filter(c => c.embed_id).length > 0) && (
                  <div className="w-full max-w-full overflow-hidden mb-6" data-section="videogrid">
                    <VideoGrid youtubeVideos={ytVids} socialClips={clips} storyImage={story.image_file} storyIndex={1} />
                  </div>
                )}

                {/* TELEGRAM + REDDIT — combined card, 3 columns mixed */}
                {(() => {
                  const tgClips = telegramClips.filter(c => c.embed_id && !c.duration);
                  const seen = new Set<string>();
                  const uniqueReddit = redditClips.filter(c => { if (seen.has(c.url)) return false; seen.add(c.url); return true; });

                  if (tgClips.length === 0 && uniqueReddit.length === 0) return null;

                  type TextItem = { kind: 'telegram' | 'reddit'; url: string; title: string; meta: string };
                  const mixed: TextItem[] = [];
                  const max = Math.max(tgClips.length, uniqueReddit.length);
                  for (let i = 0; i < max; i++) {
                    if (tgClips[i]) mixed.push({ kind: 'telegram', url: tgClips[i].url, title: tgClips[i].title || '', meta: `@${tgClips[i].author}` });
                    if (uniqueReddit[i]) {
                      const c = uniqueReddit[i];
                      const title = c.title || c.url.replace(/.*\/comments\/\w+\//, '').replace(/\/$/, '').replace(/_/g, ' ').replace(/^\w/, (ch: string) => ch.toUpperCase());
                      mixed.push({ kind: 'reddit', url: c.url, title, meta: `r/${c.url.match(/\/r\/(\w+)/)?.[1] || 'reddit'}` });
                    }
                  }

                  const previewCount = 9;
                  const visible = telegramExpanded ? mixed : mixed.slice(0, previewCount);

                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#daa520' }}>Discussions</span>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: '#253545' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {visible.map((item, i) => {
                            const metaColor = item.kind === 'telegram' ? '#0088cc' : '#ff4500';
                            const logo = item.kind === 'telegram' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#0088cc" className="mt-0.5 shrink-0"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37l-.53-.28z"/></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path d="M19.93 12.24c0-.97-.78-1.75-1.75-1.75-.47 0-.89.19-1.21.49-1.19-.86-2.85-1.41-4.67-1.49l.8-3.75 2.6.55c.03.66.57 1.19 1.24 1.19.69 0 1.25-.56 1.25-1.25S17.63 5 16.94 5c-.49 0-.91.28-1.11.69l-2.91-.62a.33.33 0 00-.23.04.32.32 0 00-.14.2l-.88 4.18c-1.87.06-3.54.6-4.75 1.49a1.73 1.73 0 00-1.21-.49c-.97 0-1.75.78-1.75 1.75 0 .71.43 1.33 1.04 1.61-.03.18-.04.35-.04.53 0 2.69 3.13 4.87 7 4.87s7-2.18 7-4.87c0-.18-.01-.36-.04-.53.61-.28 1.04-.9 1.04-1.61zM7 13.5c0-.69.56-1.25 1.25-1.25s1.25.56 1.25 1.25-.56 1.25-1.25 1.25S7 14.19 7 13.5zm8.37 3.5c-.74.74-2.14.8-2.5.8h-.01c-.37 0-1.77-.05-2.5-.8a.271.271 0 010-.38c.1-.1.27-.1.38 0 .46.46 1.46.63 2.13.63h.01c.67 0 1.67-.17 2.13-.63.1-.1.27-.1.38 0 .09.1.09.28-.02.38zm-.12-2.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" fill="#fff"/></svg>
                            );
                            return (
                              <a key={`${item.kind}-${i}`} href={item.url} target="_blank" rel="noreferrer"
                                className="rounded-lg p-3 hover:opacity-80 transition-opacity block">
                                <div className="flex items-start gap-2">
                                  {logo}
                                  <div className="min-w-0">
                                    <p className="text-[12px] text-[#ccc] leading-snug line-clamp-2">{item.title}</p>
                                    <span className="text-[10px] mt-1 block" style={{ color: metaColor }}>{item.meta}</span>
                                  </div>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                        {mixed.length > previewCount && (
                          <button onClick={() => setTelegramExpanded(!telegramExpanded)}
                            className="w-full mt-3 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
                            style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
                            {telegramExpanded ? 'Show less' : `Show ${mixed.length - previewCount} more`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* X + TIKTOK — combined card, 3 columns mixed */}
                {(() => {
                  const textTweets = xClips.filter(c => !(c as any).duration && c.embed_id);
                  const allTiktoks = tiktokClips.filter(c => c.embed_id);
                  if (textTweets.length === 0 && allTiktoks.length === 0) return null;

                  const mixed: Array<{ kind: 'x' | 'tiktok'; embedId: string }> = [];
                  const max = Math.max(textTweets.length, allTiktoks.length);
                  for (let i = 0; i < max; i++) {
                    if (textTweets[i]) mixed.push({ kind: 'x', embedId: textTweets[i].embed_id! });
                    if (allTiktoks[i]) mixed.push({ kind: 'tiktok', embedId: allTiktoks[i].embed_id! });
                  }

                  const previewCount = 3;
                  const visible = tweetsExpanded ? mixed : mixed.slice(0, previewCount);

                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#daa520' }}>Socials</span>
                        <span className="text-[14px] font-bold text-white">𝕏</span>
                        <span className="text-[11px]" style={{ color: '#daa520' }}>+</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.84-.1z"/></svg>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: '#253545' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {visible.map((item, i) => {
                            const isExp = item.kind === 'x' ? expandedTweet === item.embedId : expandedTiktok === item.embedId;
                            const toggleExp = () => {
                              if (item.kind === 'x') setExpandedTweet(isExp ? null : item.embedId);
                              else setExpandedTiktok(isExp ? null : item.embedId);
                            };
                            return (
                              <div key={`${item.kind}-${item.embedId}-${i}`}
                                className={`rounded overflow-hidden relative group ${isExp ? 'md:col-span-3' : ''}`}
                                style={{ background: '#1e2a3a', height: isExp ? 620 : 420 }}>
                                {item.kind === 'x' ? (
                                  <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${item.embedId}&theme=dark&dnt=true`}
                                    style={{ border: 'none', width: '100%', height: '100%' }} loading="lazy" />
                                ) : (
                                  <iframe src={`https://www.tiktok.com/embed/v2/${item.embedId}`}
                                    style={{ border: 'none', width: '100%', height: '100%' }}
                                    sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" loading="lazy" />
                                )}
                                <button onClick={toggleExp}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
                                  aria-label={isExp ? 'Collapse' : 'Expand'}>
                                  {isExp ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                                  ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        {mixed.length > previewCount && (
                          <button onClick={() => setTweetsExpanded(!tweetsExpanded)}
                            className="w-full mt-3 py-2 text-[11px] font-semibold text-[#999] rounded-md hover:text-white transition-colors"
                            style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', cursor: 'pointer' }}>
                            {tweetsExpanded ? 'Show less' : `Show ${mixed.length - previewCount} more`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex flex-col gap-4 self-start" style={{ flex: '0 0 320px', width: 320 }}>
              <aside className="rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                {!isSportsish && (leftSources.length + centerSources.length + rightSources.length) > 0 && (
                  <div className="py-4 px-4 grid grid-cols-2 gap-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
                    <CoverageLever
                      title="Volume"
                      subtitle="amounts"
                      mode="count"
                      left={leftSources.length}
                      center={centerSources.length}
                      right={rightSources.length}
                    />
                    <CoverageLever
                      title="Saturation"
                      subtitle="vs outlets tracked"
                      mode="percent"
                      left={leftSources.length}
                      center={centerSources.length}
                      right={rightSources.length}
                    />
                  </div>
                )}
                <div className="py-4 px-4" style={{ borderBottom: '1px solid #2a3a4a' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSportsish ? '#f59e0b' : '#60a5fa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: isSportsish ? '#f59e0b' : '#60a5fa' }}>
                      {isSportsish ? 'Media' : 'Left'}
                    </span>
                  </div>
                  <p className="text-[11px] text-white leading-[1.55]">{story.left_narrative}</p>
                </div>
                {story.center_narrative && (
                  <div className="py-4 px-4" style={{ borderBottom: '1px solid #2a3a4a' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSportsish ? '#c084fc' : '#a3a3a3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: isSportsish ? '#c084fc' : '#a3a3a3' }}>
                        {isSportsish ? 'Analysts' : 'Center'}
                      </span>
                    </div>
                    <p className="text-[11px] text-white leading-[1.55]">{story.center_narrative}</p>
                  </div>
                )}
                <div className="py-4 px-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSportsish ? '#34d399' : '#f87171'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: isSportsish ? '#34d399' : '#f87171' }}>
                      {isSportsish ? 'Fans' : 'Right'}
                    </span>
                  </div>
                  <p className="text-[11px] text-white leading-[1.55]">{story.right_narrative}</p>
                </div>
              </aside>
              {(() => {
                const threads = matchedTimelines || [];
                if (threads.length === 0) return null;
                return (
                  <div className="rounded-lg py-4 px-4" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#daa520' }}>Timeline</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {threads.map((t) => (
                        <a key={t.id} href={`/timeline?thread=${t.id}`}
                          className="flex items-start gap-2 hover:opacity-80 transition-opacity"
                          style={{ textDecoration: 'none' }}>
                          {t.image_file && <img src={t.image_file} alt={t.title} className="w-12 h-12 rounded object-cover shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] text-white font-semibold leading-[1.3]">{t.title}</p>
                            {t.summary && (
                              <p className="text-[10px] text-[#ccc] leading-[1.5] mt-1" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.summary}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {t.is_active && <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Active</span>}
                              {t.days_covered && <span className="text-[9px] text-[#666]">{t.days_covered}d tracked</span>}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {(story as any).onrecord_matches?.length > 0 && (() => {
                const BLOB = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';
                const onMatches = (story as any).onrecord_matches;
                return (
                  <div className="rounded-lg py-4 px-4" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: 'rgba(184,134,11,0.2)' }}>
                        <span className="text-[6px] font-bold" style={{ color: '#b8860b' }}>!</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">On Record</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {onMatches.map((m: any, i: number) => (
                        <a key={i} href={`/onrecord/${nameToSlug(m.name)}?q=${m.search_keyword}`}
                          className="flex items-center gap-3 transition-opacity hover:opacity-80"
                          style={{ textDecoration: 'none' }}>
                          <div className="relative shrink-0">
                            <img src={`${BLOB}/politicians/photo_${m.handle}.png`} alt={m.name}
                              className="w-10 h-10 rounded-full object-cover"
                              style={{ border: '2px solid rgba(184,134,11,0.5)' }}
                              onError={(e) => { (e.target as HTMLImageElement).src = '/logo3.png'; (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                            {m.overall_score != null && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                                style={{ background: '#1e2a3a', border: '1px solid rgba(184,134,11,0.4)', color: '#daa520' }}>
                                {m.overall_score}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold leading-[1.2]" style={{ ...serif, color: '#daa520' }}>{m.name}</p>
                            {m.role && <p className="text-[9px] text-[#666] leading-[1.2] mt-0.5">{m.role}</p>}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {sources.length > 0 && (
                <div className="rounded-lg py-4 px-4" style={{ background: '#253545' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#daa520' }}>Dive Deeper</span>
                    <span className="text-[10px] text-[#6a7a8a]">({sources.length})</span>
                  </div>
                  {!(story.category === 'sports' || story.category === 'trending') && (
                    <div className="flex items-center gap-3 mb-3 pb-3 flex-wrap" style={{ borderBottom: '1px solid #2a3a4a' }}>
                      {leftSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full" style={{ background: '#1d4ed8' }} /><span className="text-[10px]" style={{ color: '#60a5fa' }}>{leftSources.length} left</span></span>}
                      {centerSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full" style={{ background: '#777' }} /><span className="text-[10px] text-[#999]">{centerSources.length} center</span></span>}
                      {rightSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full" style={{ background: '#b91c1c' }} /><span className="text-[10px]" style={{ color: '#f87171' }}>{rightSources.length} right</span></span>}
                    </div>
                  )}
                  <div className="flex flex-col gap-4">
                    {(story.category === 'sports' || story.category === 'trending') ? (
                      <SourceColumn label="Sources" sources={[...leftSources, ...centerSources, ...rightSources]} color="#999" dotColor="#999" />
                    ) : (
                      <>
                        {leftSources.length > 0 && <SourceColumn label="Left" sources={leftSources} color="#60a5fa" dotColor="#1d4ed8" />}
                        {centerSources.length > 0 && <SourceColumn label="Center" sources={centerSources} color="#999" dotColor="#999" />}
                        {rightSources.length > 0 && <SourceColumn label="Right" sources={rightSources} color="#f87171" dotColor="#f87171" />}
                      </>
                    )}
                  </div>
                </div>
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


const FEED_TOTALS = { left: 23, center: 72, right: 15 };

function CoverageLever({
  title, subtitle, mode, left, center, right,
}: {
  title: string;
  subtitle: string;
  mode: 'count' | 'percent';
  left: number;
  center: number;
  right: number;
}) {
  const lVal = mode === 'count' ? left : (left / FEED_TOTALS.left) * 100;
  const cVal = mode === 'count' ? center : (center / FEED_TOTALS.center) * 100;
  const rVal = mode === 'count' ? right : (right / FEED_TOTALS.right) * 100;

  const fmt = (v: number) => mode === 'count' ? `${Math.round(v)}` : `${v.toFixed(0)}%`;

  // Marker position: weighted centroid across L (0%), C (50%), R (100%).
  // Center pulls toward middle so L-only or R-only doesn't slam the edge.
  const total = lVal + cVal + rVal;
  const pos = total === 0 ? 50 : ((lVal * 0 + cVal * 50 + rVal * 100) / total);

  return (
    <div>
      <div className="mb-2 leading-tight">
        <div className="text-[9px] font-bold text-[#bbb] uppercase tracking-[0.18em]">{title}</div>
        <div className="text-[8px] text-[#daa520] uppercase tracking-[0.12em] mt-0.5">{subtitle}</div>
      </div>

      {/* Track with triangle pointer sitting above */}
      <div className="relative" style={{ height: 22 }}>
        {/* triangle pointer (points down at the track) */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${pos}% - 5px)`,
            top: 2,
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '7px solid #e2e8f0',
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))',
            transition: 'left 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* track */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: 13,
            height: 3,
            background: 'linear-gradient(to right, #60a5fa 0%, #60a5fa 14%, #a3a3a3 44%, #a3a3a3 56%, #f87171 86%, #f87171 100%)',
            borderRadius: 1,
          }}
        />
        {/* center tick */}
        <div
          className="absolute"
          style={{ left: 'calc(50% - 1px)', top: 10, width: 2, height: 9, background: '#4a5a6a' }}
        />
      </div>

      {/* Numbers row */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-[11px] font-mono text-[#60a5fa] leading-none">{fmt(lVal)}</span>
        <span className="text-[11px] font-mono text-[#a3a3a3] leading-none">{fmt(cVal)}</span>
        <span className="text-[11px] font-mono text-[#f87171] leading-none">{fmt(rVal)}</span>
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
    const hasSep = /\s[—–-]\s/.test(s.name);
    const outlet = hasSep ? s.name.split(/\s[—–-]\s/)[0].trim()
      : (s.name.length < 40 && !/[?!]/.test(s.name)) ? s.name
      : (() => { try { return new URL(s.url).hostname.replace(/^www\./, ''); } catch { return s.name; } })();
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
              <span className="flex-1 text-[#bbb]">{name}{articles.length > 1 && <span className="text-[10px] text-[#777] ml-1">({articles.length})</span>}</span>
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
