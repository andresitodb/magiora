'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  isHttpProjectUrl,
  normalizeProjectStatus,
  normalizeProjectType,
  parseProjectYear,
} from '@/lib/projects';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.is_admin) redirect('/dashboard');
  return supabase;
}

function projectPath(projectId: string, key: 'error' | 'saved', message: string) {
  return `/admin/projects/${projectId}?${key}=${encodeURIComponent(message)}`;
}

export async function updateAdminProject(formData: FormData) {
  const supabase = await requireAdmin();
  const projectId = String(formData.get('project_id') ?? '').trim();
  if (!projectId) redirect('/admin/projects?error=Missing%20project%20ID');

  const { data: existing, error: lookupError } = await supabase
    .from('projects')
    .select('id, slug')
    .eq('id', projectId)
    .maybeSingle();
  if (lookupError || !existing) {
    redirect(projectPath(projectId, 'error', lookupError?.message ?? 'Project not found.'));
  }

  const title = String(formData.get('title') ?? '').trim();
  if (!title) redirect(projectPath(projectId, 'error', 'Project needs a title.'));
  const yearValue = formData.get('year');
  const year = parseProjectYear(yearValue);
  if (yearValue && year === null) {
    redirect(projectPath(projectId, 'error', 'Enter a valid production year.'));
  }
  const trailerUrl = String(formData.get('trailer_url') ?? '').trim();
  const posterUrl = String(formData.get('poster_url') ?? '').trim();
  if (!isHttpProjectUrl(trailerUrl) || !isHttpProjectUrl(posterUrl)) {
    redirect(projectPath(projectId, 'error', 'Poster and trailer URLs must start with http:// or https://.'));
  }

  const { error } = await supabase
    .from('projects')
    .update({
      title,
      tagline: String(formData.get('tagline') ?? '').trim() || null,
      description: String(formData.get('description') ?? '').trim() || null,
      project_type: normalizeProjectType(formData.get('project_type')),
      status: normalizeProjectStatus(formData.get('status')),
      year,
      poster_url: posterUrl || null,
      trailer_url: trailerUrl || null,
      location_city: String(formData.get('location_city') ?? '').trim() || null,
      location_state: String(formData.get('location_state') ?? '').trim() || null,
      visible: formData.get('visible') === 'true',
    })
    .eq('id', projectId);
  if (error) redirect(projectPath(projectId, 'error', error.message));

  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath(`/projects/${existing.slug}`);
  revalidatePath('/admin/projects');
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(projectPath(projectId, 'saved', 'Project saved.'));
}

export async function toggleAdminProjectFeatured(formData: FormData) {
  const supabase = await requireAdmin();
  const projectId = String(formData.get('project_id') ?? '').trim();
  if (!projectId) redirect('/admin/projects?error=Missing%20project%20ID');

  const { data: project, error: lookupError } = await supabase
    .from('projects')
    .select('id, slug, visible, featured_at')
    .eq('id', projectId)
    .maybeSingle();
  if (lookupError || !project) {
    redirect(projectPath(projectId, 'error', lookupError?.message ?? 'Project not found.'));
  }
  if (!project.featured_at && !project.visible) {
    redirect(projectPath(projectId, 'error', 'Only public projects can be featured on Home.'));
  }

  const { error } = await supabase
    .from('projects')
    .update({ featured_at: project.featured_at ? null : new Date().toISOString() })
    .eq('id', projectId);
  if (error) redirect(projectPath(projectId, 'error', error.message));

  revalidatePath('/');
  revalidatePath('/admin/featured');
  revalidatePath('/admin/projects');
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(projectPath(projectId, 'saved', project.featured_at ? 'Removed from Home.' : 'Featured on Home.'));
}
