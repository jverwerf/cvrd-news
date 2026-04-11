import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const tweetId = req.nextUrl.searchParams.get('id') || '';
  if (!tweetId) return new NextResponse('Missing tweet id', { status: 400 });

  try {
    const resp = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVRD/1.0)' },
    });

    if (!resp.ok) return new NextResponse('Tweet not found', { status: 404 });

    const data = await resp.json();
    const media = data?.mediaDetails || [];
    const video = media.find((m: any) => m.type === 'video');

    if (!video?.video_info?.variants) return new NextResponse('No video', { status: 404 });

    const mp4s = video.video_info.variants
      .filter((v: any) => v.content_type === 'video/mp4')
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    if (!mp4s.length) return new NextResponse('No MP4', { status: 404 });

    // 307 redirect — browser fetches directly from Twitter CDN
    return NextResponse.redirect(mp4s[0].url, 307);
  } catch (e: any) {
    return new NextResponse('Error: ' + e.message, { status: 500 });
  }
}
