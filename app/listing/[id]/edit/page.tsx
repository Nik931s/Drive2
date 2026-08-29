import { createClient } from '@/lib/supabaseServer';
import { notFound, redirect } from 'next/navigation';
import EditListingForm from '@/components/EditListingForm';
 
export const dynamic = 'force-dynamic';
 
export default async function EditListingPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
 
  if (!user) {
    redirect('/login');
  }
 
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single();
 
  if (!listing) notFound();
 
  if (listing.seller_id !== user.id) {
    redirect(`/listing/${params.id}`);
  }
 
  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h1 className="font-display text-5xl mb-6">Edit listing</h1>
      <EditListingForm listing={listing} />
    </div>
  );
}
 
