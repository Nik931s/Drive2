'use client';

import { useEffect, useState } from 'react';

// Shared across every component on the page so we only ever prompt for /
// fetch the browser's location once, no matter how many DistanceBadges render.
let cachedPosition: GeolocationPosition | null = null;
let pendingPromise: Promise<GeolocationPosition | null> | null = null;

function getPosition(): Promise<GeolocationPosition | null> {
  if (cachedPosition) return Promise.resolve(cachedPosition);
  if (pendingPromise) return pendingPromise;

  pendingPromise = new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cachedPosition = pos;
        resolve(pos);
      },
      () => resolve(null),
      { maximumAge: 300000, timeout: 8000 }
    );
  });

  return pendingPromise;
}

export function useUserLocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(cachedPosition);

  useEffect(() => {
    let mounted = true;
    getPosition().then((pos) => {
      if (mounted) setPosition(pos);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return position;
}
