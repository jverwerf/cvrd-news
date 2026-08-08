"use client";

import { useState, useCallback, useEffect, useRef } from "react";

let _pauseCycling = false;

const CHIP: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 7,
  padding: '1.5px 6px',
  borderRadius: 3,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: 'rgba(255,255,255,0.35)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  letterSpacing: '0.04em',
};

function useTopStory() {
  const [state, setState] = useState<{ topic: string | null; category: string | null }>({ topic: null, category: null });
  useEffect(() => {
    fetch('/api/top-story').then(r => r.json()).then(d => setState({ topic: d.topic ?? null, category: d.category ?? null })).catch(() => {});
  }, []);
  return state;
}
import { track } from "@vercel/analytics";

// ─── Assets ────────────────────────────────────────────────────────────────

const MM_LANDSCAPE = [
  'https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/MigraineMe_Commercial_Community_Cartoon-zdFCQbzkjBqHAp1D8bGrf1EJTWuyyz.mp4',
  'https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/MigraineMe_Commercial_Community_Realistic-JaalDRSDRwvUIY0dnyPUs6e7AcFLjD.mp4',
  'https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/MigraineMe_Commercial_Nutrition-azGPKc9ZCWgISSWWSUxKIq0mKhAbeI.mp4',
];

const MM_PORTRAIT = [
  'https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/MigraineMe_Commercial_Automated_Triggers_Standing-eDbhoLIko5Z3Nmz31eZyA2E335XitQ.mp4',
  'https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/MigraineMe_Commercial_Community_Standing-cd9qIjeQHcQpMtSDHMKnKOqEqmPrFY.mp4',
  'https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/MigraineMe_Commercial_Insights_Standing.mp4',
];

const HAUS_SERVICES = [
  'Climate control, room by room',
  'Smart locks & security',
  'Lighting scenes & routines',
  'Voice, app & automation',
];

const ANDLANE_SERVICES = [
  'Email & inbox automation',
  'AI chatbots for your business',
  'CRM & operations workflows',
  'Reporting dashboards',
];

function pickNext<T>(arr: T[], current: T): T {
  const idx = arr.indexOf(current);
  return arr[(idx + 1) % arr.length];
}

type Brand = 'migraineme' | 'newsletter' | 'kofi' | 'isoqar';
const BRAND_ORDER: Brand[] = ['migraineme', 'newsletter', 'kofi'];

// Sponsored placements only enter the rotation on days whose top story
// matches their category — e.g. ISOQAR (compliance/auditor training) only
// shows up alongside 'politics' coverage, never as a blanket sitewide ad.
const SPONSORED_BY_CATEGORY: Partial<Record<string, Brand[]>> = {
  politics: ['isoqar'],
  world: ['isoqar'],
  markets: ['isoqar'],
};

function useCyclingBrand(ms = 60000, category: string | null = null) {
  const pool = [...BRAND_ORDER, ...(category ? SPONSORED_BY_CATEGORY[category] ?? [] : [])];
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * pool.length));
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      if (_pauseCycling) return;
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % pool.length); setVisible(true); }, 400);
    }, ms);
    return () => clearInterval(t);
  }, [ms, pool.length]);
  return { brand: pool[idx % pool.length], visible };
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

function useRotating(items: string[], ms = 3200) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % items.length); setVisible(true); }, 300);
    }, ms);
    return () => clearInterval(t);
  }, [items.length, ms]);
  return { text: items[idx], visible };
}

