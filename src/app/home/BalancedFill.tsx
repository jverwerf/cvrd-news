'use client';

import { useEffect, useState } from 'react';
import { StoryScroll, type StoryItem } from './StoryScroll';

/**
 * Spreads the leftover stories across the two homepage columns so both end at
 * roughly the same height.
 *
 * A fixed ratio can't do this: the blocks above the fill differ per column and
 * change daily, so the starting imbalance is never the same. Instead both
 * columns render empty on the first pass, get measured, and the split is solved
 * from the gap between them. Both instances run the same calculation over the
 * same measurements, so they agree on the result without sharing state.
 */

/** Approximate height of one card plus its gap; only used to solve the split. */
const CARD_H = 162;

export function BalancedFill({ stories, blobBase, side }: {
  stories: StoryItem[];
  blobBase: string;
  side: 'left' | 'right';
}) {
  const [split, setSplit] = useState<number | null>(null);

  useEffect(() => {
    const left = document.querySelector('[data-col="left"]') as HTMLElement | null;
    const right = document.querySelector('[data-col="right"]') as HTMLElement | null;
    if (!left || !right) return;

    // The columns are stretched to equal height by the flex row, so their box
    // heights are identical and useless here. What matters is how far their
    // content actually reaches.
    const contentHeight = (col: HTMLElement) => {
      const top = col.getBoundingClientRect().top;
      let bottom = top;
      for (const child of Array.from(col.children)) {
        const rect = child.getBoundingClientRect();
        if (rect.height > 0) bottom = Math.max(bottom, rect.bottom);
      }
      return bottom - top;
    };

    // Measured while both fills are still empty, so these are the heights of
    // the fixed blocks alone.
    const gap = contentHeight(right) - contentHeight(left);
    const n = stories.length;
    // left + a·CARD ≈ right + (n − a)·CARD
    const a = Math.round((gap + n * CARD_H) / (2 * CARD_H));
    setSplit(Math.max(0, Math.min(n, a)));
  }, [stories.length]);

  if (split === null) return null;
  const mine = side === 'left' ? stories.slice(0, split) : stories.slice(split);
  if (mine.length === 0) return null;

  return (
    <div style={{ marginTop: side === 'right' ? 20 : 0 }}>
      <StoryScroll stories={mine} blobBase={blobBase} vertical />
    </div>
  );
}
