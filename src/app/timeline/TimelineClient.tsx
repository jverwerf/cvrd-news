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


function cleanDate(dateStr: string): string {
  // Strip suffixes like "_engagement" from dates
  return dateStr.replace(/_.*$/, '');
}

function formatDate(dateStr: string): string {
  const d = new Date(cleanDate(dateStr) + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateDay(dateStr: string): string {
  const d = new Date(cleanDate(dateStr) + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getYear(dateStr: string): string {
  return dateStr.substring(0, 4);
}

function formatDateFull(dateStr: string): string {
  const d = new Date(cleanDate(dateStr) + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getMonth(dateStr: string): string {
  return cleanDate(dateStr).substring(0, 7); // "YYYY-MM"
}

function formatMonthLabel(monthKey: string): string {
  const d = new Date(monthKey + '-01T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short' });
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
.tl-mobile-accordion { display: none; }
@media (max-width: 600px) {
  .tl-card-vids { display: none !important; }
  .tl-main-video { display: none !important; }
  .tl-x-embeds { display: none !important; }
  .tl-split-layout { display: none !important; }
  .tl-mobile-accordion { display: block !important; }
}
`;

export function TimelineContent({ threads, generatedAt, lastYear, tenYearsAgo }: { threads: TimelineThread[]; generatedAt: string; lastYear?: TodayLastYearData | null; tenYearsAgo?: TodayLastYearData | null }) {
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Most Recent = sorted by last activity; Catch Me Up = sorted by biggest/longest-running
  const recentThreads = [...threads].sort((a, b) => b.last_seen.localeCompare(a.last_seen));
  const catchMeUpThreads = [...threads].sort((a, b) => b.total_days_span - a.total_days_span || b.days_covered - a.days_covered);

  const filtered = (filter === 'all' ? recentThreads : recentThreads.filter(t => t.category === filter))
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.entries.some(e => (e.topic || '').toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TIMELINE_SCROLL_CSS }} />


      {(lastYear?.summary || tenYearsAgo?.summary) && (
        <>
          <div className="px-6 md:px-12 py-3" style={{ borderTop: '1px solid #2a3a4a', borderBottom: '1px solid #2a3a4a' }}>
            <div className="grid grid-cols-2 gap-3">
              {lastYear && lastYear.summary && (() => {
                const lastYearDate = new Date(lastYear.date_last_year + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const imgSrc = (lastYear.image_file?.startsWith('http') ? lastYear.image_file : null)
                  || (lastYear as any).videos?.[0]?.thumbnail
                  || (lastYear.stories as any)?.flatMap((s: any) => s.videos || []).find((v: any) => v.thumbnail)?.thumbnail
                  || null;
                const storySummaries = (lastYear.stories || []).slice(0, 2).map(s => s.headline).join('. ') + '.';
                return (
                  <a href="/timeline/last-year" className="rounded-lg overflow-hidden block group" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                    {imgSrc && (
                      <div style={{ width: '100%', height: 140, backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    )}
                    <div className="p-3">
                      <span className="text-[8px] font-bold text-[#daa520] uppercase tracking-[0.1em]">1 Year Ago — {lastYearDate}</span>
                      <h3 className="text-[17px] text-white font-medium leading-snug mt-1 group-hover:text-[#60a5fa] transition-colors line-clamp-2" style={serif}>{lastYear.title || lastYear.stories?.[0]?.headline || 'This Day Last Year'}</h3>
                      <p className="text-[10px] text-[#999] leading-[1.4] line-clamp-2 mt-0.5">{storySummaries || lastYear.summary.split('. ').slice(0, 2).join('. ') + '.'}</p>
                    </div>
                  </a>
                );
              })()}
              {tenYearsAgo && tenYearsAgo.summary && (() => {
                const tenYearsDate = new Date(tenYearsAgo.date_last_year + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const imgSrc = (tenYearsAgo.image_file?.startsWith('http') ? tenYearsAgo.image_file : null)
                  || (tenYearsAgo as any).videos?.[0]?.thumbnail
                  || (tenYearsAgo.stories as any)?.flatMap((s: any) => s.videos || []).find((v: any) => v.thumbnail)?.thumbnail
                  || null;
                const storySummaries = (tenYearsAgo.stories || []).slice(0, 2).map(s => s.headline).join('. ') + '.';
                return (
                  <a href="/timeline/ten-years-ago" className="rounded-lg overflow-hidden block group" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
                    {imgSrc && (
                      <div style={{ width: '100%', height: 140, backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    )}
                    <div className="p-3">
                      <span className="text-[8px] font-bold text-[#daa520] uppercase tracking-[0.1em]">10 Years Ago — {tenYearsDate}</span>
                      <h3 className="text-[13px] text-white font-medium leading-snug mt-1 group-hover:text-[#60a5fa] transition-colors line-clamp-2" style={serif}>{tenYearsAgo.title || tenYearsAgo.stories?.[0]?.headline || 'This Day 10 Years Ago'}</h3>
                      <p className="text-[10px] text-[#999] leading-[1.4] line-clamp-2 mt-0.5">{storySummaries || tenYearsAgo.summary.split('. ').slice(0, 2).join('. ') + '.'}</p>
                    </div>
                  </a>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Search + Thread list */}
      <div className="px-6 md:px-12 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 180 }}>
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
          {(() => {
            const activeCats = new Set(threads.map(t => t.category));
            const visibleCats = CATEGORIES.filter(c => c.value === 'all' || activeCats.has(c.value));
            if (visibleCats.length <= 2) return null;
            return (
              <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
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
        </div>

        <div className="space-y-3">
        <div className="space-y-3">
        {filtered.map(thread => {
          const latestEntry = thread.entries[thread.entries.length - 1];
          const catColor = categoryColor(thread.category);
          const allVids = thread.entries.flatMap(e => e.youtube_videos || []);
          const seenVids = new Set<string>();
          const vids = allVids.filter((v: any) => { const id = v.embed_id || v.id; if (seenVids.has(id)) return false; seenVids.add(id); return true; }).slice(0, 3);
          return (
            <a key={thread.id} href={`/timeline/${thread.id}`}
              className="rounded-lg overflow-hidden block group transition-all hover:opacity-90"
              style={{ background: '#253545', border: '1px solid #2a3a4a' }}>
              <div className="flex" style={{ minHeight: 120 }}>
                {(thread.image_file || latestEntry?.image_file) && (
                  <div className="w-[140px] shrink-0 overflow-hidden" style={{
                    backgroundImage: `url(${thread.image_file || latestEntry.image_file})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                )}
                <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-bold uppercase tracking-[0.1em]" style={{ color: catColor }}>{thread.category}</span>
                  </div>
                  <h2 className="text-[13px] text-white font-medium leading-snug mb-0.5 group-hover:text-[#60a5fa] transition-colors line-clamp-1" style={serif}>
                    {thread.title}
                  </h2>
                  <p className="text-[10px] text-[#999] leading-[1.4] line-clamp-2">{thread.summary}</p>
                </div>
                {vids.length > 0 && (
                  <div className="flex gap-1 p-2 shrink-0 items-center tl-card-vids">
                    {vids.map((v: any, i: number) => (
                      <div key={i} className="w-[100px] rounded overflow-hidden relative" style={{ background: '#1e2a3a' }}>
                        <img src={`https://img.youtube.com/vi/${v.embed_id || v.id}/mqdefault.jpg`} alt="" className="w-full h-[56px] object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-80">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                        <p className="text-[7px] text-[#999] px-1 py-0.5 line-clamp-1">{v.channel || ''}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </a>
          );
        })}
        </div>

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

export function ThreadCard({ thread, isExpanded, onToggle, onHover }: {
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

  const seenXIds = new Set<string>();
  const xClips = allSocialClips.filter(c => {
    if (c.platform !== 'x' || !c.embed_id) return false;
    if (seenXIds.has(c.embed_id)) return false;
    seenXIds.add(c.embed_id);
    return true;
  });
  const allSources = selectedEntries.flatMap(e => e.sources || []);
  // Dedupe sources by URL
  const seenUrls = new Set<string>();
  const sources = allSources.filter(s => { if (seenUrls.has(s.url)) return false; seenUrls.add(s.url); return true; });

  const selectedYear = selectedDate ? getYear(selectedDate) : null;
  const yearSummary = selectedYear
    ? (() => {
        const yearEntries = dates.filter(d => getYear(d) === selectedYear).flatMap(d => grouped[d] || []);
        return [...yearEntries].sort((a, b) => b.summary.length - a.summary.length)[0]?.summary || thread.summary;
      })()
    : thread.summary;

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: TIMELINE_SCROLL_CSS }} />
    {isExpanded && (
      <div className="rounded-lg mb-3" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a', padding: '14px 18px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={selectedYear || '__default'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#daa520', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>
              {selectedYear ? `What Happened in ${selectedYear}` : 'How Did We Get Here'}
            </span>
            <p style={{ fontSize: 13, color: '#ccc', lineHeight: 1.7, fontStyle: 'italic' }}>{yearSummary}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    )}
    <article className="rounded-lg" style={{ background: '#253545', border: '1px solid #2a3a4a', overflow: 'hidden' }}>

      {/* COLLAPSED — image left, content right */}
      <button onClick={onToggle} className="w-full text-left cursor-pointer group">
        <div className="flex">
          {/* Large image — hide when expanded */}
          {!isExpanded && (thread.image_file || latestEntry?.image_file) && (
            <div className="w-36 md:w-48 shrink-0 overflow-hidden" style={{
              backgroundImage: `url(${thread.image_file || latestEntry.image_file})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: 90,
            }} />
          )}

          {/* Content */}
          <div className="flex-1 px-4 py-3 flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: catColor }}>
                {thread.category}
              </span>
            </div>

            <a href={`/timeline/${thread.id}`} onClick={(e) => e.stopPropagation()}
              className="text-[16px] md:text-[18px] text-white leading-tight tracking-[-0.02em] mb-1 group-hover:text-[#daa520] transition-colors block hover:underline" style={serif}>
              {thread.title}
            </a>

            {!isExpanded && (
              <p className="text-[11px] text-[#888] leading-[1.5] line-clamp-1">
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
            {/* ═══ SPLIT LAYOUT: timeline left, content right ═══ */}
            <div className="tl-split-layout" style={{ display: 'flex', height: 600, flexShrink: 0 }}>

              {/* ── LEFT: Vertical Timeline ── */}
              <div className="tl-split-left" style={{ width: 220, flexShrink: 0, borderRight: '1px solid #2a3a4a', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '12px 12px 4px', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#daa520', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Timeline</span>
                </div>
                <VerticalTimeline
                  grouped={grouped}
                  dates={dates}
                  selectedDate={selectedDate}
                  onSelect={handleSelectDate}
                />
              </div>

              {/* ── RIGHT: Content ── */}
              <div ref={contentRef} style={{ flex: 1, minWidth: 0, padding: '14px 20px', overflowY: 'auto', height: '100%' }}>
                <AnimatePresence mode="wait">
                  {selectedDate && selectedEntries.length > 0 ? (
                    <motion.div
                      key={selectedDate}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Date + topic */}
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#daa520', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          {formatDateFull(selectedDate)}
                        </span>
                        <h3 style={{ fontSize: 17, color: '#fff', lineHeight: 1.3, marginTop: 4, ...serif }}>
                          {selectedEntries[0].topic}
                        </h3>
                      </div>

                      {(() => {
                        const best = [...selectedEntries].sort((a, b) => b.summary.length - a.summary.length)[0]?.summary;
                        return best ? <p style={{ fontSize: 13, color: '#bbb', lineHeight: 1.7 }}>{best}</p> : null;
                      })()}

                      <div style={{ borderBottom: '1px solid #2a3a4a' }} />

                      {/* YouTube */}
                      {mainYtVideo && (
                        <div className="tl-main-video" style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9' }}>
                          <iframe
                            key={mainYtVideo.embed_id}
                            src={`https://www.youtube.com/embed/${mainYtVideo.embed_id}`}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            allowFullScreen
                          />
                        </div>
                      )}

                      {/* X embeds */}
                      {xClips.length > 0 && (
                        <div className="rounded-lg p-4 tl-x-embeds" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[16px] font-bold text-white">&#x1D54F;</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
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

                      {/* Share */}
                      <ShareBar
                        text={`${thread.title} — tracked by CVRD\n\n${thread.summary.substring(0, 120)}...`}
                        url={`https://cvrdnews.com/timeline`}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="__empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p style={{ fontSize: 13, color: '#555', fontStyle: 'italic' }}>Select a date from the timeline.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          {/* ═══ MOBILE ACCORDION ═══ */}
          <div className="tl-mobile-accordion" style={{ display: 'none' }}>
            <MobileAccordion grouped={grouped} dates={dates} />
          </div>

          </motion.div>
        )}
      </AnimatePresence>
    </article>
    </>
  );
}

// ── Vertical Timeline (mobile) ──

function VerticalTimeline({ grouped, dates, selectedDate, onSelect }: {
  grouped: Record<string, ThreadEntry[]>;
  dates: string[];
  selectedDate: string | null;
  onSelect: (date: string, scrollToContent?: boolean) => void;
}) {
  type MonthGroup = { month: string; dates: string[] };
  type YearGroup = { year: string; monthGroups: MonthGroup[] };
  const yearGroups: YearGroup[] = [];
  for (const date of dates) {
    const y = getYear(date);
    const m = getMonth(date);
    if (yearGroups.length === 0 || yearGroups[yearGroups.length - 1].year !== y) {
      yearGroups.push({ year: y, monthGroups: [{ month: m, dates: [date] }] });
    } else {
      const yg = yearGroups[yearGroups.length - 1];
      if (yg.monthGroups[yg.monthGroups.length - 1].month !== m) {
        yg.monthGroups.push({ month: m, dates: [date] });
      } else {
        yg.monthGroups[yg.monthGroups.length - 1].dates.push(date);
      }
    }
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const btn = selectedBtnRef.current;
    if (!container || !btn) return;
    container.scrollTo({ top: btn.offsetTop - container.offsetTop, behavior: 'smooth' });
  }, [selectedDate]);

  return (
    <div ref={containerRef} className="tl-vlist" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
      {yearGroups.map((yg) => (
        <div key={yg.year}>
          {/* Year separator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 4px' }}>
            <div style={{ flex: 1, height: 1, background: '#daa520', opacity: 0.25 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#daa520', opacity: 0.7, letterSpacing: '0.1em' }}>{yg.year}</span>
            <div style={{ flex: 1, height: 1, background: '#daa520', opacity: 0.25 }} />
          </div>

          {yg.monthGroups.map((mg) => (
            <div key={mg.month}>
              {yg.monthGroups.length > 1 && (
                <div style={{ padding: '4px 12px 2px' }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#daa520', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {formatMonthLabel(mg.month)}
                  </span>
                </div>
              )}
              {mg.dates.map((date) => {
                const entries = grouped[date];
                const isSelected = date === selectedDate;
                const topic = entries?.[0]?.topic || '';
                const thumb = entries?.[0]?.image_file;
                return (
                  <button
                    key={date}
                    ref={isSelected ? selectedBtnRef : null}
                    onClick={() => onSelect(date)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '7px 12px',
                      background: isSelected ? 'rgba(218,165,32,0.1)' : 'transparent',
                      border: 'none',
                      borderLeft: isSelected ? '3px solid #daa520' : '3px solid transparent',
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                    <div style={{ width: 52, height: 38, borderRadius: 4, overflow: 'hidden', flexShrink: 0, border: isSelected ? '1px solid rgba(218,165,32,0.5)' : '1px solid rgba(255,255,255,0.06)' }}>
                      {thumb
                        ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isSelected ? 1 : 0.65 }} />
                        : <div style={{ width: '100%', height: '100%', background: '#2a3a4a' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 8, fontWeight: 600, color: isSelected ? '#daa520' : '#666', marginBottom: 2 }}>
                        {formatDateDay(date)}
                      </span>
                      <span style={{ display: 'block', fontSize: 11, color: isSelected ? '#fff' : '#aaa', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {topic}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Mobile Accordion (phone expanded view) ──

function MobileAccordion({ grouped, dates }: {
  grouped: Record<string, ThreadEntry[]>;
  dates: string[];
}) {
  const [openDate, setOpenDate] = useState<string | null>(null);

  return (
    <div>
      {[...dates].reverse().map((date) => {
        const entries = grouped[date];
        const isOpen = openDate === date;
        const topic = entries[0]?.topic || '';
        const thumb = entries[0]?.image_file;
        const best = [...entries].sort((a, b) => b.summary.length - a.summary.length)[0]?.summary;
        const ytVideo = entries.flatMap(e => e.youtube_videos || []).find(v => v.embed_id);

        return (
          <div key={date} style={{ borderBottom: '1px solid #2a3a4a' }}>

            {/* Row header */}
            <button
              onClick={() => setOpenDate(isOpen ? null : date)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '11px 14px',
                background: isOpen ? 'rgba(218,165,32,0.07)' : 'transparent',
                border: 'none',
                borderLeft: isOpen ? '3px solid #daa520' : '3px solid transparent',
                cursor: 'pointer', textAlign: 'left',
              }}>
              {thumb && (
                <div style={{ width: 60, height: 48, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isOpen ? 1 : 0.7 }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 9, fontWeight: 700, color: '#daa520', letterSpacing: '0.1em', marginBottom: 3 }}>
                  {formatDateFull(date)}
                </span>
                <span style={{ display: 'block', fontSize: 14, color: isOpen ? '#fff' : '#ccc', lineHeight: 1.3, ...serif }}>
                  {topic}
                </span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div style={{ padding: '4px 14px 16px 14px', borderLeft: '3px solid #daa520' }}>
                {best && (
                  <p style={{ fontSize: 13, color: '#bbb', lineHeight: 1.7, marginBottom: ytVideo ? 14 : 0 }}>{best}</p>
                )}
                {ytVideo && (
                  <div style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytVideo.embed_id}`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
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
  // First pass: bucket by date
  const raw: Record<string, ThreadEntry[]> = {};
  for (const entry of entries) {
    if (!raw[entry.date]) raw[entry.date] = [];
    raw[entry.date].push(entry);
  }

  // Second pass: within each date, merge only entries with the SAME topic
  // (pipeline duplicate runs) — different topics on the same date stay separate
  const merged: Record<string, ThreadEntry[]> = {};
  for (const [date, dayEntries] of Object.entries(raw)) {
    // Group by topic
    const byTopic: Record<string, ThreadEntry[]> = {};
    for (const entry of dayEntries) {
      const key = (entry.topic || '').trim().toLowerCase();
      if (!byTopic[key]) byTopic[key] = [];
      byTopic[key].push(entry);
    }

    merged[date] = Object.values(byTopic).map(topicEntries => {
      if (topicEntries.length === 1) return topicEntries[0];

      // Multiple entries for the same date+topic: merge them
      const base = [...topicEntries].sort((a, b) => b.summary.length - a.summary.length)[0];

      const seenVids = new Set<string>();
      const youtube_videos = topicEntries.flatMap(e => e.youtube_videos || []).filter(v => {
        const id = v.embed_id || (v as any).id;
        if (!id || seenVids.has(id)) return false;
        seenVids.add(id); return true;
      });

      const seenClips = new Set<string>();
      const social_clips = topicEntries.flatMap(e => e.social_clips || []).filter(c => {
        const key = `${c.platform}:${c.embed_id || c.url}`;
        if (seenClips.has(key)) return false;
        seenClips.add(key); return true;
      });

      const seenUrls = new Set<string>();
      const sources = topicEntries.flatMap(e => e.sources || []).filter(s => {
        if (seenUrls.has(s.url)) return false;
        seenUrls.add(s.url); return true;
      });

      return { ...base, youtube_videos, social_clips, sources };
    });
  }

  return merged;
}