function useCircuit(ref: React.RefObject<HTMLCanvasElement | null>, w: number, h: number) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const G = 18;
    const AMBER = 'rgba(200,132,26,';
    const TEAL  = 'rgba(26,122,110,';
    type Pt = [number, number];
    type Path = { pts: Pt[]; color: string; p: number; spd: number };
    const paths: Path[] = [];
    for (let i = 0; i < 4; i++) {
      let x = Math.round(Math.random() * (w / G)) * G;
      let y = Math.round(Math.random() * (h / G)) * G;
      const pts: Pt[] = [[x, y]];
      for (let j = 0; j < 2 + Math.floor(Math.random() * 2); j++) {
        if (Math.random() < 0.5) x = Math.max(0, Math.min(w, x + (Math.random()<0.5?1:-1)*G*(1+Math.floor(Math.random()*3))));
        else y = Math.max(0, Math.min(h, y + (Math.random()<0.5?1:-1)*G*(1+Math.floor(Math.random()*2))));
        pts.push([x, y]);
      }
      paths.push({ pts, color: Math.random() < 0.6 ? AMBER : TEAL, p: Math.random(), spd: 0.001 + Math.random() * 0.0008 });
    }
    function tlen(pts: Pt[]) {
      let l = 0; for (let i=1; i<pts.length; i++) l += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); return l;
    }
    function ptAt(pts: Pt[], t: number): Pt {
      const tot = tlen(pts); let target = t*tot, acc = 0;
      for (let i=1; i<pts.length; i++) {
        const sl = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
        if (acc+sl >= target) { const f=(target-acc)/(sl||1); return [pts[i-1][0]+f*(pts[i][0]-pts[i-1][0]), pts[i-1][1]+f*(pts[i][1]-pts[i-1][1])]; }
        acc += sl;
      }
      return pts[pts.length-1];
    }
    let rafId: number;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of paths) {
        p.p += p.spd; if (p.p > 1.4) p.p = -0.3;
        const t = Math.max(0, Math.min(1, p.p)), tail = Math.max(0, t - 0.28);
        ctx.beginPath(); ctx.moveTo(p.pts[0][0], p.pts[0][1]);
        for (let i=1; i<p.pts.length; i++) ctx.lineTo(p.pts[i][0], p.pts[i][1]);
        ctx.strokeStyle = p.color+'0.06)'; ctx.lineWidth = 0.8; ctx.stroke();
        if (t > 0 && t < 1) {
          const [x1,y1] = ptAt(p.pts, tail), [x2,y2] = ptAt(p.pts, t);
          const g = ctx.createLinearGradient(x1,y1,x2,y2);
          g.addColorStop(0, p.color+'0)'); g.addColorStop(1, p.color+'0.5)');
          ctx.beginPath(); ctx.moveTo(p.pts[0][0], p.pts[0][1]);
          for (let i=1; i<p.pts.length; i++) ctx.lineTo(p.pts[i][0], p.pts[i][1]);
          ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.stroke();
          ctx.beginPath(); ctx.arc(x2, y2, 1.5, 0, Math.PI*2);
          ctx.fillStyle = p.color+'0.55)'; ctx.fill();
        }
      }
      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [w, h]);
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const ANIM_CSS = `
@keyframes ad-needle { 0%,100%{transform:rotate(-120deg)} 50%{transform:rotate(30deg)} }
@keyframes ad-sub-in  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
@keyframes ad-sub-out { from{opacity:1} to{opacity:0;transform:translateY(-4px)} }
`;

