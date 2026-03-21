import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const v = req.nextUrl.searchParams.get('v') || '';
  if (!v) return new NextResponse('Missing video ID', { status: 400 });

  const html = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;overflow:hidden}body,html{width:100%;height:100%;background:#000}</style>
</head><body>
<iframe src="https://www.youtube-nocookie.com/embed/${v}?autoplay=1&mute=1&controls=0&loop=1&playlist=${v}&modestbranding=1&playsinline=1&enablejsapi=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&widget_referrer=${encodeURIComponent(req.nextUrl.origin)}"
  style="width:100%;height:100%;border:none" allow="autoplay" allowfullscreen></iframe>
</body></html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600' },
  });
}
