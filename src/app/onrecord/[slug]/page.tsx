import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OnRecordDetail } from './OnRecordDetail';

const BLOB_BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';

async function fetchJson(url: string): Promise<any | null> {
  try {
    const resp = await fetch(url, { next: { revalidate: 3600 } });
    if (!resp.ok) return null;
    return resp.json();
  } catch { return null; }
}

async function getAllScores(): Promise<any[]> {
  const manifest = await fetchJson(`${BLOB_BASE}/politicians/manifest.json`);
  if (!manifest?.handles) return [];
  const results = await Promise.all(
    manifest.handles.map((h: string) => fetchJson(`${BLOB_BASE}/politicians/score_${h}.json`))
  );
  return results.filter(Boolean);
}

function findBySlugInScores(scores: any[], slug: string): { score: any } | null {
  for (const score of scores) {
    const nameSlug = (score.name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (nameSlug === slug || score.handle === slug) return { score };
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const scores = await getAllScores();
  const data = findBySlugInScores(scores, slug);
  if (!data) return { title: 'Not Found' };

  const { score } = data;
  const title = `${score.name} — ${score.overall_score}% Truthful | On Record by CVRD`;
  const description = `${score.name} scores ${score.overall_score}% on verified claims. ${score.true_count} true, ${score.somewhat_misleading_count || 0} somewhat misleading, ${score.misleading_count} misleading, ${score.false_count} false. Every verdict backed by evidence.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://cvrdnews.com/onrecord/${slug}`,
      images: [`${BLOB_BASE}/politicians/photo_${score.handle}.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${score.name} — ${score.overall_score}% Truthful`,
      description,
      images: [`${BLOB_BASE}/politicians/photo_${score.handle}.png`],
    },
    alternates: { canonical: `/onrecord/${slug}` },
  };
}

export default async function OnRecordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const allScores = await getAllScores();
  const data = findBySlugInScores(allScores, slug);
  if (!data) notFound();

  const { score } = data;

  // Load verified claims
  const verified = await fetchJson(`${BLOB_BASE}/politicians/verified_${score.handle}.json`);

  // Sort for navigation
  const sortedScores = [...allScores].sort((a: any, b: any) => (b.prominence || 0) - (a.prominence || 0));

  // JSON-LD ClaimReview structured data
  const claimReviews = (verified?.scored_claims || []).slice(0, 10).map((c: any) => ({
    '@type': 'ClaimReview',
    url: `https://cvrdnews.com/onrecord/${slug}`,
    claimReviewed: c.claim,
    author: { '@type': 'Organization', name: 'CVRD News', url: 'https://cvrdnews.com' },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: c.score,
      bestRating: 1,
      worstRating: 0,
      alternateName: c.verdict === 'TRUE' ? 'True' : c.verdict === 'MISLEADING' ? 'Mostly True' : 'False',
    },
    itemReviewed: {
      '@type': 'CreativeWork',
      author: { '@type': 'Person', name: score.name },
      datePublished: c.tweet_date,
    },
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': claimReviews,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <OnRecordDetail
        score={score}
        verified={verified}
        allPoliticians={sortedScores}
        slug={slug}
      />
    </>
  );
}
