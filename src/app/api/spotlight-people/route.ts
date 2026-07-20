import { createAnonClient } from '@/lib/supabase/anon';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return Response.json({ people: [] });

  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('interviews')
    .select(
      'subject:profiles!inner(id, slug, display_name, role_titles, role_category, headshot_url)'
    )
    .eq('status', 'published')
    .ilike('subject.display_name', `%${q}%`)
    .limit(20);

  if (error) {
    console.error('[spotlight-people] Suggestion query failed', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    return Response.json({ people: [] });
  }

  const unique = new Map<string, {
    id: string;
    slug: string;
    display_name: string;
    role: string | null;
    headshot_url: string | null;
  }>();
  for (const row of data ?? []) {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    if (!subject || unique.has(subject.id)) continue;
    unique.set(subject.id, {
      id: subject.id,
      slug: subject.slug,
      display_name: subject.display_name,
      role:
        subject.role_titles?.[0] ??
        subject.role_category?.replace('_', ' ') ??
        null,
      headshot_url: subject.headshot_url,
    });
    if (unique.size === 5) break;
  }

  return Response.json({ people: Array.from(unique.values()) });
}
