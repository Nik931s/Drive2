'use client';
 
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
 
export default function ProfileEditForm({ userId, initialName }: { userId: string; initialName: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', userId);
    setSaving(false);
    if (updateError) { setError(updateError.message); return; }
    setSaved(true);
    router.refresh();
  }
 
  return (
    <form onSubmit={handleSubmit} className="bg-white border border-chrome p-4 max-w-sm space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase text-inkSoft mb-1">Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border border-chrome px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {saved && <p className="text-sm text-green">Saved.</p>}
      <button disabled={saving} className="bg-amber text-ink font-bold text-sm px-4 py-2 disabled:opacity-50">
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
 
