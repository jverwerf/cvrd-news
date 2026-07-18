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
  const [topic, setTopic] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/top-story').then(r => r.json()).then(d => setTopic(d.topic ?? null)).catch(() => {});
  }, []);
  return topic;
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

type Brand = 'migraineme' | 'newsletter' | 'kofi';
const BRAND_ORDER: Brand[] = ['migraineme', 'newsletter', 'kofi'];

function useCyclingBrand(ms = 60000) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * BRAND_ORDER.length));
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      if (_pauseCycling) return;
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % BRAND_ORDER.length); setVisible(true); }, 400);
    }, ms);
    return () => clearInterval(t);
  }, [ms]);
  return { brand: BRAND_ORDER[idx], visible };
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

const NEWSLETTER_CHIPS = ['𝕏', 'social pulse', 'reddit', 'tiktok', 'telegram', 'on record', 'timeline'];
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

// ─── Public components ───────────────────────────────────────────────────────

/** Wide horizontal banner (~90px tall) */
export function HorizontalAdBanner() {
  const { brand, visible } = useCyclingBrand();
  const topic = useTopStory();
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
      </div>
    </div>
  );
}

/** Square tile — Dashboard, On Record grid */
export function TileAdBanner() {
  const { brand, visible } = useCyclingBrand();
  const topic = useTopStory();
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
