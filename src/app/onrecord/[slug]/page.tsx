import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OnRecordDetail } from './OnRecordDetail';

// Map slug (donald-trump) → handle (realDonaldTrump)
function findBySlug(slug: string): { score: any; verified: any } | null {
  const dir = path.resolve(process.cwd(), 'public/data/politicians');
  if (!fs.existsSync(dir)) return null;

  const scoreFiles = fs.readdirSync(dir).filter(f => f.startsWith('score_') && f.endsWith('.json'));
  for (const f of scoreFiles) {
    const score = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const nameSlug = (score.name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (nameSlug === slug || score.handle === slug) {
      const verifiedPath = path.join(dir, `verified_${score.handle}.json`);
      const verified = fs.existsSync(verifiedPath) ? JSON.parse(fs.readFileSync(verifiedPath, 'utf8')) : null;
      return { score, verified };
    }
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = findBySlug(slug);
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
      images: [`/data/politicians/photo_${score.handle}.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${score.name} — ${score.overall_score}% Truthful`,
      description,
      images: [`/data/politicians/photo_${score.handle}.png`],
    },
    alternates: { canonical: `/onrecord/${slug}` },
  };
}

export default async function OnRecordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = findBySlug(slug);
  if (!data) notFound();

  const { score, verified } = data;

  // Load all scores for navigation
  const dir = path.resolve(process.cwd(), 'public/data/politicians');
  const allScores = fs.readdirSync(dir)
    .filter(f => f.startsWith('score_') && f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .sort((a: any, b: any) => (b.prominence || 0) - (a.prominence || 0));

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
        allPoliticians={allScores}
        slug={slug}
      />
    </>
  );
}
