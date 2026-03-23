import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const tweetId = req.nextUrl.searchParams.get('id') || '';
  const wantThumb = req.nextUrl.searchParams.get('thumb') === '1';
  if (!tweetId) return new NextResponse('Missing tweet id', { status: 400 });

  try {
    // Use Twitter's syndication API to get tweet data with video URL
    const resp = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)' },
    });

    if (!resp.ok) return new NextResponse('Tweet not found', { status: 404 });

    const data = await resp.json();

    // Find video in mediaDetails
    const media = data?.mediaDetails || [];
    const video = media.find((m: any) => m.type === 'video');

    if (!video?.video_info?.variants) {
      return new NextResponse('No video in this tweet', { status: 404 });
    }

    // Return thumbnail if requested
    if (wantThumb) {
      const thumbUrl = video.media_url_https || media.find((m: any) => m.media_url_https)?.media_url_https;
      if (thumbUrl) {
        const thumbResp = await fetch(thumbUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)' },
        });
        if (thumbResp.ok) {
          return new NextResponse(thumbResp.body, {
            headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
          });
        }
      }
      return new NextResponse('No thumbnail', { status: 404 });
    }

    // Get highest quality MP4
    const mp4s = video.video_info.variants
      .filter((v: any) => v.content_type === 'video/mp4')
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    if (mp4s.length === 0) return new NextResponse('No MP4 found', { status: 404 });

    const videoUrl = mp4s[0].url;

    // Proxy the video
    const videoResp = await fetch(videoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)' },
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
