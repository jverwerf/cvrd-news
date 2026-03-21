import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const v = req.nextUrl.searchParams.get('v') || '';
  if (!v) return new NextResponse('Missing video ID', { status: 400 });

  const thumb = `https://img.youtube.com/vi/${v}/hqdefault.jpg`;

  const html = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0}
body,html{width:100%;height:100%;overflow:hidden}
iframe{position:absolute;top:-30%;left:-30%;width:160%;height:160%;border:none}
</style>
<script>
try {
  Object.defineProperty(window, 'top', { get: function() { return window; } });
  Object.defineProperty(window, 'parent', { get: function() { return window; } });
} catch(e) {}
</script>
</head><body>
<iframe src="https://www.youtube-nocookie.com/embed/${v}?autoplay=1&mute=1&controls=0&loop=1&playlist=${v}&modestbranding=1&playsinline=1&enablejsapi=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&widget_referrer=${encodeURIComponent(req.nextUrl.origin)}"
  allow="autoplay"></iframe>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store',
    },
  });
}
