'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { hasMemberEntitlement as hasPaidMembership } from '@/lib/memberEntitlementServer';

export async function requestFeature(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  if (!(await hasPaidMembership(user.id))) {
    redirect('/pricing?reason=feature_request');
  }

  const requestNote = formData.get('request_note') as string;

  const { error } = await supabase.from('interviews').insert({
    subject_profile_id: user.id,
    status: 'requested',
    request_note: requestNote,
  });

  if (error) {
    redirect(`/dashboard/stories/request?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/dashboard');
  redirect('/dashboard/stories/request?submitted=true');
}

export async function updateInterview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) redirect('/dashboard');

  const id = formData.get('id') as string;
  const status = formData.get('status') as string;

  // Parse Q&A as JSON
  let qa: { question: string; answer: string }[] = [];
  try {
    qa = JSON.parse((formData.get('qa') as string) || '[]');
  } catch {
    qa = [];
  }

  const updates: {
    title: string | null;
    intro: string | null;
    hero_image_url: string | null;
    qa: { question: string; answer: string }[];
    status: string;
  } = {
    title: (formData.get('title') as string) || null,
    intro: (formData.get('intro') as string) || null,
    hero_image_url: (formData.get('hero_image_url') as string) || null,
    qa,
    status,
  };

  const { error } = await supabase.from('interviews').update(updates).eq('id', id);
  if (error) {
    redirect(`/admin/stories/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/stories');
  revalidatePath(`/admin/stories/${id}`);
  revalidatePath('/stories');
  revalidatePath('/stories/[slug]', 'page');
  revalidatePath('/');
  redirect(`/admin/stories/${id}?saved=true`);
}
