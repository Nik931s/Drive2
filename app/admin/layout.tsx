import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <div className="bg-concreteDark border-b border-chrome">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center gap-5 text-xs font-bold uppercase tracking-wide">
          <span className="text-inkSoft">Admin</span>
          <Link href="/admin" className="hover:text-amberDeep">Listings</Link>
        </div>
      </div>
      {children}
    </div>
  );
}
