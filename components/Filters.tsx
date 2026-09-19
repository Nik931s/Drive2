'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';

type Option = { value: string; label: string; count: number };
type MakeOption = Option & { models: Option[] };

export default function Filters({
  bounds,
  makes,
  allModels,
  bodyTypes,
  fuelTypes,
  catStatuses,
  totalCount,
}: {
  bounds: {
    minPrice: number; maxPrice: number;
    minMileage: number; maxMileage: number;
    minYear: number; maxYear: number;
    minDoors: number; maxDoors: number;
    minSeats: number; maxSeats: number;
    minEngineSize: number; maxEngineSize: number;
  };
  makes: MakeOption[];
  allModels: Option[];
  bodyTypes: Option[];
  fuelTypes: Option[];
  catStatuses: Option[];
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minMileage, setMinMileage] = useState(searchParams.get('minMileage') || '');
  const [maxMileage, setMaxMileage] = useState(searchParams.get('maxMileage') || '');
  const [minYear, setMinYear] = useState(searchParams.get('minYear') || '');
  const [maxYear, setMaxYear] = useState(searchParams.get('maxYear') || '');
  const [minDoors, setMinDoors] = useState(searchParams.get('minDoors') || '');
  const [maxDoors, setMaxDoors] = useState(searchParams.get('maxDoors') || '');
  const [minSeats, setMinSeats] = useState(searchParams.get('minSeats') || '');
  const [maxSeats, setMaxSeats] = useState(searchParams.get('maxSeats') || '');
  const [minEngineSize, setMinEngineSize] = useState(searchParams.get('minEngineSize') || '');
  const [maxEngineSize, setMaxEngineSize] = useState(searchParams.get('maxEngineSize') || '');
  const [body, setBody] = useState(searchParams.get('body') || 'all');
  const [make, setMake] = useState(searchParams.get('make') || 'all');
  const [model, setModel] = useState(searchParams.get('model') || 'all');
  const [variant, setVariant] = useState(searchParams.get('variant') || '');
  const [fuel, setFuel] = useState(searchParams.get('fuel') || 'all');
  const [catStatus, setCatStatus] = useState(searchParams.get('catStatus') || 'all');
  const [postcode, setPostcode] = useState(searchParams.get('postcode') || '');
  const [radius, setRadius] = useState(searchParams.get('radius') || '10');
  const [q, setQ] = useState(searchParams.get('q') || '');

  const modelOptions: Option[] =
    make === 'all' ? allModels : (makes.find((m) => m.value === make)?.models || []);

  function apply(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const values: Record<string, string> = {
      minPrice, maxPrice, minMileage, maxMileage, minYear, maxYear,
      minDoors, maxDoors, minSeats, maxSeats, minEngineSize, maxEngineSize,
      body, make, model, variant, fuel, catStatus, postcode, radius, q,
      ...overrides,
    };
    Object.entries(values).forEach(([k, v]) => {
      if (v && v !== 'all') params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  function reset() {
    setMinPrice(''); setMaxPrice('');
    setMinMileage(''); setMaxMileage('');
    setMinYear(''); setMaxYear('');
    setMinDoors(''); setMaxDoors('');
    setMinSeats(''); setMaxSeats('');
    setMinEngineSize(''); setMaxEngineSize('');
    setBody('all'); setMake('all'); setModel('all');
    setVariant(''); setFuel('all'); setCatStatus('all');
    setPostcode(''); setRadius('10'); setQ('');
    router.push(pathname);
  }

  return (
    <aside className="bg-white border border-chrome p-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <h3 className="font-display text-lg mb-1 flex justify-between items-center">
        Filters
        <button className="text-[11px] font-mono text-inkSoft underline" onClick={reset}>
          Reset
        </button>
      </h3>
      <p className="text-[11px] font-mono text-inkSoft mb-3">{totalCount} total vehicles listed</p>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">Search</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="Make, model…"
          className="w-full border border-chrome px-2 py-1.5 text-sm"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">Make</label>
        <select
          value={make}
          onChange={(e) => { setMake(e.target.value); setModel('all'); apply({ make: e.target.value, model: 'all' }); }}
          className="w-full border border-chrome px-2 py-1.5 text-sm"
        >
          <option value="all">All makes ({totalCount})</option>
          {makes.map((m) => <option key={m.value} value={m.value}>{m.label} ({m.count})</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">Model</label>
        <select
          value={model}
          onChange={(e) => { setModel(e.target.value); apply({ model: e.target.value }); }}
          className="w-full border border-chrome px-2 py-1.5 text-sm"
        >
          <option value="all">All models</option>
          {modelOptions.map((m) => <option key={m.value} value={m.value}>{m.label} ({m.count})</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">Variant / trim</label>
        <input
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
          onBlur={() => apply()}
          placeholder="e.g. ST-Line"
          className="w-full border border-chrome px-2 py-1.5 text-sm"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">Body type</label>
        <select value={body} onChange={(e) => { setBody(e.target.value); apply({ body: e.target.value }); }} className="w-full border border-chrome px-2 py-1.5 text-sm">
          <option value="all">All ({totalCount})</option>
          {bodyTypes.map((b) => <option key={b.value} value={b.value}>{b.label} ({b.count})</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">Fuel type</label>
        <select value={fuel} onChange={(e) => { setFuel(e.target.value); apply({ fuel: e.target.value }); }} className="w-full border border-chrome px-2 py-1.5 text-sm">
          <option value="all">All ({totalCount})</option>
          {fuelTypes.map((f) => <option key={f.value} value={f.value}>{f.label} ({f.count})</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">Write-off category</label>
        <select value={catStatus} onChange={(e) => { setCatStatus(e.target.value); apply({ catStatus: e.target.value }); }} className="w-full border border-chrome px-2 py-1.5 text-sm">
          <option value="all">All ({totalCount})</option>
          {catStatuses.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.count})</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">Location</label>
        <div className="flex items-center gap-2">
          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="Postcode"
            className="w-full border border-chrome px-2 py-1.5 text-sm"
          />
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="border border-chrome px-2 py-1.5 text-sm"
          >
            {[5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>{r} mi</option>)}
            <option value="any">Nationwide</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => apply()}
          className="mt-2 w-full text-xs font-bold border border-chrome py-1.5 hover:border-ink"
        >
          Search near postcode
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Price (£{bounds.minPrice.toLocaleString()} – £{bounds.maxPrice.toLocaleString()})
        </label>
        <div className="flex items-center gap-2">
          <input type="number" placeholder={`Min £${bounds.minPrice}`} value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
          <span className="text-inkSoft text-xs">to</span>
          <input type="number" placeholder={`Max £${bounds.maxPrice}`} value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Mileage ({bounds.minMileage.toLocaleString()} – {bounds.maxMileage.toLocaleString()} mi)
        </label>
        <div className="flex items-center gap-2">
          <input type="number" placeholder={`Min ${bounds.minMileage}`} value={minMileage}
            onChange={(e) => setMinMileage(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
          <span className="text-inkSoft text-xs">to</span>
          <input type="number" placeholder={`Max ${bounds.maxMileage}`} value={maxMileage}
            onChange={(e) => setMaxMileage(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Year ({bounds.minYear} – {bounds.maxYear})
        </label>
        <div className="flex items-center gap-2">
          <input type="number" placeholder={`From ${bounds.minYear}`} value={minYear}
            onChange={(e) => setMinYear(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
          <span className="text-inkSoft text-xs">to</span>
          <input type="number" placeholder={`To ${bounds.maxYear}`} value={maxYear}
            onChange={(e) => setMaxYear(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Doors ({bounds.minDoors} – {bounds.maxDoors})
        </label>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={minDoors}
            onChange={(e) => setMinDoors(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
          <span className="text-inkSoft text-xs">to</span>
          <input type="number" placeholder="Max" value={maxDoors}
            onChange={(e) => setMaxDoors(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Seats ({bounds.minSeats} – {bounds.maxSeats})
        </label>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={minSeats}
            onChange={(e) => setMinSeats(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
          <span className="text-inkSoft text-xs">to</span>
          <input type="number" placeholder="Max" value={maxSeats}
            onChange={(e) => setMaxSeats(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Engine size ({bounds.minEngineSize}L – {bounds.maxEngineSize}L)
        </label>
        <div className="flex items-center gap-2">
          <input type="number" step={0.1} placeholder="Min L" value={minEngineSize}
            onChange={(e) => setMinEngineSize(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
          <span className="text-inkSoft text-xs">to</span>
          <input type="number" step={0.1} placeholder="Max L" value={maxEngineSize}
            onChange={(e) => setMaxEngineSize(e.target.value)} onBlur={() => apply()} className="w-full border border-chrome px-2 py-1.5 text-sm" />
        </div>
      </div>
    </aside>
  );
}
