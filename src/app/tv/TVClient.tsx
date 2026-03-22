"use client";

import { useState, useEffect, useRef } from "react";
import type { NarrativeGap } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const CHANNELS = [
  { id: 'daily', label: 'Daily Pick', sub: 'Today\'s top stories', color: '#3b82f6' },
  { id: 'world', label: 'World', sub: 'Global affairs', color: '#60a5fa' },
  { id: 'politics', label: 'Politics', sub: 'Left. Right. Uncovered.', color: '#818cf8' },
  { id: 'markets-crypto', label: 'Markets', sub: 'Crypto & finance', color: '#38bdf8' },
  { id: 'tech-ai', label: 'Tech & AI', sub: 'The frontier', color: '#93c5fd' },
  { id: 'culture', label: 'Culture', sub: 'Society & stories', color: '#a5b4fc' },
  { id: 'unfiltered', label: 'Unfiltered', sub: 'What they won\'t cover', color: '#7dd3fc' },
] as const;

export function TVClient({
  allStories,
  videoUrl,
  videoDate,
}: {
  allStories: NarrativeGap[];
  videoUrl?: string;
  videoDate?: string;
}) {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [entered, setEntered] = useState(false);

  // Staggered reveal on mount
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Keyboard nav for TV remote
  useEffect(() => {
    if (activeChannel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setFocusedIdx(p => Math.min(p + 1, CHANNELS.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setFocusedIdx(p => Math.max(p - 1, 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        setActiveChannel(CHANNELS[focusedIdx].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeChannel, focusedIdx]);

  const getStories = (channelId: string) => {
    if (channelId === 'daily') {
      const top = allStories.filter(s => s.is_top_story);
      return top.length >= 10 ? top : allStories.slice(0, 10);
    }
    const filtered = allStories.filter(s => s.category === channelId);
    return filtered.length > 0 ? filtered : allStories.filter(s => !s.category);
  };

  // ── Landing screen ──
  if (!activeChannel) {
    return (
      <div className="tv-landing" style={{
        background: '#0a1018',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'var(--font-dm), -apple-system, sans-serif',
      }}>

        {/* Clean dark background — no gradients, no overlays */}

        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* Top bar — signal indicator + time */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '24px 40px 0',
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                animation: 'tvPulse 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
                Live Signal
              </span>
            </div>
            <TVClock />
          </div>

          {/* Center content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, paddingBottom: '40px' }}>

            {/* Logo */}
            <div style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'scale(1)' : 'scale(0.9)',
              transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
              marginBottom: '8px',
            }}>
              <img src="/logo3.png" alt="CVRD" style={{
                height: '80px',
                filter: 'none',
              }} />
            </div>

            {/* Tagline */}
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.25em', textTransform: 'uppercase',
              fontWeight: 400, marginBottom: '48px',
              opacity: entered ? 1 : 0,
              transition: 'opacity 1s ease 0.5s',
            }}>
              Your streaming platform to cover the news
            </p>

            {/* Channel strip — horizontal, editorial */}
            <div style={{
              display: 'flex', alignItems: 'stretch', gap: '2px',
              maxWidth: '1100px', width: '90%',
              opacity: entered ? 1 : 0,
              transform: entered ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
            }}>
              {CHANNELS.map((ch, i) => {
                const count = ch.id === 'daily'
                  ? (allStories.filter(s => s.is_top_story).length >= 10 ? allStories.filter(s => s.is_top_story).length : Math.min(allStories.length, 10))
                  : allStories.filter(s => s.category === ch.id).length;
                const isFocused = focusedIdx === i;
                const isFirst = ch.id === 'daily';

                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    onMouseEnter={() => setFocusedIdx(i)}
                    className="tv-channel-btn"
                    style={{
                      flex: isFocused ? 2.2 : 1,
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      padding: isFocused ? '20px 24px' : '16px 14px',
                      background: isFocused
                        ? `linear-gradient(170deg, ${ch.color}18, ${ch.color}08 50%, rgba(10,16,24,0.95))`
                        : 'rgba(255,255,255,0.02)',
                      border: 'none', cursor: 'pointer',
                      borderTop: isFocused ? `2px solid ${ch.color}` : '2px solid transparent',
                      borderRadius: '4px',
                      minHeight: '160px',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      textAlign: 'left',
                      animationDelay: `${0.5 + i * 0.08}s`,
                    }}
                  >
                    {/* Hover glow */}
                    {isFocused && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '80px',
                        background: `linear-gradient(180deg, ${ch.color}12, transparent)`,
                        pointerEvents: 'none',
                      }} />
                    )}

                    {/* Count badge */}
                    {count > 0 && (
                      <div style={{
                        position: 'absolute', top: isFocused ? 16 : 12, right: isFocused ? 20 : 12,
                        fontSize: 10, fontWeight: 600, color: isFocused ? ch.color : 'rgba(255,255,255,0.15)',
                        fontVariantNumeric: 'tabular-nums',
                        transition: 'all 0.3s ease',
                      }}>
                        {count}
                      </div>
                    )}

                    {/* Channel number */}
                    <span style={{
                      fontSize: isFocused ? 11 : 10,
                      color: isFocused ? ch.color : 'rgba(255,255,255,0.12)',
                      fontWeight: 500, letterSpacing: '0.05em',
                      marginBottom: '8px',
                      fontVariantNumeric: 'tabular-nums',
                      transition: 'all 0.3s ease',
                    }}>
                      CH{String(i + 1).padStart(2, '0')}
                    </span>

                    {/* Label — Instrument Serif for focused */}
                    <span style={{
                      fontSize: isFocused ? 22 : 14,
                      fontFamily: isFocused ? "'Instrument Serif', Georgia, serif" : 'inherit',
                      fontWeight: isFocused ? 400 : 600,
                      color: isFocused ? '#fff' : 'rgba(255,255,255,0.45)',
                      lineHeight: 1.1,
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      marginBottom: '4px',
                    }}>
                      {ch.label}
                    </span>

                    {/* Subtitle — only when focused */}
                    <span style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.3)',
                      fontWeight: 400,
                      opacity: isFocused ? 1 : 0,
                      maxHeight: isFocused ? '20px' : '0',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                    }}>
                      {ch.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Headline preview — shows first story of focused channel */}
            <HeadlinePreview stories={allStories} channelId={CHANNELS[focusedIdx].id} color={CHANNELS[focusedIdx].color} entered={entered} />
          </div>

          {/* Bottom bar */}
          <div style={{
            padding: '0 40px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            opacity: entered ? 1 : 0,
            transition: 'opacity 0.8s ease 0.8s',
          }}>
            <a href="/" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textDecoration: 'none' }}>
              ← Back to cvrdnews.com
            </a>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.05em' }}>
              ← → Navigate &middot; Enter to select
            </span>
          </div>
        </div>

        {/* Auto-refresh */}
        <meta httpEquiv="refresh" content="300" />

        <style>{`
          @keyframes tvPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .tv-channel-btn:hover {
            background: rgba(255,255,255,0.04) !important;
          }
        `}</style>
      </div>
    );
  }

  // ── Dashboard view ──
  const stories = getStories(activeChannel);
  const channel = CHANNELS.find(c => c.id === activeChannel)!;
  return (
    <div style={{ background: '#000000', height: '100vh', overflow: 'hidden', cursor: 'none' }}>
      {/* Ghost logo */}
      <img src="/logo3.png" alt="CVRD" className="fixed left-1/2 top-1/2 pointer-events-none"
        style={{ transform: 'translate(-50%, -50%)', height: '300px', zIndex: 101, opacity: 0.08, filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.3))' }} />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 h-10 flex items-center overflow-hidden" style={{ background: '#111', zIndex: 100 }}>
        <button
          onClick={() => setActiveChannel(null)}
          className="shrink-0 px-4 h-full flex items-center gap-2 hover:bg-white/5 transition-colors"
          style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
        >
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>←</span>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: channel.color }}>
            {channel.label}
          </span>
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-8 animate-[ticker_180s_linear_infinite] whitespace-nowrap pl-4">
            {[...stories, ...stories, ...stories].map((s, i) => (
              <span key={i} className="flex items-center gap-2 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: channel.color }} />
                <span className="text-[12px] text-white/70 font-medium">{s.topic}</span>
                <span className="text-[#333] ml-2">&middot;</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ paddingTop: '40px', height: '100vh' }}>
        <ErrorBoundary>
          <Dashboard
            stories={stories}
            tvMode
          />
        </ErrorBoundary>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}

