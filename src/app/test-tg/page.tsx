"use client";

import { useState } from "react";

const TG_CLIPS = [
  { id: "Newsmax/30592", label: "JUST IN: President Trump issued a 48-hour warning to Iran" },
  { id: "disclosetv/20640", label: "U.S. fighter jet shot down in Iran" },
  { id: "France24_en/16319", label: "Two US fighter jets downed in Mideast" },
  { id: "France24_en/16329", label: "Trump gives Iran 48 hours to make a deal" },
  { id: "liveuamap/12054", label: "Iran has shot down a U.S. fighter jet" },
  { id: "warmonitors/43144", label: "Israel prepares to attack additional energy sites" },
];

export default function TestTG() {
  const [active, setActive] = useState(TG_CLIPS[0]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");

  const apiUrl = `/api/tg-video?post=${active.id}`;
  const thumbUrl = `/api/tg-video?post=${active.id}&thumb=1`;

  return (
    <div style={{ background: "#111", color: "#eee", minHeight: "100vh", padding: 32, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Telegram Video Test</h1>

      {/* Clip selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {TG_CLIPS.map((clip) => (
          <button
            key={clip.id}
            onClick={() => { setActive(clip); setError(null); setStatus("idle"); }}
            style={{
              padding: "8px 12px", borderRadius: 6, border: "1px solid #444",
              background: active.id === clip.id ? "#0088cc" : "#222",
              color: "#eee", cursor: "pointer", fontSize: 11,
            }}
          >
            {clip.id}
          </button>
        ))}
      </div>

      {/* Info */}
      <div style={{ marginBottom: 16, fontSize: 12, color: "#888" }}>
        <div>Post: <strong style={{ color: "#eee" }}>{active.id}</strong></div>
        <div>API URL: <a href={apiUrl} target="_blank" style={{ color: "#0088cc" }}>{apiUrl}</a></div>
        <div>Thumb URL: <a href={thumbUrl} target="_blank" style={{ color: "#0088cc" }}>{thumbUrl}</a></div>
        <div>Status: <strong style={{ color: status === "error" ? "#f44" : status === "playing" ? "#4f4" : "#ff0" }}>{status}</strong></div>
        {error && <div style={{ color: "#f44", marginTop: 4 }}>Error: {error}</div>}
      </div>

      {/* Thumbnail test */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Thumbnail (thumb=1)</h3>
        <img
          src={thumbUrl}
          alt="thumb"
          style={{ maxWidth: 400, border: "1px solid #333", borderRadius: 8 }}
          onLoad={() => console.log("Thumb loaded")}
          onError={() => console.log("Thumb failed")}
        />
      </div>

      {/* Video player test */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Video (autoPlay muted playsInline controls)</h3>
        <video
          key={active.id + "-auto"}
          src={apiUrl}
          poster={thumbUrl}
          autoPlay
          muted
          playsInline
          controls
          style={{ maxWidth: 600, border: "1px solid #333", borderRadius: 8, background: "#000" }}
          onLoadStart={() => setStatus("loading")}
          onCanPlay={() => setStatus("canplay")}
          onPlaying={() => setStatus("playing")}
          onError={(e) => {
            const v = e.currentTarget;
            const code = v.error?.code;
            const msg = v.error?.message || "unknown";
            setError(`code=${code} msg=${msg}`);
            setStatus("error");
          }}
          onStalled={() => setStatus("stalled")}
          onWaiting={() => setStatus("waiting")}
        />
      </div>

      {/* Manual fetch test */}
      <div>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Manual fetch test</h3>
        <button
          onClick={async () => {
            setStatus("fetching...");
            setError(null);
            try {
              const res = await fetch(apiUrl);
              const ct = res.headers.get("content-type");
              const size = res.headers.get("content-length");
              if (!res.ok) {
                const text = await res.text();
                setError(`HTTP ${res.status}: ${text}`);
                setStatus("error");
              } else {
                setStatus(`OK — content-type: ${ct}, size: ${size}`);
              }
            } catch (e: any) {
              setError(e.message);
              setStatus("error");
            }
          }}
          style={{ padding: "8px 16px", background: "#333", color: "#eee", border: "1px solid #555", borderRadius: 6, cursor: "pointer" }}
        >
          Fetch API response
        </button>
        </div>
    </div>
  );
}
