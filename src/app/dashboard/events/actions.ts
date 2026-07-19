'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function postEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();
  if (profile?.plan !== 'member') redirect('/dashboard?error=members_only');

  const action = formData.get('submit_action') as string;
  const status = action === 'submit' ? 'pending_review' : 'draft';

  const eventDateStr = formData.get('event_date') as string;
  const eventTime = (formData.get('event_time') as string) || '19:00';
  const endDateStr = formData.get('end_date') as string | null;
  const endTime = formData.get('end_time') as string | null;

  const insertData: any = {
    posted_by: user.id,
    status,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    event_date: `${eventDateStr}T${eventTime}:00`,
    end_date:
      endDateStr && endTime ? `${endDateStr}T${endTime}:00` : null,
    location_name: (formData.get('location_name') as string) || null,
    location_address: (formData.get('location_address') as string) || null,
    online_link: (formData.get('online_link') as string) || null,
    cover_image_url: (formData.get('cover_image_url') as string) || null,
    price_public: formData.get('price_public') ? parseFloat(formData.get('price_public') as string) : 0,
    price_member: formData.get('price_member') ? parseFloat(formData.get('price_member') as string) : null,
    rsvp_required: formData.get('rsvp_required') === 'on',
    max_capacity: formData.get('max_capacity') ? parseInt(formData.get('max_capacity') as string) : null,
  };

  const { data, error } = await supabase
    .from('events')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    redirect(`/dashboard/events/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/dashboard/events');
  revalidatePath('/events');
  redirect(`/dashboard/events?submitted=${data!.id}`);
}

export async function rsvpToEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const eventId = formData.get('event_id') as string;
  const { error } = await supabase.from('event_rsvps').upsert({
    event_id: eventId,
    member_id: user.id,
    status: 'going',
  });

  if (error) redirect(`/events/${eventId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/events/${eventId}?rsvped=true`);
}