const CREAM = '#f5f0e8';
const GRID_BG: React.CSSProperties = {
  backgroundColor: CREAM,
  backgroundImage: 'linear-gradient(rgba(42,37,32,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(42,37,32,0.055) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

// ─── Thermostat SVG ──────────────────────────────────────────────────────────

function ThermoSVG({ size, opacity }: { size: number; opacity: number }) {
  const s = size / 130;
  return (
    <svg width={size} height={size} viewBox="0 0 130 130" fill="none" style={{ opacity, pointerEvents: 'none' }}>
      <circle cx="65" cy="65" r="55" stroke="rgba(42,37,32,0.5)" strokeWidth="1.2" fill="none"/>
      <circle cx="65" cy="65" r="45" stroke="rgba(42,37,32,0.25)" strokeWidth="1" fill="none" strokeDasharray="5 4"/>
      <circle cx="65" cy="65" r="32" stroke="rgba(42,37,32,0.2)" strokeWidth="0.8" fill="none"/>
      <g stroke="rgba(42,37,32,0.45)" strokeWidth="1.2" strokeLinecap="round">
        {[0,30,60,90,120,150,180,210,240,270,300,330].map(r => (
          <line key={r} x1="65" y1="10" x2="65" y2="20" transform={`rotate(${r},65,65)`}/>
        ))}
      </g>
      <line x1="65" y1="65" x2="65" y2="18" stroke="rgba(196,122,8,0.7)" strokeWidth="1.5" strokeLinecap="round"
        style={{ transformOrigin: `65px 65px`, animation: 'ad-needle 6s ease-in-out infinite' }}/>
      <circle cx="65" cy="65" r="4" stroke="rgba(42,37,32,0.4)" strokeWidth="1" fill={CREAM}/>
      <text fontFamily="Caveat,cursive" fontSize="10" fill="rgba(42,37,32,0.35)" textAnchor="middle" x="65" y="122">smart thermostat</text>
      <line x1="5" y1="12" x2="5" y2="118" stroke="rgba(42,37,32,0.15)" strokeWidth="0.8"/>
      <line x1="2" y1="12" x2="8" y2="12" stroke="rgba(42,37,32,0.15)" strokeWidth="0.8"/>
      <line x1="2" y1="118" x2="8" y2="118" stroke="rgba(42,37,32,0.15)" strokeWidth="0.8"/>
    </svg>
  );
}

function LockSVG({ opacity }: { opacity: number }) {
  return (
    <svg width="55" height="85" viewBox="0 0 55 85" fill="none" style={{ opacity, pointerEvents: 'none' }}>
      <rect x="8" y="34" width="38" height="42" rx="4" stroke="rgba(42,37,32,0.5)" strokeWidth="1.2" fill="none"/>
      <path d="M16 34 L16 22 Q16 6 27 6 Q38 6 38 22 L38 34" stroke="rgba(42,37,32,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="27" cy="57" r="7" stroke="rgba(42,37,32,0.35)" strokeWidth="1" fill="none"/>
      <circle cx="27" cy="57" r="2.5" stroke="rgba(42,37,32,0.45)" strokeWidth="1" fill="none"/>
      <line x1="27" y1="60" x2="27" y2="68" stroke="rgba(42,37,32,0.35)" strokeWidth="1.2" strokeLinecap="round"/>
      <text fontFamily="Caveat,cursive" fontSize="8" fill="rgba(42,37,32,0.3)" textAnchor="middle" x="27" y="82">yale · nuki</text>
    </svg>
  );
}

// ─── MigraineMe components ───────────────────────────────────────────────────

function MigraineStaticTile() {
  return (
    <a href="https://migraineme.app" target="_blank" rel="noreferrer"
      className="w-full h-full flex flex-col items-center justify-center gap-2 rounded-lg text-center no-underline"
      style={{ background: 'linear-gradient(135deg, #2d0b4e 0%, #1a0630 100%)' }}>
      <img src="https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/migraineme_logo-O5wAPkK8shHu9KXtDeUvCyWbwpvRTW.png" alt="MigraineMe" className="w-10 h-10 object-contain" />
      <div>
        <p className="text-white font-bold text-[11px] leading-tight">MigraineMe</p>
        <p className="text-white/50 text-[9px] leading-snug mt-0.5">AI migraine tracking</p>
      </div>
      <span className="px-2.5 py-1 rounded-full text-[9px] font-semibold text-white" style={{ background: '#E879A0' }}>
        Free Download
      </span>
    </a>
  );
}

// ─── Andlane components ──────────────────────────────────────────────────────

function AndlaneHorizontal() {
  const { text, visible } = useRotating(ANDLANE_SERVICES);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCircuit(canvasRef, 260, 90);
  const subStyle: React.CSSProperties = {
    transition: 'opacity 0.28s ease, transform 0.28s ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(-4px)',
  };
  return (
    <a href="https://andlane.co.uk" target="_blank" rel="noreferrer"
      style={{ ...GRID_BG, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 90, padding: '0 18px', borderRadius: 8, border: '1.5px solid rgba(42,37,32,0.10)', boxShadow: '2px 4px 20px rgba(42,37,32,0.08)', textDecoration: 'none', position: 'relative', overflow: 'hidden' }}>
      <style>{ANIM_CSS}</style>
      {/* circuit canvas — right zone only, fades out left */}
      <canvas ref={canvasRef} style={{ position: 'absolute', right: 0, top: 0, width: 260, height: 90, pointerEvents: 'none', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 35%)', maskImage: 'linear-gradient(to right, transparent 0%, black 35%)' }} />
      {/* left: logo + divider + copy */}
      <div className="flex items-center relative z-10 flex-shrink-0" style={{ gap: 8 }}>
        <img src="https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/andlane_logo-E8ZnpFBFTq3FGzA9AYDvREd4knuzNY.png" alt="Andlane" style={{ height: 144, maxWidth: 170, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ width: 1, height: 40, background: 'rgba(42,37,32,0.12)', flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 12, color: '#1a7a6e', lineHeight: 1, marginBottom: 3, whiteSpace: 'nowrap' }}>
            ↳ automation studio · London
          </div>
          <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: '-0.03em', color: '#1a1a2e', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
            We automate what slows you down.
          </div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: '#c8841a', marginTop: 3, minHeight: 14, lineHeight: 1, whiteSpace: 'nowrap', ...subStyle }}>
            {text}
          </div>
        </div>
      </div>
      {/* CTA */}
      <span className="relative z-10 flex-shrink-0"
        style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: 11, padding: '9px 18px', borderRadius: 3, background: '#1a1a2e', color: CREAM, letterSpacing: '0.02em' }}>
        Find out more
      </span>
    </a>
  );
}

