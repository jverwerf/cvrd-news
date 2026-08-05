'use client';

import { useState, useEffect } from 'react';
import { TILE_TOP, THUMB_FOCUS } from '@/lib/tileFocus';

/**
 * How a clip is displayed:
 *  - player: chrome-free autoplaying YouTube embed over its own still frame
 *  - thumb:  animated still (TikTok, Telegram and X video, none of which embed cleanly)
 *  - tweet:  live tweet embed that slowly scrolls, for X posts with no video
 */
export type TileMode = 'player' | 'thumb' | 'tweet';

export type TileInfo = {
  platform: 'youtube' | 'telegram' | 'x' | 'tiktok';
  mode: TileMode;
  embedId: string;
  thumbUrl: string;
  badge: string;
  badgeColor: string;
  title: string;
};

/** Every showable clip for a story, video first, tweets last. */
export function getStoryTiles(story: any): TileInfo[] {
  const video: TileInfo[] = [];
  const tweets: TileInfo[] = [];

  for (const v of (story.youtube_videos || [])) {
    if (!v.embed_id) continue;
    video.push({ platform: 'youtube', mode: 'player', embedId: v.embed_id, thumbUrl: `https://img.youtube.com/vi/${v.embed_id}/hqdefault.jpg`, badge: 'YouTube', badgeColor: '#cc0000', title: v.title || v.channel || story.topic });
  }

  for (const c of (story.social_clips || [])) {
    if (!c.embed_id) continue;
    // TikTok needs no duration check — a TikTok clip is always video.
    if (c.platform === 'tiktok') {
      video.push({ platform: 'tiktok', mode: 'thumb', embedId: c.embed_id, thumbUrl: `/api/tt-video?id=${c.embed_id}&thumb=1`, badge: 'TikTok', badgeColor: '#fe2c55', title: c.title || story.topic });
      continue;
    }
    if (c.platform === 'telegram' && c.duration) {
      video.push({ platform: 'telegram', mode: 'thumb', embedId: c.embed_id, thumbUrl: `/api/tg-video?post=${c.embed_id}&thumb=1`, badge: 'TG', badgeColor: '#0088cc', title: c.title || story.topic });
      continue;
    }
    if (c.platform === 'x') {
      if (c.duration) {
        video.push({ platform: 'x', mode: 'thumb', embedId: c.embed_id, thumbUrl: `/api/x-video?id=${c.embed_id}&thumb=1`, badge: '𝕏', badgeColor: '#1a1a1a', title: c.title || story.topic });
      } else {
        tweets.push({ platform: 'x', mode: 'tweet', embedId: c.embed_id, thumbUrl: '', badge: '𝕏', badgeColor: '#1d9bf0', title: c.title || story.topic });
      }
    }
  }

  return [...video, ...tweets];
}

export function getFirstTile(story: any): TileInfo | null {
  return getStoryTiles(story)[0] ?? null;
}

const DEFAULT_CYCLE_MS = 13000;

/** Small platform chip, bottom-left of a tile. */
export function TileBadge({ tile, small }: { tile: TileInfo; small?: boolean }) {
  return (
    <div style={{ position: 'absolute', bottom: small ? 4 : 8, left: small ? 6 : 9, zIndex: 10 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: small ? 7 : 7.5, fontWeight: 700, color: '#fff', background: tile.badgeColor, padding: small ? '2px 5px' : '2px 6px', borderRadius: 3, letterSpacing: '0.04em' }}>
        {tile.badge}
      </span>
    </div>
  );
}

/**
 * Autoplaying, non-interactive tile filling its positioned parent. Given more
 * than one clip it rotates through them, so a story shows its whole coverage
 * rather than the same clip forever.
 */
export function StoryTile({ tiles, cycleMs = DEFAULT_CYCLE_MS, badge }: {
  tiles: TileInfo[];
  cycleMs?: number;
  badge?: 'sm' | 'md';
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (tiles.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % tiles.length), cycleMs);
    return () => clearInterval(t);
  }, [tiles.length, cycleMs]);

  if (!tiles.length) return null;
  const tile = tiles[idx % tiles.length];
  const playable = tile.mode === 'player';

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#111d2b' }}>
      {tile.mode === 'tweet' ? (
        <iframe
          key={`tweet-${tile.embedId}`}
          src={`https://platform.twitter.com/embed/Tweet.html?id=${tile.embedId}&theme=dark&hideCard=false&hideThread=true&dnt=true`}
          scrolling="no" tabIndex={-1}
          style={{
            position: 'absolute', border: 'none', pointerEvents: 'none',
            left: '-8px', width: 'calc(100% + 16px)', height: '200%', top: 0,
            animation: 'xScrollDown 50s ease-in-out infinite alternate',
          }}
          loading="lazy"
        />
      ) : (
        <>
          {/* Still frame sits under the player so a loading or blocked embed
              shows the thumbnail rather than a black box. */}
          <img
            key={`thumb-${tile.embedId}`}
            src={tile.thumbUrl}
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: THUMB_FOCUS, opacity: 0.9,
              animation: 'thumbZoom 8s ease-in-out infinite alternate',
              transformOrigin: 'center',
            }}
            onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
          />
          {playable && (
            <iframe
              key={`player-${tile.embedId}`}
              src={`/api/yt-tile?v=${tile.embedId}`}
              style={{ position: 'absolute', border: 'none', pointerEvents: 'none', top: TILE_TOP, left: '-50%', width: '200%', height: '200%' }}
              allow="autoplay"
              loading="lazy"
            />
          )}
        </>
      )}
      {badge && <TileBadge tile={tile} small={badge === 'sm'} />}
    </div>
  );
}
