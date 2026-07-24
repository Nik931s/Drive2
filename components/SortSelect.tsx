'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function change(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'relevance') params.delete('sort'); else params.set('sort', value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      defaultValue={searchParams.get('sort') || 'relevance'}
      onChange={(e) => change(e.target.value)}
      className="border border-chrome px-2 py-1.5 text-sm bg-white"
    >
      <option value="relevance">Sort: Relevance</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
      <option value="mileage-asc">Mileage: Low to High</option>
      <option value="year-desc">Year: Newest first</option>
    </select>
  );
}
