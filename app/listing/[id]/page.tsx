mkdir -p /home/claude/driveway/app/listing/'[id]'
cat > "/home/claude/driveway/app/listing/[id]/page.tsx" << 'ENDOFFILE'
import { createClient } from '@/lib/supabaseServer';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import ContactSellerForm from '@/components/ContactSellerForm';
import PaymentCalculator from '@/components/PaymentCalculator';
import SaveButton from '@/components/SaveButton';
import FeatureListingButton from '@/components/FeatureListingButton';

export const dynamic = 'force-dynamic';

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: listing } = await supabase
    .from('listings')
    .select('*, listing_photos(storage_path, sort_order), profiles!listings_seller_id_fkey(full_name)')
    .eq('id', params.id)
    .single();

  if (!listing) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === listing.seller_id;

  let isSaved = false;
  if (user) {
    const { data: savedRow } = await supabase
      .from('saved_listings')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('listing_id', listing.id)
      .maybeSingle();
    isSaved = !!savedRow;
  }

  const cover = listing.listing_photos?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="bg-ink text-concrete p-5 flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display text-4xl">{listing.year} {listing.make} {listing.model}</h1>
          <p className="font-mono text-xs text-chrome mt-1">
            {listing.vin ? `VIN ${listing.vin} · ` : ''}Listed by {listing.profiles?.full_name || 'a seller'}
          </p>
        </div>
        {user && !isOwner && <SaveButton listingId={listing.id} initialSaved={isSaved} />}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="bg-white border border-chrome h-56 flex items-center justify-center relative overflow-hidden">
            {cover ? (
              <Image src={cover.storage_path} alt={listing.model} fill className="object-cover" />
            ) : (
              <span className="font-mono text-xs text-inkSoft">No photo uploaded yet</span>
            )}
          </div>
          <p className="text-sm text-inkSoft mt-4 leading-relaxed">
            {listing.description || 'No description provided by the seller.'}
          </p>

          <PaymentCalculator price={listing.price} />
        </div>

        <div>
          <div className="border border-dashed border-inkSoft p-4 font-mono text-xs">
            <p className="uppercase tracking-widest text-inkSoft text-[10px] border-b border-chrome pb-2 mb-2">Window sticker</p>
            <div className="spec-row"><span>Price</span><span>£{Number(listing.price).toLocaleString()}</span></div>
            <div className="spec-row"><span>Mileage</span><span>{listing.mileage.toLocaleString()} mi</span></div>
            <div className="spec-row"><span>Body style</span><span>{listing.body_type}</span></div>
            <div className="spec-row"><span>Exterior</span><span>{listing.color || '—'}</span></div>
            <div className="spec-row"><span>Transmission</span><span>{listing.transmission}</span></div>
            <div className="spec-row"><span>Drivetrain</span><span>{listing.drivetrain || '—'}</span></div>
            <div className="spec-row"><span>Fuel type</span><span>{listing.fuel_type}</span></div>
            <div className="spec-row"><span>Year</span><span>{listing.year}</span></div>
          </div>

          {!isOwner && user && <ContactSellerForm listingId={listing.id} sellerId={listing.seller_id} />}
          {!user && (
            <p className="text-sm text-inkSoft mt-4">
              <a href="/login" className="underline text-ink">Log in</a> to message the seller or save this listing.
            </p>
          )}
          {isOwner && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-inkSoft">This is your listing.</p>
              <FeatureListingButton listingId={listing.id} isFeatured={listing.is_featured} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
