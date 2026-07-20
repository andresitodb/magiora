import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const searchTerm = query.replace(/[,%()]/g, ' ').trim();
  const type = request.nextUrl.searchParams.get('type');
  if (searchTerm.length < 2 || !['profile', 'project'].includes(type ?? '')) {
    return NextResponse.json({ results: [] });
  }

  if (type === 'profile') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, slug, role_titles, role_category, headshot_url')
      .eq('visible', true)
      .eq('approved', true)
      .is('featured_at', null)
      .or(`display_name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)
      .order('display_name', { ascending: true })
      .limit(8);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      results: (data ?? []).map((item) => ({
        id: item.id,
        title: item.display_name ?? item.slug,
        subtitle: item.role_titles?.[0] ?? item.role_category,
        image: item.headshot_url,
      })),
    });
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, title, project_type, year, poster_url')
    .eq('visible', true)
    .is('featured_at', null)
    .ilike('title', `%${searchTerm}%`)
    .order('title', { ascending: true })
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    results: (data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: [item.project_type?.replaceAll('_', ' '), item.year]
        .filter(Boolean)
        .join(' · '),
      image: item.poster_url,
    })),
  });
}
