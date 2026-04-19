export const revalidate = 600;

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { dateFromSlug } from '@/lib/onrecord-slug';

const BLOB_BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL || '';
const serif = { fontFamily: "'Instrument Serif', Georgia, serif" };

function nameToSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function getEditorialByDate(date: string): Promise<any | null> {
  try {
    const resp = await fetch(`${BLOB_BASE}/politicians/onrecord_today_${date}.json`, { next: { revalidate: 600 } });
    if (!resp.ok) return null;
    return resp.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const date = dateFromSlug(slug);
  if (!date) return { title: 'On Record Today | CVRD' };
  const data = await getEditorialByDate(date);
  if (!data) return { title: 'On Record Today | CVRD' };
  const title = data.search_keyword
    ? `${data.person.name} on ${data.search_keyword}: ${data.topic_score ?? data.overall_score}% Truthful`
    : data.headline;
  const description = (data.editorial || '').split('\n\n')[0]?.slice(0, 180) || '';
  return {
    title: `${title} | On Record`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://cvrdnews.com/onrecord/today/${slug}`,
      images: data.person?.photo ? [data.person.photo] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: data.person?.photo ? [data.person.photo] : [],
    },
    alternates: { canonical: `/onrecord/today/${slug}` },
  };
}

export default async function OnRecordTodayBySlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const date = dateFromSlug(slug);
  if (!date) notFound();

  const editorial = await getEditorialByDate(date);
  if (!editorial) notFound();

  let isBreaking = false;
  try {
    const { hasBreakingData } = await import('@/lib/breaking-store');
    isBreaking = await hasBreakingData();
  } catch {}

  const shareHeadline = editorial.headline;
  const shareUrl = `https://cvrdnews.com/onrecord/today/${slug}`;
  const shareFirstPara = (editorial.editorial || '').split('\n\n')[0] || '';

  // deterministic heights for SSR/hydration match
  const meterLines = 40;
  const meterHeights = Array.from({ length: meterLines }, (_, i) => 30 + ((i * 2654435761) % 50));

  return (
    <div className="min-h-screen" style={{ background: '#1e2a3a' }}>
      <SiteNav isBreaking={isBreaking} />

      <div className="px-6 md:px-12 py-8" style={{ background: '#1e2a3a' }}>
        <div className="rounded-lg overflow-hidden" style={{ background: '#253545', border: '1px solid #2a3a4a' }}>

          {/* Card header */}
          <div className="px-5 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: '1px solid #2a3a4a' }}>
            <span className="text-[9px] font-bold text-[#daa520] uppercase tracking-[0.12em] shrink-0">On Record Today</span>
            <span className="text-[#2a3a4a]">·</span>
            <span className="text-[16px] text-white leading-none" style={serif}>{editorial.person.name}</span>
            <span className="text-[#2a3a4a] ml-auto">·</span>
            <span className="text-[10px] text-white/30 shrink-0">{date}</span>
          </div>

          {/* Photo + headline + meter */}
          <div className="flex flex-col md:flex-row">
            <img src={editorial.person.photo} alt={editorial.person.name}
              className="w-full md:w-48 h-48 md:h-auto object-cover object-top" />
            <div className="flex-1 p-5" style={{ borderLeft: '1px solid #2a3a4a' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded"
                  style={{ color: '#daa520', background: 'rgba(184,134,11,0.1)' }}>
                  {editorial.story_topic}
                </span>
              </div>
              <h1 className="text-[22px] md:text-[26px] text-white leading-tight tracking-[-0.02em] mb-1" style={serif}>
                {editorial.search_keyword ? `On ${editorial.search_keyword.charAt(0).toUpperCase() + editorial.search_keyword.slice(1)}: ${editorial.topic_score ?? editorial.overall_score}% Truthful` : editorial.headline}
              </h1>
              <p className="text-[11px] text-white/30 mb-3">
                {editorial.person.role}
                {editorial.search_keyword && <> · {editorial.matching_claims} claims on &ldquo;{editorial.search_keyword}&rdquo;</>}
                {editorial.overall_score != null && <> · {editorial.overall_score}% overall</>}
              </p>
              {editorial.topic_score != null && (
                <div className="max-w-[200px]">
                  <div className="flex justify-between mb-0.5 text-[7px] uppercase tracking-[0.15em]">
                    <span style={{ color: '#f87171' }}>Less truthful</span>
                    <span style={{ color: '#60a5fa' }}>More truthful</span>
                  </div>
                  <div className="flex items-end gap-[1px] h-5">
                    {Array.from({ length: meterLines }).map((_, i) => {
                      const pct = (i / meterLines) * 100;
                      const color = pct < 35 ? '#f87171' : pct < 55 ? '#daa520' : '#60a5fa';
                      return (
                        <div key={i} className="flex-1 rounded-sm" style={{
                          height: `${meterHeights[i]}%`,
                          background: pct <= (editorial.topic_score || 0) ? color : '#1e2a3a',
                          opacity: pct <= (editorial.topic_score || 0) ? 0.7 : 0.2,
                        }} />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editorial text */}
          <div className="px-5 py-5" style={{ borderTop: '1px solid #2a3a4a' }}>
            {(editorial.editorial || '').split('\n\n').filter((p: string) => p.trim()).map((para: string, i: number) => (
              <p key={i} className="text-[13px] text-[#bbb] leading-[1.75] mb-3 last:mb-0">{para}</p>
            ))}
          </div>

          {/* Matched tweets */}
          {editorial.matched_tweets?.length > 0 && (
            <div className="px-5 py-4" style={{ borderTop: '1px solid #2a3a4a' }}>
              <span className="text-[9px] font-bold text-[#daa520] uppercase tracking-[0.12em] block mb-3">Claims We Checked</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {editorial.matched_tweets.slice(0, 6).map((t: any, i: number) => {
                  const verdictColor = t.verdict === 'TRUE' ? '#34d399' : t.verdict === 'FALSE' ? '#f87171' : '#f59e0b';
                  return (
                    <div key={i} className="rounded-lg p-3" style={{ background: '#1e2a3a', border: '1px solid #2a3a4a' }}>
                      <p className="text-[11px] text-[#bbb] leading-[1.6] line-clamp-2 mb-2">{t.claim}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                          style={{ color: verdictColor, border: `1px solid ${verdictColor}40` }}>
                          {t.verdict}
                        </span>
                        {t.domain && <span className="text-[8px] text-[#555] uppercase tracking-[0.08em]">{t.domain.replace(/_/g, ' ')}</span>}
                      </div>
                      {t.reasoning && <p className="text-[10px] text-[#888] leading-[1.5]">{t.reasoning}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA + Share */}
          <div className="px-5 pb-5 flex flex-wrap items-center gap-3">
            <Link href={`/onrecord/${nameToSlug(editorial.person.name)}${editorial.search_keyword ? '?q=' + editorial.search_keyword : ''}`}
              className="inline-block px-4 py-1.5 rounded-full text-[10px] font-semibold text-white transition-colors hover:opacity-90"
              style={{ background: '#b8860b' }}>
              View full record →
            </Link>
            <Link href="/onrecord" className="text-[11px] text-white/50 hover:text-white transition-colors">
              ← All leaders
            </Link>
            <span className="text-[8px] uppercase tracking-[0.12em] text-[#555] ml-auto">Share</span>
            {[
              { svg: <span className="text-[11px] font-bold text-white/50">𝕏</span>, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareHeadline}\n\n${shareFirstPara.substring(0, 100)}...`)}&url=${encodeURIComponent(shareUrl)}` },
              { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4500" opacity={0.5}><circle cx="12" cy="12" r="12"/></svg>, href: `https://www.reddit.com/submit?title=${encodeURIComponent(shareHeadline)}&url=${encodeURIComponent(shareUrl)}` },
              { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.13 1.6 5.93L0 24l6.26-1.64A11.93 11.93 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>, href: `https://wa.me/?text=${encodeURIComponent(`${shareHeadline}\n\n${shareUrl}`)}` },
              { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0088cc" opacity={0.5}><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 5.2l-2.84 13.4c-.2.95-.77 1.18-1.56.73l-4.3-3.17-2.08 2c-.23.23-.42.42-.87.42l.31-4.39 7.98-7.21c.35-.31-.07-.48-.54-.19L7.76 13.2l-4.24-1.33c-.92-.29-.94-.92.19-1.37l16.58-6.39c.77-.28 1.44.19 1.19 1.37z"/></svg>, href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareHeadline)}` },
              { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#1877F2" opacity={0.5}><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"/></svg>, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
              { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2" opacity={0.5}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
              { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" opacity={0.3}><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.083.717 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.281 1.332-3.08.857-.74 2.063-1.182 3.39-1.246.927-.044 1.813.06 2.647.306l.053-.265c.231-1.148.084-2.078-.437-2.762-.544-.715-1.465-1.1-2.593-1.084-1.593.023-2.727.637-3.467 1.033l-.096.053-.924-1.685.122-.067c.928-.51 2.395-1.265 4.39-1.293h.044c1.616-.02 2.95.525 3.855 1.576.753.876 1.133 2.059.96 3.437.792.326 1.476.784 2.036 1.37 1.033 1.08 1.532 2.555 1.443 4.265-.105 2.028-1.066 3.793-2.862 5.254C17.677 23.276 15.252 23.977 12.186 24z"/></svg>, href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareHeadline}\n\n${shareUrl}`)}` },
              { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="#0085ff" opacity={0.5}><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>, href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareHeadline}\n\n${shareUrl}`)}` },
            ].map((s, j) => (
              <a key={j} href={s.href} target="_blank" rel="noreferrer" className="p-1.5 rounded transition-opacity hover:opacity-100 opacity-70">{s.svg}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
