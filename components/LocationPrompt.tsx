'use client';

import { useState } from 'react';
import { useLocation } from '@/components/LocationProvider';

export default function LocationPrompt() {
  const { postcode, coords, loading, error, setPostcode, clearPostcode } = useLocation();
  const [input, setInput] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    await setPostcode(input.trim());
    setInput('');
  }

  if (coords) {
    return (
      <div className="flex items-center gap-2 text-xs text-concrete">
        <span className="font-mono">📍 {postcode}</span>
        <button onClick={clearPostcode} className="underline text-chrome hover:text-amber">
          Change
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Your postcode"
        className="text-xs px-2 py-1 w-28 text-ink"
      />
      <button
        disabled={loading}
        className="text-xs font-bold px-2 py-1 bg-amber text-ink disabled:opacity-50"
      >
        {loading ? '…' : 'Set'}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </form>
  );
}
