'use client';

import { dmPlayerSrc, dmIframeName } from '@/lib/dailymotion';

/**
 * A Dailymotion player iframe that is guaranteed to be a FRESH DOM element
 * whenever its settings change.
 *
 * Chrome reads an iframe's `name` attribute once, when the nested browsing
 * context is created. Setting `name` on an iframe that already exists does
 * NOT update window.name, so the player never sees the forcedSettings blob
 * mute rides in (see lib/dailymotion) and comes up unmuted with its own
 * controls. React hits that case constantly on the tile wall: every tile
 * branch renders `<div><img/><iframe/></div>`, so when a slot rotates from a
 * YouTube or X clip to a Dailymotion one React keeps the existing iframe node
 * and only rewrites its src and name — verified live: such a frame doesn't
 * even answer the player's postMessage API, because the name is gone.
 *
 * Being a component rather than a bare <iframe> is the fix: React remounts on
 * an element-type change, so a slot swapping platform always builds a new
 * iframe, and the inner key remounts on any change to the name itself
 * (different video, or the mute toggle flipping).
 */
export function DmFrame({
  videoId, autoplay, muted, controls,
  className, style, allow, allowFullScreen, loading,
}: {
  videoId: string;
  autoplay: boolean;
  muted: boolean;
  controls: boolean;
  className?: string;
  style?: React.CSSProperties;
  allow?: string;
  allowFullScreen?: boolean;
  loading?: 'lazy' | 'eager';
}) {
  const name = dmIframeName(videoId, { muted, controls });
  return (
    <iframe key={name} src={dmPlayerSrc(videoId, autoplay)} name={name}
      className={className} style={style} allow={allow}
      allowFullScreen={allowFullScreen} loading={loading} />
  );
}