function AndlaneTile() {
  const { text, visible } = useRotating(ANDLANE_SERVICES);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCircuit(canvasRef, 160, 80);
  const subStyle: React.CSSProperties = {
    transition: 'opacity 0.28s ease, transform 0.28s ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(-4px)',
  };
  return (
    <a href="https://andlane.co.uk" target="_blank" rel="noreferrer"
      className="w-full h-full flex flex-col no-underline relative overflow-hidden rounded-lg"
      style={{ background: CREAM, border: '1.5px solid rgba(42,37,32,0.10)', boxShadow: '2px 4px 20px rgba(42,37,32,0.08)' }}>
      <style>{ANIM_CSS}</style>
      {/* logo section */}
      <div className="relative flex items-center justify-center overflow-hidden" style={{ flex: '0 0 80px', ...GRID_BG }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%, black 60%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 40%, black 60%, transparent 100%)' }} />
        <img src="https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/andlane_logo-E8ZnpFBFTq3FGzA9AYDvREd4knuzNY.png" alt="Andlane" className="relative z-10" style={{ width: '110%', height: 'auto', objectFit: 'contain' }} />
      </div>
      {/* text section */}
      <div className="flex flex-col items-center justify-center text-center" style={{ flex: 1, borderTop: '1px solid rgba(42,37,32,0.08)', padding: '5px 8px 14px', gap: 3 }}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 9, color: '#1a7a6e', lineHeight: 1 }}>↳ automation studio · London</div>
        <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900, fontSize: 9, letterSpacing: '-0.02em', color: '#1a1a2e', lineHeight: 1.2 }}>
          We automate what slows you down.
        </div>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 7.5, color: '#c8841a', minHeight: 11, lineHeight: 1.2, ...subStyle }}>{text}</div>
        <span style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: 8.5, padding: '4px 11px', borderRadius: 3, background: '#1a1a2e', color: CREAM, letterSpacing: '0.02em', marginTop: 2 }}>
          Find out more
        </span>
      </div>
    </a>
  );
}

// ─── HausCtrl components ─────────────────────────────────────────────────────

