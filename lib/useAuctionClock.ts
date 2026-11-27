'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';

// One shared clock for the whole page: a single 1-second timer no matter how
// many countdowns are showing, and one lookup of the server's time so the
// countdowns stay right even if the visitor's device clock is wrong.
let offset = 0;
let offsetPromise: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(n: number) => void>();

function loadOffset() {
  if (offsetPromise) return offsetPromise;
  offsetPromise = (async () => {
    try {
      const supabase = createClient();
      const before = Date.now();
      const { data } = await supabase.rpc('server_now');
      const after = Date.now();
      if (data) {
        offset = new Date(data as string).getTime() - (before + after) / 2;
      }
    } catch {
      // keep offset 0 — falls back to the device clock
    }
  })();
  return offsetPromise;
}

function tick() {
  const n = Date.now() + offset;
  listeners.forEach((l) => l(n));
}

/** Server-corrected "now" in ms, or null until the page has mounted. */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    listeners.add(setNow);
    setNow(Date.now() + offset);
    loadOffset().then(() => setNow(Date.now() + offset));
    if (!timer) timer = setInterval(tick, 1000);
    return () => {
      listeners.delete(setNow);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return now;
}
