import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { promises as fs } from 'fs';
import path from 'path';

type ArticleSection = {
  id: string; heading: string; body: string;
  stat_callout?: { value: string; label: string; detail: string };
};

type Contract = {
  recipient: string; agency: string; department: string; amount: number;
  date: string; description: string; competed: boolean; offers: number;
  score: string; flags: string[];
};

type TimelineEvent = { year: string; label: string; highlight: boolean };
type KeyStat = { value: string; label: string; subtext: string };

type Episode = {
  slug: string; title: string; subtitle: string; date: string; hook: string; cold_open?: string;
  subject: string; secretary: string; department: string; image?: string;
  key_stats: KeyStat[];
  article_sections?: ArticleSection[];
  contracts?: Contract[];
  total_amount?: number;
  timeline?: TimelineEvent[];
  price_comparison?: { market_rate: number; abilityone_rate: number; note: string };
  accountability?: Record<string, unknown>;
  legal_basis?: { statute: string; far_code?: string; justification?: string; audit_type?: string; reform_path: string };
  gao_quote?: { source: string; text: string };
  worker_pay?: { min_disabled_worker_percent: number; note: string };
  sources?: string[];
};

async function getEpisode(slug: string): Promise<Episode | null> {
  try {
    const file = path.join(process.cwd(), `public/data/declassified/${slug}.json`);
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ep = await getEpisode(slug);
  if (!ep) return { title: 'Not Found' };
  return {
    title: `${ep.title} | Declassified`,
    description: ep.hook,
    openGraph: { title: ep.title, description: ep.hook, url: `https://cvrdnews.com/declassified/${slug}` },
  };
}

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const C = {
  bg: '#1e2a3a', panel: '#253545', border: '#2a3a4a',
  gold: '#daa520', goldFaint: 'rgba(218,165,32,0.15)',
  text: '#e2e8f0', dim: '#7a8fa6', dimFaint: 'rgba(122,143,166,0.4)',
  red: '#ef4444', green: '#22c55e',
};

const serif = "'Instrument Serif', Georgia, serif";
const mono = "'DM Mono', monospace";
const sans = "'DM Sans', system-ui, sans-serif";

export default async function DeclassifiedStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ep = await getEpisode(slug);
  if (!ep) notFound();

  const maxAmount = ep.contracts?.length ? Math.max(...ep.contracts.map(c => c.amount)) : 0;

  const { hasBreakingData } = await import('@/lib/breaking-store');
  const isBreaking = await hasBreakingData().catch(() => false);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      <SiteNav isBreaking={isBreaking} />

      {/* Article header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
        {ep.image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={ep.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #1e2a3a 55%, transparent 100%)' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 24px 44px', position: 'relative' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <a href="/declassified" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 4, color: C.gold, opacity: 0.65, textDecoration: 'none', textTransform: 'uppercase' as const }}>
              Declassified
            </a>
            <span style={{ color: C.gold, opacity: 0.3, fontSize: 13 }}>›</span>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: C.dim }}>
              {formatDate(ep.date).toUpperCase()}
            </span>
          </div>

          {/* Kicker */}
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: C.gold, opacity: 0.8, marginBottom: 18, textTransform: 'uppercase' as const }}>
            {ep.department}
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 'bold', color: C.text, lineHeight: 1.15, margin: '0 0 20px' }}>
            {ep.title}
          </h1>

          {/* Rule */}
          <div style={{ width: 40, height: 2, background: C.gold, marginBottom: 20, opacity: 0.7 }} />

          {/* Standfirst */}
          <p style={{ fontFamily: serif, fontSize: 18, fontStyle: 'italic', color: C.dim, lineHeight: 1.7, margin: '0 0 24px' }}>
            {ep.hook}
          </p>

          {/* Byline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: C.dim }}>
              BY AGENT ZERO
            </span>
            <span style={{ width: 1, height: 12, background: C.border }} />
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: C.dimFaint }}>
              CVRD NEWS
            </span>
          </div>
        </div>
      </div>

      {/* Key stats bar */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 0 }}>
          {ep.key_stats.map((stat, i) => (
            <div key={i} style={{
              padding: '28px 24px',
              borderRight: i < ep.key_stats.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ fontFamily: serif, fontSize: 40, fontWeight: 'bold', color: C.gold, lineHeight: 1, marginBottom: 6 }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: sans, fontSize: 12, color: C.text, marginBottom: 3, lineHeight: 1.3 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: mono, fontSize: 9, color: C.dim, letterSpacing: 1 }}>
                {stat.subtext}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Article body */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Article sections with prose */}
        {ep.article_sections && ep.article_sections.length > 0 ? (
          <>
            {ep.article_sections.map((section, i) => (
              <div key={section.id}>
                {/* Section heading */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, marginTop: i === 0 ? 0 : 40 }}>
                  <div style={{ width: 24, height: 1, background: C.gold, opacity: 0.5, flexShrink: 0 }} />
                  <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 5, color: C.gold, opacity: 0.7, textTransform: 'uppercase' as const }}>
                    {section.heading}
                  </span>
                </div>

                {/* Body text */}
                <p style={{ fontFamily: "'Georgia', serif", fontSize: 17, color: C.text, lineHeight: 1.8, margin: '0 0 20px', opacity: 0.9 }}>
                  {section.body}
                </p>

                {/* Inline stat callout */}
                {section.stat_callout && (
                  <div style={{
                    margin: '28px 0',
                    padding: '20px 24px',
                    borderLeft: `3px solid ${C.gold}`,
                    background: C.panel,
                    borderRadius: '0 3px 3px 0',
                  }}>
                    <div style={{ fontFamily: serif, fontSize: 36, fontWeight: 'bold', color: C.gold, lineHeight: 1, marginBottom: 6 }}>
                      {section.stat_callout.value}
                    </div>
                    <div style={{ fontFamily: sans, fontSize: 13, color: C.text, marginBottom: 4, lineHeight: 1.4 }}>
                      {section.stat_callout.label}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 9, color: C.dim, letterSpacing: 1 }}>
                      {section.stat_callout.detail}
                    </div>
                  </div>
                )}

                {/* Inject data after specific sections */}
                {section.id === 'the_deal' && ep.contracts?.length && (
                  <ContractsTable contracts={ep.contracts} maxAmount={maxAmount} total={ep.total_amount ?? 0} />
                )}

                {section.id === 'the_oversight_question' && ep.gao_quote && (
                  <GaoQuoteBlock source={ep.gao_quote.source} text={ep.gao_quote.text} />
                )}

                {section.id === 'the_accountability' && ep.timeline?.length && (
                  <TimelineBlock timeline={ep.timeline} />
                )}

                {section.id === 'the_record' && ep.gao_quote && (
                  <GaoQuoteBlock source={ep.gao_quote.source} text={ep.gao_quote.text} />
                )}

                {section.id === 'why_it_matters' && ep.timeline?.length && (
                  <TimelineBlock timeline={ep.timeline} />
                )}
              </div>
            ))}
          </>
        ) : (
          /* Fallback: cold open for episodes without article_sections */
          <blockquote style={{ margin: '0 0 40px', padding: '24px 28px', borderLeft: `3px solid ${C.gold}`, background: C.panel, borderRadius: '0 3px 3px 0' }}>
            <p style={{ fontFamily: serif, fontSize: 18, color: C.text, lineHeight: 1.75, margin: 0, fontStyle: 'italic' }}>
              {ep.cold_open}
            </p>
          </blockquote>
        )}

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 28, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 16 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 4, color: C.gold, opacity: 0.5, marginBottom: 4 }}>
              SOURCES
            </div>
            <div style={{ fontFamily: mono, fontSize: 9, color: C.dim, lineHeight: 1.6 }}>
              {ep.sources
                ? ep.sources.join(' \u00b7 ')
                : 'USASpending.gov award pages \u00b7 GAO-13-457 (May 2013) \u00b7 41 U.S.C. 8501\u20138506 \u00b7 AbilityOne FY 2024 Performance Report \u00b7 AbilityOne 2025 Report to the President'}
            </div>
          </div>
          <a href="/declassified" style={{ fontFamily: mono, fontSize: 10, letterSpacing: 4, color: C.gold, textDecoration: 'none', opacity: 0.6, borderBottom: `1px solid ${C.goldFaint}`, paddingBottom: 2 }}>
            ALL EPISODES
          </a>
        </div>
      </div>
    </div>
  );
}

