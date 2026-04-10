'use client';
import Script from 'next/script';

export default function KofiWidget() {
  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      strategy="afterInteractive"
      onLoad={() => {
        (window as any).kofiWidgetOverlay.draw('cvrdnews', {
          'type': 'floating-chat',
          'floating-chat.donateButton.text': 'Support CVRD',
          'floating-chat.donateButton.background-color': '#1e2a3a',
          'floating-chat.donateButton.text-color': '#fff',
        });
      }}
    />
  );
}
