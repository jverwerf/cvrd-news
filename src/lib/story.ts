import type { NarrativeGap } from '@/lib/data';

/**
 * How many playable clips a story has: YouTube videos plus the social clips
 * that are actual video (a `duration` is what separates a TikTok or a Reel
 * from a text tweet).
 *
 * This lives here rather than beside the components that use it because the
 * homepage is a server component and its filler panels are client ones — a
 * function exported from a `'use client'` module cannot be called during the
 * server render, only rendered as a component.
 */
export function clipCount(story: Pick<NarrativeGap, 'youtube_videos' | 'social_clips'>) {
  return (story.youtube_videos ?? []).length
    + (story.social_clips ?? []).filter(c => c.duration).length;
}
