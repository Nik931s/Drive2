import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CarCard from '@/components/CarCard';
import ProfileEditForm from '@/components/ProfileEditForm';
import type { Listing } from '@/lib/types';
 
export const dynamic = 'force-dynamic';
 
export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
 
  if (!user) {
    redirect('/login');
  }
 
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
 
  const { data: myListings } = await supabase
    .from('listings')
    .select('*, listing_photos(storage_path, sort_order)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });
 
  const { data: savedRows } = await supabase
    .from('saved_listings')
    .select('listings(*, listing_photos(storage_path, sort_order))')
    .eq('user_id', user.id);
 
  const savedListings = (savedRows || [])
    .map((row: any) => row.listings)
    .filter(Boolean);
 
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, listing_id, buyer_id, seller_id, created_at, listings(make, model, year), messages(body, created_at, sender_id)')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });
 
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
      <div>
        <h1 className="font-display text-5xl mb-1">Dashboard</h1>
        <p className="text-inkSoft text-sm">{user.email}</p>
      </div>
 
      <section>
        <h2 className="font-display text-2xl mb-3">Your details</h2>
        <ProfileEditForm userId={user.id} initialName={profile?.full_name || ''} />
      </section>
 
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-display text-2xl">Your listings</h2>
          <Link href="/sell" className="text-sm underline text-ink">+ List a car</Link>
        </div>
        {myListings && myListings.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {(myListings as Listing[]).map((l) => <CarCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <p className="text-inkSoft text-sm">You haven&apos;t listed any cars yet.</p>
        )}
      </section>
 
      <section>
        <h2 className="font-display text-2xl mb-3">Saved listings</h2>
        {savedListings.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {(savedListings as Listing[]).map((l) => <CarCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <p className="text-inkSoft text-sm">Nothing saved yet. Browse listings and tap Save to bookmark a car.</p>
        )}
      </section>
 
      <section>
        <h2 className="font-display text-2xl mb-3">Messages</h2>
        {conversations && conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((c: any) => {
              const lastMessage = c.messages?.[c.messages.length - 1];
              return (
                <Link
                  key={c.id}
                  href={`/listing/${c.listing_id}`}
                  className="block bg-white border border-chrome p-4 hover:border-amber transition"
                >
                  <p className="font-bold text-sm">
                    {c.listings?.year} {c.listings?.make} {c.listings?.model}
                  </p>
                  {lastMessage && (
                    <p className="text-xs text-inkSoft mt-1 truncate">{lastMessage.body}</p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-inkSoft text-sm">No messages yet.</p>
        )}
      </section>
    </div>
  );
}
 
