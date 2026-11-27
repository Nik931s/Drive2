'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';
import AuctionStatusBar from '@/components/AuctionStatusBar';
import { fmtMoney, getAuctionState, minNextBid } from '@/lib/auction';
import { useNow } from '@/lib/useAuctionClock';
import type { Listing } from '@/lib/types';

export type AuctionSnapshot = Pick<
  Listing,
  'status' | 'price' | 'bid_count' | 'bid_increment' | 'auction_start' | 'auction_end' | 'has_reserve' | 'reserve_met'
>;

type Bid = { amount: number; created_at: string; bidder_label: string; is_you: boolean };

const SNAPSHOT_COLUMNS =
  'status, price, bid_count, bid_increment, auction_start, auction_end, has_reserve, reserve_met';

function preventScrollChange(e: React.WheelEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).blur();
}

function toSnapshot(row: any): AuctionSnapshot {
  return {
    status: row.status,
    price: Number(row.price),
    bid_count: Number(row.bid_count),
    bid_increment: Number(row.bid_increment),
    auction_start: row.auction_start,
    auction_end: row.auction_end,
    has_reserve: !!row.has_reserve,
    reserve_met: !!row.reserve_met,
  };
}

export default function BidPanel({
  listingId,
  initial,
  isOwner,
  isLoggedIn,
}: {
  listingId: string;
  initial: AuctionSnapshot;
  isOwner: boolean;
  isLoggedIn: boolean;
}) {
  const supabase = createClient();
  const now = useNow();

  const [auction, setAuction] = useState<AuctionSnapshot>(initial);
  const [bids, setBids] = useState<Bid[]>([]);
  const [amount, setAmount] = useState(String(minNextBid(initial)));
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadBids = useCallback(async () => {
    const { data } = await supabase.rpc('get_bid_history', { p_listing_id: listingId });
    if (data) setBids(data as Bid[]);
  }, [supabase, listingId]);

  const refreshListing = useCallback(async () => {
    const { data } = await supabase.from('listings').select(SNAPSHOT_COLUMNS).eq('id', listingId).single();
    if (data) setAuction(toSnapshot(data));
  }, [supabase, listingId]);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  // Live updates: whenever this listing's row changes (new bid, extended end
  // time, auction closed) every viewer is told straight away.
  useEffect(() => {
    const channel = supabase
      .channel(`listing-${listingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings', filter: `id=eq.${listingId}` },
        (payload) => {
          setAuction((prev) => ({ ...prev, ...toSnapshot({ ...prev, ...payload.new }) }));
          loadBids();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, listingId, loadBids]);

  // Keep the suggested bid at or above the current minimum.
  const minBid = minNextBid(auction);
  useEffect(() => {
    setAmount((prev) => (Number(prev) < minBid ? String(minBid) : prev));
  }, [minBid]);

  const state = getAuctionState(auction, now);
  const isLive = state === 'live';
  const iAmHighest = bids.length > 0 && bids[0].is_you;
  const iHaveBid = bids.some((b) => b.is_you);

  async function placeBid() {
    setError(null);
    setNotice(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid bid amount.');
      setConfirming(false);
      return;
    }
    setSubmitting(true);
    const { error: rpcError } = await supabase.rpc('place_bid', { p_listing_id: listingId, p_amount: value });
    setSubmitting(false);
    setConfirming(false);
    if (rpcError) {
      setError(rpcError.message);
      await Promise.all([refreshListing(), loadBids()]);
      return;
    }
    setNotice('Bid placed. You are the highest bidder.');
    await Promise.all([refreshListing(), loadBids()]);
  }

  const reserveText = auction.has_reserve ? (auction.reserve_met ? 'Reserve met' : 'Reserve not met') : 'No reserve';

  return (
    <div className="border border-chrome bg-white">
      <AuctionStatusBar listing={auction} variant="full" />

      <div className="p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-inkSoft">
              {state === 'sold' ? 'Winning bid' : auction.bid_count > 0 ? 'Current bid' : 'Starting bid'}
            </p>
            <p className="font-display text-5xl leading-none">{fmtMoney(auction.price)}</p>
          </div>
          <div className="text-right font-mono text-xs text-inkSoft">
            <p>
              {auction.bid_count} bid{auction.bid_count === 1 ? '' : 's'}
            </p>
            <p>{reserveText}</p>
          </div>
        </div>

        {iAmHighest && isLive && (
          <p className="mt-3 text-sm font-bold text-green">You&apos;re the highest bidder.</p>
        )}
        {iHaveBid && !iAmHighest && isLive && (
          <p className="mt-3 text-sm font-bold text-red-700">You&apos;ve been outbid.</p>
        )}
        {iAmHighest && state === 'sold' && (
          <p className="mt-3 text-sm font-bold text-green">Congratulations — you won this auction.</p>
        )}

        {isLive && (
          <div className="mt-4">
            {!isLoggedIn ? (
              <p className="text-sm text-inkSoft">
                <Link href="/login" className="underline text-ink font-bold">Log in</Link> or{' '}
                <Link href="/signup" className="underline text-ink font-bold">sign up</Link> to place a bid.
              </p>
            ) : isOwner ? (
              <p className="text-sm text-inkSoft">You can&apos;t bid on your own listing.</p>
            ) : (
              <>
                <label className="block text-xs font-semibold uppercase text-inkSoft mb-1">
                  Your bid (minimum {fmtMoney(minBid)})
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center border border-chrome px-3">
                    <span className="text-inkSoft mr-1">£</span>
                    <input
                      type="number"
                      min={minBid}
                      step={1}
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setConfirming(false);
                      }}
                      onWheel={preventScrollChange}
                      className="w-full py-2 text-sm outline-none"
                    />
                  </div>
                  {!confirming ? (
                    <button
                      onClick={() => {
                        setError(null);
                        setNotice(null);
                        setConfirming(true);
                      }}
                      className="bg-amber text-ink font-bold px-5 py-2"
                    >
                      Place bid
                    </button>
                  ) : (
                    <button
                      onClick={placeBid}
                      disabled={submitting}
                      className="bg-ink text-concrete font-bold px-5 py-2 disabled:opacity-50"
                    >
                      {submitting ? 'Placing…' : `Confirm ${fmtMoney(Number(amount) || 0)}`}
                    </button>
                  )}
                </div>
                {confirming && (
                  <p className="text-xs text-inkSoft mt-2">
                    Bids are binding. Press confirm to place a bid of {fmtMoney(Number(amount) || 0)}, or change the
                    amount to cancel.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
        {notice && <p className="text-sm text-green mt-3">{notice}</p>}

        <div className="mt-5">
          <h4 className="font-display text-lg mb-2">Bid history</h4>
          {bids.length === 0 ? (
            <p className="text-xs text-inkSoft">No bids yet.</p>
          ) : (
            <ul className="divide-y divide-chrome border border-chrome max-h-64 overflow-y-auto">
              {bids.map((b, i) => (
                <li
                  key={`${b.created_at}-${b.amount}`}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-mono ${
                    i === 0 ? 'bg-concrete font-bold' : ''
                  }`}
                >
                  <span>
                    {b.bidder_label}
                    {b.is_you && <span className="ml-1 text-green">(you)</span>}
                  </span>
                  <span>{fmtMoney(b.amount)}</span>
                  <span className="text-inkSoft">
                    {new Date(b.created_at).toLocaleString('en-GB', {
                      timeZone: 'Europe/London',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
