import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();

  if (body.all === true) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .is('read_at', null);
  } else if (body.id) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('recipient_id', user.id);
  }

  return Response.json({ ok: true });
}
