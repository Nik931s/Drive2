import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/lib/types';
import SaveButton from '@/components/SaveButton';

function fmtMoney(n: number) {
  return '£' + Math.round(n).toLocaleString();
}

export default function CarCard({
  listing,
  saved,
  showSaveButton,
}: {
  listing: Listing;
  saved?: boolean;
  showSaveButton?: boolean;
}) {
  const cover = listing.listing_photos?.sort((a, b) => a.sort_order - b.sort_order)[0];
  return (
    <div className="bg-white border border-chrome flex flex-col hover:-translate-y-1 hover:shadow-lg transition">
      <div className="h-40 relative border-b border-chrome bg-concreteDark flex items-center justify-center overflow-hidden">
        {cover ? (
          <Image
            src={cover.storage_path}
            alt={`${listing.year} ${listing.make} ${listing.model}`}
            fill
            className="object-cover"
          />
        ) : (
          <span className="font-mono text-xs text-inkSoft">No photo yet</span>
        )}
        <div className="absolute top-2 right-2 bg-ink text-concrete font-mono font-semibold text-xs px-2 py-1 border border-amber">
          {fmtMoney(listing.price)}
        </div>
        {listing.is_featured && (
          <div className="absolute top-2 left-2 bg-amber text-ink font-mono font-bold text-[10px] px-2 py-1">
            FEATURED
          </div>
        )}
        {showSaveButton && (
          <div className="absolute bottom-2 right-2">
            <SaveButton listingId={listing.id} initialSaved={!!saved} />
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <p className="font-bold text-sm">{listing.year} {listing.make} {listing.model}</p>
        <p className="text-xs text-inkSoft mb-2">{listing.body_type} · {listing.color || '—'} · {listing.drivetrain || '—'}</p>
        <div className="grid grid-cols-2 gap-1 font-mono text-[10.5px] text-inkSoft border border-dashed border-chrome p-2 mt-auto">
          <div><b className="block text-ink text-xs">{listing.mileage.toLocaleString()}</b>miles</div>
          <div><b className="block text-ink text-xs">{listing.transmission}</b>transmission</div>
        </div>
        <Link
          href={`/listing/${listing.id}`}
          className="mt-2 block text-center bg-green hover:bg-greenLight text-concrete text-xs font-bold py-2"
        >
          View window sticker
        </Link>
      </div>
    </div>
  );
}
