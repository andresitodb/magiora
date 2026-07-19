'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { castingApplicationIssue } from '@/lib/castingEligibility';

export async function postCastingCall(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();
  if (profile?.plan !== 'member') {
    redirect('/dashboard?error=members_only');
  }

  const action = formData.get('submit_action') as string;
  const status = action === 'submit' ? 'pending_review' : 'draft';

  const targetLanguages = ((formData.get('target_languages') as string) || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const insertData: Record<string, unknown> = {
    posted_by: user.id,
    status,
    project_title: formData.get('project_title') as string,
    project_type: formData.get('project_type') as string,
    project_status: formData.get('project_status') as string,
    project_description: formData.get('project_description') as string,
    role_name: formData.get('role_name') as string,
    role_size: formData.get('role_size') as string,
    role_description: formData.get('role_description') as string,
    shoot_start_date: (formData.get('shoot_start_date') as string) || null,
    shoot_end_date: (formData.get('shoot_end_date') as string) || null,
    location_city: (formData.get('location_city') as string) || null,
    compensation: (formData.get('compensation') as string) || null,
    union_status: formData.get('union_status') as string,
    target_role_category: formData.get('target_role_category') as string,
    target_gender: formData.get('target_gender') as string,
    target_age_min: formData.get('target_age_min')
      ? parseInt(formData.get('target_age_min') as string)
      : null,
    target_age_max: formData.get('target_age_max')
      ? parseInt(formData.get('target_age_max') as string)
      : null,
    target_languages: targetLanguages,
    target_skills: [],
    additional_requirements:
      (formData.get('additional_requirements') as string) || null,
    application_deadline: formData.get('application_deadline') as string,
  };

  const { data, error } = await supabase
    .from('casting_calls')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    redirect(
      `/dashboard/casting-calls/new?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath('/dashboard');
  revalidatePath('/casting-calls');
  redirect(
    action === 'submit'
      ? `/dashboard/casting-calls?submitted=${data!.id}`
      : `/dashboard/casting-calls?draft=${data!.id}`
  );
}

export async function applyCastingCall(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const callId = formData.get('casting_call_id') as string;
  const errorRedirect = (message: string) =>
    `/casting-calls/${encodeURIComponent(callId)}?error=${encodeURIComponent(message)}`;

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/casting-calls/${callId}`)}`);
  }
  if (!callId) {
    redirect('/casting-calls?error=invalid_call');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const { data: call } = await supabase
    .from('casting_calls')
    .select('id, status, posted_by, application_deadline')
    .eq('id', callId)
    .maybeSingle();

  if (!call) {
    redirect('/casting-calls?error=call_not_found');
  }
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('casting_call_id', callId)
    .eq('applicant_id', user.id)
    .maybeSingle();
  const eligibilityIssue = castingApplicationIssue({
    isMember: profile?.plan === 'member',
    status: call.status,
    isOwner: call.posted_by === user.id,
    applicationDeadline: call.application_deadline,
    alreadyApplied: Boolean(existingApplication),
  });
  if (eligibilityIssue) {
    redirect(errorRedirect(eligibilityIssue));
  }

  const { error } = await supabase.from('applications').insert({
    casting_call_id: callId,
    applicant_id: user.id,
    cover_note: (formData.get('cover_note') as string) || null,
    self_tape_url: (formData.get('self_tape_url') as string) || null,
    availability_confirmed: formData.get('availability_confirmed') === 'on',
  });

  if (error) {
    const message =
      error.code === '23505'
        ? 'You have already applied to this casting call.'
        : error.message;
    redirect(errorRedirect(message));
  }

  redirect(`/casting-calls/${callId}?applied=true`);
}
