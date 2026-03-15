import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type LiveItem = {
  type: string;
  label: string;
  value: string;
  change?: string;
  changeDirection?: string;
  url?: string;
};

export async function GET() {
  const items: LiveItem[] = [];

  // Markets
  const symbols = [
    { symbol: '^GSPC', label: 'S&P 500' },
    { symbol: '^IXIC', label: 'Nasdaq' },
    { symbol: 'CL=F', label: 'Oil' },
    { symbol: 'GC=F', label: 'Gold' },
  ];
  for (const s of symbols) {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s.symbol}?interval=1d&range=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000),
      });
      const d = await r.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose || meta.previousClose;
        const chg = prev ? ((price - prev) / prev * 100).toFixed(2) : null;
        items.push({
          type: ['CL=F', 'GC=F'].includes(s.symbol) ? 'commodity' : 'stock',
          label: s.label,
          value: `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: chg ? `${parseFloat(chg) >= 0 ? '+' : ''}${chg}%` : undefined,
          changeDirection: chg ? (parseFloat(chg) >= 0 ? 'up' : 'down') : 'neutral',
          url: `https://finance.yahoo.com/quote/${s.symbol}`,
        });
      }
    } catch {}
  }

  // Crypto
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true', {
      signal: AbortSignal.timeout(5000),
    });
    const d = await r.json();
    if (d.bitcoin) {
      const chg = d.bitcoin.usd_24h_change?.toFixed(2);
      items.push({ type: 'crypto', label: 'BTC', value: `$${d.bitcoin.usd.toLocaleString()}`, change: chg ? `${parseFloat(chg) >= 0 ? '+' : ''}${chg}%` : undefined, changeDirection: chg ? (parseFloat(chg) >= 0 ? 'up' : 'down') : 'neutral', url: 'https://finance.yahoo.com/quote/BTC-USD' });
    }
    if (d.ethereum) {
      const chg = d.ethereum.usd_24h_change?.toFixed(2);
      items.push({ type: 'crypto', label: 'ETH', value: `$${d.ethereum.usd.toLocaleString()}`, change: chg ? `${parseFloat(chg) >= 0 ? '+' : ''}${chg}%` : undefined, changeDirection: chg ? (parseFloat(chg) >= 0 ? 'up' : 'down') : 'neutral', url: 'https://finance.yahoo.com/quote/ETH-USD' });
    }
  } catch {}

  return NextResponse.json(items);
}
