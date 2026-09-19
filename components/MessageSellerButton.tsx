'use client';

import { useState } from 'react';
import ContactSellerForm from '@/components/ContactSellerForm';

export default function MessageSellerButton({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return <ContactSellerForm listingId={listingId} sellerId={sellerId} />;
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="mt-4 w-full bg-amber text-ink font-bold py-2.5"
    >
      Message seller
    </button>
  );
}
