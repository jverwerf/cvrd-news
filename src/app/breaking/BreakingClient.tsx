"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { VideoGrid } from "@/components/VideoGrid";
import { SiteNav } from "@/components/SiteNav";
import type { NarrativeGap } from "@/lib/data";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };
const mono = "'DM Mono', monospace";

function toNarrativeGap(b: any): NarrativeGap {
  const ytVideos = (b.youtube_videos || []).length > 0
    ? b.youtube_videos
    : (b.clips || [])
        .filter((c: any) => c.platform === 'youtube' && c.embed_id)
        .map((c: any) => ({ url: c.url || '', embed_id: c.embed_id, channel: c.title || 'Breaking', duration: c.duration, title: c.title }));

  const socialClips = (b.social_clips || []).length > 0
    ? b.social_clips
    : (b.clips || [])
        .filter((c: any) => c.platform !== 'youtube' && c.embed_id)
        .map((c: any) => ({ platform: c.platform, url: c.url || '', embed_id: c.embed_id, title: c.title, author: c.author, thumbnail: c.thumbnail, duration: c.duration }));

  return {
    topic: b.topic || 'Breaking News',
    summary: b.summary || '',
    left_narrative: b.left_narrative || '',
    right_narrative: b.right_narrative || '',
    what_they_arent_telling_you: b.what_they_arent_telling_you || '',
    social_summary: b.social_summary || '',
    image_file: undefined,
    image_prompt: b.image_prompt || '',
    sources: (b.sources || []).map((s: any) => ({
      name: s.name, url: s.url, lean: s.lean, title: s.title,
    })),
    youtube_videos: ytVideos,
    social_clips: socialClips,
  };
}

