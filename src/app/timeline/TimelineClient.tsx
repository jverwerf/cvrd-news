"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TimelineThread, ThreadEntry } from "@/lib/timeline-data";

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'World', value: 'world' },
  { label: 'Politics', value: 'politics' },
  { label: 'Markets', value: 'markets' },
  { label: 'Trending', value: 'trending' },
  { label: 'Sports', value: 'sports' },
];


function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function categoryColor(cat: string): string {
  switch (cat) {
    case 'world': return '#60a5fa';
    case 'politics': return '#f87171';
    case 'markets': return '#34d399';
    case 'trending': return '#f59e0b';
    case 'sports': return '#a78bfa';
    default: return '#999';
  }
}

export function TimelineContent({ threads, generatedAt }: { threads: TimelineThread[]; generatedAt: string }) {
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = (filter === 'all' ? threads : threads.filter(t => t.category === filter))
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.entries.some(e => e.topic.toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      {/* MOST RECENT STORIES — exact same layout as main page "Today's Top Stories" */}
      <div className="px-6 md:px-12 pt-6 pb-4" style={{ background: '#1e2a3a' }}>
        <h2 className="text-[11px] font-bold text-[#daa520] uppercase tracking-[0.15em] mb-4">Most Recent Stories</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {threads.map((t, i) => (
            <button key={t.id} onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              className="text-left rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]"
              style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
              {t.entries[t.entries.length - 1]?.image_file && (
                <div className="h-28 overflow-hidden" style={{
                  backgroundImage: `url(${t.entries[t.entries.length - 1].image_file})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }}>
                  <div className="w-full h-full" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />
                </div>
              )}
              <div className="p-2.5">
                <span className="text-[8px] font-bold uppercase tracking-[0.1em]" style={{ color: categoryColor(t.category) }}>{t.category}</span>
                <p className="text-[11px] text-white font-medium leading-snug line-clamp-2 mt-0.5 group-hover:text-[#60a5fa] transition-colors">
                  {t.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* WHITE BANNER — Catch Me Up */}
      <div className="px-6 md:px-12 py-3 flex items-center gap-3" style={{ background: '#f5f5f5' }}>
        <h1 className="text-[22px] md:text-[28px] text-[#1e2a3a] leading-tight tracking-[-0.02em]" style={serif}>
          Catch Me Up
        </h1>
      </div>

      {/* Search + Thread list */}
      <div className="px-4 md:px-8 pt-5 pb-16 max-w-5xl mx-auto">
        {/* Search pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full mb-5 max-w-sm"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search threads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[11px] text-white/80 placeholder-white/25 outline-none"
            style={{ background: 'transparent', border: 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[10px] text-white/30 hover:text-white/60 cursor-pointer" style={{ background: 'none', border: 'none' }}>
              ×
            </button>
          )}
        </div>

        <div className="space-y-4">

        {/* CATEGORY FILTER — only show categories that have threads */}
        {(() => {
          const activeCats = new Set(threads.map(t => t.category));
          const visibleCats = CATEGORIES.filter(c => c.value === 'all' || activeCats.has(c.value));
          // Don't show filter at all if only 1 category
          if (visibleCats.length <= 2) return null;
          return (
        <div className="flex items-center gap-2 mt-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {visibleCats.map(cat => (
            <button key={cat.value} onClick={() => { setFilter(cat.value); setExpandedId(null); }}
              className="shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors cursor-pointer"
              style={{
                background: filter === cat.value ? 'rgba(218,165,32,0.15)' : '#253545',
                color: filter === cat.value ? '#daa520' : '#999',
                border: `1px solid ${filter === cat.value ? 'rgba(218,165,32,0.3)' : '#2a3a4a'}`,
              }}>
              {cat.label}
            </button>
          ))}
        </div>
          );
        })()}
        {filtered.map(thread => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            isExpanded={expandedId === thread.id}
            onToggle={() => setExpandedId(expandedId === thread.id ? null : thread.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#666] text-[13px]">No threads found.</p>
          </div>
        )}
        </div>
      </div>

    </>
  );
}

// ── Thread Card ──

function ThreadCard({ thread, isExpanded, onToggle }: {
  thread: TimelineThread;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group entries by date
  const grouped = groupByDate(thread.entries);
  const dates = Object.keys(grouped).sort();
  const latestEntry = grouped[dates[dates.length - 1]]?.[0];
  const catColor = categoryColor(thread.category);

  // Auto-select latest date when expanding
  useEffect(() => {
    if (isExpanded && !selectedDate && dates.length > 0) {
      setSelectedDate(dates[dates.length - 1]);
    }
  }, [isExpanded]);

  // All entries for the selected date
  const selectedEntries = selectedDate ? (grouped[selectedDate] || []) : [];

  // Aggregate media across all entries for this date
  const allYtVids = selectedEntries.flatMap(e => e.youtube_videos || []);
  const allSocialClips = selectedEntries.flatMap(e => e.social_clips || []);

  // GPT-picked best video takes priority
  const bestPick = selectedEntries.find(e => e.best_video_id);
  const bestVideoId = bestPick?.best_video_id;
  const bestVideoPlatform = bestPick?.best_video_platform || 'youtube';

  // Resolve: GPT pick first, then first YouTube, then social
  const mainYtVideo = bestVideoId && bestVideoPlatform === 'youtube'
    ? (allYtVids.find(v => v.embed_id === bestVideoId) || allYtVids[0] || null)
    : allYtVids[0] || null;
  const mainSocialClip = bestVideoId && bestVideoPlatform !== 'youtube'
    ? (allSocialClips.find(c => c.embed_id === bestVideoId) || null)
    : allSocialClips.find(c => c.embed_id && (c.duration || c.platform === 'tiktok' || c.platform === 'telegram')) || null;

  const xClips = allSocialClips.filter(c => c.platform === 'x' && c.embed_id);
  const allSources = selectedEntries.flatMap(e => e.sources || []);
  // Dedupe sources by URL
  const seenUrls = new Set<string>();
  const sources = allSources.filter(s => { if (seenUrls.has(s.url)) return false; seenUrls.add(s.url); return true; });

  return (
    <article className="rounded-lg overflow-hidden" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>

      {/* COLLAPSED — image left, content right */}
      <button onClick={onToggle} className="w-full text-left cursor-pointer group">
        <div className="flex">
          {/* Large image — hide when expanded */}
          {!isExpanded && latestEntry?.image_file && (
            <div className="w-40 md:w-56 shrink-0 overflow-hidden" style={{
              backgroundImage: `url(${latestEntry.image_file})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: 130,
            }} />
          )}

          {/* Content */}
          <div className="flex-1 px-5 py-4 flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: catColor }}>
                {thread.category}
              </span>
              <span className="text-[10px] text-[#666]">
                {formatDate(thread.first_seen)} — {formatDate(thread.last_seen)}
              </span>
            </div>

            <h2 className="text-[20px] md:text-[24px] text-white leading-tight tracking-[-0.02em] mb-2 group-hover:text-[#daa520] transition-colors" style={serif}>
              {thread.title}
            </h2>

            {!isExpanded && (
              <p className="text-[12px] text-[#888] leading-[1.6] line-clamp-2">
                {thread.summary}
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center pr-5">
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </motion.div>
          </div>
        </div>
      </button>

      {/* EXPANDED */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pt-2 pb-5">

              {/* HOW DID WE GET HERE */}
              <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em] block mb-2">How Did We Get Here</span>
              <div className="p-4 rounded-lg mb-5" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                <p className="text-[13px] text-[#ccc] leading-[1.7] italic">{thread.summary}</p>
              </div>

              {/* ═══ HORIZONTAL TIMELINE ═══ */}
              <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em] block mb-2">Timeline</span>
              <div className="rounded-lg p-4 mb-5" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                <HorizontalTimeline
                  grouped={grouped}
                  dates={dates}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                />

                {/* Summary + video below thumbnails */}
                {selectedEntries.length > 0 && (
                  <>
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2a3a4a' }}>
                      {[...new Set(selectedEntries.map(e => e.summary))].map((s, i) => (
                        <p key={i} className="text-[13px] text-[#bbb] leading-[1.7] mb-2 last:mb-0">{s}</p>
                      ))}
                    </div>

                    {/* Video centered below summary */}
                    {mainYtVideo && (
                      <div className="mt-3 pt-3 flex justify-center" style={{ borderTop: '1px solid #2a3a4a' }}>
                        <div className="w-full max-w-[560px] rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                          <iframe
                            key={mainYtVideo.embed_id}
                            src={`https://www.youtube.com/embed/${mainYtVideo.embed_id}`}
                            className="w-full h-full"
                            style={{ border: 'none' }}
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                    {!mainYtVideo && mainSocialClip?.platform === 'tiktok' && mainSocialClip.embed_id && (
                      <div className="mt-3 pt-3 flex justify-center" style={{ borderTop: '1px solid #2a3a4a' }}>
                        <div className="rounded-lg overflow-hidden" style={{ background: '#253545' }}>
                          <iframe
                            src={`https://www.tiktok.com/embed/v2/${mainSocialClip.embed_id}`}
                            className="h-[400px] w-[320px]"
                            style={{ border: 'none' }}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ═══ SELECTED DAY CONTENT ═══ */}
              <AnimatePresence mode="wait">
                {selectedEntries.length > 0 && (
                  <motion.div
                    key={selectedDate}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* X */}
                    {xClips.length > 0 && (
                      <div className="rounded-lg p-4" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[16px] font-bold text-white">&#x1D54F;</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {xClips.slice(0, 6).map((c, i) => (
                            <div key={i} className="rounded overflow-hidden relative" style={{ background: '#253545', height: 90 }}>
                              <div className="absolute" style={{ top: 0, left: 0, width: '125%', height: '125%', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                                <iframe
                                  src={`https://platform.twitter.com/embed/Tweet.html?id=${c.embed_id}&theme=dark&dnt=true`}
                                  style={{ border: 'none', width: '100%', height: '100%' }}
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SOURCES — grouped by lean */}
                    {sources.length > 0 && (() => {
                      const leftS = sources.filter(s => s.lean === 'left');
                      const rightS = sources.filter(s => s.lean === 'right');
                      const centerS = sources.filter(s => !s.lean || s.lean === 'center');
                      return (
                        <div className="rounded-lg p-4" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                          <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
                            <span className="text-[10px] font-bold text-[#999] uppercase tracking-[0.12em]">All Articles</span>
                            <span className="text-[11px] text-[#777]">{sources.length} sources</span>
                            {leftS.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#1d4ed8]" /><span className="text-[10px] text-[#1d4ed8]">{leftS.length} left</span></span>}
                            {rightS.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#b91c1c]" /><span className="text-[10px] text-[#b91c1c]">{rightS.length} right</span></span>}
                            {centerS.length > 0 && <span className="flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#777]" /><span className="text-[10px] text-[#777]">{centerS.length} center</span></span>}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {leftS.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span className="w-[5px] h-[5px] rounded-full bg-[#1d4ed8]" />
                                  <span className="text-[9px] font-bold text-[#60a5fa] uppercase tracking-[0.12em]">Left</span>
                                </div>
                                {leftS.map((s, j) => (
                                  <a key={j} href={s.url} target="_blank" rel="noreferrer"
                                    className="block text-[11px] text-[#888] hover:text-[#60a5fa] transition-colors py-0.5 truncate">
                                    {s.name}
                                  </a>
                                ))}
                              </div>
                            )}
                            {centerS.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span className="w-[5px] h-[5px] rounded-full bg-[#999]" />
                                  <span className="text-[9px] font-bold text-[#999] uppercase tracking-[0.12em]">Center</span>
                                </div>
                                {centerS.map((s, j) => (
                                  <a key={j} href={s.url} target="_blank" rel="noreferrer"
                                    className="block text-[11px] text-[#888] hover:text-[#ccc] transition-colors py-0.5 truncate">
                                    {s.name}
                                  </a>
                                ))}
                              </div>
                            )}
                            {rightS.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span className="w-[5px] h-[5px] rounded-full bg-[#f87171]" />
                                  <span className="text-[9px] font-bold text-[#f87171] uppercase tracking-[0.12em]">Right</span>
                                </div>
                                {rightS.map((s, j) => (
                                  <a key={j} href={s.url} target="_blank" rel="noreferrer"
                                    className="block text-[11px] text-[#888] hover:text-[#f87171] transition-colors py-0.5 truncate">
                                    {s.name}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}

              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

// ── Horizontal Timeline ──

function HorizontalTimeline({ grouped, dates, selectedDate, onSelect }: {
  grouped: Record<string, ThreadEntry[]>;
  dates: string[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current || !selectedDate) return;
    const el = scrollRef.current.querySelector(`[data-date="${selectedDate}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDate]);

  return (
    <div className="relative">
      <div ref={scrollRef} className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center min-w-max px-4">
          {dates.map((date, i) => {
            const dayEntries = grouped[date];
            const isSelected = date === selectedDate;
            const isEven = i % 2 === 0;
            const topic = dayEntries[0]?.topic || '';

            return (
              <div key={date} className="flex items-center" data-date={date}>
                <div className="flex flex-col items-center" style={{ width: 150 }}>
                  {/* TOP: even=title, odd=dot+date */}
                  <div className="flex flex-col items-center justify-end text-center px-1 mb-2" style={{ minHeight: 28 }}>
                    {isEven ? (
                      <p className="text-[9px] leading-tight line-clamp-1" style={{ color: isSelected ? '#daa520' : '#e0e0e0' }}>{topic}</p>
                    ) : (
                      <>
                        <span className="text-[10px] whitespace-nowrap font-semibold" style={{ color: isSelected ? '#daa520' : '#e0e0e0' }}>{formatDateDay(date)}</span>
                        <div className="mt-1" style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: isSelected ? '#daa520' : '#e0e0e0',
                          boxShadow: isSelected ? '0 0 10px rgba(218,165,32,0.6)' : 'none',
                        }} />
                      </>
                    )}
                  </div>

                  {/* THUMBNAIL */}
                  <TimelineThumb date={date} entries={dayEntries} isSelected={isSelected} onSelect={onSelect} />

                  {/* BOTTOM: even=dot+date, odd=title */}
                  <div className="flex flex-col items-center justify-start text-center px-1 mt-2" style={{ minHeight: 28 }}>
                    {isEven ? (
                      <>
                        <div className="mb-1" style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: isSelected ? '#daa520' : '#e0e0e0',
                          boxShadow: isSelected ? '0 0 10px rgba(218,165,32,0.6)' : 'none',
                        }} />
                        <span className="text-[10px] whitespace-nowrap font-semibold" style={{ color: isSelected ? '#daa520' : '#e0e0e0' }}>{formatDateDay(date)}</span>
                      </>
                    ) : (
                      <p className="text-[9px] leading-tight line-clamp-1" style={{ color: isSelected ? '#daa520' : '#e0e0e0' }}>{topic}</p>
                    )}
                  </div>
                </div>

                {/* Simple gold bar between thumbnails */}
                {i < dates.length - 1 && (
                  <div style={{ width: 28, height: 2, background: '#daa520', opacity: 0.4, flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-6 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #1e2a3a, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #1e2a3a, transparent)' }} />
    </div>
  );
}

// ── Timeline sub-components ──

function TimelineThumb({ date, entries, isSelected, onSelect }: {
  date: string; entries: ThreadEntry[]; isSelected: boolean; onSelect: (d: string) => void;
}) {
  const thumb = entries[0]?.image_file;
  const entryCount = entries.length;
  const hasVideo = entries.some(e =>
    (e.youtube_videos?.length || 0) > 0 ||
    (e.social_clips || []).some(c => c.duration || c.platform === 'tiktok')
  );

  return (
    <button onClick={() => onSelect(date)}
      className="relative cursor-pointer group transition-all duration-200 w-full"
      style={{ height: 75 }}>
      {thumb ? (
        <div className="w-full h-full rounded-lg overflow-hidden relative" style={{
          backgroundImage: `url(${thumb})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: isSelected ? '2px solid #daa520' : '2px solid rgba(255,255,255,0.08)',
          opacity: isSelected ? 1 : 0.6,
          transition: 'all 0.2s',
          filter: isSelected ? 'none' : 'grayscale(20%)',
        }}>
          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21"/></svg>
              </div>
            </div>
          )}
          {isSelected && (
            <div className="absolute inset-0 rounded-lg" style={{ boxShadow: '0 0 16px rgba(218,165,32,0.5)' }} />
          )}
        </div>
      ) : (
        <div className="w-full h-full rounded-lg flex items-center justify-center" style={{
          background: isSelected ? 'rgba(218,165,32,0.15)' : '#253545',
          border: isSelected ? '2px solid #daa520' : '2px solid #2a3a4a',
          transition: 'all 0.2s',
        }}>
          <span className="text-[11px] font-bold" style={{ color: isSelected ? '#daa520' : '#666' }}>
            {formatDate(date)}
          </span>
        </div>
      )}
    </button>
  );
}

function TimelineLabel({ date, topic, isSelected }: { date: string; topic: string; isSelected: boolean }) {
  return (
    <div className="text-center px-1 py-1" style={{ height: 32 }}>
      <span className="text-[10px] whitespace-nowrap block" style={{
        color: isSelected ? '#daa520' : '#777',
        fontWeight: isSelected ? 700 : 400,
      }}>{formatDate(date)}</span>
      <p className="text-[9px] leading-tight line-clamp-1" style={{
        color: isSelected ? '#ccc' : '#555',
      }}>{topic}</p>
    </div>
  );
}

// ── Group entries by date ──

function groupByDate(entries: ThreadEntry[]): Record<string, ThreadEntry[]> {
  const grouped: Record<string, ThreadEntry[]> = {};
  for (const entry of entries) {
    if (!grouped[entry.date]) grouped[entry.date] = [];
    grouped[entry.date].push(entry);
  }
  return grouped;
}
