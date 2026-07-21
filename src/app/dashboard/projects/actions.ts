'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { slugify, PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/projects';
import { categoryForTitle } from '@/lib/role_titles';
import type { SupabaseClient } from '@supabase/supabase-js';

const VALID_TYPES = PROJECT_TYPES.map((t) => t.value) as string[];
const VALID_STATUSES = PROJECT_STATUSES.map((s) => s.value) as string[];

function validProjectYear(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const year = Number.parseInt(String(value), 10);
  const max = new Date().getFullYear() + 5;
  return Number.isInteger(year) && year >= 1900 && year <= max ? year : null;
}

function isHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function generateUniqueSlug(
  supabase: SupabaseClient,
  baseTitle: string,
  excludeId?: string
): Promise<string> {
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
  const yearValue = formData.get('year');
  const year = validProjectYear(yearValue);
  const trailerUrl = String(formData.get('trailer_url') ?? '').trim();
  if (yearValue && year === null) {
    redirect(
      '/dashboard/projects/new?error=' +
        encodeURIComponent('Enter a valid production year')
    );
  }
  if (!isHttpUrl(trailerUrl)) {
    redirect(
      '/dashboard/projects/new?error=' +
        encodeURIComponent('Trailer URL must start with http:// or https://')
    );
  }

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
      year,
      poster_url: (formData.get('poster_url') as string) || null,
      trailer_url: trailerUrl || null,
      location_city: (formData.get('location_city') as string) || null,
      location_state: (formData.get('location_state') as string) || null,
      visible: true,
    })
    .select('id, slug')
    .single();

  if (error || !created) {
    redirect('/dashboard/projects/new?error=' + encodeURIComponent(error?.message ?? 'Could not create project'));
  }

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
  const yearValue = formData.get('year');
  const year = validProjectYear(yearValue);
  const trailerUrl = String(formData.get('trailer_url') ?? '').trim();
  if (yearValue && year === null) {
    redirect(
      `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
        'Enter a valid production year'
      )}`
    );
  }
  if (!isHttpUrl(trailerUrl)) {
    redirect(
      `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
        'Trailer URL must start with http:// or https://'
      )}`
    );
  }

  let links: Record<string, string> = {};
  try {
    const raw = formData.get('links') as string;
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      links = Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, string] =>
            typeof entry[1] === 'string' && isHttpUrl(entry[1])
        )
      );
    }
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
      year,
      poster_url: (formData.get('poster_url') as string) || null,
      trailer_url: trailerUrl || null,
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
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('owner_id', user.id);
  if (error) {
    redirect(
      `/dashboard/projects?error=${encodeURIComponent(error.message)}`
    );
  }

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
  const magioraSlug = (formData.get('magiora_slug') as string)?.trim();
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

  if (magioraSlug) {
    const { data: linkedProfile } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('slug', magioraSlug)
      .maybeSingle();
    if (linkedProfile) {
      profileId = linkedProfile.id;
      externalName = null;
    } else {
      redirect(
        `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
          'No Magiora profile was found for that profile link.'
        )}`
      );
    }
  }

  const normalizedRole = roleTitle.toLocaleLowerCase();
  if (profileId) {
    const { data: existingProfileCredits, error: existingCreditsError } =
      await supabase
        .from('project_credits')
        .select('id, role_title')
        .eq('project_id', projectId)
        .eq('profile_id', profileId);

    if (existingCreditsError) {
      redirect(
        `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
          existingCreditsError.message
        )}`
      );
    }

    const duplicate = (existingProfileCredits ?? []).find(
      (credit) =>
        credit.role_title.trim().toLocaleLowerCase() === normalizedRole
    );
    if (duplicate) {
      redirect(
        `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
          'That professional already has this role on the project.'
        )}`
      );
    }

    const legacyOwnerCredit = (existingProfileCredits ?? []).find(
      (credit) => credit.role_title.trim().toLocaleLowerCase() === 'owner'
    );
    if (legacyOwnerCredit) {
      const roleCategory = categoryForTitle(roleTitle) ?? null;
      const { error: replaceOwnerError } = await supabase
        .from('project_credits')
        .update({
          role_title: roleTitle,
          role_category: roleCategory,
          character_name: characterName,
          external_name: null,
          confirmed: true,
        })
        .eq('id', legacyOwnerCredit.id)
        .eq('project_id', projectId);

      if (replaceOwnerError) {
        redirect(
          `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
            replaceOwnerError.message
          )}`
        );
      }

      revalidatePath(`/dashboard/projects/${projectId}/edit`);
      revalidatePath('/projects/[slug]', 'page');
      revalidatePath('/m/[slug]', 'page');
      redirect(`/dashboard/projects/${projectId}/edit?toast=credit_added`);
    }
  } else {
    const { data: duplicateExternal, error: duplicateExternalError } =
      await supabase
        .from('project_credits')
        .select('id')
        .eq('project_id', projectId)
        .ilike('external_name', name)
        .ilike('role_title', roleTitle)
        .limit(1)
        .maybeSingle();

    if (duplicateExternalError) {
      redirect(
        `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
          duplicateExternalError.message
        )}`
      );
    }
    if (duplicateExternal) {
      redirect(
        `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
          'That professional already has this role on the project.'
        )}`
      );
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
  revalidatePath('/projects/[slug]', 'page');
  revalidatePath('/m/[slug]', 'page');
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

  const { error } = await supabase
    .from('project_credits')
    .delete()
    .eq('id', creditId)
    .eq('project_id', projectId);
  if (error) {
    redirect(
      `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

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

  const { data: existingCredits, error: creditsError } = await supabase
    .from('project_credits')
    .select('id')
    .eq('project_id', projectId);
  if (creditsError) {
    redirect(
      `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
        creditsError.message
      )}`
    );
  }

  const existingIds = new Set((existingCredits ?? []).map((credit) => credit.id));
  if (
    orderedIds.length !== existingIds.size ||
    new Set(orderedIds).size !== orderedIds.length ||
    orderedIds.some((id) => !existingIds.has(id))
  ) {
    redirect(
      `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
        'Credit order is incomplete or invalid'
      )}`
    );
  }

  const results = await Promise.all(
    orderedIds.map((creditId, position) =>
      supabase
        .from('project_credits')
        .update({ position })
        .eq('id', creditId)
        .eq('project_id', projectId)
    )
  );
  const reorderError = results.find((result) => result.error)?.error;
  if (reorderError) {
    redirect(
      `/dashboard/projects/${projectId}/edit?error=${encodeURIComponent(
        reorderError.message
      )}`
    );
  }

  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  revalidatePath(`/projects/[slug]`, 'page');
  redirect(`/dashboard/projects/${projectId}/edit?toast=reordered`);
}