/** Shows a rotating headline from the focused channel */
function HeadlinePreview({ stories, channelId, color, entered }: {
  stories: NarrativeGap[]; channelId: string; color: string; entered: boolean;
}) {
  const [headlineIdx, setHeadlineIdx] = useState(0);

  const channelStories = channelId === 'daily'
    ? (stories.filter(s => s.is_top_story).length >= 10 ? stories.filter(s => s.is_top_story) : stories.slice(0, 10))
    : stories.filter(s => s.category === channelId);

  useEffect(() => {
    setHeadlineIdx(0);
  }, [channelId]);

  useEffect(() => {
    if (channelStories.length <= 1) return;
    const t = setInterval(() => setHeadlineIdx(p => (p + 1) % channelStories.length), 3000);
    return () => clearInterval(t);
  }, [channelId, channelStories.length]);

  const story = channelStories[headlineIdx];
  if (!story) return null;

  return (
    <div style={{
      marginTop: '28px', textAlign: 'center',
      maxWidth: '600px',
      opacity: entered ? 1 : 0,
      transition: 'opacity 0.8s ease 0.7s',
    }}>
      <p key={`${channelId}-${headlineIdx}`} style={{
        fontSize: 15,
        fontFamily: "'Instrument Serif', Georgia, serif",
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 400,
        fontStyle: 'italic',
        lineHeight: 1.4,
        animation: 'fadeIn 0.5s ease',
      }}>
        {story.topic}
      </p>
    </div>
  );
}

function TVClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!time) return null;

  return (
    <span style={{
      fontSize: 12, color: 'rgba(255,255,255,0.2)',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '0.1em',
      fontWeight: 500,
    }}>
      {time}
    </span>
  );
}
