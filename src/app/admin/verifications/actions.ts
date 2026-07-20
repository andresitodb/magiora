'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!me?.is_admin) redirect('/dashboard');
  return { supabase, user };
}

export async function approveVerified(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const profileId = formData.get('profile_id') as string;
  if (!profileId) {
    redirect('/admin/verifications?error=' + encodeURIComponent('Missing profile_id'));
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('verification_data, display_name')
    .eq('id', profileId)
    .single();

  const updatedData = {
    ...(target?.verification_data ?? {}),
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      verified: true,
      verification_status: 'approved',
      verification_data: updatedData,
    })
    .eq('id', profileId);

  if (error) {
    redirect('/admin/verifications?error=' + encodeURIComponent(error.message));
  }

  // Delete the ID photo for privacy now that review is done
  const idPath = (target?.verification_data as any)?.id_photo_url;
  if (idPath) {
    await supabase.storage.from('verification-docs').remove([idPath]);
  }

  // Notify user
  await supabase.from('notifications').insert({
    recipient_id: profileId,
    type: 'verification_approved',
    payload: {
      title: 'You are now verified ✓',
      body: 'A blue check now appears next to your name across Magiora.',
    },
  });

  revalidatePath('/admin/verifications');
  revalidatePath(`/m/[slug]`, 'page');
  redirect('/admin/verifications?saved=approved');
}

export async function rejectVerified(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const profileId = formData.get('profile_id') as string;
  const rejectionReason = ((formData.get('rejection_reason') as string) ?? '').trim() || null;

  if (!profileId) {
    redirect('/admin/verifications?error=' + encodeURIComponent('Missing profile_id'));
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('verification_data')
    .eq('id', profileId)
    .single();

  const updatedData = {
    ...(target?.verification_data ?? {}),
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
    rejection_reason: rejectionReason,
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      verification_status: 'rejected',
      verification_data: updatedData,
    })
    .eq('id', profileId);

  if (error) {
    redirect('/admin/verifications?error=' + encodeURIComponent(error.message));
  }

  // Delete the ID photo for privacy
  const idPath = (target?.verification_data as any)?.id_photo_url;
  if (idPath) {
    await supabase.storage.from('verification-docs').remove([idPath]);
  }

  // Notify user
  await supabase.from('notifications').insert({
    recipient_id: profileId,
    type: 'verification_rejected',
    payload: {
      title: 'Verification request not approved',
      body: rejectionReason
        ? `Reason: ${rejectionReason}. You can submit a new request from your profile.`
        : 'You can submit a new request from your profile editor.',
    },
  });

  revalidatePath('/admin/verifications');
  redirect('/admin/verifications?saved=rejected');
}
