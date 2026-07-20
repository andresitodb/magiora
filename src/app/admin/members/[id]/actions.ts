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

function sameTimestamp(actual: string | null, expected: string | null) {
  if (actual === expected) return true;
  if (!actual || !expected) return false;
  return new Date(actual).getTime() === new Date(expected).getTime();
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

export async function toggleApproved(formData: FormData) {
  const { supabase } = await requireAdmin();
  const memberId = formData.get('member_id') as string;
  const approved = formData.get('new_value') === 'true';

  if (!memberId) redirect('/admin/members');

  const { data, error } = await supabase
    .from('profiles')
    .update({ approved })
    .eq('id', memberId)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    redirect(
      `/admin/members/${memberId}?error=${encodeURIComponent(
        error?.message ?? 'The approval state could not be updated.'
      )}`
    );
  }

  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath('/admin/members');
  revalidatePath('/admin/featured');
  revalidatePath('/directory');
  revalidatePath(`/m/[slug]`, 'page');
  revalidatePath('/');
  redirect(`/admin/members/${memberId}?saved=approval`);
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

  const submittedProfileId = formData.get('profile_id');
  const profileId =
    typeof submittedProfileId === 'string' ? submittedProfileId.trim() : '';
  const action = formData.get('action');

  if (!profileId) {
    redirect(
      `/admin/members?error=${encodeURIComponent('Profile ID was not submitted.')}`
    );
  }

  if (action === 'feature') {
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('id, display_name, visible, approved, featured_at')
      .eq('id', profileId)
      .maybeSingle();

    if (selectError) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          `Profile lookup failed: ${selectError.message}`
        )}`
      );
    }
    if (!profile) {
      redirect(
        `/admin/members?error=${encodeURIComponent(
          'Profile was not found.'
        )}`
      );
    }

    const profileName = profile.display_name?.trim() || 'This profile';
    if (profile.visible !== true && profile.approved !== true) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          `${profileName} is hidden and not approved.`
        )}`
      );
    }
    if (profile.visible !== true) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          `${profileName} is approved but currently hidden.`
        )}`
      );
    }
    if (profile.approved !== true) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          `${profileName} is public but not approved.`
        )}`
      );
    }

    const featuredAt = new Date().toISOString();
    const mutation = await supabase
      .from('profiles')
      .update({ featured_at: featuredAt }, { count: 'exact' })
      .eq('id', profileId)
      .select('id, featured_at');

    if (mutation.error) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          `Profile was eligible but the update failed: ${mutation.error.message} (HTTP ${mutation.status} ${mutation.statusText})`
        )}`
      );
    }

    const { data: confirmedProfile, error: confirmationError } = await supabase
      .from('profiles')
      .select('id, display_name, visible, approved, featured_at')
      .eq('id', profileId)
      .maybeSingle();

    if (confirmationError) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          `The update response could not be confirmed: ${confirmationError.message}`
        )}`
      );
    }
    if (!confirmedProfile) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          `The profile could not be re-read after the update (HTTP ${mutation.status} ${mutation.statusText}; returned ${mutation.data?.length ?? 0} rows; count ${mutation.count ?? 'unavailable'}).`
        )}`
      );
    }
    if (!sameTimestamp(confirmedProfile.featured_at, featuredAt)) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          `The profile remained unchanged after the update (HTTP ${mutation.status} ${mutation.statusText}; returned ${mutation.data?.length ?? 0} rows; count ${mutation.count ?? 'unavailable'}).`
        )}`
      );
    }
    revalidatePath(`/admin/members/${profileId}`);
    revalidatePath('/admin/members');
    revalidatePath('/admin/featured');
    revalidatePath('/directory');
    revalidatePath('/');
    redirect(
      `/admin/members/${profileId}?featured=on&name=${encodeURIComponent(
        confirmedProfile.display_name?.trim() || profileName
      )}`
    );
  } else {
    const mutation = await supabase
      .from('profiles')
      .update({ featured_at: null }, { count: 'exact' })
      .eq('id', profileId)
      .select('id, featured_at');
    if (mutation.error) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          `The profile could not be removed from Featured: ${mutation.error.message} (HTTP ${mutation.status} ${mutation.statusText})`
        )}`
      );
    }

    const { data: confirmedProfile, error: confirmationError } = await supabase
      .from('profiles')
      .select('id, featured_at')
      .eq('id', profileId)
      .maybeSingle();

    if (confirmationError || !confirmedProfile) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          confirmationError?.message ??
            'The profile could not be re-read after removing Featured.'
        )}`
      );
    }
    if (confirmedProfile.featured_at !== null) {
      redirect(
        `/admin/members/${profileId}?error=${encodeURIComponent(
          `The profile remained Featured after the update (HTTP ${mutation.status} ${mutation.statusText}; returned ${mutation.data?.length ?? 0} rows; count ${mutation.count ?? 'unavailable'}).`
        )}`
      );
    }
    revalidatePath(`/admin/members/${profileId}`);
    revalidatePath('/admin/members');
    revalidatePath('/admin/featured');
    revalidatePath('/directory');
    revalidatePath('/');
    redirect(`/admin/members/${profileId}?featured=off`);
  }
}
