'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

async function authedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

async function ownsInterview(supabase: SupabaseClient, interviewId: string, userId: string) {
  const { data } = await supabase
    .from('interviews')
    .select('id, subject_profile_id, status')
    .eq('id', interviewId)
    .maybeSingle();
  if (!data) return null;
  if (data.subject_profile_id !== userId) return null;
  if (!['in_progress', 'pending_review'].includes(data.status)) return null;
  return data;
}

function parseQa(formData: FormData) {
  try {
    const raw = formData.get('qa') as string | null;
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveInterviewAnswers(formData: FormData) {
  const { supabase, user } = await authedUser();
  const interviewId = formData.get('interview_id') as string;
  const intro = (formData.get('intro') as string) || null;
  const qa = parseQa(formData);

  const valid = await ownsInterview(supabase, interviewId, user.id);
  if (!valid) {
    redirect('/dashboard/stories');
  }

  const { error } = await supabase
    .from('interviews')
    .update({ qa, intro })
    .eq('id', interviewId);

  if (error) {
    redirect(
      `/dashboard/stories/${interviewId}/answer?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/dashboard/stories/${interviewId}/answer`);
  redirect(`/dashboard/stories/${interviewId}/answer?saved=1`);
}

export async function submitInterviewForReview(formData: FormData) {
  const { supabase, user } = await authedUser();
  const interviewId = formData.get('interview_id') as string;
  const intro = (formData.get('intro') as string) || null;
  const qa = parseQa(formData);

  const valid = await ownsInterview(supabase, interviewId, user.id);
  if (!valid) {
    redirect('/dashboard/stories');
  }

  // Save answers AND move to pending_review
  const { error } = await supabase
    .from('interviews')
    .update({ qa, intro, status: 'pending_review' })
    .eq('id', interviewId);

  if (error) {
    redirect(
      `/dashboard/stories/${interviewId}/answer?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/dashboard/stories/${interviewId}/answer`);
  revalidatePath('/admin/stories');
  redirect(`/dashboard/stories/${interviewId}/answer?submitted=1`);
}