function HausCtrlHorizontal() {
  const { text, visible } = useRotating(HAUS_SERVICES);
  const subStyle: React.CSSProperties = {
    transition: 'opacity 0.28s ease, transform 0.28s ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(-4px)',
  };
  return (
    <a href="https://hausctrl.co.uk" target="_blank" rel="noreferrer"
      style={{ ...GRID_BG, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 90, padding: '0 18px', borderRadius: 8, border: '1.5px solid rgba(42,37,32,0.10)', boxShadow: '2px 4px 20px rgba(42,37,32,0.08)', textDecoration: 'none', position: 'relative', overflow: 'hidden' }}>
      <style>{ANIM_CSS}</style>
      {/* thermostat sketch */}
      <div style={{ position: 'absolute', right: 185, top: '50%', transform: 'translateY(-50%) scale(0.8)', transformOrigin: 'right center', pointerEvents: 'none' }}>
        <ThermoSVG size={110} opacity={0.15} />
      </div>
      {/* lock sketch */}
      <div style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-55%) scale(0.8)', transformOrigin: 'right center', pointerEvents: 'none' }}>
        <LockSVG opacity={0.08} />
      </div>
      {/* left: logo + divider + copy */}
      <div className="flex items-center relative z-10 flex-shrink-0" style={{ gap: 8 }}>
        <img src="https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/hausctrl_logo-Ynu7hmslS0dK1ZoAy2a8nWh7tbaQoA.png" alt="HausCtrl" style={{ height: 144, maxWidth: 170, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ width: 1, height: 40, background: 'rgba(42,37,32,0.12)', flexShrink: 0 }} />
        <div>
          <div className="flex items-center" style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0e8a6e', lineHeight: 1, marginBottom: 3, gap: 5, whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-block', width: 12, height: 1, background: '#0e8a6e', opacity: 0.6 }} />
            intelligent home automation
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: '-0.03em', color: '#2a2520', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
            Your home, intelligently controlled.
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontSize: 9, color: '#0e8a6e', marginTop: 3, minHeight: 13, lineHeight: 1, whiteSpace: 'nowrap', ...subStyle }}>
            {text}
          </div>
        </div>
      </div>
      {/* CTA */}
      <span className="relative z-10 flex-shrink-0"
        style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: 10, padding: '9px 18px', borderRadius: 2, background: '#0e8a6e', color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 4px 16px rgba(14,138,110,0.2)' }}>
        Get a free quote
      </span>
    </a>
  );
}

function HausCtrlTile() {
  const { text, visible } = useRotating(HAUS_SERVICES);
  const subStyle: React.CSSProperties = {
    transition: 'opacity 0.28s ease, transform 0.28s ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(-4px)',
  };
  return (
    <a href="https://hausctrl.co.uk" target="_blank" rel="noreferrer"
      className="w-full h-full flex flex-col no-underline relative overflow-hidden rounded-lg"
      style={{ background: CREAM, border: '1.5px solid rgba(42,37,32,0.10)', boxShadow: '2px 4px 20px rgba(42,37,32,0.08)' }}>
      <style>{ANIM_CSS}</style>
      {/* logo section */}
      <div className="relative flex items-center justify-center overflow-hidden" style={{ flex: '0 0 80px', ...GRID_BG }}>
        <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <ThermoSVG size={90} opacity={0.15} />
        </div>
        <img src="https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/hausctrl_logo-Ynu7hmslS0dK1ZoAy2a8nWh7tbaQoA.png" alt="HausCtrl" className="relative z-10" style={{ width: '110%', height: 'auto', objectFit: 'contain' }} />
      </div>
      {/* text section */}
      <div className="flex flex-col items-center justify-center text-center" style={{ flex: 1, borderTop: '1px solid rgba(42,37,32,0.08)', padding: '5px 8px 14px', gap: 3 }}>
        <div className="flex items-center" style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0e8a6e', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 1, background: '#0e8a6e', opacity: 0.6 }} />
          smart home · London
        </div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 9, letterSpacing: '-0.025em', color: '#2a2520', lineHeight: 1.2 }}>
          Your home, intelligently controlled.
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontSize: 7, color: '#0e8a6e', minHeight: 10, lineHeight: 1.2, ...subStyle }}>{text}</div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: 7.5, padding: '5px 10px', borderRadius: 2, background: '#0e8a6e', color: '#fff', letterSpacing: '0.09em', textTransform: 'uppercase', marginTop: 3, boxShadow: '0 2px 8px rgba(14,138,110,0.2)' }}>
          Get a free quote
        </span>
      </div>
    </a>
  );
}

// ─── Newsletter components ───────────────────────────────────────────────────

const NEWSLETTER_CHIPS = ['𝕏', 'social pulse', 'tiktok', 'telegram', 'on record', 'timeline'];
const SEP: React.CSSProperties = { width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 2px' };

function NewsletterForm({ direction, onFocus, onBlur }: { direction: 'row' | 'col'; onFocus: () => void; onBlur: () => void }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: direction === 'row' ? 13 : 11, color: '#fff', fontWeight: 600, textAlign: 'center', padding: direction === 'col' ? '8px 0' : undefined }}>
      You&apos;re in ✓
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: direction === 'col' ? 'column' : 'row', gap: direction === 'col' ? 5 : 7 }}>
      <input
        type="email" value={email} placeholder="your@email.com"
        onChange={e => setEmail(e.target.value)}
        onFocus={onFocus} onBlur={onBlur}
        style={direction === 'row'
          ? { height: 34, width: 162, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '0 11px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#fff', outline: 'none' }
          : { width: '100%', height: 26, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '0 8px', fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: '#fff', outline: 'none' }}
      />
      <button type="submit" disabled={status === 'loading'}
        style={direction === 'row'
          ? { height: 34, padding: '0 14px', background: '#fff', border: 'none', borderRadius: 4, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 11, color: '#1e2a3a', cursor: 'pointer', whiteSpace: 'nowrap' }
          : { width: '100%', height: 26, background: '#fff', border: 'none', borderRadius: 4, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 9, color: '#1e2a3a', cursor: 'pointer' }}>
        {status === 'loading' ? '...' : 'Subscribe'}
      </button>
    </form>
  );
}

