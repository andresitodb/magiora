'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { triggerMatchingForCall } from '@/lib/matching-trigger';

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

export async function approveCastingCall(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;

  const { data: existing } = await supabase
    .from('casting_calls')
    .select('status')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('casting_calls')
    .update({ status: 'open' })
    .eq('id', id);

  if (error) {
    console.error(error);
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  if (existing?.status !== 'open') {
    const matching = await triggerMatchingForCall(id);
    if (!matching.ok) {
      console.error('Matching failed after casting approval:', matching.error);
    }
  }

  revalidatePath('/admin');
  revalidatePath('/casting-calls');
  redirect('/admin');
}

export async function rejectCastingCall(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;

  const { error } = await supabase
    .from('casting_calls')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) console.error(error);

  revalidatePath('/admin');
  redirect('/admin');
}
