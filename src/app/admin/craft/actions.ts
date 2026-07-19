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
  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!me?.is_admin) redirect('/dashboard');
  return { supabase, user };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

async function generateUniqueSlug(supabase: any, baseTitle: string, excludeId?: string): Promise<string> {
  const base = slugify(baseTitle) || 'article';
  let slug = base;
  let n = 1;
  while (true) {
    let q = supabase.from('craft_articles').select('id').eq('slug', slug);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    n++;
    slug = `${base}-${n}`;
    if (n > 200) return `${base}-${Date.now()}`;
  }
}

function formToData(formData: FormData): any {
  return {
    slug: ((formData.get('slug') as string) ?? '').trim(),
    title_en: ((formData.get('title_en') as string) ?? '').trim(),
    title_es: ((formData.get('title_es') as string) ?? '').trim(),
    intro_en: ((formData.get('intro_en') as string) ?? '').trim() || null,
    intro_es: ((formData.get('intro_es') as string) ?? '').trim() || null,
    body_en: ((formData.get('body_en') as string) ?? '').trim(),
    body_es: ((formData.get('body_es') as string) ?? '').trim(),
    category: (formData.get('category') as string) ?? 'cinema',
    reading_minutes: parseInt((formData.get('reading_minutes') as string) || '2', 10),
    cover_image_url: ((formData.get('cover_image_url') as string) ?? '').trim() || null,
    status: (formData.get('status') as string) ?? 'draft',
    publish_at: (formData.get('publish_at') as string) || new Date().toISOString(),
  };
}

export async function createArticle(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const data = formToData(formData);

  if (!data.title_en || !data.title_es) {
    redirect('/admin/craft/new?error=' + encodeURIComponent('Both EN and ES titles are required'));
  }
  if (!data.body_en || !data.body_es) {
    redirect('/admin/craft/new?error=' + encodeURIComponent('Both EN and ES body are required'));
  }

  // Slug — use submitted if valid, else generate from title_en
  let slug = data.slug;
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    slug = await generateUniqueSlug(supabase, data.title_en);
  } else {
    // Make sure it's unique
    const { data: taken } = await supabase
      .from('craft_articles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (taken) {
      slug = await generateUniqueSlug(supabase, slug);
    }
  }

  const { error } = await supabase.from('craft_articles').insert({
    ...data,
    slug,
    author_id: user.id,
  });

  if (error) {
    redirect('/admin/craft/new?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/craft');
  revalidatePath('/admin/craft');
  revalidatePath('/');
  redirect('/admin/craft?saved=created');
}

export async function updateArticle(formData: FormData) {
  const { supabase } = await requireAdmin();
  const articleId = formData.get('article_id') as string;
  if (!articleId) redirect('/admin/craft');

  const data = formToData(formData);

  if (!data.title_en || !data.title_es) {
    redirect(`/admin/craft/${articleId}/edit?error=` + encodeURIComponent('Both EN and ES titles are required'));
  }
  if (!data.body_en || !data.body_es) {
    redirect(`/admin/craft/${articleId}/edit?error=` + encodeURIComponent('Both EN and ES body are required'));
  }

  // Slug — keep submitted if valid and unique, else regenerate
  let slug = data.slug;
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    slug = await generateUniqueSlug(supabase, data.title_en, articleId);
  } else {
    const { data: taken } = await supabase
      .from('craft_articles')
      .select('id')
      .eq('slug', slug)
      .neq('id', articleId)
      .maybeSingle();
    if (taken) {
      slug = await generateUniqueSlug(supabase, slug, articleId);
    }
  }

  const { error } = await supabase
    .from('craft_articles')
    .update({ ...data, slug })
    .eq('id', articleId);

  if (error) {
    redirect(`/admin/craft/${articleId}/edit?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/craft');
  revalidatePath('/craft/[slug]', 'page');
  revalidatePath('/admin/craft');
  revalidatePath('/');
  redirect('/admin/craft?saved=updated');
}

export async function deleteArticle(formData: FormData) {
  const { supabase } = await requireAdmin();
  const articleId = formData.get('article_id') as string;
  if (!articleId) redirect('/admin/craft');

  const { error } = await supabase.from('craft_articles').delete().eq('id', articleId);
  if (error) {
    redirect(`/admin/craft/${articleId}/edit?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/craft');
  revalidatePath('/admin/craft');
  revalidatePath('/');
  redirect('/admin/craft?saved=deleted');
}
