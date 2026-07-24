'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function ContactSellerForm({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Please log in first.'); setLoading(false); return; }
    // Find or create the conversation for this buyer + listing.
    let { data: convo } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .maybeSingle();
    if (!convo) {
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
        .select()
        .single();
      if (convoError) { setError(convoError.message); setLoading(false); return; }
      convo = newConvo;
    }
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: convo!.id,
      sender_id: user.id,
      body: message,
    });
    setLoading(false);
    if (msgError) { setError(msgError.message); return; }
    setSent(true);
    setMessage('');
    router.refresh();
  }

  if (sent) {
    return <p className="text-sm text-green mt-4 font-semibold">Message sent — check your dashboard for replies.</p>;
  }

  return (
    <div className="mt-4">
      <h4 className="font-display text-lg mb-2">Contact seller</h4>
      <textarea
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Hi, is this still available?"
        className="w-full border border-chrome px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-700 mt-1">{error}</p>}
      <button
        onClick={send}
        disabled={loading || !message.trim()}
        className="mt-2 w-full bg-amber text-ink font-bold py-2.5 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send message'}
      </button>
    </div>
  );
}
