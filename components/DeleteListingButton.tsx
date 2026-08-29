'use client';
 
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
 
export default function DeleteListingButton({ listingId }: { listingId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  async function handleDelete() {
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);
    setLoading(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.refresh();
  }
 
  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-inkSoft">Delete this listing?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-red-700 font-bold underline disabled:opacity-50"
        >
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-inkSoft underline">
          Cancel
        </button>
        {error && <span className="text-red-700">{error}</span>}
      </div>
    );
  }
 
  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-bold px-3 py-2 border border-red-700 text-red-700 hover:bg-red-50"
    >
      Delete
    </button>
  );
}
