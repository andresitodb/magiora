import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return new Response('Forbidden', { status: 403 });

  const { data: signups } = await supabase
    .from('newsletter_signups')
    .select('email, created_at, source, unsubscribed_at')
    .order('created_at', { ascending: false });

  const escape = (v: string | null | undefined) => {
    if (!v) return '';
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const lines = ['email,signed_up_at,source,unsubscribed_at'];
  for (const s of signups ?? []) {
    lines.push(
      [escape(s.email), escape(s.created_at), escape(s.source), escape(s.unsubscribed_at)].join(',')
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="magiora-newsletter-${today}.csv"`,
    },
  });
}
