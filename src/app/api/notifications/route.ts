import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ notifications: [], unreadCount: 0 });

  const { data: rows } = await supabase
    .from('notifications')
    .select('id, type, payload, read_at, created_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .is('read_at', null);

  // Normalize: flatten payload fields into top-level for the client
  const notifications = (rows ?? []).map((r: any) => ({
    id: r.id,
    type: r.type,
    title: r.payload?.title ?? defaultTitle(r.type),
    body: r.payload?.body ?? null,
    related_id:
      r.payload?.related_id ??
      r.payload?.call_id ??
      r.payload?.interview_id ??
      r.payload?.event_id ??
      r.payload?.application_id ??
      r.payload?.story_id ??
      null,
    read_at: r.read_at,
    created_at: r.created_at,
  }));

  return Response.json({
    notifications,
    unreadCount: unreadCount ?? 0,
  });
}

function defaultTitle(type: string): string {
  switch (type) {
    case 'casting_call_match':
      return 'New casting call match';
    case 'interview_invited':
      return 'You were invited for an interview';
    case 'application_status_changed':
      return 'Application update';
    case 'event_reminder':
      return 'Upcoming event';
    case 'story_published':
      return 'Your story was published';
    default:
      return 'Notification';
  }
}
