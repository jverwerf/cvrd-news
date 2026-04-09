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
