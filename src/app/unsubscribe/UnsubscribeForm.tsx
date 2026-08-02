"use client";

import { useState } from "react";

export function UnsubscribeForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleUnsubscribe() {
    if (!email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="text-center">
        <p className="font-semibold mb-2">You&apos;re unsubscribed.</p>
        <p className="text-[#666]">{email} will no longer receive the Daily Pick. Changed your mind? You can re-subscribe any time on the <a href="/newsletter" className="text-blue-600 underline">newsletter page</a>.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4">Stop receiving the CVRD Daily Pick at this address:</p>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="w-full border border-[#ccc] rounded px-3 py-2 mb-4 text-[15px] outline-none focus:border-[#1e2a3a]"
      />
      <button
        onClick={handleUnsubscribe}
        disabled={status === 'loading' || !email.includes('@')}
        className="w-full py-2.5 rounded font-semibold text-white disabled:opacity-50"
        style={{ background: '#1e2a3a', cursor: 'pointer' }}
      >
        {status === 'loading' ? 'Unsubscribing…' : 'Unsubscribe'}
      </button>
      {status === 'error' && (
        <p className="mt-3 text-red-600 text-[13px]">Something went wrong. Try again, or email info@cvrdnews.com and we&apos;ll remove you manually.</p>
      )}
    </div>
  );
}
