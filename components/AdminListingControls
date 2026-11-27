'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

type Props = {
  listing: {
    id: string;
    status: string;
    price: number;
    starting_price: number | null;
    bid_count: number;
    bid_increment: number;
    anti_snipe_minutes: number;
    auction_start: string | null;
    auction_end: string | null;
  };
  reserve: number | null;
};

function preventScrollChange(e: React.WheelEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).blur();
}

// <input type="datetime-local"> works in the browser's local time.
function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminListingControls({ listing, reserve }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [form, setForm] = useState({
    start: toLocalInput(listing.auction_start),
    end: toLocalInput(listing.auction_end),
    startingBid: String(listing.starting_price ?? listing.price),
    increment: String(listing.bid_increment),
    antiSnipe: String(listing.anti_snipe_minutes),
    reserve: reserve != null ? String(reserve) : '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const status = listing.status;
  const noBids = listing.bid_count === 0;
  const canActivate = status === 'pending' || status === 'cancelled' || (status === 'unsold' && noBids);
  const canEditSchedule = status !== 'sold';

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save(activate: boolean) {
    setError(null);
    setNotice(null);

    if (!form.start || !form.end) {
      setError('Set both a start time and an end time.');
      return;
    }
    const start = new Date(form.start);
    const end = new Date(form.end);
    if (end <= start) {
      setError('The end time must be after the start time.');
      return;
    }
    if (!(Number(form.increment) > 0)) {
      setError('The bid increment must be more than zero.');
      return;
    }
    if (noBids && !(Number(form.startingBid) >= 0)) {
      setError('Enter a valid starting bid.');
      return;
    }

    setBusy(true);
    const update: Record<string, unknown> = {
      auction_start: start.toISOString(),
      auction_end: end.toISOString(),
      bid_increment: Number(form.increment),
      anti_snipe_minutes: Math.max(0, Math.floor(Number(form.antiSnipe) || 0)),
    };
    if (noBids) {
      update.price = Number(form.startingBid);
      update.starting_price = Number(form.startingBid);
    }
    if (activate) update.status = 'active';

    const { error: updateError } = await supabase.from('listings').update(update).eq('id', listing.id);
    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    const { error: reserveError } = await supabase.rpc('admin_set_reserve', {
      p_listing_id: listing.id,
      p_reserve: form.reserve.trim() ? Number(form.reserve) : null,
    });
    setBusy(false);
    if (reserveError) {
      setError(reserveError.message);
      return;
    }

    setNotice(activate ? 'Auction approved and scheduled.' : 'Changes saved.');
    router.refresh();
  }

  async function endNow() {
    if (!window.confirm('End this auction right now? It will close immediately.')) return;
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase
      .from('listings')
      .update({ auction_end: new Date().toISOString() })
      .eq('id', listing.id);
    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }
    await supabase.rpc('finalise_auctions');
    setBusy(false);
    setNotice('Auction ended.');
    router.refresh();
  }

  async function cancelAuction() {
    if (!window.confirm('Cancel this auction? It will be withdrawn from the site (bids are kept on record).')) return;
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.from('listings').update({ status: 'cancelled' }).eq('id', listing.id);
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setNotice('Auction cancelled.');
    router.refresh();
  }

  async function deleteListing() {
    if (!window.confirm('Permanently delete this listing and all its bids? This cannot be undone.')) return;
    setBusy(true);
    setError(null);
    const { error: deleteError } = await supabase.from('listings').delete().eq('id', listing.id);
    if (deleteError) {
      setError(deleteError.message);
      setBusy(false);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  const input = 'w-full border border-chrome px-3 py-2 text-sm';
  const label = 'block text-xs font-semibold uppercase text-inkSoft mb-1';

  return (
    <div className="bg-white border border-chrome p-5 space-y-4">
      <h2 className="font-display text-2xl">Auction schedule</h2>

      {!canEditSchedule ? (
        <p className="text-sm text-inkSoft">This auction has finished and can no longer be rescheduled.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Starts</label>
              <input type="datetime-local" value={form.start} onChange={(e) => set('start', e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Ends</label>
              <input type="datetime-local" value={form.end} onChange={(e) => set('end', e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Starting bid (£){!noBids && ' — locked'}</label>
              <input
                type="number"
                min={0}
                disabled={!noBids}
                value={form.startingBid}
                onChange={(e) => set('startingBid', e.target.value)}
                onWheel={preventScrollChange}
                className={`${input} disabled:bg-concrete`}
              />
            </div>
            <div>
              <label className={label}>Bid increment (£)</label>
              <input
                type="number"
                min={1}
                value={form.increment}
                onChange={(e) => set('increment', e.target.value)}
                onWheel={preventScrollChange}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Reserve price (£, secret)</label>
              <input
                type="number"
                min={0}
                placeholder="No reserve"
                value={form.reserve}
                onChange={(e) => set('reserve', e.target.value)}
                onWheel={preventScrollChange}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Anti-sniping (minutes)</label>
              <input
                type="number"
                min={0}
                value={form.antiSnipe}
                onChange={(e) => set('antiSnipe', e.target.value)}
                onWheel={preventScrollChange}
                className={input}
              />
            </div>
          </div>
          <p className="text-xs text-inkSoft">
            Times are in your browser&apos;s local time. Anti-sniping: a bid placed in the last N minutes pushes the end
            time back to N minutes from that bid (0 turns it off). Bidders never see the reserve — only whether it has
            been met.
          </p>

          <div className="flex flex-wrap gap-2">
            {canActivate && (
              <button
                onClick={() => save(true)}
                disabled={busy}
                className="bg-amber text-ink font-bold text-sm px-4 py-2 disabled:opacity-50"
              >
                {status === 'pending' ? 'Approve & schedule' : 'Reactivate with this schedule'}
              </button>
            )}
            {status === 'active' && (
              <button
                onClick={() => save(false)}
                disabled={busy}
                className="bg-amber text-ink font-bold text-sm px-4 py-2 disabled:opacity-50"
              >
                Save changes
              </button>
            )}
            {status === 'pending' && (
              <button
                onClick={() => save(false)}
                disabled={busy}
                className="border border-chrome text-sm font-bold px-4 py-2 disabled:opacity-50"
              >
                Save without approving
              </button>
            )}
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
      {notice && <p className="text-sm text-green">{notice}</p>}

      <div className="border-t border-chrome pt-4 flex flex-wrap gap-2">
        {status === 'active' && (
          <button onClick={endNow} disabled={busy} className="border border-chrome text-sm font-bold px-4 py-2 disabled:opacity-50">
            End auction now
          </button>
        )}
        {status !== 'cancelled' && status !== 'sold' && (
          <button onClick={cancelAuction} disabled={busy} className="border border-chrome text-sm font-bold px-4 py-2 disabled:opacity-50">
            Cancel auction
          </button>
        )}
        <button
          onClick={deleteListing}
          disabled={busy}
          className="border border-red-700 text-red-700 text-sm font-bold px-4 py-2 hover:bg-red-50 disabled:opacity-50"
        >
          Delete listing
        </button>
      </div>
    </div>
  );
}