function NewsletterHorizontal({ topic }: { topic: string | null }) {
  const pause = () => { _pauseCycling = true; };
  const resume = () => { _pauseCycling = false; };
  const headline = topic || 'Both sides of every story — daily';

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', width: '100%', height: 90, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Wordmark */}
      <div style={{ flexShrink: 0, background: '#1e2a3a', display: 'flex', alignItems: 'center', padding: '0 18px 0 20px', gap: 12, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.04em', color: '#fff', whiteSpace: 'nowrap' }}>
          CVRD<span style={{ color: 'rgba(255,255,255,0.3)' }}>.</span>
        </div>
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.09)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: '#fff', lineHeight: 1, whiteSpace: 'nowrap' }}>Daily Pick</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, fontWeight: 300, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>newsletter</div>
        </div>
      </div>
      {/* Middle */}
      <div style={{ flex: 1, background: '#19232f', display: 'flex', alignItems: 'stretch', padding: '0 20px', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Left col: eyebrow + lr chips */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, paddingRight: 12 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>today&apos;s story</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {['◀ left', 'right ▶'].map(l => <span key={l} style={CHIP}>{l}</span>)}
          </div>
        </div>
        {/* Shared vertical rule */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '16px 14px' }} />
        {/* Right col: headline + chips */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, minWidth: 0 }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{headline}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
            {NEWSLETTER_CHIPS.map((c, i) => (
              <span key={c} style={CHIP}>{c}{i === 4 && <span style={SEP} />}</span>
            ))}
          </div>
        </div>
      </div>
      {/* Form */}
      <div style={{ flexShrink: 0, background: '#1e2a3a', display: 'flex', alignItems: 'center', padding: '0 18px' }}>
        <NewsletterForm direction="row" onFocus={pause} onBlur={resume} />
      </div>
    </div>
  );
}

