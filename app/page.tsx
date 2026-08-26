import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
 
export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
 
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-concrete px-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="font-display text-7xl sm:text-8xl leading-none mb-3">
          DRIVE<span className="text-amber">·</span>WAY
        </h1>
        <p className="text-inkSoft text-sm mb-10 max-w-sm mx-auto">
          A real, working car marketplace. No haggling games, no hidden fees —
          just real listings from real sellers.
        </p>
 
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto">
          <Link
            href="/browse"
            className="bg-ink text-concrete font-bold text-sm py-3.5 hover:bg-inkSoft transition"
          >
            Browse cars
          </Link>
          <Link
            href="/sell"
            className="bg-amber text-ink font-bold text-sm py-3.5 hover:bg-amberDeep transition"
          >
            Sell a car
          </Link>
 
          {user ? (
            <Link
              href="/dashboard"
              className="col-span-1 sm:col-span-2 border border-chrome text-ink font-bold text-sm py-3.5 hover:border-ink transition"
            >
              Go to your dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="border border-chrome text-ink font-bold text-sm py-3.5 hover:border-ink transition"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="border border-chrome text-ink font-bold text-sm py-3.5 hover:border-ink transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
 
