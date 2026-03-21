import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const dm = DM_Sans({ variable: "--font-dm", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "CVRD News — Unfiltered Daily News from Every Side",
    template: "%s | CVRD News",
  },
  description: "The news, unfiltered. Daily video briefings covering world news, politics, markets, crypto, tech, and culture from 36+ sources across the political spectrum. Every side. Every source. You decide.",
  keywords: ["news", "unfiltered news", "daily news", "breaking news", "world news", "politics", "media bias", "both sides", "video news", "news today", "covered news", "CVRD"],
  authors: [{ name: "CVRD News" }],
  creator: "CVRD News",
  publisher: "CVRD News",
  metadataBase: new URL("https://cvrdnews.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cvrdnews.com",
    siteName: "CVRD News",
    title: "CVRD News — Unfiltered Daily News from Every Side",
    description: "Daily video briefings covering world news, politics, markets, and tech from 36+ sources. No spin. No agenda. Every side of every story.",
    images: [{ url: "/logo_new.jpg", width: 1024, height: 559, alt: "CVRD News" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CVRD News — Unfiltered Daily News",
    description: "Daily video briefings from 36+ sources across the political spectrum. The news they won't cover.",
    images: ["/logo_new.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "G-594H3DW6ZD",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2572735826517528" crossOrigin="anonymous" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-594H3DW6ZD" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-594H3DW6ZD');`,
          }}
        />
      </head>
      <body className={`${dm.variable} font-sans antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: `
          // Block YouTube iframe redirects
          (function() {
            // Prevent any iframe from navigating the top window
            if (window === window.top) {
              var currentHost = window.location.hostname;
              window.addEventListener('beforeunload', function(e) {
                // If we're about to leave our own site, check if it's a YouTube redirect
                setTimeout(function() {
                  if (window.location.hostname !== currentHost &&
                      (window.location.hostname.includes('youtube') || window.location.hostname.includes('google'))) {
                    window.stop();
                    window.location.href = 'https://' + currentHost;
                  }
                }, 0);
              });
              // Override location setters
              var desc = Object.getOwnPropertyDescriptor(window.location.__proto__, 'href') || {};
              if (desc.set) {
                var origSet = desc.set;
                Object.defineProperty(window.location, 'href', {
                  set: function(url) {
                    if (typeof url === 'string' && (url.includes('youtube') || url.includes('googlevideo'))) return;
                    origSet.call(window.location, url);
                  },
                  get: function() { return desc.get.call(window.location); }
                });
              }
            }
          })();
        `}} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