function NewsletterTile({ topic: _ }: { topic: string | null }) {
  const pause = () => { _pauseCycling = true; };
  const resume = () => { _pauseCycling = false; };

  return (
    <div className="w-full h-full" style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, padding: '10px 12px 9px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '-0.03em', color: '#fff' }}>
          CVRD<span style={{ color: 'rgba(255,255,255,0.3)' }}>.</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '6px 10px', gap: 4 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)' }}>newsletter</div>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 15, color: '#fff', lineHeight: 1.1 }}>Daily Pick</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {['◀ left', 'right ▶', ...NEWSLETTER_CHIPS].map(c => <span key={c} style={{ ...CHIP, fontSize: 7, padding: '1.5px 5px' }}>{c}</span>)}
        </div>
      </div>
      <div style={{ flexShrink: 0, padding: '7px 10px 11px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <NewsletterForm direction="col" onFocus={pause} onBlur={resume} />
      </div>
    </div>
  );
}

// ─── Ko-fi components ────────────────────────────────────────────────────────

function KofiHorizontal() {
  return (
    <a href="https://ko-fi.com/cvrdnews" target="_blank" rel="noreferrer"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 90, padding: '0 24px', borderRadius: 8, background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.04em', color: '#fff' }}>
          CVRD<span style={{ color: 'rgba(255,255,255,0.3)' }}>.</span>
        </div>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>
          Independent news, built different. Help us keep it that way.
        </div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
        ♥ Buy us a coffee
      </div>
    </a>
  );
}

function KofiTile() {
  return (
    <a href="https://ko-fi.com/cvrdnews" target="_blank" rel="noreferrer"
      className="w-full h-full flex flex-col items-center justify-center gap-3 no-underline"
      style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', padding: '16px 12px' }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '-0.03em', color: '#fff', textAlign: 'center' as const }}>
        CVRD<span style={{ color: 'rgba(255,255,255,0.3)' }}>.</span>
      </div>
      <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.3, textAlign: 'center' as const }}>
        Independent news, built different.<br />Help us keep it that way.
      </div>
      <div style={{ padding: '7px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: '#fff' }}>
        ♥ Buy us a coffee
      </div>
    </a>
  );
}

// ─── ISOQAR components ───────────────────────────────────────────────────────
// Real Awin creative pulled from the ISOQAR Academy program (publisher 3026993,
// program 87091) — this is the only image asset they supply affiliates, so it's
// inlined here rather than re-hosted. rel="sponsored" per Google's guidance for
// paid/affiliate links; this is CVRD's first live paid placement.

const ISOQAR_LOGO = "data:image/png;base64,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";
const ISOQAR_LINK = "https://www.awin1.com/cread.php?s=3677624&v=87091&q=494073&r=3026993";

function IsoqarHorizontal() {
  return (
    <a href={ISOQAR_LINK} target="_blank" rel="sponsored noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 90, padding: '0 20px', borderRadius: 8, background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}>
      <div className="flex items-center" style={{ gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: '#0d2b52', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 5 }}>
          <img src={ISOQAR_LOGO} alt="ISOQAR Academy" style={{ width: '100%', height: '100%', borderRadius: 4, objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>
            Sponsored
          </div>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 15, color: '#fff', lineHeight: 1.2 }}>
            ISO 14001 &amp; 45001 Lead Auditor Course
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
            CQI IRCA certified · 3 days · classroom, virtual, or in-house
          </div>
        </div>
      </div>
      <span className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, padding: '9px 16px', borderRadius: 5, background: '#6bc4af', color: '#0a1420', letterSpacing: '0.02em' }}>
        View course
      </span>
    </a>
  );
}

function IsoqarTile() {
  return (
    <a href={ISOQAR_LINK} target="_blank" rel="sponsored noopener noreferrer"
      className="w-full h-full flex flex-col no-underline rounded-lg overflow-hidden"
      style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between" style={{ padding: '10px 10px 0' }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>
          Sponsored
        </span>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: '#0d2b52', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <img src={ISOQAR_LOGO} alt="" style={{ width: '100%', height: '100%', borderRadius: 3, objectFit: 'contain' }} />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center" style={{ padding: '4px 10px' }}>
        <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 11, color: '#fff', lineHeight: 1.25, margin: 0 }}>
          ISO 14001 &amp; 45001 Lead Auditor Course
        </p>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          CQI IRCA certified · 3 days
        </p>
      </div>
      <div style={{ padding: '0 10px 10px' }}>
        <span style={{ display: 'inline-block', fontFamily: "'DM Mono', monospace", fontSize: 8.5, fontWeight: 500, padding: '4px 10px', borderRadius: 4, background: '#6bc4af', color: '#0a1420' }}>
          View course
        </span>
      </div>
    </a>
  );
}

// ─── Public components ───────────────────────────────────────────────────────

/** Wide horizontal banner (~90px tall)
 * Pass `category` when the surrounding page already knows it (a specific
 * story or a /world, /politics, /markets… listing) — that's the real
 * context for gating sponsored placements. Falls back to the sitewide
 * top-story flag only on mixed-content pages (home) that have no single
 * category of their own.
 */
