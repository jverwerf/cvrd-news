// Dailymotion's geo player (v0.88, checked 2026-09-09) ignores the mute=,
// controls= and autoplay= query flags the old /embed/video/ URL took: its
// URL parser only reads loop, scaleMode, startTime and syndicationKey. Mute
// and controls come from the player config, and the one way to override that
// config from the embedding page is the internal-data blob the official
// player library hands the iframe through its `name` attribute
// (JSON.parse(decodeURIComponent(window.name)).dmInternalData). Its
// forcedSettings merge over the player config, so enableMute:true starts the
// player muted regardless of the browser's autoplay verdict, and
// enablePlaybackControls:false drops the player chrome. Verified live: a plain
// embed with mute=true reported volumechange {muted:false, controls:true};
// the same embed with this name reported {muted:true, controls:false}.
//
// Passing iframeId also switches the player's postMessage API on, so the
// iframe posts JSON events ({event:'volumechange', muted, id}) to the parent.

export function dmPlayerSrc(videoId: string, autoplay: boolean): string {
  return `https://geo.dailymotion.com/player.html?video=${encodeURIComponent(videoId)}&autoplay=${autoplay ? 'true' : 'false'}`;
}

export function dmIframeName(videoId: string, opts: { muted: boolean; controls: boolean }): string {
  return encodeURIComponent(JSON.stringify({
    dmInternalData: {
      iframeId: `dm-${videoId}`,
      forcedSettings: {
        enableMute: opts.muted,
        enablePlaybackControls: opts.controls,
        // The tap/click-to-unmute overlays are the player's own unmute
        // buttons; a muted preview tile must not grow one.
        enableTapToUnmute: opts.controls,
        enableClickToUnmute: opts.controls,
      },
    },
  }));
}
