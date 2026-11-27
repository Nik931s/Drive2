'use client';

import { useNow } from '@/lib/useAuctionClock';
import { fmtDateTime, fmtMoney, formatRemaining, getAuctionState, type AuctionFields } from '@/lib/auction';

export default function AuctionStatusBar({
  listing,
  variant = 'compact',
}: {
  listing: AuctionFields;
  variant?: 'compact' | 'full';
}) {
  const now = useNow();
  const full = variant === 'full';
  const pad = full ? 'px-4 py-3' : 'px-3 py-1.5';

  // Until the page has mounted we don't know the time yet, so show a neutral bar.
  if (now === null && listing.status === 'active') {
    return (
      <div className={`${pad} bg-concreteDark text-inkSoft font-mono text-[10px] uppercase tracking-widest`}>
        Auction
      </div>
    );
  }

  const state = getAuctionState(listing, now);
  const endMs = listing.auction_end ? new Date(listing.auction_end).getTime() : null;
  const startMs = listing.auction_start ? new Date(listing.auction_start).getTime() : null;
  const remaining = endMs !== null && now !== null ? endMs - now : null;
  const untilStart = startMs !== null && now !== null ? startMs - now : null;
  const endingSoon = state === 'live' && remaining !== null && remaining < 3_600_000;
  const bids = `${listing.bid_count} bid${listing.bid_count === 1 ? '' : 's'}`;

  let label = '';
  let detail = '';
  let tone = '';
  let sub = '';

  switch (state) {
    case 'live':
      label = '● LIVE';
      detail = `Ends in ${formatRemaining(remaining, full)}`;
      if (!full) detail += ` · ${bids}`;
      tone = endingSoon ? 'bg-red-700 text-white' : 'bg-green text-concrete';
      sub = `Ends ${fmtDateTime(listing.auction_end)}`;
      break;
    case 'scheduled':
      label = 'UPCOMING';
      detail = `Starts in ${formatRemaining(untilStart, full)}`;
      tone = 'bg-amber text-ink';
      sub = `Starts ${fmtDateTime(listing.auction_start)}`;
      break;
    case 'sold':
      label = 'SOLD';
      detail = full ? `Sold for ${fmtMoney(listing.price)}` : fmtMoney(listing.price);
      tone = 'bg-ink text-concrete';
      break;
    case 'unsold':
      label = 'ENDED';
      detail = listing.bid_count > 0 ? 'Reserve not met' : 'No bids';
      tone = 'bg-chrome text-ink';
      break;
    case 'pending':
      label = 'PENDING';
      detail = 'Awaiting approval';
      tone = 'bg-concreteDark text-ink';
      break;
    case 'cancelled':
      label = 'CANCELLED';
      detail = 'Auction withdrawn';
      tone = 'bg-chrome text-ink';
      break;
  }

  if (!full) {
    return (
      <div className={`${pad} ${tone} flex items-center justify-between gap-2 font-mono text-[11px] font-bold`}>
        <span>{label}</span>
        <span className="font-semibold">{detail}</span>
      </div>
    );
  }

  return (
    <div className={`${pad} ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs font-bold tracking-widest">{label}</span>
        <span className="font-mono text-lg font-bold">{detail}</span>
      </div>
      {sub && state !== 'sold' && <p className="font-mono text-[11px] opacity-80 mt-1">{sub}</p>}
    </div>
  );
}
