export default function TilePage() {
  return (
    <div style={{ background: '#1e2a3a', minHeight: '100vh', padding: 40 }}>
      <h1 style={{ color: 'white', marginBottom: 30 }}>Video Proxy Tests</h1>

      {/* Telegram video via proxy */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: '#0088cc', marginBottom: 10, fontSize: 14 }}>Telegram Video (via /api/tg-video)</h2>
        <video
          src="/api/tg-video?post=cbsnews/1507"
          controls autoPlay muted playsInline
          style={{ width: 600, borderRadius: 8 }}
        />
      </div>

      {/* X video via proxy - Iran strikes */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: '#1d9bf0', marginBottom: 10, fontSize: 14 }}>X Video — Iran strikes Dimona</h2>
        <video
          src="/api/x-video?id=2035718138252107994"
          controls autoPlay muted playsInline
          style={{ width: 600, borderRadius: 8 }}
        />
      </div>

      {/* X video - Cuba blackout */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: '#1d9bf0', marginBottom: 10, fontSize: 14 }}>X Video — Cuba grid collapse</h2>
        <video
          src="/api/x-video?id=2033653303394127991"
          controls autoPlay muted playsInline
          style={{ width: 600, borderRadius: 8 }}
        />
      </div>

      {/* X video - Trump ultimatum */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: '#1d9bf0', marginBottom: 10, fontSize: 14 }}>X Video — Trump 48hr ultimatum to Iran</h2>
        <video
          src="/api/x-video?id=2035609005897429019"
          controls autoPlay muted playsInline
          style={{ width: 600, borderRadius: 8 }}
        />
      </div>
    </div>
  );
}
