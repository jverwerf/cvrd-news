import { NextRequest, NextResponse } from 'next/server';

// Known aggressive scrapers / AI crawlers that ignore robots.txt and generate cost
const BLOCKED_UA_PATTERNS = [
  'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'BLEXBot', 'PetalBot',
  'serpstatbot', 'SEOkicks', 'Bytespider', 'GPTBot', 'ChatGPT-User',
  'ClaudeBot', 'anthropic-ai', 'cohere-ai', 'PerplexityBot',
  'DataForSeoBot', 'SiteAuditBot', 'linkdexbot', 'MegaIndex',
  'ZoominfoBot', 'Screaming Frog', 'YandexBot', 'Baiduspider',
];

export function proxy(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';

  // Block known cost-generating bots
  if (BLOCKED_UA_PATTERNS.some(p => ua.includes(p))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Block empty user agents hitting API routes (likely scrapers)
  if (!ua && req.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to all routes except static files and _next internals
    '/((?!_next/static|_next/image|favicon.ico|logo|images|icons).*)',
  ],
};
