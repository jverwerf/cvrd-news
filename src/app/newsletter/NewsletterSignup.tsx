"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubscribe() {
    if (!email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
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
      <div className="text-center py-4 rounded-lg" style={{ background: 'rgba(218,165,32,0.12)' }}>
        <p className="font-semibold text-[#1e2a3a]">You&apos;re in ✓</p>
        <p className="text-[#555] text-[14px] mt-1">Check your inbox for a welcome email. Your first Daily Pick arrives tomorrow morning.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
          placeholder="you@email.com"
          className="flex-1 border border-[#ccc] rounded px-3 py-2.5 text-[15px] outline-none focus:border-[#1e2a3a]"
        />
        <button
          onClick={handleSubscribe}
          disabled={status === 'loading' || !email.includes('@')}
          className="px-6 py-2.5 rounded font-semibold text-white disabled:opacity-50"
          style={{ background: '#1e2a3a', cursor: 'pointer' }}
        >
          {status === 'loading' ? 'Joining…' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-2 text-red-600 text-[13px]">Something went wrong — try again in a moment.</p>
      )}
    </div>
  );
}
