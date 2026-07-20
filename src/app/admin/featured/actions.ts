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
  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!me?.is_admin) redirect('/dashboard');
  return { supabase, user };
}

function sameTimestamp(actual: string | null, expected: string | null) {
  if (actual === expected) return true;
  if (!actual || !expected) return false;
  return new Date(actual).getTime() === new Date(expected).getTime();
}

export async function featureProfile(formData: FormData) {
  const { supabase } = await requireAdmin();
  const submittedProfileId = formData.get('profile_id');
  const profileId =
    typeof submittedProfileId === 'string' ? submittedProfileId.trim() : '';
  if (!profileId) {
    redirect(
      `/admin/featured?error=${encodeURIComponent('Profile ID was not submitted.')}`
    );
  }

  const { data: profile, error: selectError } = await supabase
    .from('profiles')
    .select('id, display_name, visible, approved, featured_at')
    .eq('id', profileId)
    .maybeSingle();

  if (selectError) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(
        `Profile lookup failed: ${selectError.message}`
      )}`
    );
  }
  if (!profile) {
    redirect(
      `/admin/featured?error=${encodeURIComponent('Profile was not found.')}`
    );
  }

  const profileName = profile.display_name?.trim() || 'This profile';
  if (profile.visible !== true && profile.approved !== true) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(
        `${profileName} is hidden and not approved.`
      )}`
    );
  }
  if (profile.visible !== true) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(
        `${profileName} is approved but currently hidden.`
      )}`
    );
  }
  if (profile.approved !== true) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(
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
      `/admin/featured?error=${encodeURIComponent(
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
      `/admin/featured?error=${encodeURIComponent(
        `The update response could not be confirmed: ${confirmationError.message}`
      )}`
    );
  }
  if (!confirmedProfile) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(
        `The profile could not be re-read after the update (HTTP ${mutation.status} ${mutation.statusText}; returned ${mutation.data?.length ?? 0} rows; count ${mutation.count ?? 'unavailable'}).`
      )}`
    );
  }
  if (!sameTimestamp(confirmedProfile.featured_at, featuredAt)) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(
        `The profile remained unchanged after the update (HTTP ${mutation.status} ${mutation.statusText}; returned ${mutation.data?.length ?? 0} rows; count ${mutation.count ?? 'unavailable'}).`
      )}`
    );
  }

  revalidatePath('/admin/featured');
  revalidatePath('/admin/members');
  revalidatePath('/directory');
  revalidatePath('/');
  redirect(
    `/admin/featured?saved=featured&name=${encodeURIComponent(
      confirmedProfile.display_name?.trim() || profileName
    )}`
  );
}

export async function unfeatureProfile(formData: FormData) {
  const { supabase } = await requireAdmin();
  const profileId = formData.get('profile_id') as string;
  if (!profileId) redirect('/admin/featured');

  const mutation = await supabase
    .from('profiles')
    .update({ featured_at: null }, { count: 'exact' })
    .eq('id', profileId)
    .select('id, featured_at');

  if (mutation.error) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(
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
      `/admin/featured?error=${encodeURIComponent(
        confirmationError?.message ??
          'The profile could not be re-read after removing Featured.'
      )}`
    );
  }
  if (confirmedProfile.featured_at !== null) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(
        `The profile remained Featured after the update (HTTP ${mutation.status} ${mutation.statusText}; returned ${mutation.data?.length ?? 0} rows; count ${mutation.count ?? 'unavailable'}).`
      )}`
    );
  }

  revalidatePath('/admin/featured');
  revalidatePath('/admin/members');
  revalidatePath('/directory');
  revalidatePath('/');
  redirect('/admin/featured?saved=unfeatured');
}

export async function featureProject(formData: FormData) {
  const { supabase } = await requireAdmin();
  const projectId = formData.get('project_id') as string;
  if (!projectId) redirect('/admin/featured');

  const { data, error } = await supabase
    .from('projects')
    .update({ featured_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('visible', true)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(
        error?.message ?? 'Only public projects can be featured on Home.'
      )}`
    );
  }

  revalidatePath('/admin/featured');
  revalidatePath('/projects');
  revalidatePath('/');
  redirect('/admin/featured?saved=project_featured');
}

