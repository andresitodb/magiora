'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) redirect('/dashboard');
  return supabase;
}

export async function approveEvent(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;

  const { error } = await supabase
    .from('events')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    redirect(`/admin/events?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/events');
  revalidatePath('/events');
  revalidatePath('/');
  redirect('/admin/events');
}

export async function rejectEvent(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;

  const { error } = await supabase.from('events').update({ status: 'rejected' }).eq('id', id);
  if (error) {
    redirect(`/admin/events?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/events');
  revalidatePath('/events');
  revalidatePath('/');
  redirect('/admin/events');
}
