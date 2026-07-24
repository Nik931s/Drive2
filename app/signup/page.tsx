'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';

export default function SignupPage() {
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      // Create the matching profile row.
      await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName });
    }
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-6 py-16 text-center">
        <h1 className="font-display text-4xl mb-3">Check your email</h1>
        <p className="text-inkSoft text-sm">
          We sent a confirmation link to <b>{email}</b>. Click it, then come back and log in.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display text-4xl mb-6">Create your account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-inkSoft mb-1">Full name</label>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-chrome px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-inkSoft mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-chrome px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-inkSoft mb-1">Password</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-chrome px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full bg-amber text-ink font-bold py-2.5 disabled:opacity-50">
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm text-inkSoft mt-4">
        Already have an account? <Link href="/login" className="underline text-ink">Log in</Link>
      </p>
    </div>
  );
}
