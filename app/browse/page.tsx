import { createClient } from '@/lib/supabaseServer';
import CarCard from '@/components/CarCard';
import Filters from '@/components/Filters';
import SortSelect from '@/components/SortSelect';
import type { Listing } from '@/lib/types';

export const dynamic = 'force-dynamic';

function titleCase(s: string) {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createClient();

  // Lightweight query across ALL active listings (unfiltered) purely to work out
  // the real min/max bounds and the available make/model options for the filter UI.
  const { data: aggregateRows } = await supabase
    .from('listings')
    .select('price, mileage, year, make, model')
    .eq('status', 'active');

  const prices = (aggregateRows || []).map((r) => r.price).filter((n) => n != null);
  const mileages = (aggregateRows || []).map((r) => r.mileage).filter((n) => n != null);
  const years = (aggregateRows || []).map((r) => r.year).filter((n) => n != null);

  const bounds = {
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 90000,
    minMileage: mileages.length ? Math.min(...mileages) : 0,
    maxMileage: mileages.length ? Math.max(...mileages) : 150000,
    minYear: years.length ? Math.min(...years) : 2000,
    maxYear: years.length ? Math.max(...years) : new Date().getFullYear(),
  };

  // Build a deduplicated make -> models map, case-insensitively, so "ford" and
  // "Ford" collapse into a single filter option.
  const makeMap = new Map<string, { label: string; models: Map<string, string> }>();
  const allModelsMap = new Map<string, string>();

  (aggregateRows || []).forEach((row) => {
    if (!row.make) return;
    const makeKey = row.make.trim().toLowerCase();
    if (!makeMap.has(makeKey)) {
      makeMap.set(makeKey, { label: titleCase(row.make), models: new Map() });
    }
    if (row.model) {
      const modelKey = row.model.trim().toLowerCase();
      const modelLabel = titleCase(row.model);
      makeMap.get(makeKey)!.models.set(modelKey, modelLabel);
      allModelsMap.set(modelKey, modelLabel);
    }
  });

  const makes = Array.from(makeMap.entries())
    .map(([value, { label, models }]) => ({
      value,
      label,
      models: Array.from(models.entries())
        .map(([mvalue, mlabel]) => ({ value: mvalue, label: mlabel }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const allModels = Array.from(allModelsMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Main, filtered query.
  let query = supabase
    .from('listings')
    .select('*, listing_photos(storage_path, sort_order)')
    .eq('status', 'active');

  if (searchParams.body) query = query.eq('body_type', searchParams.body);
  if (searchParams.make) query = query.ilike('make', searchParams.make);
  if (searchParams.model) query = query.ilike('model', searchParams.model);
  if (searchParams.minPrice) query = query.gte('price', Number(searchParams.minPrice));
  if (searchParams.maxPrice) query = query.lte('price', Number(searchParams.maxPrice));
  if (searchParams.minMileage) query = query.gte('mileage', Number(searchParams.minMileage));
  if (searchParams.maxMileage) query = query.lte('mileage', Number(searchParams.maxMileage));
  if (searchParams.minYear) query = query.gte('year', Number(searchParams.minYear));
  if (searchParams.maxYear) query = query.lte('year', Number(searchParams.maxYear));
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
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-7">
        <Filters bounds={bounds} makes={makes} allModels={allModels} />
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
