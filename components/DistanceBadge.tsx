'use client';

import { useUserLocation } from '@/lib/useUserLocation';

function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DistanceBadge({ lat, lng }: { lat: number | null; lng: number | null }) {
  const position = useUserLocation();

  if (lat == null || lng == null || !position) return null;

  const miles = distanceMiles(position.coords.latitude, position.coords.longitude, lat, lng);

  return (
    <span className="font-mono text-[10px] text-inkSoft">
      {miles < 1 ? '<1 mi away' : `${Math.round(miles)} mi away`}
    </span>
  );
}
