'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';

const BODY_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'EV', 'Van', 'Convertible'];

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '90000');
  const [maxMileage, setMaxMileage] = useState(searchParams.get('maxMileage') || '150000');
  const [minYear, setMinYear] = useState(searchParams.get('minYear') || '2014');
  const [body, setBody] = useState(searchParams.get('body') || 'all');
  const [q, setQ] = useState(searchParams.get('q') || '');

  function apply(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const values: Record<string, string> = { maxPrice, maxMileage, minYear, body, q, ...overrides };
    Object.entries(values).forEach(([k, v]) => {
      if (v && v !== 'all') params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <aside className="bg-white border border-chrome p-4 h-fit sticky top-24">
      <h3 className="font-display text-lg mb-3 flex justify-between items-center">
        Filters
        <button
          className="text-[11px] font-mono text-inkSoft underline"
          onClick={() => {
            setMaxPrice('90000'); setMaxMileage('150000'); setMinYear('2014'); setBody('all'); setQ('');
            router.push(pathname);
          }}
        >
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
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">Body type</label>
        <select value={body} onChange={(e) => { setBody(e.target.value); apply({ body: e.target.value }); }} className="w-full border border-chrome px-2 py-1.5 text-sm">
          <option value="all">All</option>
          {BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Max price <span className="font-mono text-green">${Number(maxPrice).toLocaleString()}</span>
        </label>
        <input type="range" min={4000} max={90000} step={1000} value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)} onMouseUp={() => apply()} onTouchEnd={() => apply()}
          className="w-full accent-amberDeep" />
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Max mileage <span className="font-mono text-green">{Number(maxMileage).toLocaleString()} mi</span>
        </label>
        <input type="range" min={0} max={150000} step={5000} value={maxMileage}
          onChange={(e) => setMaxMileage(e.target.value)} onMouseUp={() => apply()} onTouchEnd={() => apply()}
          className="w-full accent-amberDeep" />
      </div>

      <div className="mb-2">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-inkSoft mb-2">
          Min year <span className="font-mono text-green">{minYear}</span>
        </label>
        <input type="range" min={2000} max={2026} step={1} value={minYear}
          onChange={(e) => setMinYear(e.target.value)} onMouseUp={() => apply()} onTouchEnd={() => apply()}
          className="w-full accent-amberDeep" />
      </div>
    </aside>
  );
}