function ContractsTable({ contracts, maxAmount, total }: { contracts: Contract[]; maxAmount: number; total: number }) {
  return (
    <div style={{ margin: '28px 0 32px' }}>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 5, color: C.gold, opacity: 0.65, marginBottom: 14, textTransform: 'uppercase' as const }}>
        The contracts
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {contracts.map((c, i) => {
          const pct = (c.amount / maxAmount) * 100;
          const isIllegal = c.flags.some(f => f.includes('ILLEGAL'));
          return (
            <div key={i} style={{
              background: C.panel, border: `1px solid ${isIllegal ? 'rgba(239,68,68,0.25)' : C.border}`,
              borderRadius: 3, padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10, flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: C.text, marginBottom: 2 }}>
                    {c.agency}
                    {isIllegal && (
                      <span style={{ marginLeft: 8, fontFamily: mono, fontSize: 8, letterSpacing: 2, color: C.red, background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: 2 }}>
                        ILLEGAL FLAG
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: C.dim, letterSpacing: 1 }}>{c.description.toUpperCase()}</div>
                </div>
                <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                  <div style={{ fontFamily: serif, fontSize: 22, color: isIllegal ? C.red : C.gold, fontWeight: 'bold' }}>{fmt(c.amount)}</div>
                  <div style={{ fontFamily: mono, fontSize: 8, color: C.dim, letterSpacing: 1 }}>{c.offers} offer received</div>
                </div>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: isIllegal ? C.red : C.gold, opacity: 0.6, borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 1, padding: '14px 20px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 3 }}>
        <div style={{ fontFamily: mono, fontSize: 9, color: C.dim, lineHeight: 1.7 }}>
          Figures from public federal contract databases. Exact amounts and offer counts require verification against the underlying USASpending.gov award pages before publication.
        </div>
      </div>
    </div>
  );
}

function GaoQuoteBlock({ source, text }: { source: string; text: string }) {
  return (
    <div style={{ margin: '28px 0 32px', padding: '28px 32px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 3 }}>
      <p style={{ fontFamily: serif, fontSize: 17, color: C.text, lineHeight: 1.75, margin: '0 0 16px', fontStyle: 'italic', opacity: 0.88 }}>
        &ldquo;{text}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 24, height: 1, background: C.gold, opacity: 0.4 }} />
        <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: C.gold, opacity: 0.6 }}>
          {source.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function TimelineBlock({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <div style={{ margin: '28px 0 32px', position: 'relative', paddingLeft: 20 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, background: `linear-gradient(to bottom, ${C.gold}50, transparent)` }} />
      {timeline.map((event, i) => (
        <div key={i} style={{ position: 'relative', paddingLeft: 22, paddingBottom: i < timeline.length - 1 ? 22 : 0 }}>
          <div style={{
            position: 'absolute', left: -4, top: 5, width: 8, height: 8,
            borderRadius: '50%', border: `2px solid ${event.highlight ? C.gold : C.border}`,
            background: event.highlight ? C.gold : C.bg,
          }} />
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: mono, fontSize: 10, color: event.highlight ? C.gold : C.dim, letterSpacing: 1, flexShrink: 0, minWidth: 72 }}>
              {event.year}
            </span>
            <span style={{ fontFamily: sans, fontSize: 13, color: event.highlight ? C.text : C.dim, lineHeight: 1.5 }}>
              {event.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
