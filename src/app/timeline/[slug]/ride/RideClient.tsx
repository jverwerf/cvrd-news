"use client";

import { useEffect, useRef, useState } from "react";
import type { RidePayload } from "@/lib/ride-data";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function RideClient({ ride, compact, expandHref }: {
  ride: RidePayload;
  compact?: boolean;
  expandHref?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [voice, setVoice] = useState(true);
  const [flyDate, setFlyDate] = useState(ride.first);
  const [said, setSaid] = useState(0);          // words spoken so far
  const api = useRef<any>(null);
  const capRef = useRef<HTMLDivElement>(null);

  // In a card only a couple of lines fit, so the caption rolls with the voice
  // instead of truncating — the line being spoken is always the one you see.
  useEffect(() => {
    const box = capRef.current;
    if (!box || !compact) return;      // full view shows it all; nothing to scroll
    const word = box.querySelector<HTMLElement>(`[data-w="${Math.max(0, said - 1)}"]`);
    if (!word) return;
    // Snap to whole lines: a box cut mid-glyph reads as broken, so the scroll
    // position is always a multiple of the line height.
    const lineH = word.offsetHeight;
    const raw = word.offsetTop - box.clientHeight / 2 + word.offsetHeight / 2;
    const target = Math.max(0, Math.round(raw / lineH) * lineH);
    box.scrollTo({ top: target, behavior: "smooth" });
  }, [said]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { CSS3DRenderer, CSS3DObject } = await import(
        "three/examples/jsm/renderers/CSS3DRenderer.js"
      );
      const PP = await import("postprocessing");
      if (disposed || !stageRef.current) return;

      cleanup = buildRide({
        THREE, CSS3DRenderer, CSS3DObject, PP,
        stage: stageRef.current,
        ride,
        onDate: setFlyDate,
        onChapter: setChapter,
        onWords: setSaid,
        onPlaying: setPlaying,
            register: (controls: any) => {
          api.current = controls;
          (window as any).__ridePoster = controls.poster;
        },
      });
    })();

    return () => { disposed = true; cleanup(); };
  }, [ride]);

  const ch = ride.chapters[chapter];
  const words = ch ? ch.tldr.split(/\s+/) : [];

  return (
    <div className="relative w-full" style={{
      height: compact ? "100%" : "100svh",
      minHeight: compact ? 0 : 540,
      background: "#060B11", overflow: "hidden",
      // its own stacking context, so nothing inside paints over the site chrome
      isolation: "isolate",
      zIndex: 0,
      contain: compact ? "paint" : undefined,
    }}>
      <div ref={stageRef} className="absolute inset-0" />

      {/* corner brackets */}
      <div className="absolute pointer-events-none" style={{ inset: 18, zIndex: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{
            position: "absolute", width: 20, height: 20,
            border: "1px solid rgba(224,169,78,0.4)",
            top: i < 2 ? 0 : undefined, bottom: i >= 2 ? 0 : undefined,
            left: i % 2 === 0 ? 0 : undefined, right: i % 2 === 1 ? 0 : undefined,
            borderRight: i % 2 === 0 ? 0 : undefined, borderLeft: i % 2 === 1 ? 0 : undefined,
            borderBottom: i < 2 ? 0 : undefined, borderTop: i >= 2 ? 0 : undefined,
          }} />
        ))}
      </div>

      {/* top HUD */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start gap-6 pointer-events-none"
           style={{ padding: compact ? "14px 16px" : "34px 40px", zIndex: 4 }}>
        <div>
          {!compact && <div style={{ fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(126,142,151,0.85)", fontFamily: "ui-monospace, monospace" }}>Thread</div>}
          <div style={{ marginTop: compact ? 0 : 9, fontSize: compact ? 14 : 17, fontFamily: "'Instrument Serif', Georgia, serif", color: "#E6ECEF" }}>{ride.title}</div>
          {!compact && (
            <div style={{ marginTop: 6, fontSize: 10, letterSpacing: "0.08em", color: "rgba(126,142,151,0.6)", fontFamily: "ui-monospace, monospace" }}>
              {ride.stops.length} developments · {fmt(ride.first)} → {fmt(ride.last)}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: compact ? 14 : 22, color: "#E6ECEF", fontFamily: "ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}>{fmt(flyDate)}</div>
          <div style={{ fontSize: 11, color: "#E0A94E", fontFamily: "ui-monospace, monospace" }}>
            {pad(chapter + 1)} / {pad(ride.chapters.length)}
          </div>
          {ride.chapters.length <= 20 ? (
            <div className="flex gap-1 justify-end" style={{ marginTop: 10 }}>
              {ride.chapters.map((_, i) => (
                <span key={i} style={{
                  width: 16, height: i === chapter ? 3 : 1,
                  background: i === chapter ? "#E0A94E" : i < chapter ? "rgba(224,169,78,0.5)" : "rgba(230,236,239,0.22)",
                  transition: "all 400ms ease",
                }} />
              ))}
            </div>
          ) : (
            // the full story has hundreds of chapters: one bar, not a dash per chapter
            <div style={{ marginTop: 10, marginLeft: "auto", width: 150, height: 2, background: "rgba(230,236,239,0.18)" }}>
              <div style={{
                width: `${((chapter + 1) / ride.chapters.length) * 100}%`, height: "100%",
                background: "#E0A94E", transition: "width 400ms ease",
              }} />
            </div>
          )}
        </div>
      </div>

      {/* out: back to the thread when full, out to full view when in a card */}
      {compact ? (
        expandHref && (
          <a href={expandHref} className="absolute"
             style={{
               left: 14, bottom: 13, zIndex: 6, fontSize: 9.5, letterSpacing: "0.16em",
               textTransform: "uppercase", color: "#F6D9A0", fontFamily: "ui-monospace, monospace",
               textDecoration: "none", border: "1px solid rgba(224,169,78,0.45)", padding: "6px 9px",
             }}>⤢ Full view</a>
        )
      ) : (
        <a href={`/timeline/${ride.id}`} className="absolute"
           style={{
             left: 40, bottom: 34, zIndex: 5, fontSize: 10, letterSpacing: "0.18em",
             textTransform: "uppercase", color: "rgba(126,142,151,0.8)",
             fontFamily: "ui-monospace, monospace", textDecoration: "none",
           }}>← Back to the thread</a>
      )}

      {/* caption + controls */}
      <div className="absolute left-0 right-0 bottom-0 grid justify-items-center"
           style={{ padding: compact ? "14px 14px 12px" : "40px 40px 34px", gap: compact ? 7 : 18, zIndex: 4,
                    justifyItems: "center",
                    background: "linear-gradient(180deg, transparent, rgba(4,8,11,0.94) 46%)" }}>
        {ch && (
          <>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#E0A94E", fontFamily: "ui-monospace, monospace" }}>
              {fmt(ride.stops[ch.i]?.d || ride.first)} · {ch.label}
            </div>
            <div ref={capRef} style={{
              maxWidth: compact ? "62ch" : "58ch",
              width: "100%",
              marginInline: "auto",
              height: compact ? "3.1em" : undefined,
              overflow: "hidden",
              maskImage: compact ? "linear-gradient(180deg, transparent 0, #000 9%, #000 91%, transparent 100%)" : undefined,
              WebkitMaskImage: compact ? "linear-gradient(180deg, transparent 0, #000 9%, #000 91%, transparent 100%)" : undefined,
            }}>
              <p style={{
                textAlign: "center", fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: compact ? 12.5 : "clamp(15px, 1.4vw, 18px)", lineHeight: 1.5,
                color: "rgba(126,142,151,0.9)", margin: 0,
              }}>
                {words.map((w, i) => (
                  <span key={i} data-w={i}
                        style={{ color: i < said ? "#E6ECEF" : undefined, transition: "color 200ms ease" }}>{w} </span>
                ))}
              </p>
            </div>
          </>
        )}
        <div className="flex items-center gap-2 flex-wrap justify-center" style={{ pointerEvents: "auto" }}>
          <RideButton disabled={chapter === 0} onClick={() => api.current?.prev()}>Back</RideButton>
          <RideButton primary onClick={() => { if (!started) { setStarted(true); api.current?.start(); } else api.current?.toggle(); }}>
            {playing ? "Pause" : "Play"}
          </RideButton>
          <RideButton disabled={chapter === ride.chapters.length - 1} onClick={() => api.current?.next()}>Next</RideButton>
          <RideButton onClick={() => { setVoice(v => !v); api.current?.setVoice(!voice); }}>Voice: {voice ? "on" : "off"}</RideButton>
        </div>
      </div>
    </div>
  );
}

function RideButton({ children, onClick, primary, disabled }: {
  children: React.ReactNode; onClick?: () => void; primary?: boolean; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em",
        textTransform: "uppercase", padding: "10px 16px", cursor: disabled ? "not-allowed" : "pointer",
        background: "transparent", opacity: disabled ? 0.3 : 1,
        border: `1px solid ${primary ? "#E0A94E" : "rgba(230,236,239,0.13)"}`,
        color: primary ? "#E0A94E" : "#E6ECEF",
      }}>{children}</button>
  );
}

function pad(n: number) { return ("0" + n).slice(-2); }
function fmt(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// The scene itself lives outside React — it owns a render loop and a pile of
// GPU objects, and has no business re-rendering when a caption changes.
function buildRide(opts: any): () => void {
  const { THREE, CSS3DRenderer, CSS3DObject, PP, stage, ride, onDate, onChapter, onWords, onPlaying, register } = opts;
  const STOPS = ride.stops, CHAPTERS = ride.chapters;
  const chapterAt: Record<number, number> = {};
  CHAPTERS.forEach((c: any, n: number) => { chapterAt[c.i] = n; });

  const INK = 0x060B11, GOLD = 0xE0A94E, GOLD_HOT = 0xF6D9A0, BRONZE = 0x8A6224;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,   // so a frame can be read back for the poster
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.FogExp2(INK, 0.0075);
  const camera = new THREE.PerspectiveCamera(60, stage.clientWidth / stage.clientHeight, 0.1, 1400);

  const composer = new PP.EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new PP.RenderPass(scene, camera));
  composer.addPass(new PP.EffectPass(camera,
    new PP.BloomEffect({ intensity: 1.15, luminanceThreshold: 0.22, luminanceSmoothing: 0.45, mipmapBlur: true, kernelSize: PP.KernelSize.LARGE }),
    new PP.ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0006, 0.0004) }),
    Object.assign(new PP.NoiseEffect({ blendFunction: PP.BlendFunction.OVERLAY, premultiply: true }), {}),
    new PP.VignetteEffect({ offset: 0.28, darkness: 0.6 })));

  const cssScene = new THREE.Scene();
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(stage.clientWidth, stage.clientHeight);
  cssRenderer.domElement.style.cssText =
    "position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;clip-path:inset(0)";
  stage.appendChild(cssRenderer.domElement);

  scene.add(new THREE.AmbientLight(0x46565F, 1.0));
  const key = new THREE.PointLight(0xD2914E, 70, 110, 2);
  scene.add(key);

  // ── the thread ───────────────────────────────────────────
  const SPACING = 17;
  const raw: any[] = [];
  for (let g = 0; g <= STOPS.length; g += 3) {
    raw.push(new THREE.Vector3(
      // two slow sideways swings of different lengths, so it never repeats
      Math.sin(g * 0.048) * 19 + Math.sin(g * 0.013) * 11,
      // a long rise and fall with a shallower ripple over it
      Math.cos(g * 0.034) * 9 + Math.sin(g * 0.087) * 2.4,
      -g * SPACING));
  }
  const curve = new THREE.CatmullRomCurve3(raw, false, "catmullrom", 0.5);
  const TOTAL_Z = STOPS.length * SPACING;
  const tForStop = (i: number) => Math.min(0.9995, Math.max(0.0005, (i * SPACING) / TOTAL_Z));

  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 2400, 0.075, 8, false),
    new THREE.MeshBasicMaterial({ color: GOLD_HOT, transparent: true, opacity: 0.95 })));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 1200, 0.55, 8, false),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false })));

  const frames = curve.computeFrenetFrames(1200, false);
  const braid = (phase: number, colour: number, radius: number, opacity: number) => {
    const pts: any[] = [];
    for (let i = 0; i <= 1200; i++) {
      const u = i / 1200;
      const p = curve.getPointAt(u).clone();
      const a = u * Math.PI * 2 * 26 + phase;
      p.addScaledVector(frames.normals[Math.min(i, frames.normals.length - 1)], Math.cos(a) * radius);
      p.addScaledVector(frames.binormals[Math.min(i, frames.binormals.length - 1)], Math.sin(a) * radius);
      pts.push(p);
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity })));
  };
  braid(0, GOLD, 0.36, 0.5);
  braid(Math.PI, BRONZE, 0.36, 0.4);

  // pulses along the thread
  const stripe = document.createElement("canvas");
  stripe.width = 256; stripe.height = 4;
  const sc = stripe.getContext("2d")!;
  const grd = sc.createLinearGradient(0, 0, 256, 0);
  grd.addColorStop(0, "rgba(255,255,255,0)");
  grd.addColorStop(0.44, "rgba(255,255,255,0)");
  grd.addColorStop(0.5, "rgba(255,226,170,0.95)");
  grd.addColorStop(0.56, "rgba(255,255,255,0)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  sc.fillStyle = grd; sc.fillRect(0, 0, 256, 4);
  const stripeTex = new THREE.CanvasTexture(stripe);
  stripeTex.wrapS = stripeTex.wrapT = THREE.RepeatWrapping;
  stripeTex.repeat.set(40, 1);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 1200, 0.17, 8, false),
    new THREE.MeshBasicMaterial({ map: stripeTex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));

  // ── a screen per stop: thumbnail now, live player when you are near ──
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  const W = 7.2, H = W * 9 / 16;
  const panels = STOPS.map((stop: any, i: number) => {
    const isChapter = chapterAt[i] !== undefined;
    const scale = isChapter ? 1.6 : 1;
    const mat = new THREE.MeshBasicMaterial({
      color: 0x0B1015, transparent: true, opacity: isChapter ? 0.98 : 0.5, depthWrite: false,
    });
    const paint = (url: string) => loader.load(url, (tex: any) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
    });
    if (stop.v) paint(`https://i.ytimg.com/vi/${stop.v}/mqdefault.jpg`);
    else if (stop.img) paint(stop.img);
    else {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 288;
      const g = c.getContext("2d")!;
      g.fillStyle = "#0B1218"; g.fillRect(0, 0, c.width, c.height);
      g.strokeStyle = "rgba(224,169,78,0.45)"; g.lineWidth = 2;
      g.strokeRect(10, 10, c.width - 20, c.height - 20);
      g.fillStyle = "#E0A94E";
      g.font = "500 18px ui-monospace, monospace";
      g.fillText(new Date(stop.d + "T00:00:00")
        .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        .toUpperCase(), 30, 52);
      g.fillStyle = "#E9EEF1";
      g.font = "24px 'Instrument Serif', Georgia, serif";
      const words = String(stop.t || "").split(" ");
      let line = "", y = 96;
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (g.measureText(test).width > c.width - 60) { g.fillText(line, 30, y); line = w; y += 30; }
        else line = test;
        if (y > c.height - 40) break;
      }
      g.fillText(line, 30, y);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
    }
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W * scale, H * scale), mat);
    const at = curve.getPointAt(tForStop(i));
    const side = isChapter ? 0 : (i % 2 ? 1 : -1) * (8.6 + (i % 5) * 1.7);
    const lift = isChapter ? 5.6 : 2.4 + ((i % 3) - 1) * 2.8;
    mesh.position.set(at.x + side, at.y + lift, at.z);
    scene.add(mesh);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(W * scale, H * scale)),
      new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: isChapter ? 0.5 : 0.16 }));
    edge.position.copy(mesh.position);
    scene.add(edge);

    return { mesh, edge, isChapter, index: i };
  });

  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(2600 * 3);
  for (let i = 0; i < 2600; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 150;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 70;
    dustPos[i * 3 + 2] = -Math.random() * TOTAL_Z;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9FB3BA, size: 0.11, transparent: true, opacity: 0.45, depthWrite: false }));
  scene.add(dust);

  // ── live players ─────────────────────────────────────────
  const PLAYER_COUNT = 3;
  const players: any[] = [];
  let ytReady = false;

  // reused each frame for parking the two players that are not on screen duty
  const parkFwd = new THREE.Vector3();
  const parkRight = new THREE.Vector3();
  const parkUp = new THREE.Vector3();

  const videoFor = (idx: number) => {
    const c = chapterAt[idx];
    if (c !== undefined && CHAPTERS[c].v) return CHAPTERS[c].v;
    return STOPS[idx]?.v;
  };
  const startFor = (idx: number) => {
    const c = chapterAt[idx];
    return c !== undefined ? (CHAPTERS[c].start ?? 14) : 14;
  };

  // A YT.Player built without a video id loads an invalid embed that never fires
  // onReady, so it can never be told what to show. Seed each one from a stop
  // that genuinely has a clip — chapter 0 often has none.
  const seedStops: number[] = [];
  CHAPTERS.forEach((c: any) => { if (c.v && seedStops.length < PLAYER_COUNT) seedStops.push(c.i); });
  for (let i = 0; i < STOPS.length && seedStops.length < PLAYER_COUNT; i++) {
    if (STOPS[i].v && !seedStops.includes(i)) seedStops.push(i);
  }

  for (let i = 0; i < PLAYER_COUNT; i++) {
    const holder = document.createElement("div");
    holder.style.cssText =
      "position:relative;width:480px;height:270px;background:#05080B;border:1px solid rgba(224,169,78,0.5);" +
      "overflow:hidden;filter:saturate(0.82) contrast(1.06) brightness(0.92);";
    const mount = document.createElement("div");
    mount.style.cssText = "width:100%;height:100%";
    holder.appendChild(mount);
    // An embed that has not started yet paints solid black, and three of those
    // hanging in the scene read as broken. Cover each one with the same still
    // its panel would have shown, and lift it the moment the clip is running.
    const poster = document.createElement("div");
    poster.style.cssText =
      "position:absolute;inset:0;background:#05080B center/cover no-repeat;" +
      "pointer-events:none;transition:opacity 260ms ease;";
    holder.appendChild(poster);
    const obj = new CSS3DObject(holder);
    obj.scale.set(0.0165, 0.0165, 0.0165);
    obj.visible = false;
    cssScene.add(obj);
    players.push({ obj, mount, poster, posterId: null, player: null, seed: seedStops[i % Math.max(1, seedStops.length)] ?? -1,
      stop: -1, wanted: -1, loaded: -1, ready: false, loadedAt: 0, retried: false });
  }

  // read-only handle for diagnosing playback from the console
  (window as any).__ridePlayers = players;

  function initPlayers() {
    if (!window.YT?.Player) return;
    if (!seedStops.length) return;                 // a thread with no clips at all
    if (ytReady) return;                           // never build the pool twice
    ytReady = true;
    players.forEach((pl) => {
      pl.player = new window.YT.Player(pl.mount, {
        width: "480", height: "270",
        videoId: videoFor(pl.seed),
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0,
          modestbranding: 1, rel: 0, iv_load_policy: 3, playsinline: 1,
          start: startFor(pl.seed),
        },
        // index 0 keeps the opening clip; the rest are told what to show as
        // soon as they are ready, so no two sit on the same video
        events: {
          onReady: (e: any) => {
            pl.ready = true;
            if (pl.loaded < 0) pl.loaded = pl.seed;
            e.target.mute();
            e.target.playVideo();
          },
          // never let one rest on its end card — that is where the chrome lives
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              e.target.seekTo(startFor(pl.stop), true);
              e.target.playVideo();
            }
          },
        },
      });
    });
  }

  if (window.YT?.Player) initPlayers();
  else {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); initPlayers(); };
    if (!document.getElementById("yt-iframe-api")) {
      const s = document.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
    // onYouTubeIframeAPIReady fires once per page. If it has already gone off —
    // an earlier mount, another component, a remount in dev — this ride would
    // wait for a callback that never comes and silently show no video at all.
    // So watch for the API directly as well; whichever arrives first wins.
    const waitForApi = setInterval(() => {
      if (ytReady) { clearInterval(waitForApi); return; }
      if (window.YT?.Player) { clearInterval(waitForApi); initPlayers(); }
    }, 250);
    setTimeout(() => clearInterval(waitForApi), 45000);
  }

  // ── ride state ───────────────────────────────────────────
  let chapter = 0, t = tForStop(CHAPTERS[0].i), target = t;
  let playing = false, voiceOn = true;
  let audio: HTMLAudioElement | null = null;
  let timer: any = null, wordTimer: any = null, fade: any = null;
  let lastAssigned = -1, firstAssign = true;
  const posTmp = new THREE.Vector3(), lookTmp = new THREE.Vector3(), upTmp = new THREE.Vector3(0, 1, 0);

  const SOUND_BITE_MS = 30000;

  let audioCtx: AudioContext | null = null;
  function zoof() {
    if (!audioCtx) return;
    const ctx = audioCtx, now = ctx.currentTime, dur = 1.8;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * 0.6;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.Q.value = 1.5;
    bp.frequency.setValueAtTime(160, now);
    bp.frequency.exponentialRampToValueAtTime(2500, now + 0.5);
    bp.frequency.exponentialRampToValueAtTime(120, now + dur);
    const air = ctx.createGain();
    air.gain.setValueAtTime(0.0001, now);
    air.gain.exponentialRampToValueAtTime(0.13, now + 0.2);
    air.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(bp); bp.connect(air); air.connect(ctx.destination);
    src.start(now); src.stop(now + dur);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 1.3);
    const sub = ctx.createGain();
    sub.gain.setValueAtTime(0.0001, now);
    sub.gain.exponentialRampToValueAtTime(0.26, now + 0.12);
    sub.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    osc.connect(sub); sub.connect(ctx.destination);
    osc.start(now); osc.stop(now + 1.55);
  }

  function muteAll() {
    players.forEach((pl) => { try { pl.player?.mute?.(); } catch {} });
  }

  function stopNarration() {
    clearInterval(wordTimer);
    clearInterval(fade);
    if (audio) { audio.pause(); audio = null; }
    muteAll();
  }

  /**
   * Hand the floor to the clip: unmute the chapter's player for a beat, then
   * fade it away rather than cutting, so leaving a stop doesn't feel abrupt.
   */
  const FADE_MS = 3000;

  function soundBite(done: () => void) {
    const pl = players.find((p) => p.stop === CHAPTERS[chapter].i && p.player?.unMute);
    if (!pl) { timer = setTimeout(done, 700); return; }

    // The clip has been running muted underneath the narration, so the playhead
    // is a long way past the second that was chosen for it — often with only a
    // few seconds of clip left. Go back to the chosen moment whenever that buys
    // a fuller bite; the picker guarantees the window fits from there.
    const dur = Number(pl.player.getDuration?.() || 0);
    const pos = Number(pl.player.getCurrentTime?.() || 0);
    const from = startFor(pl.stop);
    let biteMs = SOUND_BITE_MS;
    if (dur > 1) {
      let leftMs = Math.max(0, (dur - pos - 0.6) * 1000);
      const fromStartMs = Math.max(0, (dur - from - 0.6) * 1000);
      if (leftMs < Math.min(SOUND_BITE_MS, fromStartMs)) {
        try { pl.player.seekTo(from, true); pl.player.playVideo?.(); } catch {}
        leftMs = fromStartMs;
      }
      biteMs = Math.max(1500, Math.min(SOUND_BITE_MS, leftMs));
    }
    const fadeMs = Math.min(FADE_MS, Math.round(biteMs * 0.4));

    const PEAK = 70;
    try { pl.player.setVolume?.(0); pl.player.unMute(); } catch {}

    // ease in as well, so it arrives gently
    let v = 0;
    const rise = setInterval(() => {
      v = Math.min(PEAK, v + PEAK / 12);
      try { pl.player.setVolume?.(Math.round(v)); } catch {}
      if (v >= PEAK) clearInterval(rise);
    }, 60);

    timer = setTimeout(() => {
      clearInterval(rise);
      let out = PEAK;
      const steps = Math.max(1, Math.round(fadeMs / 60));
      fade = setInterval(() => {
        out -= PEAK / steps;
        if (out <= 0) {
          clearInterval(fade);
          try { pl.player.setVolume?.(0); pl.player.mute(); } catch {}
          done();
          return;
        }
        try { pl.player.setVolume?.(Math.round(out)); } catch {}
      }, 60);
    }, Math.max(0, biteMs - fadeMs));
  }

  function narrate(n: number, done: () => void) {
    stopNarration();
    const c = CHAPTERS[n];
    const total = c.tldr.split(/\s+/).length;
    if (!voiceOn || !c.audio) { onWords(total); timer = setTimeout(done, 2800); return; }
    audio = new Audio(c.audio);
    audio.play().catch(() => { onWords(total); timer = setTimeout(done, 1500); });
    const LEAD = 0.3;        // land the word just before it is said
    const TAIL = 0.4;        // clips end with a beat of silence
    wordTimer = setInterval(() => {
      if (!audio || !audio.duration) return;
      const usable = Math.max(0.1, audio.duration - TAIL);
      const p = Math.min(1, Math.max(0, (audio.currentTime + LEAD) / usable));
      onWords(Math.round(p * total));
    }, 50);
    audio.onended = () => { onWords(total); done(); };
    audio.onerror = () => { onWords(total); timer = setTimeout(done, 1500); };
  }

  function goToChapter(n: number, silent?: boolean) {
    chapter = Math.max(0, Math.min(CHAPTERS.length - 1, n));
    target = tForStop(CHAPTERS[chapter].i);
    onChapter(chapter);
    onWords(0);
    clearTimeout(timer);
    stopNarration();
    if (!silent) zoof();
    if (playing) {
      timer = setTimeout(() => {
        afterNarration = () => {
          if (!playing) return;
          soundBite(() => {
            if (!playing) return;
            if (chapter < CHAPTERS.length - 1) goToChapter(chapter + 1);
            else setPlaying(false);
          });
        };
        narrate(chapter, () => afterNarration?.());
      }, reduced ? 300 : 1400);
    }
  }

  let afterNarration: (() => void) | null = null;   // what to do once the voice finishes

  function setPlaying(on: boolean) {
    if (!on) {
      playing = false;
      onPlaying(false);
      clearTimeout(timer);
      clearInterval(wordTimer);
      clearInterval(fade);
      if (audio) audio.pause();                       // keep it, do not discard
      players.forEach((pl) => {
        try { pl.player?.pauseVideo?.(); pl.player?.mute?.(); } catch {}
      });
      return;
    }

    playing = true;
    onPlaying(true);
    players.forEach((pl) => { try { pl.player?.playVideo?.(); } catch {} });

    // mid-sentence: carry on from where the voice stopped
    if (audio && !audio.ended && audio.currentTime > 0) {
      const total = (CHAPTERS[chapter].tldr.match(/\S+/g) || []).length;
      const resume = audio;
      resume.play().catch(() => {});
      const LEAD = 0.3, TAIL = 0.4;
      clearInterval(wordTimer);
      wordTimer = setInterval(() => {
        if (!resume.duration) return;
        const usable = Math.max(0.1, resume.duration - TAIL);
        onWords(Math.round(Math.min(1, Math.max(0, (resume.currentTime + LEAD) / usable)) * total));
      }, 50);
      resume.onended = () => { onWords(total); afterNarration?.(); };
      return;
    }

    goToChapter(chapter, true);
  }

  register({
    // brighten for the grab only — a poster is an advert for the ride, not a
    // measurement of it — then put everything back exactly as it was
    poster: (chapterIndex = 0) => {
      const before = { fog: scene.fog.density, key: key.intensity, exposure: renderer.toneMappingExposure };
      scene.fog.density = before.fog * 0.45;
      key.intensity = before.key * 2.4;
      renderer.toneMappingExposure = 1.9;
      panels.forEach((p: any) => { p.mesh.material.opacity = Math.min(1, p.mesh.material.opacity + 0.45); });
      composer.render(0.016);
      const data = renderer.domElement.toDataURL("image/png");
      scene.fog.density = before.fog;
      key.intensity = before.key;
      renderer.toneMappingExposure = before.exposure;
      return data;
    },
    start: () => {
      // browsers only allow audio from a user gesture, and this is it
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
      } catch { audioCtx = null; }
      setPlaying(true);
    },
    toggle: () => setPlaying(!playing),
    next: () => goToChapter(chapter + 1),
    prev: () => goToChapter(chapter - 1),
    setVoice: (v: boolean) => { voiceOn = v; if (!v) stopNarration(); },
  });

  // ── frame loop ───────────────────────────────────────────
  const clock = new THREE.Clock();
  let bank = 0, settle = 0, nearest = -1, raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    const time = performance.now();
    const dt = Math.min(clock.getDelta(), 0.05);

    const gap = target - t;
    if (Math.abs(gap) > 0.00004) t += gap * Math.min(1, dt * (reduced ? 5 : 0.55));
    else t = target;

    const head = Math.min(0.9995, Math.max(0.0005, t));
    curve.getPointAt(head, posTmp);
    const tan = curve.getTangentAt(head);
    const active = panels[CHAPTERS[chapter].i];
    settle += ((Math.abs(gap) < 0.0009 ? 1 : 0) - settle) * 0.035;

    camera.position.set(
      posTmp.x - tan.x * 15,
      posTmp.y + 4.2 - tan.y * 15 + settle * 1.6,
      posTmp.z - tan.z * 15);
    // aim further up the thread while travelling, so you see where it goes next
    curve.getPointAt(Math.min(0.9995, head + 0.006 + (1 - settle) * 0.012), lookTmp);
    let aimX = lookTmp.x, aimY = lookTmp.y + 1.2, aimZ = lookTmp.z;
    if (active) {
      const ap = active.mesh.position, turn = settle * 0.8;
      aimX += (ap.x - aimX) * turn; aimY += (ap.y - aimY) * turn; aimZ += (ap.z - aimZ) * turn;
    }
    camera.up.copy(upTmp);
    camera.lookAt(aimX, aimY, aimZ);

    const ahead = curve.getTangentAt(Math.min(0.9995, head + 0.002));
    bank += ((ahead.x - tan.x) * 1.6 - bank) * 0.04;
    camera.rotation.z += bank * (1 - settle * 0.7) + Math.sin(time * 0.0004) * 0.01;
    const rush = Math.min(1, Math.abs(gap) * 900);
    camera.fov += ((60 + rush * 7) - camera.fov) * 0.06;
    camera.updateProjectionMatrix();

    key.position.set(posTmp.x, posTmp.y + 4, posTmp.z);
    stripeTex.offset.x -= dt * (0.1 + rush * 0.8);

    const approx = Math.round((head * TOTAL_Z) / SPACING);
    if (approx !== nearest && STOPS[approx]) { nearest = approx; onDate(STOPS[approx].d); }

    // assignment only on chapter change: every reshuffle costs a load
    if (ytReady && (chapter !== lastAssigned || firstAssign)) {
      lastAssigned = chapter; firstAssign = false;
      const want: number[] = [];
      if (CHAPTERS[chapter].v) want.push(CHAPTERS[chapter].i);
      [chapter + 1, chapter - 1, chapter + 2].forEach((n) => {
        if (n < 0 || n >= CHAPTERS.length || want.length >= PLAYER_COUNT) return;
        if (CHAPTERS[n].v && !want.includes(CHAPTERS[n].i)) want.push(CHAPTERS[n].i);
      });
      for (let off = 1; want.length < PLAYER_COUNT && off < 60; off++) {
        [CHAPTERS[chapter].i + off, CHAPTERS[chapter].i - off].forEach((idx) => {
          if (want.length >= PLAYER_COUNT) return;
          if (idx < 0 || idx >= STOPS.length || !STOPS[idx].v) return;
          if (!want.includes(idx)) want.push(idx);
        });
      }
      const held = players.map((p) => p.stop);
      const free = want.filter((w) => !held.includes(w));
      players.forEach((pl) => {
        if (want.includes(pl.wanted)) { pl.stop = pl.wanted; return; }
        const next = free.shift();
        pl.wanted = next === undefined ? -1 : next;
        pl.stop = pl.wanted;
        pl.retried = false;
      });
    }

    // load what each player is meant to show, once it is able to
    players.forEach((pl) => {
      if (!pl.ready || pl.wanted < 0 || pl.wanted === pl.loaded) return;
      const id = videoFor(pl.wanted);
      if (!id) return;
      pl.player?.loadVideoById?.({ videoId: id, startSeconds: startFor(pl.wanted) });
      pl.player?.mute?.();
      pl.loaded = pl.wanted;
      pl.loadedAt = performance.now();
    });

    // a player that never leaves "unstarted" is a throttled embed: nudge it once
    players.forEach((pl) => {
      if (!pl.ready || pl.loaded < 0 || pl.retried) return;
      if (performance.now() - (pl.loadedAt || 0) < 6000) return;
      const state = pl.player?.getPlayerState?.();
      if (state === -1 || state === 5 || state === undefined) {
        pl.retried = true;
        try {
          pl.player.loadVideoById({ videoId: videoFor(pl.loaded), startSeconds: startFor(pl.loaded) });
          pl.player.mute();
          pl.player.playVideo();
        } catch {}
      }
    });

    const nowStop = CHAPTERS[chapter].i;
    let parked = 0;
    players.forEach((pl) => {
      const host = panels[pl.stop];
      if (!host) { pl.obj.visible = false; return; }
      // CSS3D draws above the whole scene, so a player loading in the distance
      // still lands on top of the stop you are watching. Only the one you are
      // on sits on its panel; the others wait out to the side, smaller, where
      // they can keep loading without covering anything.
      const mine = pl.stop === nowStop;
      const big = host.isChapter ? 1.6 : 1;
      if (mine) {
        pl.obj.position.copy(host.mesh.position);
        pl.obj.quaternion.copy(host.mesh.quaternion);
        pl.obj.scale.set(0.0165 * big, 0.0165 * big, 0.0165 * big);
      } else {
        // Pinned to the camera rather than to the thread, so they hold the same
        // two spots on screen while the camera flies between stops.
        const side = parked++ === 0 ? -1 : 1;
        parkFwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
        parkRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
        parkUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
        pl.obj.position.copy(camera.position)
          .addScaledVector(parkFwd, 26)
          .addScaledVector(parkRight, side * 10.6)
          .addScaledVector(parkUp, -1.6);
        pl.obj.quaternion.copy(camera.quaternion);
        pl.obj.scale.set(0.0165 * 0.58, 0.0165 * 0.58, 0.0165 * 0.58);
      }
      // Visible as soon as a clip is ASSIGNED, not once it has loaded: a hidden
      // CSS3D element is out of the DOM, so gating on load never resolves.
      const hasVideo = pl.stop >= 0 && !!videoFor(pl.stop);
      // Keep the cover in step with whatever stop this player owns, whether it
      // was seeded with it or told to load it, then lift it once it is running.
      const owned = hasVideo ? videoFor(pl.stop) : null;
      if (owned && pl.posterId !== owned) {
        pl.poster.style.backgroundImage = `url(https://i.ytimg.com/vi/${owned}/mqdefault.jpg)`;
        pl.posterId = owned;
      }
      pl.poster.style.opacity = pl.player?.getPlayerState?.() === 1 ? "0" : "1";
      pl.obj.visible = hasVideo;
      host.mesh.visible = !hasVideo;                      // still holds it until a clip is loaded
      host.edge.visible = !hasVideo;
    });

    for (let i = 0; i < panels.length; i++) {
      const p = panels[i];
      if (players.some((pl) => pl.stop === i && pl.obj.visible)) continue;   // a loaded player owns this one
      if (Math.abs(p.mesh.position.z - posTmp.z) > 260) { p.mesh.visible = false; p.edge.visible = false; continue; }
      p.mesh.visible = true; p.edge.visible = true;
      p.mesh.lookAt(camera.position);
      p.edge.lookAt(camera.position);
      const goal = p.isChapter ? 0.7 : 0.42;
      p.mesh.material.opacity += (goal - p.mesh.material.opacity) * 0.05;
    }

    dust.rotation.y += dt * 0.004;
    composer.render(dt);
    cssRenderer.render(cssScene, camera);
  }
  frame();

  const onResize = () => {
    camera.aspect = stage.clientWidth / stage.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    composer.setSize(stage.clientWidth, stage.clientHeight);
    cssRenderer.setSize(stage.clientWidth, stage.clientHeight);
  };
  window.addEventListener("resize", onResize);
  goToChapter(0, true);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    clearTimeout(timer); clearInterval(wordTimer);
    if (audio) audio.pause();
    players.forEach((pl) => pl.player?.destroy?.());
    renderer.dispose();
    composer.dispose();
    stage.innerHTML = "";
  };
}