export function HorizontalAdBanner({ category: categoryProp }: { category?: string | null } = {}) {
  const { topic, category: topStoryCategory } = useTopStory();
  const category = categoryProp ?? topStoryCategory;
  const { brand, visible } = useCyclingBrand(60000, category);
  const [src, setSrc] = useState(() => MM_LANDSCAPE[Math.floor(Math.random() * MM_LANDSCAPE.length)]);
  const onEnded = useCallback(() => setSrc(prev => pickNext(MM_LANDSCAPE, prev)), []);

  useEffect(() => {
    if (visible) track('ad_impression', { brand, placement: 'horizontal' });
  }, [brand, visible]);

  return (
    <div style={{ width: '100%', height: 90 }} onClick={() => track('ad_click', { brand, placement: 'horizontal' })}>
      <div style={{ width: '100%', height: '100%', opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        {brand === 'migraineme' && (
          <a href="https://migraineme.app" target="_blank" rel="noreferrer"
            style={{ display: 'block', width: '100%', height: 90, position: 'relative', overflow: 'hidden', borderRadius: 8, textDecoration: 'none' }}>
            <video key={src} src={src} autoPlay muted playsInline onEnded={onEnded}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'translateY(-25%) scale(1.35)', transformOrigin: 'top center' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.6) 100%)' }}>
              <div className="flex items-center gap-3">
                <img src="https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com/ads/migraineme_logo-O5wAPkK8shHu9KXtDeUvCyWbwpvRTW.png" alt="MigraineMe" className="w-9 h-9 object-contain" />
                <div>
                  <p className="text-white font-bold text-[13px] leading-tight">MigraineMe</p>
                  <p className="text-white/60 text-[11px]">AI-powered migraine tracking</p>
                </div>
              </div>
              <span className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white" style={{ background: '#E879A0' }}>
                Free Download
              </span>
            </div>
          </a>
        )}
        {brand === 'newsletter'  && <NewsletterHorizontal topic={topic} />}
        {brand === 'kofi'        && <KofiHorizontal />}
        {brand === 'isoqar'      && <IsoqarHorizontal />}
      </div>
    </div>
  );
}

/** Square tile — Dashboard, On Record grid. See HorizontalAdBanner re: category prop. */
export function TileAdBanner({ category: categoryProp }: { category?: string | null } = {}) {
  const { topic, category: topStoryCategory } = useTopStory();
  const category = categoryProp ?? topStoryCategory;
  const { brand, visible } = useCyclingBrand(60000, category);
  const [showVideo] = useState(() => Math.random() < 0.67);
  const [src, setSrc] = useState(() => MM_PORTRAIT[Math.floor(Math.random() * MM_PORTRAIT.length)]);
  const onEnded = useCallback(() => setSrc(prev => pickNext(MM_PORTRAIT, prev)), []);

  useEffect(() => {
    if (visible) track('ad_impression', { brand, placement: 'tile' });
  }, [brand, visible]);

  return (
    <div className="w-full h-full" onClick={() => track('ad_click', { brand, placement: 'tile' })}>
      <div className="w-full h-full" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        {brand === 'newsletter' && <NewsletterTile topic={topic} />}
        {brand === 'kofi'       && <KofiTile />}
        {brand === 'isoqar'     && <IsoqarTile />}
        {brand === 'migraineme' && (showVideo ? (
          <a href="https://migraineme.app" target="_blank" rel="noreferrer"
            className="w-full h-full block relative overflow-hidden rounded-lg no-underline">
            <video key={src} src={src} autoPlay muted playsInline onEnded={onEnded}
              className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-end pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }}>
              <div className="p-2 flex items-end justify-between">
                <p className="text-white font-semibold text-[9px] leading-tight">MigraineMe</p>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-semibold text-white" style={{ background: '#E879A0' }}>Download</span>
              </div>
            </div>
          </a>
        ) : (
          <MigraineStaticTile />
        ))}
      </div>
    </div>
  );
}

/** 16:9 player ad — VideoGrid */
export function VideoGridAdBanner() {
  const [src, setSrc] = useState(() => MM_LANDSCAPE[Math.floor(Math.random() * MM_LANDSCAPE.length)]);
  const onEnded = useCallback(() => setSrc(prev => pickNext(MM_LANDSCAPE, prev)), []);

  return (
    <div className="w-full h-full relative bg-black">
      <video key={src} src={src} autoPlay muted playsInline onEnded={onEnded}
        className="w-full h-full object-cover"
        style={{ transform: 'translateY(-25%) scale(1.35)', transformOrigin: 'top center' }} />
      <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
        <div className="p-4 flex items-end justify-between"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
          <div>
            <p className="text-white font-semibold text-[13px] leading-tight">MigraineMe</p>
            <p className="text-white/70 text-[11px]">AI-powered migraine tracking</p>
          </div>
          <a href="https://migraineme.app" target="_blank" rel="noreferrer"
            className="pointer-events-auto shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold text-black"
            style={{ background: '#E879A0' }}>
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
