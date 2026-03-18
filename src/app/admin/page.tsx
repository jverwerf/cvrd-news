"use client";

import { useEffect, useState } from "react";

type VideoStat = {
  platform: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  date: string;
  url?: string;
};

type DashboardData = {
  youtube: { videos: VideoStat[]; totalViews: number; subscribers: number };
  instagram: { reels: VideoStat[]; totalViews: number; followers: number };
  website: { pageViews: number; visitors: number; daily: { date: string; views: number; devices: number }[] };
  revenue: { youtube: number; instagram: number; website: number; app: number };
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888', fontSize: 18 }}>Loading analytics...</p>
    </div>
  );

  if (!data) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#f44', fontSize: 18 }}>Failed to load analytics</p>
    </div>
  );

  const totalVideoViews = data.youtube.totalViews + data.instagram.totalViews;
  const totalRevenue = data.revenue.youtube + data.revenue.instagram + data.revenue.website + data.revenue.app;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: '-apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>CVRD Analytics</h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 14 }}>Internal dashboard</p>
        </div>
        <a href="/" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>Back to site</a>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Revenue Overview */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Revenue</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <RevenueCard label="YouTube" value={data.revenue.youtube} sublabel="Ad revenue (Partner Program)" color="#f00" />
            <RevenueCard label="Instagram Reels" value={data.revenue.instagram} sublabel="Reels bonus program" color="#c026d3" />
            <RevenueCard label="Website (Ads)" value={data.revenue.website} sublabel="Google AdSense" color="#4ade80" />
            <RevenueCard label="App (Ads)" value={data.revenue.app} sublabel="AdMob (iOS/Android)" color="#1d9bf0" />
          </div>
          <div style={{ marginTop: 12, padding: '16px 20px', background: '#111', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Total Revenue</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#4ade80' }}>${totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* Platform Overview */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Platform Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatCard label="Total Video Views" value={totalVideoViews.toLocaleString()} color="#fff" />
            <StatCard label="YouTube Subscribers" value={data.youtube.subscribers.toLocaleString()} color="#f00" />
            <StatCard label="Instagram Followers" value={data.instagram.followers.toLocaleString()} color="#c026d3" />
            <StatCard label="Website Visitors" value={data.website.visitors.toLocaleString()} sublabel={`${data.website.pageViews.toLocaleString()} page views`} color="#4ade80" />
          </div>
        </div>

        {/* Website Traffic Chart */}
        {data.website.daily.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Website Traffic (7 days)</h2>
            <div style={{ background: '#111', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                {data.website.daily.map((d, i) => {
                  const max = Math.max(...data.website.daily.map(x => x.views), 1);
                  const h = Math.max((d.views / max) * 100, 2);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#888' }}>{d.views}</span>
                      <div style={{ width: '100%', height: h, background: '#4ade80', borderRadius: 4, minHeight: 2 }} />
                      <span style={{ fontSize: 10, color: '#555' }}>{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Video Performance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* YouTube */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              YouTube ({data.youtube.videos.length} videos)
            </h2>
            <div style={{ background: '#111', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #222' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 500 }}>Title</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: '#888', fontWeight: 500 }}>Views</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: '#888', fontWeight: 500 }}>Likes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.youtube.videos.map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.url ? <a href={v.url} target="_blank" style={{ color: '#fff', textDecoration: 'none' }}>{v.title}</a> : v.title}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{v.views.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, color: '#888' }}>{v.likes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instagram */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              Instagram Reels ({data.instagram.reels.length} reels)
            </h2>
            <div style={{ background: '#111', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #222' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 500 }}>Caption</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: '#888', fontWeight: 500 }}>Views</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: '#888', fontWeight: 500 }}>Likes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.instagram.reels.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '20px 16px', textAlign: 'center', color: '#555', fontSize: 13 }}>No reels data yet</td></tr>
                  ) : data.instagram.reels.map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{v.views.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, color: '#888' }}>{v.likes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sublabel, color }: { label: string; value: string; sublabel?: string; color: string }) {
  return (
    <div style={{ background: '#111', borderRadius: 12, padding: '20px', borderLeft: `3px solid ${color}` }}>
      <p style={{ fontSize: 12, color: '#888', margin: 0, marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{value}</p>
      {sublabel && <p style={{ fontSize: 12, color: '#555', margin: '4px 0 0' }}>{sublabel}</p>}
    </div>
  );
}

function RevenueCard({ label, value, sublabel, color }: { label: string; value: number; sublabel: string; color: string }) {
  const isActive = value > 0;
  return (
    <div style={{ background: '#111', borderRadius: 12, padding: '20px', borderLeft: `3px solid ${color}`, opacity: isActive ? 1 : 0.5 }}>
      <p style={{ fontSize: 12, color: '#888', margin: 0, marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
        {isActive ? `$${value.toFixed(2)}` : '$0.00'}
      </p>
      <p style={{ fontSize: 11, color: '#555', margin: '4px 0 0' }}>{isActive ? sublabel : 'Not active yet'}</p>
    </div>
  );
}
