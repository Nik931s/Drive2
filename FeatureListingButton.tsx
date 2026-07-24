'use client';

import { useState } from 'react';

export default function FeatureListingButton({ listingId, isFeatured }: { listingId: string; isFeatured: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, purpose: 'featured_listing' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not start checkout.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (isFeatured) {
    return <p className="text-xs font-mono text-green font-semibold">This listing is currently featured.</p>;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-amber text-ink font-bold text-xs px-4 py-2 disabled:opacity-50"
      >
        {loading ? 'Starting checkout…' : 'Feature this listing — $15'}
      </button>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
