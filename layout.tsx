import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Driveway — Find your next drive',
  description: 'A real, working car marketplace built with Next.js and Supabase.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-concrete text-ink min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-chrome py-6 text-center text-xs text-inkSoft font-mono">
          Driveway — a demo marketplace. Not a licensed dealer.
        </footer>
      </body>
    </html>
  );
}
