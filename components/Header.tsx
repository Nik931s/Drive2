import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
 
export default async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <header className="sticky top-0 z-40 bg-ink text-concrete border-b-4 border-amber">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6">
        <Link href="/" className="font-display text-2xl tracking-wide whitespace-nowrap">
          DRIVE<span className="text-amber">·</span>WAY
        </Link>
        <nav className="hidden sm:flex items-center gap-5 text-sm font-medium">
          <Link href="/browse" className="hover:text-amber">Browse</Link>
          <Link href="/sell" className="hover:text-amber">Sell</Link>
          {user && <Link href="/dashboard" className="hover:text-amber">Dashboard</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <form action="/api/auth/signout" method="post">
              <button className="text-sm border border-white/25 rounded-full px-4 py-2 hover:border-amber">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="text-sm border border-white/25 rounded-full px-4 py-2 hover:border-amber">
                Log in
              </Link>
              <Link href="/signup" className="bg-amber text-ink font-bold text-sm rounded-full px-4 py-2">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
 
