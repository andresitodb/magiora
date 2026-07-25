import { redirect } from 'next/navigation';
import ProfileTemplatePreviewPage from '@/components/ProfileTemplatePreviewPage';
import { createClient } from '@/lib/supabase/server';
import { aggregatePreviewProjects, type ProfilePreviewData, type PreviewProject } from '@/lib/profilePreview';
import {
  getAccent,
  getTemplate,
} from '@/lib/profile_themes';
import { getLanguageName } from '@/lib/languages';
import { resolveProfileTemplateSettings } from '@/lib/profileTemplateSettings';
import { hasMemberEntitlement } from '@/lib/memberEntitlementServer';

export const metadata = {
  title: 'Profile Preview',
  robots: { index: false, follow: false },
};

export default async function ProfilePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; accent?: string }>;
}) {
  const requested = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: ownedProjects },
    { data: linkedCredits },
    { data: screenTemplateSettings },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('projects')
      .select('slug, title, tagline, poster_url, year')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('project_credits')
      .select('role_title, project:projects(slug, title, tagline, poster_url, year)')
      .eq('profile_id', user.id),
    supabase
      .from('profile_template_settings')
      .select('template_id, palette_id, font_style, section_order, hidden_sections')
      .eq('profile_id', user.id)
      .eq('template_id', 'editorial')
      .maybeSingle(),
  ]);
  if (!profile) redirect('/dashboard/profile');

  const creditedProjects = (linkedCredits ?? []).flatMap((credit) => {
    const relation = Array.isArray(credit.project) ? credit.project[0] : credit.project;
    return relation ? [{ ...(relation as PreviewProject), creditRole: credit.role_title }] : [];
  });
  const projects = aggregatePreviewProjects([
    ...(ownedProjects ?? []),
    ...creditedProjects,
  ]).slice(0, 6);

  const data: ProfilePreviewData = {
    headshotUrl: profile.headshot_url,
    displayName: profile.display_name ?? '',
    roles: profile.role_titles ?? [],
    city: profile.location_city ?? '',
    state: profile.location_state ?? '',
    bio: profile.bio ?? '',
    languages: profile.languages?.map(getLanguageName) ?? [],
    skills: profile.skills ?? [],
    demoReelUrl: profile.demo_reel_url ?? '',
    gallery: profile.gallery ?? [],
    experience: profile.experience ?? [],
    projects,
    recommendations: profile.recommendations ?? [],
    socialLinks: profile.social_links ?? {},
    equipment: profile.equipment ?? [],
    contactEmail: profile.contact_email ?? '',
    websiteUrl: profile.website_url ?? '',
  };
  const resolvedSettings = resolveProfileTemplateSettings({
    local: {
      ...(requested.template ? { templateId: getTemplate(requested.template).id } : {}),
      ...(requested.accent ? { paletteId: getAccent(requested.accent).id } : {}),
    },
    saved: screenTemplateSettings,
    legacyTemplate: profile.profile_theme,
    legacyAccent: profile.profile_accent,
  });
  const isMember = await hasMemberEntitlement(user.id);

  return (
    <ProfileTemplatePreviewPage
      initialTemplate={resolvedSettings.templateId}
      initialAccent={resolvedSettings.paletteId}
      initialData={data}
      initialSettings={screenTemplateSettings}
      isMember={isMember}
    />
  );
}
