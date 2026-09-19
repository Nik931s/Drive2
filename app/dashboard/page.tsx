import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import CarCard from '@/components/CarCard';
import ProfileEditForm from '@/components/ProfileEditForm';
import type { Listing } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;
const TABS = [
  { key: 'listings', label: 'Your listings' },
  { key: 'saved', label: 'Saved listings' },
  { key: 'messages', label: 'Messages' },
];

function buildTabHref(tab: string) {
  return `/dashboard?tab=${tab}`;
}

function buildPageHref(tab: string, page: number) {
  return `/dashboard?tab=${tab}&page=${page}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const activeTab = TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab! : 'listings';
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  let myListings: Listing[] = [];
  let listingsCount = 0;
  let savedListings: Listing[] = [];
  let savedCount = 0;
  let conversations: any[] = [];
  let conversationsCount = 0;

  if (activeTab === 'listings') {
    const { data, count } = await supabase
      .from('listings')
      .select('*, listing_photos(storage_path, sort_order)', { count: 'exact' })
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    myListings = (data || []) as Listing[];
    listingsCount = count ?? 0;
  }

  if (activeTab === 'saved') {
    const { data, count } = await supabase
      .from('saved_listings')
      .select('listings(*, listing_photos(storage_path, sort_order))', { count: 'exact' })
      .eq('user_id', user.id)
      .range(from, to);
    savedListings = (data || []).map((row: any) => row.listings).filter(Boolean) as Listing[];
    savedCount = count ?? 0;
  }

  if (activeTab === 'messages') {
    const { data, count } = await supabase
      .from('conversations')
      .select('id, listing_id, buyer_id, seller_id, created_at, listings(make, model, year), messages(body, created_at, sender_id)', { count: 'exact' })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .range(from, to);
    conversations = data || [];
    conversationsCount = count ?? 0;
  }

  const activeCount =
    activeTab === 'listings' ? listingsCount :
    activeTab === 'saved' ? savedCount :
    conversationsCount;
  const totalPages = Math.max(1, Math.ceil(activeCount / PAGE_SIZE));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-5xl mb-1">Dashboard</h1>
        <p className="text-inkSoft text-sm">{user.email}</p>
      </div>

      <section>
        <h2 className="font-display text-2xl mb-3">Your details</h2>
        <ProfileEditForm userId={user.id} initialName={profile?.full_name || ''} />
      </section>

      <div className="border-b border-chrome flex gap-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={buildTabHref(t.key)}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${
              activeTab === t.key ? 'border-amber text-ink' : 'border-transparent text-inkSoft hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === 'listings' && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-inkSoft"><b className="text-ink">{listingsCount}</b> listing(s)</p>
            <Link href="/sell" className="text-sm underline text-ink">+ List a car</Link>
          </div>
          {myListings.length > 0 ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {myListings.map((l) => <CarCard key={l.id} listing={l} ownerActions />)}
            </div>
          ) : (
            <p className="text-inkSoft text-sm">You haven&apos;t listed any cars yet.</p>
          )}
        </section>
      )}

      {activeTab === 'saved' && (
        <section>
          <p className="text-sm text-inkSoft mb-3"><b className="text-ink">{savedCount}</b> saved listing(s)</p>
          {savedListings.length > 0 ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {savedListings.map((l) => <CarCard key={l.id} listing={l} showSaveButton saved />)}
            </div>
          ) : (
            <p className="text-inkSoft text-sm">Nothing saved yet. Browse listings and tap Save to bookmark a car.</p>
          )}
        </section>
      )}

      {activeTab === 'messages' && (
        <section>
          <p className="text-sm text-inkSoft mb-3"><b className="text-ink">{conversationsCount}</b> conversation(s)</p>
          {conversations.length > 0 ? (
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
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            href={buildPageHref(activeTab, Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`text-xs font-bold px-3 py-2 border border-chrome ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-ink'}`}
          >
            ← Prev
          </Link>
          <span className="text-xs font-mono text-inkSoft px-2">Page {page} of {totalPages}</span>
          <Link
            href={buildPageHref(activeTab, Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`text-xs font-bold px-3 py-2 border border-chrome ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-ink'}`}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
