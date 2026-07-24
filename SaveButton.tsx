'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';

export default function SaveButton({ listingId, initialSaved }: { listingId: string; initialSaved: boolean }) {
  const supabase = createClient();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    if (saved) {
      await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', listingId);
    } else {
      await supabase.from('saved_listings').insert({ user_id: user.id, listing_id: listingId });
    }
    setSaved(!saved);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-bold px-3 py-2 border ${saved ? 'bg-amber text-ink border-amber' : 'border-white/30 text-concrete'}`}
    >
      {saved ? '★ Saved' : '♥ Save'}
    </button>
  );
}
