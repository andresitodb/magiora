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

export async function featureProfile(formData: FormData) {
  const { supabase } = await requireAdmin();
  const profileId = formData.get('profile_id') as string;
  if (!profileId) redirect('/admin/featured');

  await supabase.from('profiles').update({ featured_at: new Date().toISOString() }).eq('id', profileId);

  revalidatePath('/admin/featured');
  revalidatePath('/');
  redirect('/admin/featured?saved=featured');
}

export async function unfeatureProfile(formData: FormData) {
  const { supabase } = await requireAdmin();
  const profileId = formData.get('profile_id') as string;
  if (!profileId) redirect('/admin/featured');

  await supabase.from('profiles').update({ featured_at: null }).eq('id', profileId);

  revalidatePath('/admin/featured');
  revalidatePath('/');
  redirect('/admin/featured?saved=unfeatured');
}

export async function featureProject(formData: FormData) {
  const { supabase } = await requireAdmin();
  const projectId = formData.get('project_id') as string;
  if (!projectId) redirect('/admin/featured');

  const { error } = await supabase
    .from('projects')
    .update({ featured_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('visible', true);

  if (error) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath('/admin/featured');
  revalidatePath('/');
  redirect('/admin/featured?saved=project_featured');
}

export async function unfeatureProject(formData: FormData) {
  const { supabase } = await requireAdmin();
  const projectId = formData.get('project_id') as string;
  if (!projectId) redirect('/admin/featured');

  const { error } = await supabase
    .from('projects')
    .update({ featured_at: null })
    .eq('id', projectId);

  if (error) {
    redirect(
      `/admin/featured?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath('/admin/featured');
  revalidatePath('/');
  redirect('/admin/featured?saved=project_unfeatured');
}
