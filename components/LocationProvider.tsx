'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Coords = { lat: number; lng: number } | null;

type LocationContextValue = {
  postcode: string;
  coords: Coords;
  loading: boolean;
  error: string | null;
  setPostcode: (postcode: string) => Promise<void>;
  clearPostcode: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

const STORAGE_KEY = 'driveway_postcode';
const STORAGE_COORDS_KEY = 'driveway_postcode_coords';

async function geocodePostcode(postcode: string): Promise<Coords> {
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

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [postcode, setPostcodeState] = useState('');
  const [coords, setCoords] = useState<Coords>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedPostcode = localStorage.getItem(STORAGE_KEY);
    const savedCoords = localStorage.getItem(STORAGE_COORDS_KEY);
    if (savedPostcode && savedCoords) {
      setPostcodeState(savedPostcode);
      setCoords(JSON.parse(savedCoords));
    }
  }, []);

  async function setPostcode(newPostcode: string) {
    setLoading(true);
    setError(null);
    const geo = await geocodePostcode(newPostcode);
    setLoading(false);
    if (!geo) {
      setError(`Couldn't find postcode "${newPostcode}".`);
      return;
    }
    setPostcodeState(newPostcode);
    setCoords(geo);
    localStorage.setItem(STORAGE_KEY, newPostcode);
    localStorage.setItem(STORAGE_COORDS_KEY, JSON.stringify(geo));
  }

  function clearPostcode() {
    setPostcodeState('');
    setCoords(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_COORDS_KEY);
  }

  return (
    <LocationContext.Provider value={{ postcode, coords, loading, error, setPostcode, clearPostcode }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
