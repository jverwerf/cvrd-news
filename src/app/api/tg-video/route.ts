import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const post = req.nextUrl.searchParams.get('post') || '';
  const wantThumb = req.nextUrl.searchParams.get('thumb') === '1';
  if (!post) return new NextResponse('Missing post param', { status: 400 });

  // post format: "channel/postId" e.g. "disclosetv/20448"
  const channel = post.split('/')[0];

  try {
    // Fetch the /s/ page centered on this specific post — server-rendered, has <video> tags
    const resp = await fetch(`https://t.me/s/${post}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    });
    const html = await resp.text();

    // Find the block for this specific post
    const postBlock = html.split(`data-post="${post}"`)[1];
    if (!postBlock) {
      // Fallback: try og:image for thumbnail from direct URL
      if (wantThumb) {
        const directResp = await fetch(`https://t.me/${post}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const directHtml = await directResp.text();
        const ogMatch = directHtml.match(/og:image"[^>]*content="([^"]+)"/);
        if (ogMatch) {
          const thumbResp = await fetch(ogMatch[1], {
            headers: { 'Referer': 'https://t.me/', 'User-Agent': 'Mozilla/5.0' },
          });
          if (thumbResp.ok) {
            return new NextResponse(thumbResp.body, {
              headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
            });
          }
        }
      }
      return new NextResponse('Post not found', { status: 404 });
    }

    if (wantThumb) {
      // Try background-image from video thumbnail
      const thumbMatch = postBlock.match(/background-image:url\('?(https:\/\/cdn[^'")\s]+)/);
      if (thumbMatch) {
        const thumbResp = await fetch(thumbMatch[1], {
          headers: { 'Referer': 'https://t.me/', 'User-Agent': 'Mozilla/5.0' },
        });
        if (thumbResp.ok) {
          return new NextResponse(thumbResp.body, {
            headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
          });
        }
      }
      // Fallback: og:image from direct URL
      const directResp = await fetch(`https://t.me/${post}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const directHtml = await directResp.text();
      const ogMatch = directHtml.match(/og:image"[^>]*content="([^"]+)"/);
      if (ogMatch) {
        const thumbResp = await fetch(ogMatch[1], {
          headers: { 'Referer': 'https://t.me/', 'User-Agent': 'Mozilla/5.0' },
        });
        if (thumbResp.ok) {
          return new NextResponse(thumbResp.body, {
            headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
          });
        }
      }
      return new NextResponse('No thumbnail', { status: 404 });
    }

    // Find video URL
    const videoMatch = postBlock.match(/<video[^>]*\ssrc="([^"]+)"/);
    if (!videoMatch) return new NextResponse('No video found for this post', { status: 404 });

    const videoUrl = videoMatch[1];

    const videoResp = await fetch(videoUrl, {
      headers: {
        'Referer': 'https://t.me/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!videoResp.ok || !videoResp.body) {
      return new NextResponse('Failed to fetch video', { status: 502 });
    }

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
