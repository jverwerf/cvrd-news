import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

async function fetchTgThumbnail(post: string): Promise<ArrayBuffer | null> {
  // Try the /s/ page first — has background-image in CSS
  try {
    const resp = await fetch(`https://t.me/s/${post}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    });
    const html = await resp.text();
    const postBlock = html.split(`data-post="${post}"`)[1];
    if (postBlock) {
      const thumbMatch = postBlock.match(/background-image:url\('?(https:\/\/cdn[^'")\s]+)/);
      if (thumbMatch) {
        const thumbResp = await fetch(thumbMatch[1], {
          headers: { 'Referer': 'https://t.me/', 'User-Agent': 'Mozilla/5.0' },
        });
        if (thumbResp.ok) return thumbResp.arrayBuffer();
      }
    }
  } catch {}

  // Fallback: og:image from direct post URL
  try {
    const directResp = await fetch(`https://t.me/${post}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const directHtml = await directResp.text();
    const ogMatch = directHtml.match(/og:image"[^>]*content="([^"]+)"/);
    if (ogMatch) {
      const thumbResp = await fetch(ogMatch[1], {
        headers: { 'Referer': 'https://t.me/', 'User-Agent': 'Mozilla/5.0' },
      });
      if (thumbResp.ok) return thumbResp.arrayBuffer();
    }
  } catch {}

  return null;
}

export async function GET(req: NextRequest) {
  const post = req.nextUrl.searchParams.get('post') || '';
  const wantThumb = req.nextUrl.searchParams.get('thumb') === '1';
  if (!post) return new NextResponse('Missing post param', { status: 400 });

  // Thumbnail — cached in Vercel Blob by date
  if (wantThumb) {
    const dateStr = new Date().toISOString().split('T')[0];
    const safePost = post.replace(/\//g, '-');
    const blobPath = `thumbnails/tg-${safePost}-${dateStr}.jpg`;
    try {
      const { blobs } = await list({ prefix: `thumbnails/tg-${safePost}-${dateStr}`, limit: 1 });
      if (blobs.length > 0) return NextResponse.redirect(blobs[0].url, { status: 302 });
    } catch {}
    const buffer = await fetchTgThumbnail(post);
    if (!buffer) return new NextResponse('No thumbnail', { status: 404 });
    try {
      const blob = await put(blobPath, buffer, { access: 'public', addRandomSuffix: false, contentType: 'image/jpeg' });
      return NextResponse.redirect(blob.url, { status: 302 });
    } catch {
      // Blob unavailable — return directly
      return new NextResponse(buffer, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, s-maxage=86400' } });
    }
  }

  // Video proxy (Telegram requires Referer header — can't redirect browser directly)
  try {
    const resp = await fetch(`https://t.me/s/${post}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    });
    const html = await resp.text();
    const postBlock = html.split(`data-post="${post}"`)[1];
    if (!postBlock) return new NextResponse('Post not found', { status: 404 });

    const videoMatch = postBlock.match(/<video[^>]*\ssrc="([^"]+)"/);
    if (!videoMatch) return new NextResponse('No video found for this post', { status: 404 });

    const videoResp = await fetch(videoMatch[1], {
      headers: {
        'Referer': 'https://t.me/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!videoResp.ok || !videoResp.body) return new NextResponse('Failed to fetch video', { status: 502 });

    const contentLength = videoResp.headers.get('content-length');
    const headers: Record<string, string> = {
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      'Accept-Ranges': 'bytes',
    };
    if (contentLength) headers['Content-Length'] = contentLength;

    return new NextResponse(videoResp.body, { headers });
  } catch (e: any) {
    return new NextResponse('Error: ' + e.message, { status: 500 });
  }
}
