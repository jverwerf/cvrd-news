"use client";

import { Dashboard } from "@/components/Dashboard";
import { HeroDuo } from "@/components/HeroDuo";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import type { NarrativeGap } from "@/lib/data";
import { toSentence } from '@/lib/text';
import { CONTENT_MAX, CONTENT_GUTTER } from "@/lib/layout";

const serif = "'Instrument Serif', Georgia, serif";
const mono = "'DM Mono', monospace";
const sans = "'DM Sans', system-ui, sans-serif";

const C = {
  bg: "#3f5a80",
  panel: "#1e2d3d",
  panelDark: "#1a2535",
  gold: "#daa520",
  text: "#e2e8f0",
  dim: "#7a8fa6",
  dimmer: "#4a5a6a",
  border: "rgba(255,255,255,0.07)",
};

const CATEGORY_LABEL: Record<string, string> = {
  world: "World",
  politics: "Politics",
  markets: "Markets",
  trending: "Trending",
  sports: "Sports",
};

function toSlug(topic: string) {
  return topic
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function ytThumb(id: string) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function CoverageStrip({ story }: { story: NarrativeGap }) {
  if (story.category === 'sports' || story.category === 'trending') return null;
  const sources = story.sources ?? [];
  const left = sources.filter(s => s.lean === 'left').length;
  const right = sources.filter(s => s.lean === 'right').length;
  const center = sources.filter(s => !s.lean || s.lean === 'center').length;
  if (left + center + right === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 9 }}>
      {left > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#1d4ed8' }} /><span style={{ color: '#60a5fa' }}>{left}</span></span>}
      {center > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#999' }} /><span style={{ color: '#bbb' }}>{center}</span></span>}
      {right > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#b91c1c' }} /><span style={{ color: '#f87171' }}>{right}</span></span>}
    </div>
  );
}

function Badge({ label, pulse }: { label: string; pulse?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 3,
        background: C.gold,
        fontFamily: mono,
        fontSize: 9,
        letterSpacing: "0.1em",
        color: "#1a1a1a",
        textTransform: "uppercase",
        fontWeight: 700,
      }}
    >
      {pulse && (
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#1a1a1a" }} className="live-dot" />
      )}
      {label}
    </span>
  );
}

