import { createAnonClient } from '@/lib/supabase/anon';

export const dynamic = 'force-dynamic';

interface SearchResult {
  kind: 'profile' | 'casting_call' | 'event' | 'story';
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  thumbnail: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return Response.json({ results: [] });
  }

  const supabase = createAnonClient();
  const pattern = `%${q}%`;
  const results: SearchResult[] = [];

  // 1. Profiles (by name)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('slug, display_name, role_category, role_titles, custom_role_label, location_city, headshot_url')
    .eq('visible', true)
    .eq('approved', true)
    .ilike('display_name', pattern)
    .limit(5);

  for (const p of profiles ?? []) {
    const roleTitle =
      (p.role_titles ?? [])[0] ??
      (p.role_category === 'crew_other'
        ? p.custom_role_label
        : p.role_category?.replace('_', ' '));
    results.push({
      kind: 'profile',
      id: p.slug,
      title: p.display_name,
      subtitle: [roleTitle, p.location_city].filter(Boolean).join(' · '),
      href: `/m/${p.slug}`,
      thumbnail: p.headshot_url,
    });
  }

  // 2. Casting calls (by title or role name)
  const { data: calls } = await supabase
    .from('casting_calls')
    .select('id, project_title, role_name, project_type, location_city')
    .eq('status', 'open')
    .or(`project_title.ilike.${pattern},role_name.ilike.${pattern}`)
    .limit(5);

  for (const c of calls ?? []) {
    results.push({
      kind: 'casting_call',
      id: c.id,
      title: c.project_title,
      subtitle: [c.role_name, c.project_type?.replace('_', ' '), c.location_city]
        .filter(Boolean)
        .join(' · '),
      href: `/casting-calls/${c.id}`,
      thumbnail: null,
    });
  }

  // 3. Events
  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date, location_name, cover_image_url')
    .eq('status', 'published')
    .gte('event_date', new Date().toISOString())
    .ilike('title', pattern)
    .limit(5);

  for (const e of events ?? []) {
    const date = new Date(e.event_date);
    results.push({
      kind: 'event',
      id: e.id,
      title: e.title,
      subtitle: [
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        e.location_name,
      ]
        .filter(Boolean)
        .join(' · '),
      href: `/events/${e.id}`,
      thumbnail: e.cover_image_url,
    });
  }

  // 4. Stories
  const { data: stories } = await supabase
    .from('interviews')
    .select('id, slug, title, hero_image_url, subject:profiles!interviews_subject_profile_id_fkey(display_name)')
    .eq('status', 'published')
    .ilike('title', pattern)
    .limit(5);

  for (const s of stories ?? []) {
    results.push({
      kind: 'story',
      id: s.slug ?? s.id,
      title: s.title ?? 'Untitled',
      subtitle: (s.subject as any)?.display_name ? `On ${(s.subject as any).display_name}` : null,
      href: `/stories/${s.slug}`,
      thumbnail: s.hero_image_url,
    });
  }

  return Response.json({ results });
}
