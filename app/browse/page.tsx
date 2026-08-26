import { createClient } from '@/lib/supabaseServer';
import CarCard from '@/components/CarCard';
import Filters from '@/components/Filters';
import SortSelect from '@/components/SortSelect';
import type { Listing } from '@/lib/types';
 
export const dynamic = 'force-dynamic';
 
export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createClient();
  let query = supabase
    .from('listings')
    .select('*, listing_photos(storage_path, sort_order)')
    .eq('status', 'active');
 
  if (searchParams.body) query = query.eq('body_type', searchParams.body);
  if (searchParams.maxPrice) query = query.lte('price', Number(searchParams.maxPrice));
  if (searchParams.maxMileage) query = query.lte('mileage', Number(searchParams.maxMileage));
  if (searchParams.minYear) query = query.gte('year', Number(searchParams.minYear));
  if (searchParams.q) {
    query = query.or(`make.ilike.%${searchParams.q}%,model.ilike.%${searchParams.q}%`);
  }
 
  switch (searchParams.sort) {
    case 'price-asc': query = query.order('price', { ascending: true }); break;
    case 'price-desc': query = query.order('price', { ascending: false }); break;
    case 'mileage-asc': query = query.order('mileage', { ascending: true }); break;
    case 'year-desc': query = query.order('year', { ascending: false }); break;
    default: query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  }
 
  const { data: listings, error } = await query;
 
  // Work out which of these listings the current viewer has already saved,
  // so each card can show the correct favorite state.
  const { data: { user } } = await supabase.auth.getUser();
  let savedIds = new Set<string>();
  if (user && listings && listings.length > 0) {
    const { data: savedRows } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', user.id)
      .in('listing_id', listings.map((l) => l.id));
    savedIds = new Set((savedRows || []).map((r) => r.listing_id));
  }
 
  return (
    <>
      <section className="bg-concrete border-b border-chrome px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-green font-semibold flex items-center gap-2 before:content-[''] before:w-5 before:h-0.5 before:bg-amber">
            {listings?.length ?? 0} vehicles listed
          </p>
          <h1 className="font-display text-6xl sm:text-7xl leading-none my-2">Find your next drive.</h1>
          <p className="max-w-lg text-inkSoft text-sm">
            No haggling games, no hidden fees — real listings from real sellers, with the full window sticker on every car.
          </p>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-7">
        <Filters />
        <main>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <p className="text-sm text-inkSoft"><b className="text-ink">{listings?.length ?? 0}</b> vehicles match</p>
            <SortSelect />
          </div>
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 mb-4">
              Couldn&apos;t load listings: {error.message}. Have you run supabase/schema.sql yet?
            </p>
          )}
          {listings && listings.length > 0 ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {(listings as Listing[]).map((l) => (
                <CarCard
                  key={l.id}
                  listing={l}
                  showSaveButton={!!user}
                  saved={savedIds.has(l.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-inkSoft">
              <p className="font-display text-3xl text-ink mb-2">No matches in the lot</p>
              <p>Try widening your filters, or be the first to list a car.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
 
