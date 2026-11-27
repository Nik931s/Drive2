import type { Listing } from '@/lib/types';

export type AuctionFields = Pick<
  Listing,
  'status' | 'auction_start' | 'auction_end' | 'price' | 'bid_count' | 'has_reserve' | 'reserve_met'
>;

export type AuctionState = 'pending' | 'cancelled' | 'scheduled' | 'live' | 'sold' | 'unsold';

/**
 * Works out what an auction is doing right now. `now` is the server-corrected
 * time in ms. The database only flips status to sold/unsold when finalise runs,
 * so we also treat "end time has passed" as finished here.
 */
export function getAuctionState(l: AuctionFields, now: number | null): AuctionState {
  if (l.status === 'pending') return 'pending';
  if (l.status === 'cancelled') return 'cancelled';
  if (l.status === 'sold') return 'sold';
  if (l.status === 'unsold') return 'unsold';

  const start = l.auction_start ? new Date(l.auction_start).getTime() : null;
  const end = l.auction_end ? new Date(l.auction_end).getTime() : null;

  if (now !== null) {
    if (start !== null && now < start) return 'scheduled';
    if (end !== null && now >= end) {
      return l.bid_count > 0 && (!l.has_reserve || l.reserve_met) ? 'sold' : 'unsold';
    }
  }
  return 'live';
}

export function minNextBid(l: { price: number; bid_count: number; bid_increment: number }) {
  return l.bid_count === 0 ? Number(l.price) : Number(l.price) + Number(l.bid_increment);
}

export function fmtMoney(n: number) {
  return '£' + Math.round(Number(n)).toLocaleString('en-GB');
}

export function formatRemaining(ms: number | null, precise = false): string {
  if (ms === null || ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (d > 0) return precise ? `${d}d ${pad(h)}h ${pad(m)}m ${pad(sec)}s` : `${d}d ${h}h ${m}m`;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
