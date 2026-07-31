"use client";

import dynamic from "next/dynamic";
import type { RidePayload } from "@/lib/ride-data";

// three and postprocessing both touch window at import time, so the scene is
// loaded only in the browser — and only once this page is actually opened,
// which keeps ~1MB of 3D code out of every other route's bundle.
const RideClient = dynamic(() => import("./RideClient").then((m) => m.RideClient), {
  ssr: false,
  loading: () => (
    <div style={{
      height: "100svh", background: "#060B11", color: "rgba(126,142,151,0.8)",
      display: "grid", placeContent: "center", fontFamily: "ui-monospace, monospace",
      fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
    }}>Threading…</div>
  ),
});

export function RideMount({ ride }: { ride: RidePayload }) {
  return <RideClient ride={ride} />;
}
