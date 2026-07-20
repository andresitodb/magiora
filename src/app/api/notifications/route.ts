import { createClient } from '@/lib/supabase/server';
import { normalizeNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ notifications: [], unreadCount: 0 });

  const [{ data: rows }, { count: unreadCount }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, type, payload, read_at, created_at')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null),
  ]);

  // Normalize: flatten payload fields into top-level for the client
  const notifications = (rows ?? []).map(normalizeNotification);

  return Response.json({
    notifications,
    unreadCount: unreadCount ?? 0,
  });
}
