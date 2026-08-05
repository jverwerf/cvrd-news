/**
 * Where a clip tile crops to.
 *
 * Every clip tile shows a slice of a wider frame, and the natural centre of that
 * slice lands on chins, torsos and desks — news footage frames people high, so a
 * centred crop misses the face. Both knobs bias the crop upward; they live here
 * so the wall, the story band and the story scroll all agree.
 */

/**
 * Top offset for a live embed tile (the iframe is 200% tall so the player's own
 * chrome falls outside the box, and /api/yt-tile applies the same trick again
 * inside — the two crops compound into a narrow horizontal slice).
 *
 * -50% centres that slice. 0% is as high as it goes; -10% keeps a little
 * headroom so tightly-framed shots don't clip the top of the head.
 */
export const TILE_TOP = '-10%';

/** Same correction for still thumbnails, which crop with object-fit instead. */
export const THUMB_FOCUS = 'center 28%';
