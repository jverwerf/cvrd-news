'use client';

import { useState } from 'react';

export type FactCheckData = {
  claim?: string;
  verdict: string;
  reasoning?: string;
  sources?: string[];
  checked_at?: string;
};

const VERDICT_COLORS: Record<string, string> = {
  TRUE: '#60a5fa',
  'SOMEWHAT MISLEADING': '#f59e0b',
  MISLEADING: '#daa520',
  FALSE: '#f87171',
};

function domain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

/**
 * CVRD verdict strip shown under an embedded tweet.
 * Renders nothing for UNSURE / NO CLAIM / missing fact-checks.
 * compact: one-line strip that expands on tap (for the small tweet tiles).
 */
export default function TweetFactCheck({ fc, compact }: { fc?: FactCheckData | null; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!fc || !VERDICT_COLORS[fc.verdict]) return null;
  const color = VERDICT_COLORS[fc.verdict];
  const expanded = open || !compact;

  return (
    <div style={{ background: '#16202e', borderTop: `2px solid ${color}` }}>
      <button
        onClick={() => compact && setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left"
        style={{ background: 'transparent', border: 'none', cursor: compact ? 'pointer' : 'default' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] shrink-0" style={{ color }}>{fc.verdict}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#667]" >CVRD Fact Check</span>
        {compact && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#667" strokeWidth="2.5" strokeLinecap="round" className="ml-auto shrink-0"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>
      {expanded && (
        <div className="px-2 pb-2">
          {fc.claim && <p className="text-[10px] leading-snug text-[#ccd] italic mb-1">&ldquo;{fc.claim}&rdquo;</p>}
          {fc.reasoning && <p className="text-[10px] leading-snug text-[#99a]">{fc.reasoning}</p>}
          {(fc.sources || []).length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
              {(fc.sources || []).map((s, i) => (
                <a key={i} href={s} target="_blank" rel="noopener noreferrer"
                  className="text-[9px] underline decoration-dotted hover:text-white transition-colors"
                  style={{ color: '#5a7' }}
                  onClick={e => e.stopPropagation()}>
                  {domain(s)}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
