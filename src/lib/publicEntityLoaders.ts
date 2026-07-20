import { cache } from 'react';
import { createAnonClient } from '@/lib/supabase/anon';
import { createClient } from '@/lib/supabase/server';

export const getProfileEntity = cache(async (slug: string) => {
  const supabase = await createClient();
  return supabase.from('profiles').select('*').eq('slug', slug).maybeSingle();
});

export const getSpotlightEntity = cache(async (slug: string) => {
  const supabase = createAnonClient();
  return supabase
    .from('interviews')
    .select(
      `*, subject:profiles!interviews_subject_profile_id_fkey (
        id, display_name, slug, headshot_url, bio, role_category, custom_role_label,
        location_city, location_state, demo_reel_url
      )`
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
});

export const getProjectEntity = cache(async (slug: string) => {
  const supabase = await createClient();
  return supabase
    .from('projects')
    .select(
      `*, owner:profiles!projects_owner_id_fkey(id, slug, display_name, headshot_url, role_titles, verified)`
    )
    .eq('slug', slug)
    .maybeSingle();
});

export const getCastingEntity = cache(async (id: string) => {
  const supabase = await createClient();
  return supabase
    .from('casting_calls')
    .select(
      '*, poster:profiles!casting_calls_posted_by_fkey(display_name, slug, headshot_url)'
    )
    .eq('id', id)
    .maybeSingle();
});

export const getEventEntity = cache(async (id: string) => {
  const supabase = createAnonClient();
  return supabase
    .from('events')
    .select(
      `*, posted_by_profile:profiles!events_posted_by_fkey ( id, display_name, slug, headshot_url )`
    )
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();
});
