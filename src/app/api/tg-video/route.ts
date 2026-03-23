import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const post = req.nextUrl.searchParams.get('post') || '';
  const wantThumb = req.nextUrl.searchParams.get('thumb') === '1';
  if (!post) return new NextResponse('Missing post param', { status: 400 });

  try {
    // Fetch the t.me/s/ page for the channel
    const channel = post.split('/')[0];
    const resp = await fetch(`https://t.me/s/${channel}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)' },
    });
    const html = await resp.text();

    // Find the video URL or thumbnail for this specific post
    const postBlock = html.split(`data-post="${post}"`)[1];
    if (!postBlock) return new NextResponse('Post not found', { status: 404 });

    if (wantThumb) {
      // Return thumbnail image
      const thumbMatch = postBlock.match(/background-image:url\(.(https:\/\/cdn[^)"]+)/);
      if (!thumbMatch) return new NextResponse('No thumbnail', { status: 404 });
      const thumbResp = await fetch(thumbMatch[1], {
        headers: { 'Referer': 'https://t.me/', 'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)' },
      });
      if (!thumbResp.ok) return new NextResponse('Thumb fetch failed', { status: 502 });
      return new NextResponse(thumbResp.body, {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    const videoMatch = postBlock.match(/<video[^>]*src="([^"]+)"/);
    if (!videoMatch) return new NextResponse('No video found for this post', { status: 404 });

    const videoUrl = videoMatch[1];

    // Fetch video with proper headers
    const videoResp = await fetch(videoUrl, {
      headers: {
        'Referer': 'https://t.me/',
        'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)',
      },
    });

    if (!videoResp.ok || !videoResp.body) {
      return new NextResponse('Failed to fetch video', { status: 502 });
    }

    // Stream the response with proper headers for video playback
    const contentLength = videoResp.headers.get('content-length');
    const headers: Record<string, string> = {
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': 'bytes',
    };
    if (contentLength) headers['Content-Length'] = contentLength;

    return new NextResponse(videoResp.body, { headers });
  } catch (e: any) {
    return new NextResponse('Error: ' + e.message, { status: 500 });
  }
}
