import { notFound } from 'next/navigation';
import CinematicShowcaseProfile, { getCinematicAvailablePages } from '@/components/CinematicShowcaseProfile';
import { getLanguageName } from '@/lib/languages';
import { resolveMemberEntitlement } from '@/lib/memberEntitlement';
import { getActiveProfileSkills, getActiveProfileVideos, type ProfileVideoLink } from '@/lib/profileMemberRetention';
import { aggregatePreviewProjects, type PreviewProject, type ProfilePreviewData } from '@/lib/profilePreview';
import { getAccent, getTemplate } from '@/lib/profile_themes';
import { isCinematicPage } from '@/lib/profileTemplateRegistry';
import { isMissingCinematicSettingsMigration, resolveProfileTemplateSettings, type StoredProfileTemplateSettings } from '@/lib/profileTemplateSettings';
import { getProfileEntity } from '@/lib/publicEntityLoaders';
import { createClient } from '@/lib/supabase/server';

export default async function CinematicProfileSubpage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  if (!isCinematicPage(page) || page === 'home') notFound();

  const supabase = await createClient();
  const { data: profile } = await getProfileEntity(slug);
  if (!profile) notFound();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;
  if ((!profile.visible || profile.approved !== true) && !isOwner) notFound();

  const isMember = resolveMemberEntitlement({ plan: profile.plan }).isMember;
  if (!isMember || getTemplate(profile.profile_theme).id !== 'cinematic') notFound();

  const [
    settingsResult,
    { data: ownedProjects },
    { data: credits },
  ] = await Promise.all([
    supabase.from('profile_template_settings')
      .select('template_id, palette_id, font_style, section_order, hidden_sections, navigation_order, home_section_order, reading_scale')
      .eq('profile_id', profile.id).eq('template_id', 'cinematic').maybeSingle(),
    page === 'portfolio' || page === 'credits'
      ? supabase.from('projects')
          .select('id, slug, title, tagline, poster_url, year, project_type, featured_at')
          .eq('owner_id', profile.id).eq('visible', true)
          .order('year', { ascending: false, nullsFirst: false }).limit(30)
      : Promise.resolve({ data: [] }),
    page === 'portfolio' || page === 'credits'
      ? supabase.from('project_credits')
          .select('role_title, project:projects(id, slug, title, tagline, poster_url, year, project_type, featured_at, visible)')
          .eq('profile_id', profile.id)
      : Promise.resolve({ data: [] }),
  ]);
  let settings: StoredProfileTemplateSettings = settingsResult.data;
  if (isMissingCinematicSettingsMigration(settingsResult.error)) {
    const fallback = await supabase.from('profile_template_settings')
      .select('template_id, palette_id, font_style, section_order, hidden_sections')
      .eq('profile_id', profile.id).eq('template_id', 'cinematic').maybeSingle();
    settings = fallback.data;
  }

  const creditedProjects = (credits ?? []).flatMap((credit) => {
    const relation = Array.isArray(credit.project) ? credit.project[0] : credit.project;
    if (!relation || relation.visible === false) return [];
    return [{ ...relation, creditRole: credit.role_title }] as PreviewProject[];
  });
  const projects = aggregatePreviewProjects([
    ...((ownedProjects ?? []) as PreviewProject[]),
    ...creditedProjects,
  ]);
  const videoLinks = getActiveProfileVideos(
    (profile.video_links ?? []) as ProfileVideoLink[],
    true,
  ) as { label: string; url: string }[];
  const data: ProfilePreviewData = {
    headshotUrl: profile.headshot_url,
    displayName: profile.display_name ?? '',
    roles: profile.role_titles ?? [],
    city: profile.location_city ?? '',
    state: profile.location_state ?? '',
    bio: profile.bio ?? '',
    languages: profile.languages?.map(getLanguageName) ?? [],
    skills: getActiveProfileSkills(profile.skills ?? [], true),
    demoReelUrl: profile.demo_reel_url ?? '',
    gallery: profile.gallery ?? [],
    experience: profile.experience ?? [],
    projects,
    recommendations: [],
    socialLinks: profile.social_links ?? {},
    equipment: profile.equipment ?? [],
    contactEmail: profile.contact_email ?? '',
    websiteUrl: profile.website_url ?? '',
    phone: profile.phone ?? '',
    country: profile.location_country ?? '',
    videoLinks,
    representation: profile.representation ?? {},
  };
  if (!getCinematicAvailablePages(data).includes(page)) notFound();
  const resolved = resolveProfileTemplateSettings({
    saved: settings,
    legacyTemplate: 'cinematic',
    legacyAccent: profile.profile_accent,
  });

  return <CinematicShowcaseProfile data={data} accent={getAccent(resolved.paletteId)} settings={resolved} slug={slug} page={page} />;
}
