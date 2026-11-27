import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabaseServer';

export async function getIsAdmin(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return data?.role === 'admin';
}

/** Use at the top of every admin page. Sends non-admins away. */
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const isAdmin = await getIsAdmin(supabase, user.id);
  if (!isAdmin) redirect('/');
  return { supabase, user };
}
