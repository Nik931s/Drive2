import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { fmtDateTime, fmtMoney } from '@/lib/auction';
import AdminListingControls from '@/components/AdminListingControls';

export const dynamic = 'force-dynamic';

export default async function AdminListingPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin();
  await supabase.rpc('finalise_auctions');

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles!listings_seller_id_fkey(full_name)')
    .eq('id', params.id)
    .single();

  if (!listing) notFound();

  const { data: reserveRow } = await supabase
    .from('auction_reserves')
    .select('reserve_price')
    .eq('listing_id', params.id)
    .maybeSingle();

  const { data: bidRows } = await supabase
    .from('bids')
    .select('id, amount, created_at, bidder_id')
    .eq('listing_id', params.id)
    .order('amount', { ascending: false })
    .limit(200);

  const bids: any[] = bidRows || [];
  const bidderIds = Array.from(new Set(bids.map((b) => b.bidder_id as string)));
  const names = new Map<string, string>();
  if (bidderIds.length > 0) {
    const { data: people } = await supabase.from('profiles').select('id, full_name').in('id', bidderIds);
    (people || []).forEach((p: any) => names.set(p.id, p.full_name || 'Unnamed user'));
  }

  const title = `${listing.year} ${listing.make} ${listing.model}${listing.variant ? ' ' + listing.variant : ''}`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <Link href="/admin" className="text-xs underline text-inkSoft">← All listings</Link>
        <h1 className="font-display text-5xl mt-1">{title}</h1>
        <p className="text-sm text-inkSoft mt-1">
          Seller: {listing.profiles?.full_name || '—'} · Status: <b className="text-ink">{listing.status}</b> · Submitted{' '}
          {fmtDateTime(listing.created_at)}
        </p>
        <div className="flex gap-4 mt-3 text-sm">
          <Link href={`/listing/${listing.id}`} className="underline font-bold">View public page</Link>
          <Link href={`/listing/${listing.id}/edit`} className="underline font-bold">Edit car details &amp; photos</Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white border border-chrome p-3">
          <p className="font-mono text-[10px] uppercase text-inkSoft">{listing.bid_count > 0 ? 'Current bid' : 'Starting bid'}</p>
          <p className="font-display text-3xl">{fmtMoney(listing.price)}</p>
        </div>
        <div className="bg-white border border-chrome p-3">
          <p className="font-mono text-[10px] uppercase text-inkSoft">Bids</p>
          <p className="font-display text-3xl">{listing.bid_count}</p>
        </div>
        <div className="bg-white border border-chrome p-3">
          <p className="font-mono text-[10px] uppercase text-inkSoft">Reserve</p>
          <p className="font-display text-3xl">
            {reserveRow ? fmtMoney(reserveRow.reserve_price) : 'None'}
          </p>
          {reserveRow && (
            <p className="font-mono text-[10px] text-inkSoft">{listing.reserve_met ? 'met' : 'not met'}</p>
          )}
        </div>
      </div>

      <AdminListingControls
        listing={{
          id: listing.id,
          status: listing.status,
          price: Number(listing.price),
          starting_price: listing.starting_price != null ? Number(listing.starting_price) : null,
          bid_count: listing.bid_count,
          bid_increment: Number(listing.bid_increment),
          anti_snipe_minutes: listing.anti_snipe_minutes,
          auction_start: listing.auction_start,
          auction_end: listing.auction_end,
        }}
        reserve={reserveRow ? Number(reserveRow.reserve_price) : null}
      />

      <section>
        <h2 className="font-display text-2xl mb-2">Bids (real names — admins only)</h2>
        {bids.length === 0 ? (
          <p className="text-sm text-inkSoft">No bids yet.</p>
        ) : (
          <div className="bg-white border border-chrome overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-concrete text-left text-[11px] uppercase tracking-wide text-inkSoft">
                <tr>
                  <th className="px-3 py-2">Bidder</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chrome">
                {bids.map((b) => (
                  <tr key={b.id} className={b.bidder_id === listing.winning_bidder_id && b.amount === listing.price ? 'font-bold bg-concrete' : ''}>
                    <td className="px-3 py-2">{names.get(b.bidder_id) || b.bidder_id}</td>
                    <td className="px-3 py-2 font-mono">{fmtMoney(b.amount)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{fmtDateTime(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
