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

export async function toggleVerified(formData: FormData) {
  const { supabase } = await requireAdmin();

  const memberId = formData.get('member_id') as string;
  const newValue = formData.get('new_value') === 'true';

  const { error } = await supabase
    .from('profiles')
    .update({ verified: newValue })
    .eq('id', memberId);

  if (error) {
    redirect(`/admin/members/${memberId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath('/admin/members');
  revalidatePath(`/m/[slug]`, 'page');
  redirect(`/admin/members/${memberId}?saved=1`);
}

export async function inviteForInterview(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const memberId = formData.get('member_id') as string;
  const workingTitle = (formData.get('working_title') as string)?.trim();

  if (!memberId || !workingTitle) {
    redirect(`/admin/members/${memberId}?error=${encodeURIComponent('Title is required')}`);
  }

  const { error } = await supabase.from('interviews').insert({
    subject_profile_id: memberId,
    title: workingTitle,
    status: 'in_progress',
    invited_by_admin: true,
    invited_at: new Date().toISOString(),
    invited_by: user.id,
  });

  if (error) {
    redirect(`/admin/members/${memberId}?error=${encodeURIComponent(error.message)}`);
  }

  // Best-effort notification — won't block if it fails
  await supabase
    .from('notifications')
    .insert({
      recipient_id: memberId,
      type: 'interview_invited',
      payload: {
        title: 'You were invited for an interview',
        body: `An editor wants to feature you in a story: "${workingTitle}". Open your dashboard to start.`,
      },
    })
    .then(() => {})
    .then(undefined, () => {});

  revalidatePath(`/admin/members/${memberId}`);
  redirect(`/admin/members/${memberId}?invited=1`);
}

export async function toggleFeatured(formData: FormData) {
  const { supabase } = await requireAdmin();

  const profileId = formData.get('profile_id') as string;
  const action = formData.get('action') as string; // 'feature' or 'unfeature'

  if (action === 'feature') {
    const { error } = await supabase
      .from('profiles')
      .update({ featured_at: new Date().toISOString() })
      .eq('id', profileId);
    if (error) {
      redirect(`/admin/members/${profileId}?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath(`/admin/members/${profileId}`);
    revalidatePath('/');
    redirect(`/admin/members/${profileId}?featured=on`);
  } else {
    const { error } = await supabase
      .from('profiles')
      .update({ featured_at: null })
      .eq('id', profileId);
    if (error) {
      redirect(`/admin/members/${profileId}?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath(`/admin/members/${profileId}`);
    revalidatePath('/');
    redirect(`/admin/members/${profileId}?featured=off`);
  }
}
