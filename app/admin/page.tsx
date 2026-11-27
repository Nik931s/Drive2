import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { fmtDateTime, fmtMoney } from '@/lib/auction';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;
const TABS = [
  { key: 'pending', label: 'Awaiting approval' },
  { key: 'active', label: 'Scheduled & live' },
  { key: 'sold', label: 'Sold' },
  { key: 'unsold', label: 'Unsold' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { supabase } = await requireAdmin();

  // Close anything that has ended so it lands in the right tab.
  await supabase.rpc('finalise_auctions');

  const tab = TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab! : 'pending';
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const counts = await Promise.all(
    TABS.map(async (t) => {
      const { count } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', t.key);
      return count ?? 0;
    })
  );

  let query = supabase
    .from('listings')
    .select('id, year, make, model, variant, status, price, bid_count, auction_start, auction_end, created_at, profiles!listings_seller_id_fkey(full_name)', { count: 'exact' })
    .eq('status', tab);

  if (tab === 'active') query = query.order('auction_end', { ascending: true });
  else if (tab === 'sold' || tab === 'unsold') query = query.order('auction_end', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  const rows: any[] = data || [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="font-display text-5xl mb-5">Manage listings</h1>

      <div className="border-b border-chrome flex flex-wrap gap-1 mb-5">
        {TABS.map((t, i) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${
              tab === t.key ? 'border-amber text-ink' : 'border-transparent text-inkSoft hover:text-ink'
            }`}
          >
            {t.label} <span className="font-mono text-xs text-inkSoft">({counts[i]})</span>
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-inkSoft">Nothing here.</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-chrome">
          <table className="w-full text-sm">
            <thead className="bg-concrete text-left text-[11px] uppercase tracking-wide text-inkSoft">
              <tr>
                <th className="px-3 py-2">Car</th>
                <th className="px-3 py-2">Seller</th>
                <th className="px-3 py-2">Bid</th>
                <th className="px-3 py-2">Bids</th>
                <th className="px-3 py-2">Starts</th>
                <th className="px-3 py-2">Ends</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-chrome">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-bold">
                    {r.year} {r.make} {r.model}
                    {r.variant && <span className="font-normal text-inkSoft"> {r.variant}</span>}
                  </td>
                  <td className="px-3 py-2">{r.profiles?.full_name || '—'}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.price)}</td>
                  <td className="px-3 py-2 font-mono">{r.bid_count}</td>
                  <td className="px-3 py-2 font-mono text-xs">{fmtDateTime(r.auction_start)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{fmtDateTime(r.auction_end)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/listings/${r.id}`} className="underline font-bold">Manage</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Link
            href={`/admin?tab=${tab}&page=${Math.max(1, page - 1)}`}
            className={`text-xs font-bold px-3 py-2 border border-chrome ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-ink'}`}
          >
            ← Prev
          </Link>
          <span className="text-xs font-mono text-inkSoft px-2">Page {page} of {totalPages}</span>
          <Link
            href={`/admin?tab=${tab}&page=${Math.min(totalPages, page + 1)}`}
            className={`text-xs font-bold px-3 py-2 border border-chrome ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-ink'}`}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
