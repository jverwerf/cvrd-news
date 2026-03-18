import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const dm = DM_Sans({ variable: "--font-dm", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "CVRD",
  description: "The unfiltered daily brief.",
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
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-594H3DW6ZD" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-594H3DW6ZD');`,
          }}
        />
      </head>
      <body className={`${dm.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
