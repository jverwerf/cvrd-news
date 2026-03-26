import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('id') || '';
  const wantThumb = req.nextUrl.searchParams.get('thumb') === '1';
  if (!videoId) return new NextResponse('Missing video id', { status: 400 });

  // Only works with numeric TikTok IDs
  if (!/^\d+$/.test(videoId)) return new NextResponse('Invalid TikTok ID', { status: 400 });

  try {
    const tiktokUrl = `https://www.tiktok.com/@_/video/${videoId}`;

    // Thumbnail via oEmbed
    if (wantThumb) {
      try {
        const resp = await fetch(`https://www.tiktok.com/oembed?url=${tiktokUrl}`, { signal: AbortSignal.timeout(5000) });
        if (resp.ok) {
          const data = await resp.json();
          if (data.thumbnail_url) {
            const thumbResp = await fetch(data.thumbnail_url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)' },
            });
            if (thumbResp.ok) {
              return new NextResponse(thumbResp.body, {
                headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
              });
            }
          }
        }
      } catch {}
      return new NextResponse('No thumbnail', { status: 404 });
    }

    // Video via tikwm
    const tikwmResp = await fetch(`https://www.tikwm.com/api/?url=${tiktokUrl}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)' },
      signal: AbortSignal.timeout(10000),
    });

    if (tikwmResp.ok) {
      const data = await tikwmResp.json();
      const playUrl = data?.data?.hdplay || data?.data?.play;
      if (playUrl) {
        const videoResp = await fetch(playUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)' },
          signal: AbortSignal.timeout(15000),
        });
        if (videoResp.ok && videoResp.body) {
          const contentLength = videoResp.headers.get('content-length');
          const headers: Record<string, string> = {
            'Content-Type': 'video/mp4',
            'Cache-Control': 'public, max-age=3600',
            'Accept-Ranges': 'bytes',
          };
          if (contentLength) headers['Content-Length'] = contentLength;
          return new NextResponse(videoResp.body, { headers });
        }
      }
    }

    return new NextResponse('Could not fetch TikTok video', { status: 404 });
  } catch (e: any) {
    return new NextResponse('Error: ' + e.message, { status: 500 });
  }
}
