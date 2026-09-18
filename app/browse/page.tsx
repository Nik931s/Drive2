import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
import CarCard from '@/components/CarCard';
import Filters from '@/components/Filters';
import SortSelect from '@/components/SortSelect';
import type { Listing } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;
const BODY_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'EV', 'Van', 'Convertible'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric', 'LPG'];
const CAT_STATUSES = ['None', 'Cat N', 'Cat S', 'Cat C (legacy)', 'Cat D (legacy)'];

function titleCase(s: string) {
  return s.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function buildHref(searchParams: { [key: string]: string | undefined }, overrides: Record<string, string>) {
  const params = new URLSearchParams();
  Object.entries({ ...searchParams, ...overrides }).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  return `/browse?${params.toString()}`;
}

// Haversine distance in miles between two lat/lng points.
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
    const data = await res.json();
    if (data.status === 200 && data.result) {
      return { lat: data.result.latitude, lng: data.result.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createClient();

  const { data: aggregateRows } = await supabase
    .from('listings')
    .select('id, price, mileage, year, make, model, body_type, fuel_type, doors, seats, engine_size, cat_status, latitude, longitude')
    .eq('status', 'active');

  const rows = aggregateRows || [];
  const totalCount = rows.length;

  const prices = rows.map((r) => r.price).filter((n) => n != null);
  const mileages = rows.map((r) => r.mileage).filter((n) => n != null);
  const years = rows.map((r) => r.year).filter((n) => n != null);
  const doorsVals = rows.map((r) => r.doors).filter((n): n is number => n != null);
  const seatsVals = rows.map((r) => r.seats).filter((n): n is number => n != null);
  const engineVals = rows.map((r) => r.engine_size).filter((n): n is number => n != null);

  const bounds = {
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 90000,
    minMileage: mileages.length ? Math.min(...mileages) : 0,
    maxMileage: mileages.length ? Math.max(...mileages) : 150000,
    minYear: years.length ? Math.min(...years) : 2000,
    maxYear: years.length ? Math.max(...years) : new Date().getFullYear(),
    minDoors: doorsVals.length ? Math.min(...doorsVals) : 2,
    maxDoors: doorsVals.length ? Math.max(...doorsVals) : 5,
    minSeats: seatsVals.length ? Math.min(...seatsVals) : 2,
    maxSeats: seatsVals.length ? Math.max(...seatsVals) : 7,
    minEngineSize: engineVals.length ? Math.min(...engineVals) : 1.0,
    maxEngineSize: engineVals.length ? Math.max(...engineVals) : 5.0,
  };

  const makeMap = new Map<string, { label: string; count: number; models: Map<string, { label: string; count: number }> }>();
  const allModelsMap = new Map<string, { label: string; count: number }>();
  const bodyTypeCounts = new Map<string, number>();
  const fuelTypeCounts = new Map<string, number>();
  const catStatusCounts = new Map<string, number>();

  rows.forEach((row) => {
    if (row.body_type) bodyTypeCounts.set(row.body_type, (bodyTypeCounts.get(row.body_type) || 0) + 1);
    if (row.fuel_type) fuelTypeCounts.set(row.fuel_type, (fuelTypeCounts.get(row.fuel_type) || 0) + 1);
    if (row.cat_status) catStatusCounts.set(row.cat_status, (catStatusCounts.get(row.cat_status) || 0) + 1);

    if (!row.make) return;
    const makeKey = row.make.trim().toLowerCase();
    if (!makeMap.has(makeKey)) makeMap.set(makeKey, { label: titleCase(row.make), count: 0, models: new Map() });
    const makeEntry = makeMap.get(makeKey)!;
    makeEntry.count += 1;

    if (row.model) {
      const modelKey = row.model.trim().toLowerCase();
      const modelLabel = titleCase(row.model);
      const existingInMake = makeEntry.models.get(modelKey);
      makeEntry.models.set(modelKey, { label: modelLabel, count: (existingInMake?.count || 0) + 1 });
      const existingGlobal = allModelsMap.get(modelKey);
      allModelsMap.set(modelKey, { label: modelLabel, count: (existingGlobal?.count || 0) + 1 });
    }
  });

  const makes = Array.from(makeMap.entries())
    .map(([value, { label, count, models }]) => ({
      value, label, count,
      models: Array.from(models.entries())
        .map(([mvalue, { label: mlabel, count: mcount }]) => ({ value: mvalue, label: mlabel, count: mcount }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const allModels = Array.from(allModelsMap.entries())
    .map(([value, { label, count }]) => ({ value, label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const bodyTypes = BODY_TYPES.map((b) => ({ value: b, label: b, count: bodyTypeCounts.get(b) || 0 }));
  const fuelTypes = FUEL_TYPES.map((f) => ({ value: f, label: f, count: fuelTypeCounts.get(f) || 0 }));
  const catStatuses = CAT_STATUSES.map((c) => ({ value: c, label: c, count: catStatusCounts.get(c) || 0 }));

  // Location + radius filtering: geocode the searched postcode, then work out
  // which listings fall within range using their stored lat/lng.
  let locationMatchIds: string[] | null = null;
  let locationError: string | null = null;
  if (searchParams.postcode && searchParams.radius) {
    const geo = await geocodePostcode(searchParams.postcode);
    if (geo) {
      const radiusMiles = Number(searchParams.radius);
      locationMatchIds = rows
        .filter((r) => r.latitude != null && r.longitude != null)
        .filter((r) => distanceMiles(geo.lat, geo.lng, r.latitude as number, r.longitude as number) <= radiusMiles)
        .map((r) => r.id);
    } else {
      locationError = `Couldn't find postcode "${searchParams.postcode}".`;
      locationMatchIds = [];
    }
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('listings')
    .select('*, listing_photos(storage_path, sort_order)', { count: 'exact' })
    .eq('status', 'active');

  if (searchParams.body) query = query.eq('body_type', searchParams.body);
  if (searchParams.make) query = query.ilike('make', searchParams.make);
  if (searchParams.model) query = query.ilike('model', searchParams.model);
  if (searchParams.variant) query = query.ilike('variant', `%${searchParams.variant}%`);
  if (searchParams.fuel) query = query.eq('fuel_type', searchParams.fuel);
  if (searchParams.catStatus) query = query.eq('cat_status', searchParams.catStatus);
  if (searchParams.minPrice) query = query.gte('price', Number(searchParams.minPrice));
  if (searchParams.maxPrice) query = query.lte('price', Number(searchParams.maxPrice));
  if (searchParams.minMileage) query = query.gte('mileage', Number(searchParams.minMileage));
  if (searchParams.maxMileage) query = query.lte('mileage', Number(searchParams.maxMileage));
  if (searchParams.minYear) query = query.gte('year', Number(searchParams.minYear));
  if (searchParams.maxYear) query = query.lte('year', Number(searchParams.maxYear));
  if (searchParams.minDoors) query = query.gte('doors', Number(searchParams.minDoors));
  if (searchParams.maxDoors) query = query.lte('doors', Number(searchParams.maxDoors));
  if (searchParams.minSeats) query = query.gte('seats', Number(searchParams.minSeats));
  if (searchParams.maxSeats) query = query.lte('seats', Number(searchParams.maxSeats));
  if (searchParams.minEngineSize) query = query.gte('engine_size', Number(searchParams.minEngineSize));
  if (searchParams.maxEngineSize) query = query.lte('engine_size', Number(searchParams.maxEngineSize));
  if (searchParams.q) {
    query = query.or(`make.ilike.%${searchParams.q}%,model.ilike.%${searchParams.q}%`);
  }
  if (locationMatchIds !== null) {
    query = query.in('id', locationMatchIds.length > 0 ? locationMatchIds : ['00000000-0000-0000-0000-000000000000']);
  }

  switch (searchParams.sort) {
    case 'price-asc': query = query.order('price', { ascending: true }); break;
    case 'price-desc': query = query.order('price', { ascending: false }); break;
    case 'mileage-asc': query = query.order('mileage', { ascending: true }); break;
    case 'year-desc': query = query.order('year', { ascending: false }); break;
    default: query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  }

  query = query.range(from, to);

  const { data: listings, error, count } = await query;

  const totalMatching = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalMatching / PAGE_SIZE));

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
            {totalCount} vehicles listed
          </p>
          <h1 className="font-display text-6xl sm:text-7xl leading-none my-2">Find your next drive.</h1>
          <p className="max-w-lg text-inkSoft text-sm">
            No haggling games, no hidden fees — real listings from real sellers, with the full window sticker on every car.
          </p>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-7 md:items-start">
        <Filters
          bounds={bounds}
          makes={makes}
          allModels={allModels}
          bodyTypes={bodyTypes}
          fuelTypes={fuelTypes}
          catStatuses={catStatuses}
          totalCount={totalCount}
        />
        <main>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <p className="text-sm text-inkSoft">
              <b className="text-ink">{totalMatching}</b> vehicles match
              {totalMatching > 0 && (
                <span className="text-inkSoft"> — showing {from + 1}–{Math.min(from + PAGE_SIZE, totalMatching)}</span>
              )}
            </p>
            <SortSelect />
          </div>
          {locationError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 mb-4">{locationError}</p>
          )}
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 mb-4">
              Couldn&apos;t load listings: {error.message}. Have you run supabase/schema.sql yet?
            </p>
          )}
          {listings && listings.length > 0 ? (
            <>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {(listings as Listing[]).map((l) => (
                  <CarCard key={l.id} listing={l} showSaveButton={!!user} saved={savedIds.has(l.id)} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Link
                    href={buildHref(searchParams, { page: String(Math.max(1, page - 1)) })}
                    aria-disabled={page <= 1}
                    className={`text-xs font-bold px-3 py-2 border border-chrome ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-ink'}`}
                  >
                    ← Prev
                  </Link>
                  <span className="text-xs font-mono text-inkSoft px-2">Page {page} of {totalPages}</span>
                  <Link
                    href={buildHref(searchParams, { page: String(Math.min(totalPages, page + 1)) })}
                    aria-disabled={page >= totalPages}
                    className={`text-xs font-bold px-3 py-2 border border-chrome ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-ink'}`}
                  >
                    Next →
                  </Link>
                </div>
              )}
            </>
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
