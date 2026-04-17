import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
import { PastIssues } from './EpisodeList';

export const metadata: Metadata = {
  title: 'Declassified — Saturday Investigation | CVRD',
  description: 'Every Saturday, CVRD investigates one story the government would rather you not read. Data-driven. Source-backed. No spin.',
  openGraph: {
    title: 'Declassified — Saturday Investigation | CVRD',
    description: 'Every Saturday, CVRD investigates one story the government would rather you not read.',
    url: 'https://cvrdnews.com/declassified',
  },
};

type Episode = {
  slug: string; title: string; subtitle: string; date: string;
  subject: string; secretary: string; department: string;
  hook: string; image?: string; status: string;
};

async function getManifest(): Promise<Episode[]> {
  try {
    const { promises: fs } = await import('fs');
    const path = await import('path');
    const file = path.join(process.cwd(), 'public/data/declassified/manifest.json');
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch { return []; }
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default async function DeclassifiedPage() {
  const episodes = await getManifest();
  if (!episodes.length) return null;

  const latest = episodes[0];
  const past = episodes.slice(1);
  const issueNo = String(episodes.length).padStart(2, '0');

  return (
    <div style={{ background: '#1e2a3a', minHeight: '100vh', color: '#e2e8f0' }}>
      <SiteNav isBreaking={true} />

      {/* ── MAGAZINE COVER HERO ── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background image */}
        {latest.image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={latest.image}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }}
          />
        )}

        {/* Light gradient — just enough to keep text legible */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(18,28,42,0.55) 0%, rgba(18,28,42,0.3) 40%, rgba(18,28,42,0.72) 100%)',
        }} />

        {/* Issue badge — top right */}
        <div style={{ position: 'absolute', top: 20, right: 28, zIndex: 2 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: 'rgba(218,165,32,0.65)' }}>
            ISSUE NO. {issueNo}
          </span>
        </div>

        {/* Cover story content */}
        <div style={{
          position: 'relative',
          padding: '72px 40px 60px',
          maxWidth: 860,
        }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 7, color: '#daa520', opacity: 0.85, marginBottom: 20 }}>
            {latest.department.toUpperCase()}
          </div>

          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(28px, 4.5vw, 68px)',
            fontWeight: 'bold',
            color: '#e2e8f0',
            lineHeight: 1.08,
            margin: '0 0 24px',
          }}>
            {latest.title}
          </h1>

          <div style={{ width: 52, height: 2, background: '#daa520', marginBottom: 20, opacity: 0.85 }} />

          <p style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(16px, 1.6vw, 20px)',
            fontStyle: 'italic',
            color: 'rgba(226,232,240,0.75)',
            maxWidth: 560,
            lineHeight: 1.6,
            margin: '0 0 32px',
          }}>
            {latest.hook}
          </p>

          <a href={`/declassified/${latest.slug}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 5,
            color: '#121c2a',
            background: '#daa520',
            padding: '13px 28px',
            borderRadius: 2,
            textDecoration: 'none',
            width: 'fit-content',
            fontWeight: 600,
          }}>
            READ THIS INVESTIGATION
            <span style={{ fontSize: 16, lineHeight: 1 }}>›</span>
          </a>
        </div>
      </div>

      {/* ── PAST ISSUES ── */}
      {past.length > 0 && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 32 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 6, color: '#7a8fa6', whiteSpace: 'nowrap' as const }}>
              PREVIOUS INVESTIGATIONS
            </span>
            <div style={{ flex: 1, height: 1, background: '#2a3a4a' }} />
          </div>
          <PastIssues episodes={past} totalCount={episodes.length} />
        </div>
      )}
    </div>
  );
}
