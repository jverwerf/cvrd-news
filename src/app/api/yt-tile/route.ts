import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const v = req.nextUrl.searchParams.get('v') || '';
  if (!v) return new NextResponse('Missing video ID', { status: 400 });

  const thumb = `https://img.youtube.com/vi/${v}/hqdefault.jpg`;

  const html = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;overflow:hidden}
body,html{width:100%;height:100%;position:relative}
.bg{position:absolute;inset:0;background:url('${thumb}') center/cover no-repeat;filter:blur(25px) brightness(0.4);transform:scale(1.3)}
.yt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.yt iframe{width:100%;height:100%;border:none}
</style>
<script>
try {
  Object.defineProperty(window, 'top', { get: function() { return window; } });
  Object.defineProperty(window, 'parent', { get: function() { return window; } });
} catch(e) {}
</script>
</head><body>
<div class="bg"></div>
<div class="yt">
<iframe src="https://www.youtube-nocookie.com/embed/${v}?autoplay=1&mute=1&controls=0&loop=1&playlist=${v}&modestbranding=1&playsinline=1&enablejsapi=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&widget_referrer=${encodeURIComponent(req.nextUrl.origin)}"
  allow="autoplay"></iframe>
</div>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
