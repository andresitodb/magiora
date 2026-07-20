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
