'use client';

import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';

/** Layout effects can't run on the server; fall back so SSR stays quiet. */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * The live size of an element, for layouts that size themselves from the room
 * they actually landed in rather than from a number chosen in advance.
 *
 * Read after every render as well as on resize. A ResizeObserver on its own
 * isn't enough: a box whose size is settled by a sibling a render later would
 * keep its mount-time reading, and an observer in a hidden tab never fires at
 * all. Re-reading a rect is cheap, and state is only set on a real change, so
 * a component that resizes its own contents in response can't loop.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const read = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setSize(prev =>
      prev && Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1
        ? prev
        : { width, height });
  }, [ref]);

  useIsomorphicLayoutEffect(read);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(read);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, read]);

  return size;
}
