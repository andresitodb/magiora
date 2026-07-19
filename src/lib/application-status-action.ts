'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sendEmail, applicationStatusEmail } from '@/lib/email';

const VALID_STATUSES = ['submitted', 'viewed', 'shortlisted', 'rejected', 'cast'];

export async function updateApplicationStatus(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const applicationId = formData.get('application_id') as string;
  const newStatus = formData.get('new_status') as string;

  if (!VALID_STATUSES.includes(newStatus)) {
    redirect('/dashboard?error=invalid_status');
  }

  // Verify the user owns the casting call this application is for
  const { data: app } = await supabase
    .from('applications')
    .select(
      `id, applicant_id, status,
       casting_call:casting_calls (id, project_title, role_name, posted_by)`
    )
    .eq('id', applicationId)
    .single();

  if (!app) redirect('/dashboard');

  const call = app.casting_call as any;
  if (!call || call.posted_by !== user.id) {
    redirect('/dashboard?error=forbidden');
  }

  // Update status
  const update: any = { status: newStatus };
  if (newStatus === 'viewed' && app.status === 'submitted') {
    update.viewed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('applications')
    .update(update)
    .eq('id', applicationId);

  if (error) {
    redirect(`/dashboard/casting-calls/${call.id}?error=${encodeURIComponent(error.message)}`);
  }

  // Trigger email + in-app notification for actor (skip on 'viewed' to avoid spam)
  if (newStatus !== 'viewed' && newStatus !== 'submitted') {
    const service = createServiceClient();
    const { data: actor } = await service
      .from('profiles')
      .select('display_name, contact_email')
      .eq('id', app.applicant_id)
      .single();

    if (actor?.contact_email) {
      const { subject, html } = applicationStatusEmail(
        actor.display_name,
        call.project_title,
        call.role_name,
        newStatus,
        call.id
      );
      sendEmail({
        to: actor.contact_email,
        template: 'application_status',
        subject,
        html,
        relatedId: applicationId,
      }).catch((err) => console.error('[email] application_status failed:', err));
    }

    await service.from('notifications').insert({
      recipient_id: app.applicant_id,
      type: 'application_status_changed',
      payload: {
        title: `Application: ${newStatus}`,
        body: `${call.project_title} — ${call.role_name}`,
        related_id: applicationId,
      },
    });
  }

  revalidatePath(`/dashboard/casting-calls/${call.id}`);
  revalidatePath('/dashboard/applications');
}
