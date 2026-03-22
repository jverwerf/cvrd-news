"use client";

import { useRef, useState, useEffect } from "react";
import { Dashboard } from "./Dashboard";
import { ErrorBoundary } from "./ErrorBoundary";
import type { NarrativeGap } from "../lib/data";

export function LazyDashboard({ stories }: { stories: NarrativeGap[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // load 200px before it enters viewport
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? (
        <ErrorBoundary>
          <Dashboard stories={stories} />
        </ErrorBoundary>
      ) : (
        <div style={{ height: 'calc(100vh - 104px)', background: '#1e2a3a' }} />
      )}
    </div>
  );
}