function StoryCard({ story, tall }: { story: NarrativeGap; tall?: boolean }) {
  const slug = toSlug(story.topic);
  const ytVids = story.youtube_videos ?? [];
  const firstThumb = story.image_file || (ytVids[0] ? ytThumb(ytVids[0].embed_id) : null);
  const totalClips = ytVids.length + (story.social_clips ?? []).filter((c) => c.duration).length;

  return (
    <a href={`/story/${slug}`} style={{ textDecoration: "none", display: "block", flex: 1, minWidth: 0 }}>
      <div
        className="hover-panel"
        style={{
          background: C.panel,
          borderRadius: 10,
          overflow: "hidden",
          border: `1px solid ${C.border}`,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "border-color 0.2s",
        }}
      >
        <div style={{ position: "relative", height: tall ? 200 : 160, flexShrink: 0, overflow: "hidden" }}>
          {totalClips > 0 ? (
            <ErrorBoundary>
              <Dashboard stories={[story]} tilesOnly={true} />
            </ErrorBoundary>
          ) : firstThumb ? (
            <img src={firstThumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: `linear-gradient(135deg, ${C.gold}20, ${C.panelDark})`,
              }}
            />
          )}
        </div>

        <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
          <h3
            style={{
              fontFamily: serif,
              fontSize: tall ? 18 : 15,
              lineHeight: 1.3,
              color: C.text,
              fontWeight: 400,
              margin: "0 0 8px",
            }}
          >
            {story.topic}
          </h3>
          {story.summary && (
            <p style={{ fontFamily: sans, fontSize: 12, lineHeight: 1.6, color: C.dim, margin: 0 }}>
              {story.summary.slice(0, tall ? 140 : 90)}
              {story.summary.length > (tall ? 140 : 90) ? "..." : ""}
            </p>
          )}
          <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {totalClips > 0 && (
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.08em", color: C.dimmer }}>
                {totalClips} clips
              </span>
            )}
            <CoverageStrip story={story} />
            <span
              style={{
                fontFamily: mono,
                fontSize: 9,
                letterSpacing: "0.1em",
                color: C.gold,
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Read
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

function StoryStrip({ story, reverse }: { story: NarrativeGap; reverse?: boolean }) {
  const slug = toSlug(story.topic);
  const totalClips =
    (story.youtube_videos ?? []).length + (story.social_clips ?? []).filter((c) => c.duration).length;

  return (
    <a href={`/story/${slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="hover-panel strip-row"
        style={{
          background: C.panel,
          borderRadius: 10,
          overflow: "hidden",
          border: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: reverse ? "row-reverse" : "row",
          minHeight: 200,
          transition: "border-color 0.2s",
        }}
      >
        <div
          style={{
            flex: 4,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
          className="strip-text"
        >
          <h3
            style={{
              fontFamily: serif,
              fontSize: 22,
              lineHeight: 1.25,
              color: C.text,
              fontWeight: 400,
              margin: "0 0 10px",
            }}
          >
            {story.topic}
          </h3>
          {story.summary && (
            <p style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.65, color: C.dim, margin: 0, maxWidth: 480 }}>
              {story.summary.slice(0, 200)}
              {story.summary.length > 200 ? "..." : ""}
            </p>
          )}
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
            {totalClips > 0 && (
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.08em", color: C.dimmer }}>
                {totalClips} clips
              </span>
            )}
            <CoverageStrip story={story} />
            <span
              style={{
                fontFamily: mono,
                fontSize: 9,
                letterSpacing: "0.1em",
                color: C.gold,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Read
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
        </div>

        <div style={{ flex: 6, minWidth: 0, position: "relative", overflow: "hidden" }} className="strip-tiles">
          <ErrorBoundary>
            <Dashboard stories={[story]} tilesOnly={true} />
          </ErrorBoundary>
        </div>
      </div>
    </a>
  );
}

function StoryGrid({ stories }: { stories: NarrativeGap[] }) {
  const elements: React.ReactNode[] = [];
  let i = 0;
  let block = 0;
  while (i < stories.length) {
    const remaining = stories.length - i;
    if (block % 2 === 0 && remaining >= 2) {
      elements.push(
        <div key={`row2-${i}`} style={{ display: "flex", gap: 16 }} className="card-row">
          <StoryCard story={stories[i]} tall />
          <StoryCard story={stories[i + 1]} tall />
        </div>
      );
      i += 2;
    } else {
      elements.push(<StoryStrip key={`strip-${i}`} story={stories[i]} reverse={block % 4 === 3} />);
      i++;
    }
    block++;
  }
  return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{elements}</div>;
}

export default function BriefLayout({
  stories,
  date,
  isBreaking,
  category,
}: {
  stories: NarrativeGap[];
  date: string;
  isBreaking: boolean;
  category?: string;
}) {
  if (stories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <SiteNav isBreaking={isBreaking} storyMeta={{ index: 0, total: 0, category }} />
        <p style={{ color: C.dim }}>No stories today yet — check back soon.</p>
      </div>
    );
  }

  const dateLabel = date
    ? new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "Today";

  const heroStory = stories[0];
  const heroYtVids = heroStory.youtube_videos ?? [];
  const heroFirstThumb = heroStory.image_file || (heroYtVids[0] ? ytThumb(heroYtVids[0].embed_id) : null);
  const heroSlug = toSlug(heroStory.topic);
  const heroTotalClips = heroYtVids.length + (heroStory.social_clips ?? []).filter((c) => c.duration).length;
  const heroTotalSources = (heroStory.sources ?? []).length;

  const heroStories = stories.slice(0, 2);
  const restStories = stories.slice(2);

  const badgeLabel = category ? CATEGORY_LABEL[category] || category : "Today's Brief";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .live-dot { animation: blink 1.3s ease-in-out infinite; }
        .hover-panel:hover { border-color: rgba(218,165,32,0.25) !important; }
        @media (max-width: 700px) {
          .card-row { flex-direction: column !important; }
          .strip-row { flex-direction: column !important; }
          .strip-text { padding: 16px 18px !important; }
          .strip-tiles { min-height: 160px !important; }
          .hero-meta-row { flex-wrap: wrap; }
          .hero-article { column-count: 1 !important; }
        }
      `,
        }}
      />

      <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: sans }}>
        <SiteNav
          isBreaking={isBreaking}
          storyMeta={{ index: 0, total: stories.length, category }}
        />

        <div style={{ padding: `20px ${CONTENT_GUTTER}px 4px`, maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <HeroDuo
            bgThumb={heroFirstThumb}
            items={heroStories.map((story) => ({
              story,
              href: `/story/${toSlug(story.topic)}`,
              meta: dateLabel,
            }))}
          />
        </div>

        <main style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: `28px ${CONTENT_GUTTER}px 40px` }}>
          {restStories.length > 0 && <StoryGrid stories={restStories} />}
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
