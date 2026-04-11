import type { NextConfig } from "next";

const BLOB_BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL || 'https://r6pqmlpcblwm51w8.public.blob.vercel-storage.com';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  async headers() {
    const CDN_CACHE = 'public, s-maxage=86400, stale-while-revalidate=3600';
    return [
      { source: '/api/yt-tile', headers: [{ key: 'Cache-Control', value: CDN_CACHE }] },
      { source: '/api/tg-video', headers: [{ key: 'Cache-Control', value: CDN_CACHE }] },
      { source: '/api/x-video', headers: [{ key: 'Cache-Control', value: CDN_CACHE }] },
      { source: '/api/tt-video', headers: [{ key: 'Cache-Control', value: CDN_CACHE }] },
    ];
  },
  async rewrites() {
    return [
      // Serve old /images/* paths from Blob (backwards compat with existing JSON data)
      {
        source: '/images/:path*',
        destination: `${BLOB_BASE}/images/:path*`,
      },
    ];
  },
};

export default nextConfig;