function timeAgo(dateStr: string): string {
  const mins = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  return mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
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

function toBullets(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(s => s.trim().length > 20);
}

function StoryContent({ story }: { story: NarrativeGap }) {
  const [open, setOpen] = useState(false);
  const clips = story.social_clips || [];
  const ytVids = story.youtube_videos || [];
  const sources = story.sources || [];
  const redditClips = clips.filter(c => c.platform === 'reddit');
  const xClips = clips.filter(c => c.platform === 'x' && !(c as any).duration && c.embed_id);
  const tiktokClips = clips.filter(c => c.platform === 'tiktok' && c.embed_id);
  const telegramClips = clips.filter(c => c.platform === 'telegram' && c.embed_id && !(c as any).duration);
  const leftSources = sources.filter(s => s.lean === 'left');
  const rightSources = sources.filter(s => s.lean === 'right');
  const centerSources = sources.filter(s => !s.lean || s.lean === 'center');
  const sentences = toBullets(story.what_they_arent_telling_you || '');

  return (
    <div className="px-6 md:px-12 pb-8 pt-5" style={{ background: '#1e2a3a' }}>

      {/* SUMMARY */}
      {story.summary && (
        <div className="mb-6">
          <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-3">Summary</h2>
          <div className="p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
            <p className="text-[13px] text-[#ccc] leading-[1.65]">{story.summary}</p>
          </div>
        </div>
      )}

      {/* VIDEO GRID */}
      {(ytVids.length > 0 || clips.filter(c => c.embed_id).length > 0) && (
        <div className="mb-6">
          <VideoGrid youtubeVideos={ytVids} socialClips={clips} storyImage={undefined} storyIndex={0} />
        </div>
      )}

      {/* COVER THE NEWS BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-2.5 text-[12px] font-semibold rounded-md mb-4 transition-colors cursor-pointer"
        style={{
          color: open ? '#999' : '#b8860b',
          background: open ? '#253545' : '#253040',
          border: `1px solid ${open ? '#3a4a5a' : 'rgba(184,134,11,0.3)'}`,
        }}>
        {open ? 'Collapse ↑' : 'Cover the news ↓'}
      </button>

      {open && <>

      {/* NARRATIVES */}
      {(story.left_narrative || story.right_narrative) && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-lg" style={{ background: '#253545' }}>
            {story.left_narrative && (
              <div className="py-4 px-4 md:border-r md:border-b-0 border-b" style={{ borderColor: '#2a3a4a' }}>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#60a5fa' }}>Left</span>
                </div>
                <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.left_narrative}</p>
              </div>
            )}
            {(story as any).center_narrative && (
              <div className="py-4 px-4 md:border-r md:border-b-0 border-b" style={{ borderColor: '#2a3a4a' }}>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#a3a3a3' }}>Center</span>
                </div>
                <p className="text-[13px] text-[#bbb] leading-[1.65]">{(story as any).center_narrative}</p>
              </div>
            )}
            {story.right_narrative && (
              <div className="py-4 px-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#f87171' }}>Right</span>
                </div>
                <p className="text-[13px] text-[#bbb] leading-[1.65]">{story.right_narrative}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BLINDSPOTS */}
      {story.what_they_arent_telling_you && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#daa520] font-bold text-[13px] leading-none mr-1">—</span>
            <span className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.12em]">Blindspots</span>
          </div>
          <div className="p-5 rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
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
      )}

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

      {/* X POSTS */}
      {xClips.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[16px] font-bold text-white">𝕏</span>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#253545' }}>
            <div className="grid grid-cols-4 gap-2">
              {xClips.slice(0, 8).map((c, i) => (
                <div key={i} className="rounded overflow-hidden relative" style={{ background: '#1e2a3a', height: 90 }}>
                  <div className="absolute" style={{ top: 0, left: 0, width: '125%', height: '125%', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                    <iframe src={`https://platform.twitter.com/embed/Tweet.html?id=${c.embed_id}&theme=dark&dnt=true`}
                      style={{ border: 'none', width: '100%', height: '100%' }} loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TIKTOK */}
      {tiktokClips.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[16px]">♪</span>
            <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">TikTok</span>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#253545' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tiktokClips.slice(0, 6).map((c, i) => (
                <div key={i} className="rounded-md overflow-hidden" style={{ background: '#1e2a3a' }}>
                  <iframe src={`https://www.tiktok.com/embed/v2/${c.embed_id}`} className="h-[480px] w-full" style={{ border: 'none' }} sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TELEGRAM */}
      {telegramClips.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0088cc"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37l-.53-.28z"/></svg>
            <span className="text-[11px] font-bold text-[#0088cc] uppercase tracking-[0.12em]">Telegram</span>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#253545' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {telegramClips.slice(0, 9).map((c, i) => (
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
        </div>
      )}

      {/* REDDIT */}
      {redditClips.length > 0 && (() => {
        const seen = new Set<string>();
        const unique = redditClips.filter(c => { if (seen.has(c.url)) return false; seen.add(c.url); return true; });
        const valid = unique.filter(c => {
          const t = (c.title || '').toLowerCase();
          return !t.includes('removed by') && !t.includes('[deleted]') && !t.includes('[removed]');
        });
        if (valid.length === 0) return null;
        return (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4500"><circle cx="12" cy="12" r="12"/><path d="M15.7 12.7c0-.6-.5-1-1-1s-1 .4-1 1c0 .5.4 1 1 1 .5 0 1-.5 1-1zm-5.4 0c0-.6-.5-1-1-1-.6 0-1 .4-1 1 0 .5.4 1 1 1 .5 0 1-.5 1-1zm2.7 2.7c-.7.7-2 .8-2.7.8h-.1c-.7 0-1.7-.1-2.4-.8-.1-.1-.3-.1-.4 0-.1.1-.1.3 0 .4.8.8 2 1 2.8 1h.1c.8 0 2-.2 2.8-1 .1-.1.1-.3 0-.4-.1-.1-.3-.1-.4 0z" fill="white"/></svg>
              <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.12em]">Reddit Discussions</span>
            </div>
            <div className="rounded-lg p-4" style={{ background: '#253545' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {valid.map((c, i) => {
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
          </div>
        );
      })()}

      {/* SOURCES */}
      {sources.length > 0 && (
        <div className="rounded-lg p-4" style={{ background: '#253545' }}>
          <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
            <span className="text-[10px] font-bold text-[#999] uppercase tracking-[0.12em]">All Articles</span>
            <span className="text-[11px] text-[#777]">{sources.length} sources</span>
            {leftSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#1d4ed8]" /><span className="text-[10px] text-[#1d4ed8]">{leftSources.length} left</span></span>}
            {centerSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#777]" /><span className="text-[10px] text-[#777]">{centerSources.length} center</span></span>}
            {rightSources.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#b91c1c]" /><span className="text-[10px] text-[#b91c1c]">{rightSources.length} right</span></span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leftSources.length > 0 && <SourceColumn label="Left" sources={leftSources} color="#60a5fa" dotColor="#1d4ed8" />}
            {centerSources.length > 0 && <SourceColumn label="Center" sources={centerSources} color="#999" dotColor="#999" />}
            {rightSources.length > 0 && <SourceColumn label="Right" sources={rightSources} color="#f87171" dotColor="#f87171" />}
          </div>
        </div>
      )}

      </>}
    </div>
  );
}

export default function BreakingClient({ initialData }: { initialData: any[] }) {
  const [breakingItems, setBreakingItems] = useState<any[]>(initialData);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/breaking/data')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || (Array.isArray(data) && data.length === 0)) return;
          const items = Array.isArray(data) ? data : [data];
          items.sort((a: any, b: any) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
          setBreakingItems(items);
        })
        .catch(() => {});
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const allStories = breakingItems.map(toNarrativeGap).filter(s => {
    const videoClips = (s.youtube_videos || []).length + (s.social_clips || []).filter(c => c.duration).length;
    return videoClips >= 3;
  });

  if (allStories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e2a3a' }}>
        <div className="text-center">
          <p className="text-white/50 mb-2">Breaking news is being verified...</p>
          <p className="text-white/30 text-[12px]">Stories appear once we have enough video sources.</p>
          <a href="/brief" className="text-[13px] text-[#3b82f6] mt-4 inline-block">← Back to Daily Cover</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>

      <SiteNav isBreaking={true} />

      {allStories.map((story, i) => {
        const b = breakingItems.find((bi: any) => bi.topic === story.topic) || breakingItems[i];
        return (
          <div key={i} style={{ borderBottom: i < allStories.length - 1 ? '2px solid #2a3a4a' : 'none' }}>
            {/* BREAKING HEADER */}
            <div className="px-6 md:px-12 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(to right, #7f1d1d, #991b1b, #7f1d1d)' }}>
              <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded animate-pulse uppercase tracking-[0.05em]">
                {i === 0 ? 'LIVE' : 'BREAKING'}
              </span>
              <span className="text-[15px] text-white font-bold flex-1 truncate" style={serif}>
                {b.topic}
              </span>
              <span className="text-[10px] text-white/60 shrink-0">{timeAgo(b.detected_at)}</span>
            </div>

            {/* DASHBOARD */}
            <ErrorBoundary>
              <Dashboard stories={[story]} videoUrl={b.breaking_short_url || undefined} />
            </ErrorBoundary>

            {/* INLINE CONTENT */}
            <StoryContent story={story} />
          </div>
        );
      })}

      <footer className="py-10 text-center" style={{ borderTop: '1px solid #2a3a4a' }}>
        <img src="/logo3.png" alt="CVRD News" className="h-36 mx-auto mb-4 opacity-30" />
        <span className="text-[11px] text-[#666] block mb-3">Your streaming platform to cover the news</span>
        <div className="flex items-center justify-center gap-4">
          <a href="/about" className="text-[11px] text-[#888] hover:text-white transition-colors">About</a>
          <span className="text-[#555]">·</span>
          <a href="/contact" className="text-[11px] text-[#888] hover:text-white transition-colors">Contact</a>
          <span className="text-[#555]">·</span>
          <a href="/terms" className="text-[11px] text-[#888] hover:text-white transition-colors">Terms of Service</a>
          <span className="text-[#555]">·</span>
          <a href="/privacy" className="text-[11px] text-[#888] hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
