'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { castingApplicationIssue } from '@/lib/castingEligibility';
import { hasPaidMembership } from '@/lib/billingServer';

function isHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function postCastingCall(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!(await hasPaidMembership(user.id))) {
    redirect('/dashboard?error=members_only');
  }

  const action = formData.get('submit_action') as string;
  const status = action === 'submit' ? 'pending_review' : 'draft';
  const projectTitle = String(formData.get('project_title') ?? '').trim();
  const roleName = String(formData.get('role_name') ?? '').trim();
  const applicationDeadline = String(
    formData.get('application_deadline') ?? ''
  );
  const shootStartDate = String(formData.get('shoot_start_date') ?? '');
  const shootEndDate = String(formData.get('shoot_end_date') ?? '');
  const targetAgeMin = formData.get('target_age_min')
    ? Number.parseInt(String(formData.get('target_age_min')), 10)
    : null;
  const targetAgeMax = formData.get('target_age_max')
    ? Number.parseInt(String(formData.get('target_age_max')), 10)
    : null;

  const formError = (message: string) =>
    `/dashboard/casting-calls/new?error=${encodeURIComponent(message)}`;

  if (!projectTitle || !roleName || !applicationDeadline) {
    redirect(formError('Project title, role name, and application deadline are required.'));
  }
  if (shootStartDate && shootEndDate && shootEndDate < shootStartDate) {
    redirect(formError('Shoot end date cannot be before the start date.'));
  }
  if (
    targetAgeMin !== null &&
    targetAgeMax !== null &&
    targetAgeMax < targetAgeMin
  ) {
    redirect(formError('Maximum age cannot be lower than minimum age.'));
  }

  const targetLanguages = ((formData.get('target_languages') as string) || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const insertData: Record<string, unknown> = {
    posted_by: user.id,
    status,
    project_title: projectTitle,
    project_type: formData.get('project_type') as string,
    project_status: formData.get('project_status') as string,
    project_description: formData.get('project_description') as string,
    role_name: roleName,
    role_size: formData.get('role_size') as string,
    role_description: formData.get('role_description') as string,
    shoot_start_date: shootStartDate || null,
    shoot_end_date: shootEndDate || null,
    location_city: (formData.get('location_city') as string) || null,
    compensation: (formData.get('compensation') as string) || null,
    union_status: formData.get('union_status') as string,
    target_role_category: formData.get('target_role_category') as string,
    target_gender: formData.get('target_gender') as string,
    target_age_min: targetAgeMin,
    target_age_max: targetAgeMax,
    target_languages: targetLanguages,
    target_skills: [],
    additional_requirements:
      (formData.get('additional_requirements') as string) || null,
    application_deadline: applicationDeadline,
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
  const workspaceContext = formData.get('workspace_context') === '1';
  const workspaceSuffix = workspaceContext ? '&workspace=1' : '';
  const errorRedirect = (message: string) =>
    `/casting-calls/${encodeURIComponent(callId)}?error=${encodeURIComponent(message)}${workspaceSuffix}`;

  if (!user) {
    const nextPath = `/casting-calls/${callId}${workspaceContext ? '?workspace=1' : ''}`;
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!callId) {
    redirect(workspaceContext ? '/dashboard/casting/browse?error=invalid_call' : '/casting-calls?error=invalid_call');
  }

  const { data: call } = await supabase
    .from('casting_calls')
    .select('id, status, posted_by, application_deadline')
    .eq('id', callId)
    .maybeSingle();

  if (!call) {
    redirect(workspaceContext ? '/dashboard/casting/browse?error=call_not_found' : '/casting-calls?error=call_not_found');
  }
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('casting_call_id', callId)
    .eq('applicant_id', user.id)
    .maybeSingle();
  const eligibilityIssue = castingApplicationIssue({
    isMember: await hasPaidMembership(user.id),
    status: call.status,
    isOwner: call.posted_by === user.id,
    applicationDeadline: call.application_deadline,
    alreadyApplied: Boolean(existingApplication),
  });
  if (eligibilityIssue) {
    redirect(errorRedirect(eligibilityIssue));
  }

  const selfTapeUrl = String(formData.get('self_tape_url') ?? '').trim();
  if (!isHttpUrl(selfTapeUrl)) {
    redirect(errorRedirect('Self-tape URL must start with http:// or https://.'));
  }

  const { error } = await supabase.from('applications').insert({
    casting_call_id: callId,
    applicant_id: user.id,
    cover_note: (formData.get('cover_note') as string) || null,
    self_tape_url: selfTapeUrl || null,
    availability_confirmed: formData.get('availability_confirmed') === 'on',
  });

  if (error) {
    const message =
      error.code === '23505'
        ? 'You have already applied to this casting call.'
        : error.message;
    redirect(errorRedirect(message));
  }

  redirect(`/casting-calls/${callId}?applied=true${workspaceSuffix}`);
}

export async function closeCastingCall(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const callId = String(formData.get('casting_call_id') ?? '');
  if (!callId) redirect('/dashboard/casting-calls?error=invalid_call');

  const { data: call } = await supabase
    .from('casting_calls')
    .select('posted_by, status')
    .eq('id', callId)
    .maybeSingle();

  if (!call || call.posted_by !== user.id) {
    redirect('/dashboard/casting-calls?error=not_allowed');
  }
  if (call.status !== 'open') {
    redirect(`/dashboard/casting-calls/${callId}?error=Only+open+calls+can+be+closed`);
  }

  const { error } = await supabase
    .from('casting_calls')
    .update({ status: 'closed' })
    .eq('id', callId)
    .eq('posted_by', user.id)
    .eq('status', 'open');

  if (error) {
    redirect(
      `/dashboard/casting-calls/${callId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath('/casting-calls');
  revalidatePath(`/casting-calls/${callId}`);
  revalidatePath('/dashboard/casting-calls');
  revalidatePath(`/dashboard/casting-calls/${callId}`);
  redirect(`/dashboard/casting-calls/${callId}?closed=1`);
}