export async function unfeatureProject(formData: FormData) {
  const { supabase } = await requireAdmin();
  const projectId = formData.get('project_id') as string;
  if (!projectId) redirect('/admin/featured');

  const { data, error } = await supabase
    .from('projects')
    .update({ featured_at: null })
    .eq('id', projectId)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(
        error?.message ?? 'The project could not be updated.'
      )}`
    );
  }

  revalidatePath('/admin/featured');
  revalidatePath('/projects');
  revalidatePath('/');
  redirect('/admin/featured?saved=project_unfeatured');
}

export async function featureInterview(formData: FormData) {
  const { supabase } = await requireAdmin();
  const submittedId = formData.get('interview_id');
  const interviewId = typeof submittedId === 'string' ? submittedId.trim() : '';
  const returnTo =
    formData.get('return_to') === 'editor' && interviewId
      ? `/admin/stories/${interviewId}`
      : '/admin/featured';
  if (!interviewId) {
    redirect(`${returnTo}?error=${encodeURIComponent('Interview ID was not submitted.')}`);
  }

  const { data: interview, error: lookupError } = await supabase
    .from('interviews')
    .select('id, title, slug, status, featured_at')
    .eq('id', interviewId)
    .maybeSingle();
  if (lookupError) {
    redirect(`${returnTo}?error=${encodeURIComponent(`Interview lookup failed: ${lookupError.message}`)}`);
  }
  if (!interview) {
    redirect(`${returnTo}?error=${encodeURIComponent('Interview was not found.')}`);
  }
  if (interview.status !== 'published') {
    redirect(`${returnTo}?error=${encodeURIComponent('Only published interviews can be Featured on Home.')}`);
  }

  const featuredAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('interviews')
    .update({ featured_at: featuredAt })
    .eq('id', interviewId);
  if (updateError) {
    redirect(`${returnTo}?error=${encodeURIComponent(`Interview update failed: ${updateError.message}`)}`);
  }

  const { data: confirmed, error: confirmationError } = await supabase
    .from('interviews')
    .select('id, title, slug, status, featured_at')
    .eq('id', interviewId)
    .maybeSingle();
  if (confirmationError) {
    redirect(`${returnTo}?error=${encodeURIComponent(`Interview confirmation failed: ${confirmationError.message}`)}`);
  }
  if (!confirmed || !sameTimestamp(confirmed.featured_at, featuredAt)) {
    redirect(`${returnTo}?error=${encodeURIComponent('Interview was eligible but no row was updated.')}`);
  }

  revalidateSpotlightPaths(interviewId, confirmed.slug);
  if (returnTo.startsWith('/admin/stories/')) redirect(`${returnTo}?featured=on`);
  redirect(`${returnTo}?saved=spotlight_featured&name=${encodeURIComponent(confirmed.title ?? 'Interview')}`);
}

export async function unfeatureInterview(formData: FormData) {
  const { supabase } = await requireAdmin();
  const submittedId = formData.get('interview_id');
  const interviewId = typeof submittedId === 'string' ? submittedId.trim() : '';
  const returnTo =
    formData.get('return_to') === 'editor' && interviewId
      ? `/admin/stories/${interviewId}`
      : '/admin/featured';
  if (!interviewId) {
    redirect(`${returnTo}?error=${encodeURIComponent('Interview ID was not submitted.')}`);
  }

  const { data: interview, error: lookupError } = await supabase
    .from('interviews')
    .select('id, title, slug, featured_at')
    .eq('id', interviewId)
    .maybeSingle();
  if (lookupError) {
    redirect(`${returnTo}?error=${encodeURIComponent(`Interview lookup failed: ${lookupError.message}`)}`);
  }
  if (!interview) {
    redirect(`${returnTo}?error=${encodeURIComponent('Interview was not found.')}`);
  }

  const { error: updateError } = await supabase
    .from('interviews')
    .update({ featured_at: null })
    .eq('id', interviewId);
  if (updateError) {
    redirect(`${returnTo}?error=${encodeURIComponent(`Interview update failed: ${updateError.message}`)}`);
  }

  const { data: confirmed, error: confirmationError } = await supabase
    .from('interviews')
    .select('id, slug, featured_at')
    .eq('id', interviewId)
    .maybeSingle();
  if (confirmationError || !confirmed) {
    redirect(`${returnTo}?error=${encodeURIComponent(confirmationError?.message ?? 'Interview could not be confirmed.')}`);
  }
  if (confirmed.featured_at !== null) {
    redirect(`${returnTo}?error=${encodeURIComponent('Interview remained Featured after the update.')}`);
  }

  revalidateSpotlightPaths(interviewId, confirmed.slug);
  if (returnTo.startsWith('/admin/stories/')) redirect(`${returnTo}?featured=off`);
  redirect(`${returnTo}?saved=spotlight_unfeatured`);
}

function revalidateSpotlightPaths(interviewId: string, slug: string | null) {
  revalidatePath('/');
  revalidatePath('/stories');
  if (slug) revalidatePath(`/stories/${slug}`);
  revalidatePath('/admin/stories');
  revalidatePath(`/admin/stories/${interviewId}`);
  revalidatePath('/admin/featured');
}
