"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TimelineThread, ThreadEntry, TodayLastYearData } from "@/lib/timeline-data";

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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getYear(dateStr: string): string {
  return dateStr.substring(0, 4);
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

const TIMELINE_SCROLL_CSS = `
.timeline-scroll { overflow-x: scroll !important; scrollbar-width: none !important; -ms-overflow-style: none !important; }
.timeline-scroll::-webkit-scrollbar { display: none !important; }
`;

export function TimelineContent({ threads, generatedAt, lastYear }: { threads: TimelineThread[]; generatedAt: string; lastYear?: TodayLastYearData | null }) {
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = (filter === 'all' ? threads : threads.filter(t => t.category === filter))
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.entries.some(e => e.topic.toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TIMELINE_SCROLL_CSS }} />

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

        {/* TODAY LAST YEAR — rendered outside this container */}

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
            onHover={() => setExpandedId(thread.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#666] text-[13px]">No threads found.</p>
          </div>
        )}
        </div>
      </div>

      {/* LAST YEAR TODAY */}
      {lastYear && lastYear.summary && (() => {
        const lastYearDate = new Date(lastYear.date_last_year + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const shareUrl = 'https://cvrdnews.com/timeline';
        const shareText = `Last Year Today — ${lastYearDate}\n\n${lastYear.summary.substring(0, 120)}...`;
        return (
          <>
            {/* White banner */}
            <div className="px-6 md:px-12 py-3 flex items-center gap-3 mt-8" style={{ background: '#f5f5f5' }}>
              <span className="text-[9px] font-bold text-[#1e2a3a] bg-[#1e2a3a]/10 px-2 py-0.5 rounded uppercase tracking-[0.1em]">Last Year Today</span>
              <h2 className="text-[18px] md:text-[22px] text-[#1e2a3a] leading-tight tracking-[-0.02em]" style={serif}>
                {lastYearDate}
              </h2>
            </div>

            {/* Content in card */}
            <div className="px-6 md:px-12 pt-5 pb-8">
              <div className="rounded-lg overflow-hidden" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                {/* Summary */}
                <div className="p-5 pb-4">
                  <p className="text-[14px] text-[#ccc] leading-[1.8]">{lastYear.summary}</p>
                </div>

                {/* Videos — inside card */}
                {lastYear.videos.length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {lastYear.videos.map((v, i) => (
                        <div key={i} className="rounded-md overflow-hidden" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                          <div style={{ aspectRatio: '16/9' }}>
                            <iframe
                              src={`https://www.youtube.com/embed/${v.id}`}
                              className="w-full h-full"
                              style={{ border: 'none' }}
                              allowFullScreen
                              loading="lazy"
                            />
                          </div>
                          <div className="p-2.5">
                            <p className="text-[11px] text-white font-medium leading-snug line-clamp-2">{v.title}</p>
                            <span className="text-[9px] text-[#555] mt-0.5 block">{v.channel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share row */}
                <div className="px-5 pb-4">
                  <ShareBar text={shareText} url={shareUrl} />
                </div>
              </div>
            </div>
          </>
        );
      })()}

    </>
  );
}

// ── Thread Card ──

function ThreadCard({ thread, isExpanded, onToggle, onHover }: {
  thread: TimelineThread;
  isExpanded: boolean;
  onToggle: () => void;
  onHover: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll page to content only on explicit click (not scroll sync)
  const handleSelectDate = (date: string, scrollToContent = false) => {
    setSelectedDate(date);
    if (scrollToContent) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  };

  // Group entries by date
  const grouped = groupByDate(thread.entries);
  const dates = Object.keys(grouped).sort();
  const latestEntry = grouped[dates[dates.length - 1]]?.[0];
  const catColor = categoryColor(thread.category);


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

  const xClips = allSocialClips.filter(c => c.platform === 'x' && c.embed_id);
  const allSources = selectedEntries.flatMap(e => e.sources || []);
  // Dedupe sources by URL
  const seenUrls = new Set<string>();
  const sources = allSources.filter(s => { if (seenUrls.has(s.url)) return false; seenUrls.add(s.url); return true; });

  return (
    <article className="rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a', overflow: 'hidden' }}>

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
            <div className="pt-2 pb-5">

              {/* HOW DID WE GET HERE / WHAT HAPPENED IN [YEAR] */}
              <div className="px-5">
                <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em] block mb-2">
                  {selectedDate ? `What Happened in ${getYear(selectedDate)}` : 'How Did We Get Here'}
                </span>
                <div className="p-4 rounded-lg mb-5" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                  <p className="text-[13px] text-[#ccc] leading-[1.7] italic">
                    {selectedDate
                      ? (() => {
                          const year = getYear(selectedDate);
                          const yearEntries = thread.entries.filter(e => getYear(e.date) === year);
                          const summaries = [...new Set(yearEntries.map(e => e.summary))];
                          return summaries.join(' ');
                        })()
                      : thread.summary}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[#daa520] uppercase tracking-[0.12em] block mb-2">Timeline</span>
              </div>

              {/* ═══ HORIZONTAL TIMELINE — scrollable independently ═══ */}
              <div className="mx-5 rounded-lg p-4 mb-5 timeline-scroll" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                <HorizontalTimeline
                  grouped={grouped}
                  dates={dates}
                  selectedDate={selectedDate}
                  onSelect={handleSelectDate}
                />
              </div>

              {/* Summary + video — outside scroll container */}
              <div className="px-5" ref={contentRef}>
                {selectedEntries.length > 0 && (
                  <>
                    <div className="mb-4">
                      {[...new Set(selectedEntries.map(e => e.summary))].map((s, i) => (
                        <p key={i} className="text-[13px] text-[#bbb] leading-[1.7] mb-2 last:mb-0">{s}</p>
                      ))}
                    </div>

                    {mainYtVideo && (
                      <div className="flex justify-center mb-4">
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

                    {/* Share */}
                    <ShareBar
                      text={`${thread.title} — tracked by CVRD\n\n${thread.summary.substring(0, 120)}...`}
                      url={`https://cvrdnews.com/timeline`}
                    />
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
  onSelect: (date: string, scrollToContent?: boolean) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group dates by year
  const yearGroups: { year: string; dates: string[] }[] = [];
  for (const date of dates) {
    const y = getYear(date);
    if (yearGroups.length === 0 || yearGroups[yearGroups.length - 1].year !== y) {
      yearGroups.push({ year: y, dates: [date] });
    } else {
      yearGroups[yearGroups.length - 1].dates.push(date);
    }
  }

  const YEAR_W_COLLAPSED = 200;
  const YEAR_W_EXPANDED = 600;
  const YEAR_GAP = 20;

  // Flatten all entries with their year for the scrollbar
  const allEntries = dates.map(d => ({ date: d, year: getYear(d) }));

  // Active entry index drives everything: scrollbar position, year opening, timeline scroll
  // Start with -1 = nothing open, all collapsed
  const [activeIdx, setActiveIdx] = useState(-1);
  const activeYear = activeIdx >= 0 ? (allEntries[activeIdx]?.year || '') : '';
  const openYears = new Set(activeYear ? [activeYear] : []);


  // Navigate to an entry: set active, open its year, select it, scroll timeline
  const goToEntry = (idx: number) => {
    hasInteracted.current = true;
    const clamped = Math.max(0, Math.min(allEntries.length - 1, idx));
    setActiveIdx(clamped);
    onSelect(allEntries[clamped].date, true); // load summary + video below, scroll to it
    // Scroll the timeline to center this entry's thumbnail after year transition
    setTimeout(() => {
      const date = allEntries[clamped].date;
      const el = scrollRef.current?.querySelector(`[data-date="${date}"]`);
      const container = scrollRef.current?.closest('.timeline-scroll') as HTMLElement;
      if (el && container) {
        const elRect = el.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        container.scrollTo({
          left: Math.max(0, container.scrollLeft + (elRect.left - contRect.left) - (contRect.width - elRect.width) / 2),
          behavior: 'smooth',
        });
      }
    }, 450);
  };

  // Click year label to jump to first entry in that year
  const jumpToYear = (year: string) => {
    const idx = allEntries.findIndex(e => e.year === year);
    if (idx >= 0) goToEntry(idx);
  };


  // Scroll to selected date thumbnail
  useEffect(() => {
    if (!scrollRef.current || !selectedDate) return;
    const el = scrollRef.current.querySelector(`[data-date="${selectedDate}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDate]);

  // Sync activeIdx when user scrolls the timeline directly
  // Only start syncing after user has interacted (clicked a year/entry)
  const scrollSyncLock = useRef(false);
  const hasInteracted = useRef(false);
  useEffect(() => {
    const container = scrollRef.current?.closest('.timeline-scroll') as HTMLElement | null;
    if (!container) return;
    const mountTime = Date.now();

    const onScroll = () => {
      if (!hasInteracted.current || Date.now() - mountTime < 800 || scrollSyncLock.current) return;
      const contRect = container.getBoundingClientRect();
      const centerX = contRect.left + contRect.width / 2;

      // Find the thumbnail closest to viewport center
      const thumbEls = scrollRef.current?.querySelectorAll('[data-date]');
      if (!thumbEls) return;
      let closestIdx = -1;
      let closestDist = Infinity;
      let entryCount = 0;
      for (const el of thumbEls) {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.left + rect.width / 2 - centerX);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = entryCount;
        }
        entryCount++;
      }

      // Map the DOM index to our allEntries index by matching dates
      if (closestIdx >= 0 && closestIdx < dates.length) {
        const closestDate = dates[closestIdx]; // dates array is sorted
        const entryIdx = allEntries.findIndex(e => e.date === closestDate);
        if (entryIdx >= 0 && entryIdx !== activeIdx) {
          setActiveIdx(entryIdx);
          onSelect(allEntries[entryIdx].date);
        }
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [activeIdx, dates.length]);

  // Drag on the scrollbar track to scrub through entries
  const handleBarDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = scrollRef.current?.closest('.timeline-scroll') as HTMLElement;
    if (!container || !scrollRef.current) return;

    scrollSyncLock.current = true;

    const scrub = (clientX: number) => {
      // Convert mouse X to a position in the scroll content
      const contRect = container.getBoundingClientRect();
      const contentX = clientX - contRect.left + container.scrollLeft;

      // Find which thumbnail is closest to this content X
      const thumbEls = scrollRef.current?.querySelectorAll('[data-date]');
      if (!thumbEls) return;
      let closestIdx = 0;
      let closestDist = Infinity;
      let idx = 0;
      for (const el of thumbEls) {
        const elLeft = (el as HTMLElement).offsetLeft;
        const elW = (el as HTMLElement).offsetWidth;
        // offsetLeft is relative to offsetParent, need to walk up to scrollRef
        const rect = el.getBoundingClientRect();
        const elCenterInContent = rect.left - contRect.left + container.scrollLeft + rect.width / 2;
        const dist = Math.abs(elCenterInContent - contentX);
        if (dist < closestDist) { closestDist = dist; closestIdx = idx; }
        idx++;
      }
      if (closestIdx < allEntries.length) {
        setActiveIdx(closestIdx);
        // Scroll to keep the entry visible
        const date = allEntries[closestIdx]?.date;
        const el = scrollRef.current?.querySelector(`[data-date="${date}"]`);
        if (el) {
          const elRect = el.getBoundingClientRect();
          if (elRect.left < contRect.left || elRect.right > contRect.right) {
            container.scrollTo({
              left: Math.max(0, container.scrollLeft + (elRect.left - contRect.left) - contRect.width / 2 + elRect.width / 2),
            });
          }
        }
      }
    };

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    scrub(startX);

    const onMove = (me: MouseEvent | TouchEvent) => {
      const cx = 'touches' in me ? me.touches[0].clientX : me.clientX;
      scrub(cx);
    };
    const onEnd = () => {
      scrollSyncLock.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);
  };

  let globalIdx = 0;

  return (
    <div>
      <div ref={scrollRef}>
        <div className="flex min-w-max" style={{ gap: YEAR_GAP }}>
        {yearGroups.map((yg) => {
          const isOpen = openYears.has(yg.year);
          const startIdx = globalIdx;
          const count = yg.dates.length;
          const gap = 4;
          const activeW = isOpen ? YEAR_W_EXPANDED : YEAR_W_COLLAPSED;
          const thumbW = Math.floor((activeW - (count - 1) * gap) / count);
          globalIdx += count;

          return (
            <div key={yg.year} data-year={yg.year}
              className="shrink-0 cursor-pointer"
              style={{ width: activeW, transition: 'width 0.4s ease' }}
              onClick={() => jumpToYear(yg.year)}>

              {/* Year + bracket */}
              <div className="text-center mb-1.5">
                <span className="font-bold text-[#daa520]" style={{ fontSize: isOpen ? 14 : 11, transition: 'font-size 0.3s' }}>{yg.year}</span>
              </div>
              <div className="flex items-start mb-1.5 mx-1">
                <div style={{ width: 2, height: isOpen ? 10 : 6, background: '#daa520', opacity: isOpen ? 0.6 : 0.3, transition: 'all 0.3s' }} />
                <div className="flex-1" style={{ height: 2, background: '#daa520', opacity: isOpen ? 0.6 : 0.3, transition: 'opacity 0.3s' }} />
                <div style={{ width: 2, height: isOpen ? 10 : 6, background: '#daa520', opacity: isOpen ? 0.6 : 0.3, transition: 'all 0.3s' }} />
              </div>

              {/* Collapsed: cropped thumbnails row — fixed width based on collapsed size */}
              <div className="flex overflow-hidden rounded" style={{ gap, height: isOpen ? 0 : 70, opacity: isOpen ? 0 : 0.75, transition: 'all 0.3s ease' }}>
                {yg.dates.map((date, di) => {
                  const thumb = grouped[date]?.[0]?.image_file;
                  const collapsedThumbW = Math.floor((YEAR_W_COLLAPSED - (count - 1) * gap) / count);
                  return (
                    <div key={di} className="overflow-hidden rounded" style={{ width: collapsedThumbW, height: 70, flexShrink: 0 }}>
                      {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: '#2a3a4a' }} />}
                    </div>
                  );
                })}
              </div>

              {/* Expanded: full thumbnails with labels */}
              <div style={{ maxHeight: isOpen ? 500 : 0, opacity: isOpen ? 1 : 0, overflow: isOpen ? 'visible' : 'hidden', transition: 'max-height 0.4s ease, opacity 0.4s ease' }}>
                <div className="flex" style={{ gap, padding: '8px 6px' }}>
                  {yg.dates.map((date, di) => {
                    const dayEntries = grouped[date];
                    const isSelected = date === selectedDate;
                    const isEven = (startIdx + di) % 2 === 0;
                    const topic = dayEntries[0]?.topic || '';

                    return (
                      <div key={date} data-date={date} className="flex flex-col items-center" style={{ width: thumbW }}>
                        {/* Top: even=topic, odd=date+dot */}
                        <div className="text-center overflow-hidden" style={{ height: 22, marginBottom: 2 }}>
                          {isEven ? (
                            <p className="text-[7px] leading-tight line-clamp-1" style={{ color: isSelected ? '#daa520' : '#e0e0e0' }}>{topic}</p>
                          ) : (
                            <>
                              <span className="text-[7px] whitespace-nowrap font-semibold block" style={{ color: isSelected ? '#daa520' : '#e0e0e0' }}>{formatDateDay(date)}</span>
                              <div className="mx-auto" style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#daa520' : '#e0e0e0', marginTop: 1 }} />
                            </>
                          )}
                        </div>

                        {/* Thumbnail — selected entry pops up bigger */}
                        <button onClick={(e) => { e.stopPropagation(); onSelect(date, true); }}
                          className="w-full rounded overflow-hidden cursor-pointer"
                          style={{
                            height: 70,
                            border: isSelected ? '2px solid #daa520' : '1px solid rgba(255,255,255,0.1)',
                            opacity: isSelected ? 1 : 0.7,
                            transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                            boxShadow: isSelected ? '0 4px 16px rgba(218,165,32,0.4)' : 'none',
                            zIndex: isSelected ? 5 : 1,
                            position: 'relative',
                            transition: 'all 0.25s ease',
                          }}>
                          {dayEntries[0]?.image_file ? (
                            <img src={dayEntries[0].image_file} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full" style={{ background: '#2a3a4a' }} />
                          )}
                        </button>

                        {/* Bottom: even=dot+date, odd=topic */}
                        <div className="text-center overflow-hidden" style={{ height: 22, marginTop: 2 }}>
                          {isEven ? (
                            <>
                              <div className="mx-auto" style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#daa520' : '#e0e0e0', marginBottom: 1 }} />
                              <span className="text-[7px] whitespace-nowrap font-semibold block" style={{ color: isSelected ? '#daa520' : '#e0e0e0' }}>{formatDateDay(date)}</span>
                            </>
                          ) : (
                            <p className="text-[7px] leading-tight line-clamp-1" style={{ color: isSelected ? '#daa520' : '#e0e0e0' }}>{topic}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ SCROLLBAR — full content width, dots below thumbnails, draggable ═══ */}
      <div className="relative mt-3 flex min-w-max" style={{ height: 14, gap: YEAR_GAP }}
        onMouseDown={handleBarDrag} onTouchStart={handleBarDrag}>
        {yearGroups.map((yg) => {
          const isOpen = openYears.has(yg.year);
          const yearW = isOpen ? YEAR_W_EXPANDED : YEAR_W_COLLAPSED;
          const count = yg.dates.length;
          const gap = 4;
          const thumbW = Math.floor((yearW - (count - 1) * gap) / count);
          const startIdx = allEntries.findIndex(e => e.year === yg.year);

          return (
            <div key={yg.year} className="shrink-0 relative" style={{ width: yearW, transition: 'width 0.4s ease' }}>
              {/* Track line */}
              <div style={{
                position: 'absolute', top: '50%', left: 0, width: '100%',
                height: isOpen ? 4 : 2, transform: 'translateY(-50%)',
                background: isOpen ? 'rgba(218,165,32,0.3)' : 'rgba(218,165,32,0.12)',
                borderRadius: 2, transition: 'height 0.2s, background 0.2s',
              }} />
              {/* Entry dots — positioned to align with thumbnails above */}
              {yg.dates.map((_, di) => {
                const entryIdx = startIdx + di;
                const isActive = entryIdx === activeIdx;
                // Center of each thumbnail: offset from year start
                const dotX = di * (thumbW + gap) + thumbW / 2;
                return (
                  <div key={di}
                    onClick={(e) => { e.stopPropagation(); goToEntry(entryIdx); }}
                    style={{
                      position: 'absolute', left: dotX, top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: isActive ? 8 : 3, height: isActive ? 8 : 3,
                      borderRadius: '50%',
                      background: isActive ? '#daa520' : 'rgba(218,165,32,0.35)',
                      boxShadow: isActive ? '0 0 6px rgba(218,165,32,0.5)' : 'none',
                      transition: 'all 0.15s', cursor: 'pointer', zIndex: isActive ? 10 : 1,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

// ── Timeline sub-components ──

function TimelineThumb({ date, entries, isSelected, onSelect }: {
  date: string; entries: ThreadEntry[]; isSelected: boolean; onSelect: (d: string, scrollToContent?: boolean) => void;
}) {
  const thumb = entries[0]?.image_file;
  const entryCount = entries.length;
  const hasVideo = entries.some(e =>
    (e.youtube_videos?.length || 0) > 0 ||
    (e.social_clips || []).some(c => c.duration || c.platform === 'tiktok')
  );

  return (
    <button onClick={() => onSelect(date, true)}
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

// ── Share Bar ──

function ShareBar({ text, url }: { text: string; url: string }) {
  const encoded = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  return (
    <div className="flex items-center gap-1.5 pt-3" style={{ borderTop: '1px solid #2a3a4a' }}>
      <span className="text-[8px] uppercase tracking-[0.12em] text-[#555] shrink-0 mr-1">Share</span>
      {[
        { svg: <span className="text-[11px] font-bold text-white/50">&#x1D54F;</span>, href: `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}` },
        { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4500" opacity={0.5}><circle cx="12" cy="12" r="12"/></svg>, href: `https://www.reddit.com/submit?title=${encoded}&url=${encodedUrl}` },
        { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.13 1.6 5.93L0 24l6.26-1.64A11.93 11.93 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>, href: `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}` },
        { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#E60023" opacity={0.5}><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>, href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encoded}` },
        { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#1877F2" opacity={0.5}><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"/></svg>, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
        { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2" opacity={0.5}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
        { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#999" opacity={0.5}><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>, href: '#', onClick: () => { navigator.clipboard.writeText(url); } },
        { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0085ff" opacity={0.5}><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>, href: `https://bsky.app/intent/compose?text=${encodeURIComponent(text + '\n\n' + url)}` },
      ].map((s, j) => (
        <a key={j} href={s.href} target="_blank" rel="noreferrer" className="p-1.5 rounded transition-opacity hover:opacity-100 opacity-70"
          onClick={(s as any).onClick ? (e: any) => { e.preventDefault(); (s as any).onClick(); } : undefined}>
          {s.svg}
        </a>
      ))}
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
