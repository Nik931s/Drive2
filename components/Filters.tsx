'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';

const BODY_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'EV', 'Van', 'Convertible'];

type Option = { value: string; label: string };
type MakeOption = Option & { models: Option[] };

export default function Filters({
  bounds,
  makes,
  allModels,
}: {
  bounds: {
    minPrice: number; maxPrice: number;
    minMileage: number; maxMileage: number;
    minYear: number; maxYear: number;
  };
  makes: MakeOption[];
  allModels: Option[];
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
  const [body, setBody] = useState(searchParams.get('body') || 'all');
  const [make, setMake] = useState(searchParams.get('make') || 'all');
  const [model, setModel] = useState(searchParams.get('model') || 'all');
  const [q, setQ] = useState(searchParams.get('q') || '');

  const modelOptions: Option[] =
    make === 'all' ? allModels : (makes.find((m) => m.value === make)?.models || []);

  function apply(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const values: Record<string, string> = {
      minPrice, maxPrice, minMileage, maxMileage, minYear, maxYear,
      body, make, model, q, ...overrides,
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
    setBody('all'); setMake('all'); setModel('all'); setQ('');
    router.push(pathname);
  }

  return (
    <aside className="bg-white border border-chrome p-4 h-fit sticky top-24">
      <h3 className="font-display text-lg mb-3 flex justify-between items-center">
        Filters
        <button className="text-[11px] font-mono text-inkSoft underline" onClick={reset}>
          Reset
        </button>
      </h3>

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
          onChange={(e) => {
            setMake(e.target.value);
            setModel('all');
            apply({ make: e.target.value, model: 'all' });
          }}
          className="w-full border border-chrome px-2 py-1.5 text-sm"
        >
          <option value="all">All makes</option>
          {makes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
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
          {modelOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">Body type</label>
        <select value={body} onChange={(e) => { setBody(e.target.value); apply({ body: e.target.value }); }} className="w-full border border-chrome px-2 py-1.5 text-sm">
          <option value="all">All</option>
          {BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Price (£{bounds.minPrice.toLocaleString()} – £{bounds.maxPrice.toLocaleString()})
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={`Min £${bounds.minPrice}`}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() => apply()}
            className="w-full border border-chrome px-2 py-1.5 text-sm"
          />
          <span className="text-inkSoft text-xs">to</span>
          <input
            type="number"
            placeholder={`Max £${bounds.maxPrice}`}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() => apply()}
            className="w-full border border-chrome px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Mileage ({bounds.minMileage.toLocaleString()} – {bounds.maxMileage.toLocaleString()} mi)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={`Min ${bounds.minMileage}`}
            value={minMileage}
            onChange={(e) => setMinMileage(e.target.value)}
            onBlur={() => apply()}
            className="w-full border border-chrome px-2 py-1.5 text-sm"
          />
          <span className="text-inkSoft text-xs">to</span>
          <input
            type="number"
            placeholder={`Max ${bounds.maxMileage}`}
            value={maxMileage}
            onChange={(e) => setMaxMileage(e.target.value)}
            onBlur={() => apply()}
            className="w-full border border-chrome px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Year ({bounds.minYear} – {bounds.maxYear})
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={`From ${bounds.minYear}`}
            value={minYear}
            onChange={(e) => setMinYear(e.target.value)}
            onBlur={() => apply()}
            className="w-full border border-chrome px-2 py-1.5 text-sm"
          />
          <span className="text-inkSoft text-xs">to</span>
          <input
            type="number"
            placeholder={`To ${bounds.maxYear}`}
            value={maxYear}
            onChange={(e) => setMaxYear(e.target.value)}
            onBlur={() => apply()}
            className="w-full border border-chrome px-2 py-1.5 text-sm"
          />
        </div>
      </div>
    </aside>
  );
}
