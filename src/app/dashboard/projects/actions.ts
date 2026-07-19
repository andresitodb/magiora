'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { slugify, PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/projects';
import { categoryForTitle } from '@/lib/role_titles';

const VALID_TYPES = PROJECT_TYPES.map((t) => t.value) as string[];
const VALID_STATUSES = PROJECT_STATUSES.map((s) => s.value) as string[];

async function generateUniqueSlug(supabase: any, baseTitle: string, excludeId?: string): Promise<string> {
  const base = slugify(baseTitle) || 'project';
  let slug = base;
  let n = 1;
  while (true) {
    let q = supabase.from('projects').select('id').eq('slug', slug);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    n++;
    slug = `${base}-${n}`;
    if (n > 200) return `${base}-${Date.now()}`;
  }
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const title = (formData.get('title') as string)?.trim();
  if (!title) {
    redirect('/dashboard/projects/new?error=' + encodeURIComponent('Project needs a title'));
  }

  const slug = await generateUniqueSlug(supabase, title);
  const project_type = (formData.get('project_type') as string) || 'feature_film';
  const status = (formData.get('status') as string) || 'in_development';

  const { data: created, error } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      slug,
      title,
      tagline: (formData.get('tagline') as string) || null,
      description: (formData.get('description') as string) || null,
      project_type: VALID_TYPES.includes(project_type) ? project_type : 'feature_film',
      status: VALID_STATUSES.includes(status) ? status : 'in_development',
      year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
      poster_url: (formData.get('poster_url') as string) || null,
      trailer_url: (formData.get('trailer_url') as string) || null,
      location_city: (formData.get('location_city') as string) || null,
      location_state: (formData.get('location_state') as string) || null,
      visible: true,
    })
    .select('id, slug')
    .single();

  if (error || !created) {
    redirect('/dashboard/projects/new?error=' + encodeURIComponent(error?.message ?? 'Could not create project'));
  }

  await supabase.from('project_credits').insert({
    project_id: created.id,
    profile_id: user.id,
    role_title: 'Owner',
    role_category: null,
    position: 0,
    confirmed: true,
  });

  revalidatePath('/dashboard/projects');
  redirect(`/dashboard/projects/${created.id}/edit?toast=created`);
}

export async function updateProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const projectId = formData.get('project_id') as string;
  if (!projectId) redirect('/dashboard/projects');

  const { data: existing } = await supabase
    .from('projects')
    .select('owner_id, slug, title')
    .eq('id', projectId)
    .maybeSingle();

  if (!existing || existing.owner_id !== user.id) {
    redirect('/dashboard/projects?error=' + encodeURIComponent('Not allowed'));
  }

  const title = (formData.get('title') as string)?.trim() || existing.title;
  const newTitle = title !== existing.title;
  const slug = newTitle ? await generateUniqueSlug(supabase, title, projectId) : existing.slug;

  const project_type = (formData.get('project_type') as string) || 'feature_film';
  const status = (formData.get('status') as string) || 'in_development';

  let links: Record<string, string> = {};
  try {
    const raw = formData.get('links') as string;
    if (raw) links = JSON.parse(raw);
  } catch {}

  let gallery: string[] = [];
  try {
    const raw = formData.get('gallery') as string;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) gallery = parsed.filter((u) => typeof u === 'string');
    }
  } catch {}

  const { error } = await supabase
    .from('projects')
    .update({
      slug,
      title,
      tagline: (formData.get('tagline') as string) || null,
      description: (formData.get('description') as string) || null,
      project_type: VALID_TYPES.includes(project_type) ? project_type : 'feature_film',
      status: VALID_STATUSES.includes(status) ? status : 'in_development',
      year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
      poster_url: (formData.get('poster_url') as string) || null,
      trailer_url: (formData.get('trailer_url') as string) || null,
      location_city: (formData.get('location_city') as string) || null,
      location_state: (formData.get('location_state') as string) || null,
      gallery,
      links,
      visible: formData.get('visible') === 'true',
    })
    .eq('id', projectId);

  if (error) {
    redirect(`/dashboard/projects/${projectId}/edit?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  revalidatePath('/projects/[slug]', 'page');
  redirect(`/dashboard/projects/${projectId}/edit?toast=saved`);
}

export async function deleteProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const projectId = formData.get('project_id') as string;
  await supabase.from('projects').delete().eq('id', projectId).eq('owner_id', user.id);

  revalidatePath('/dashboard/projects');
  redirect('/dashboard/projects?toast=deleted');
}

export async function addCredit(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const projectId = formData.get('project_id') as string;
  const name = (formData.get('name') as string)?.trim();
  const roleTitle = (formData.get('role_title') as string)?.trim();
  const kinoraSlug = (formData.get('kinora_slug') as string)?.trim();
  const characterName = (formData.get('character_name') as string)?.trim() || null;

  if (!projectId || !name || !roleTitle) {
    redirect(`/dashboard/projects/${projectId}/edit?error=` + encodeURIComponent('Name and role are required'));
  }

  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .maybeSingle();
  if (!project || project.owner_id !== user.id) {
    redirect('/dashboard/projects');
  }

  let profileId: string | null = null;
  let externalName: string | null = name;

  if (kinoraSlug) {
    const { data: linkedProfile } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('slug', kinoraSlug)
      .maybeSingle();
    if (linkedProfile) {
      profileId = linkedProfile.id;
      externalName = null;
    }
  }

  const { data: maxRow } = await supabase
    .from('project_credits')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (maxRow?.position ?? 0) + 1;

  const roleCategory = categoryForTitle(roleTitle) ?? null;

  const { error } = await supabase.from('project_credits').insert({
    project_id: projectId,
    profile_id: profileId,
    external_name: externalName,
    role_title: roleTitle,
    role_category: roleCategory,
    character_name: characterName,
    position: nextPosition,
  });

  if (error) {
    redirect(`/dashboard/projects/${projectId}/edit?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  redirect(`/dashboard/projects/${projectId}/edit?toast=credit_added`);
}

export async function removeCredit(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const creditId = formData.get('credit_id') as string;
  const projectId = formData.get('project_id') as string;

  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .maybeSingle();
  if (!project || project.owner_id !== user.id) {
    redirect('/dashboard/projects');
  }

  await supabase.from('project_credits').delete().eq('id', creditId).eq('project_id', projectId);

  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  redirect(`/dashboard/projects/${projectId}/edit`);
}

// NEW: Reorder credits
export async function reorderCredits(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const projectId = formData.get('project_id') as string;
  let orderedIds: string[] = [];
  try {
    const raw = formData.get('ordered_ids') as string;
    orderedIds = JSON.parse(raw);
    if (!Array.isArray(orderedIds)) throw new Error('not array');
  } catch {
    redirect(`/dashboard/projects/${projectId}/edit?error=` + encodeURIComponent('Invalid order'));
  }

  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .maybeSingle();
  if (!project || project.owner_id !== user.id) {
    redirect('/dashboard/projects');
  }

  // Update each credit's position. Sequential is fine for typical project sizes.
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from('project_credits')
      .update({ position: i })
      .eq('id', orderedIds[i])
      .eq('project_id', projectId);
  }

  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  revalidatePath(`/projects/[slug]`, 'page');
  redirect(`/dashboard/projects/${projectId}/edit?toast=reordered`);
}
