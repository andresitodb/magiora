import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PublicProfileTabs from '@/components/PublicProfileTabs';
import VerifiedBadge from '@/components/VerifiedBadge';
import CinematicHero from '@/components/CinematicHero';
import PortraitHero from '@/components/PortraitHero';
import MinimalistHero from '@/components/MinimalistHero';
import VideoEmbed from '@/components/VideoEmbed';
import SocialLinksList from '@/components/SocialLinksList';
import ProfileProjectsList from '@/components/ProfileProjectsList';
import Link from 'next/link';
import { getLanguageName } from '@/lib/languages';
import { getAccent, getTemplate, type Accent } from '@/lib/profile_themes';
import { applyPublicBrand } from '@/lib/publicBrand';
import type { Metadata } from 'next';
import { entityMetadata, metadataText, unavailableMetadata } from '@/lib/metadata';
import { getProfileEntity } from '@/lib/publicEntityLoaders';

const FREE_GALLERY_DISPLAY_LIMIT = 3;

type RelatedProfile = {
  id: string;
  slug: string;
  display_name: string;
  role_category: string | null;
  role_titles: string[] | null;
  custom_role_label: string | null;
  location_city: string | null;
  headshot_url: string | null;
  verified: boolean;
  featured_at: string | null;
};

function tieBreakValue(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

// Sort experience by year DESC for display
type ExperienceItem = {
  year?: string;
  title?: string;
  role?: string;
  project?: string;
  link?: string;
};

type Recommendation = {
  quote?: string;
  from_name?: string;
  from_role?: string;
};

type EquipmentItem = {
  category?: string;
  items?: string;
};

type Representation = {
  agency?: string;
  manager?: string;
  agent?: string;
  email?: string;
  phone?: string;
  website?: string;
};

function sortByYearDesc(items: ExperienceItem[]): ExperienceItem[] {
  return [...items].sort((a, b) => {
    const ay = parseInt(a.year ?? '');
    const by = parseInt(b.year ?? '');
    const aValid = !isNaN(ay);
    const bValid = !isNaN(by);
    if (!aValid && !bValid) return 0;
    if (!aValid) return 1;
    if (!bValid) return -1;
    return by - ay;
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: profile, error } = await getProfileEntity(slug);
  const pathname = `/m/${encodeURIComponent(slug)}`;

  if (error || !profile || profile.visible !== true || profile.approved !== true) {
    return unavailableMetadata(pathname);
  }

  const role =
    profile.role_titles?.[0] ??
    profile.custom_role_label ??
    profile.role_category?.replace(/_/g, ' ');
  const location = [profile.location_city, profile.location_state]
    .filter(Boolean)
    .join(', ');
  const roleLocation = [role, location].filter(Boolean).join(' in ');
  const description = metadataText(
    profile.bio || roleLocation,
    'Professional profile on Magiora.'
  );

  return entityMetadata({
    title: profile.display_name || profile.slug || 'Magiora',
    description,
    pathname,
    image: profile.headshot_url,
    type: 'profile',
  });
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: profile } = await getProfileEntity(slug);

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  if ((!profile.visible || profile.approved !== true) && !isOwner) notFound();

  const isMember = profile.plan === 'member';
  const roleTitles: string[] = profile.role_titles ?? [];
  const primaryTitle =
    roleTitles[0] ??
    (profile.role_category === 'crew_other'
      ? profile.custom_role_label
      : profile.role_category?.replace('_', ' '));

  const template = getTemplate(isMember ? profile.profile_theme : 'editorial');
  const accent = getAccent(isMember ? profile.profile_accent : 'coral');

  const [
    { data: stories },
    { data: relatedCandidates },
    { count: projectCount },
    { count: creditCount },
    { data: profileCreditProjects },
  ] = await Promise.all([
    supabase
      .from('interviews')
      .select('id, slug, title, intro, hero_image_url, published_at')
      .eq('subject_profile_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase
      .from('profiles')
      .select(
        'id, slug, display_name, role_category, role_titles, custom_role_label, location_city, headshot_url, verified, featured_at'
      )
      .eq('visible', true)
      .eq('approved', true)
      .neq('id', profile.id)
      .limit(100),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', profile.id)
      .eq('visible', true),
    supabase
      .from('project_credits')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile.id),
    supabase
      .from('project_credits')
      .select('project_id')
      .eq('profile_id', profile.id),
  ]);

  const profileProjectIds = Array.from(
    new Set((profileCreditProjects ?? []).map((credit) => credit.project_id))
  );
  const candidateIds = ((relatedCandidates ?? []) as RelatedProfile[]).map(
    (candidate) => candidate.id
  );
  const sharedProjectCounts = new Map<string, number>();
  if (profileProjectIds.length > 0 && candidateIds.length > 0) {
    const { data: sharedCredits, error: sharedCreditsError } = await supabase
      .from('project_credits')
      .select('profile_id, project_id')
      .in('profile_id', candidateIds)
      .in('project_id', profileProjectIds);

    if (sharedCreditsError) {
      console.error('[profile] Shared-project ranking unavailable', {
        profileId: profile.id,
        message: sharedCreditsError.message,
        code: sharedCreditsError.code,
      });
    } else {
      const sharedByProfile = new Map<string, Set<string>>();
      for (const credit of sharedCredits ?? []) {
        const projects = sharedByProfile.get(credit.profile_id) ?? new Set<string>();
        projects.add(credit.project_id);
        sharedByProfile.set(credit.profile_id, projects);
      }
      for (const [profileId, projects] of sharedByProfile) {
        sharedProjectCounts.set(profileId, projects.size);
      }
    }
  }

  const complementaryRoles: Record<string, string[]> = {
    director: ['producer', 'cinematographer', 'writer', 'editor'],
    producer: ['director', 'writer', 'cinematographer'],
    cinematographer: ['director', 'production_designer', 'editor'],
    writer: ['director', 'producer'],
    editor: ['director', 'cinematographer', 'sound'],
    actor: ['director', 'producer', 'writer'],
    sound: ['director', 'editor'],
    production_designer: ['director', 'cinematographer', 'costume'],
    costume: ['production_designer', 'makeup_hair'],
    makeup_hair: ['costume', 'production_designer'],
  };
  const relatedProfiles = ((relatedCandidates ?? []) as RelatedProfile[])
    .map((candidate) => ({
      candidate,
      tieBreak: tieBreakValue(`${profile.id}:${candidate.id}`),
    }))
    .sort((a, b) => {
      const aSharedProjects = sharedProjectCounts.get(a.candidate.id) ?? 0;
      const bSharedProjects = sharedProjectCounts.get(b.candidate.id) ?? 0;
      if (aSharedProjects !== bSharedProjects) {
        return bSharedProjects - aSharedProjects;
      }

      const aSameRole =
        Boolean(profile.role_category) &&
        a.candidate.role_category === profile.role_category;
      const bSameRole =
        Boolean(profile.role_category) &&
        b.candidate.role_category === profile.role_category;
      if (aSameRole !== bSameRole) return aSameRole ? -1 : 1;

      const profileCity = profile.location_city?.trim().toLowerCase();
      const aSameCity =
        Boolean(profileCity) &&
        a.candidate.location_city?.trim().toLowerCase() === profileCity;
      const bSameCity =
        Boolean(profileCity) &&
        b.candidate.location_city?.trim().toLowerCase() === profileCity;
      if (aSameCity !== bSameCity) return aSameCity ? -1 : 1;

      const complements = complementaryRoles[profile.role_category] ?? [];
      const aComplementary = complements.includes(a.candidate.role_category ?? '');
      const bComplementary = complements.includes(b.candidate.role_category ?? '');
      if (aComplementary !== bComplementary) return aComplementary ? -1 : 1;

      if (a.candidate.verified !== b.candidate.verified) {
        return a.candidate.verified ? -1 : 1;
      }
      const aFeatured = Boolean(a.candidate.featured_at);
      const bFeatured = Boolean(b.candidate.featured_at);
      if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;
      return a.tieBreak - b.tieBreak;
    })
    .slice(0, 4)
    .map(({ candidate }) => candidate);

  const videoLinks: { label: string; url: string }[] = profile.video_links ?? [];
  const experience: ExperienceItem[] = sortByYearDesc(profile.experience ?? []);
  const recommendations: Recommendation[] = profile.recommendations ?? [];
  const equipment: EquipmentItem[] = profile.equipment ?? [];
  const physical = profile.physical_details ?? {};
  const social: Record<string, string> = profile.social_links ?? {};
  const rep: Representation = profile.representation ?? {};

  let gallery: string[] = profile.gallery ?? [];
  if (!isMember) gallery = gallery.slice(0, FREE_GALLERY_DISPLAY_LIMIT);

  const hasAnyVideo = !!profile.demo_reel_url || videoLinks.length > 0;

  return (
    <div style={{ backgroundColor: accent.bg, color: accent.text }} className="min-h-screen">
      <header className="border-b" style={{ borderColor: accent.border }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          {isOwner ? (
            <Link
              href="/dashboard"
              className="font-serif italic text-sm hover:opacity-80"
              style={{ color: accent.textMuted }}
            >
              ← Back to your dashboard
            </Link>
          ) : (
            <Link
              href="/"
              className="font-serif italic text-sm hover:opacity-80"
              style={{ color: accent.textMuted }}
            >
              ← Magiora
            </Link>
          )}
          <Link
            href="/"
            className="font-serif text-sm italic hover:opacity-80"
            style={{ color: accent.textMuted }}
          >
            Magiora
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {isOwner && (!profile.visible || profile.approved !== true) && (
          <div
            className="border rounded-md p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-sm"
            style={{ backgroundColor: '#fef3c7', borderColor: '#fcd34d', color: '#78350f' }}
          >
            <div>
              <p className="font-serif font-medium">Preview — your profile is not publicly listed</p>
              <p className="text-xs italic font-serif mt-1">
                Only you can see this page until the profile is public and approved.
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="font-serif italic text-sm hover:underline whitespace-nowrap"
            >
              Edit profile →
            </Link>
          </div>
        )}

        {template.id === 'cinematic' && (
          <CinematicHero profile={profile} primaryTitle={primaryTitle} roleTitles={roleTitles} accent={accent} />
        )}
        {(template.id === 'portrait' || template.id === 'stage') && (
          <PortraitHero profile={profile} primaryTitle={primaryTitle} roleTitles={roleTitles} accent={accent} />
        )}
        {(template.id === 'minimalist' || template.id === 'studio') && (
          <MinimalistHero profile={profile} primaryTitle={primaryTitle} roleTitles={roleTitles} accent={accent} />
        )}
        {template.id === 'editorial' && (
          <div className="mb-6">
            <p
              className="font-serif italic text-sm mb-1 capitalize"
              style={{ color: accent.accent }}
            >
              {primaryTitle}
              {roleTitles.length > 1 && (
                <span style={{ color: accent.textMuted }}>
                  {' · '}
                  {roleTitles.slice(1).join(' · ')}
                </span>
              )}
            </p>
            <h1
              className="font-serif text-4xl md:text-5xl font-medium flex items-center gap-3"
              style={{ color: accent.text }}
            >
              {profile.display_name}
              {profile.verified && <VerifiedBadge size="lg" />}
            </h1>
          </div>
        )}

        {!isOwner && (profile.contact_email || profile.website_url) && (
          <div className="mb-8">
            <a
              href={
                profile.contact_email
                  ? `mailto:${profile.contact_email}`
                  : profile.website_url
              }
              target={profile.contact_email ? undefined : '_blank'}
              rel={profile.contact_email ? undefined : 'noopener noreferrer'}
              className="k-button font-serif hover:opacity-85"
              style={{ backgroundColor: accent.accent, color: accent.card }}
            >
              {profile.contact_email
                ? `Contact ${profile.display_name}`
                : 'Visit professional website ↗'}
            </a>
          </div>
        )}

        <section
          aria-label="Profile statistics"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          <ProfileStat
            accent={accent}
            label="Projects"
            value={String(projectCount ?? 0)}
          />
          <ProfileStat
            accent={accent}
            label="Credits"
            value={String(creditCount ?? 0)}
          />
          <ProfileStat
            accent={accent}
            label="Member since"
            value={
              profile.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'
            }
          />
          <div
            className="rounded-md border px-4 py-3"
            style={{ backgroundColor: accent.card, borderColor: accent.border }}
          >
            <p className="font-serif italic text-xs mb-1" style={{ color: accent.textMuted }}>
              Status
            </p>
            {profile.verified ? (
              <VerifiedBadge size="md" showLabel />
            ) : (
              <p className="font-serif font-medium" style={{ color: accent.text }}>
                Professional
              </p>
            )}
          </div>
        </section>

        <PublicProfileTabs
          accent={accent}
          about={
            <div className="space-y-8 md:space-y-10">
              {template.id === 'editorial' ? (
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 md:gap-10 items-start">
                  <div
                    className="aspect-[4/5] rounded-md overflow-hidden mx-auto md:mx-0 max-w-[280px] w-full"
                    style={{ backgroundColor: accent.accentSoft }}
                  >
                    {profile.headshot_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={profile.headshot_url}
                        alt={profile.display_name}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: '50% 25%' }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-serif italic"
                        style={{ color: accent.accent }}
                      >
                        No headshot
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    {(profile.location_city || profile.location_state) && (
                      <p
                        className="font-serif italic text-base"
                        style={{ color: accent.textMuted }}
                      >
                        {profile.location_city}
                        {profile.location_city && profile.location_state && ', '}
                        {profile.location_state}
                      </p>
                    )}
                    {profile.bio && (
                      <div
                        className="font-serif text-base md:text-lg leading-relaxed whitespace-pre-line"
                        style={{ color: accent.text }}
                      >
                        {profile.bio}
                      </div>
                    )}
                    {profile.languages?.length > 0 && (
                      <p className="font-serif text-sm italic" style={{ color: accent.textMuted }}>
                        {profile.languages.map(getLanguageName).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                profile.bio && (
                  <div
                    className="font-serif text-base md:text-lg leading-relaxed max-w-2xl mx-auto md:mx-0 whitespace-pre-line"
                    style={{ color: accent.text }}
                  >
                    {profile.bio}
                  </div>
                )
              )}

              {hasAnyVideo && (
                <div className="pt-6 border-t" style={{ borderColor: accent.border }}>
                  <p className="font-serif italic text-sm mb-4" style={{ color: accent.accent }}>
                    Work
                  </p>
                  <div className="space-y-6">
                    {profile.demo_reel_url && (
                      <VideoEmbed url={profile.demo_reel_url} label="Demo reel" accent={accent} />
                    )}
                    {videoLinks.map((link, i) => (
                      <VideoEmbed
                        key={i}
                        url={link.url}
                        label={link.label || `Video ${i + 1}`}
                        accent={accent}
                      />
                    ))}
                  </div>
                </div>
              )}

              {profile.skills?.length > 0 && (
                <div className="pt-6 border-t" style={{ borderColor: accent.border }}>
                  <p className="font-serif italic text-sm mb-3" style={{ color: accent.accent }}>Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s: string) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-full text-xs font-serif border"
                        style={{ backgroundColor: accent.card, borderColor: accent.border, color: accent.text }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.role_category === 'actor' && (Object.keys(physical).length > 0 || profile.age_range_min) && (
                <div className="pt-6 border-t" style={{ borderColor: accent.border }}>
                  <p className="font-serif italic text-sm mb-3" style={{ color: accent.accent }}>Physical</p>
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-serif">
                    {profile.age_range_min && (
                      <Detail accent={accent} label="Plays age" value={`${profile.age_range_min}–${profile.age_range_max}`} />
                    )}
                    {profile.gender && <Detail accent={accent} label="Gender" value={profile.gender} />}
                    {physical.height_ft && (
                      <Detail accent={accent} label="Height" value={`${physical.height_ft}'${physical.height_in ?? 0}"`} />
                    )}
                    {physical.weight_lb && <Detail accent={accent} label="Weight" value={`${physical.weight_lb} lb`} />}
                    {physical.hair_color && <Detail accent={accent} label="Hair" value={physical.hair_color} />}
                    {physical.eye_color && <Detail accent={accent} label="Eyes" value={physical.eye_color} />}
                  </dl>
                </div>
              )}

              {equipment.length > 0 && (
                <div className="pt-6 border-t" style={{ borderColor: accent.border }}>
                  <p className="font-serif italic text-sm mb-3" style={{ color: accent.accent }}>Equipment</p>
                  <dl className="space-y-3">
                    {equipment.map((e, i) => (
                      <div key={i}>
                        <dt className="font-serif italic text-xs" style={{ color: accent.textMuted }}>{e.category}</dt>
                        <dd className="font-serif text-sm" style={{ color: accent.text }}>{e.items}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {stories && stories.length > 0 && (
                <div className="pt-6 border-t" style={{ borderColor: accent.border }}>
                  <p className="font-serif italic text-sm mb-3" style={{ color: accent.accent }}>Spotlight</p>
                  <div className="space-y-4">
                    {stories.map((story) => (
                      <Link key={story.id} href={`/stories/${story.slug}`} className="block group">
                        <h3
                          className="font-serif text-xl font-medium group-hover:opacity-80 transition-opacity"
                          style={{ color: accent.text }}
                        >
                          {applyPublicBrand(story.title)}
                        </h3>
                        {story.intro && (
                          <p className="text-sm line-clamp-2 mt-1 font-serif italic" style={{ color: accent.textMuted }}>
                            {applyPublicBrand(story.intro)}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <ProfileProjectsList profileId={profile.id} accent={accent} />
            </div>
          }
          photos={
            gallery.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map((url: string, i: number) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt="" className="w-full aspect-[4/5] object-cover rounded-md" />
                ))}
              </div>
            ) : (
              <p className="font-serif italic text-center py-12" style={{ color: accent.textMuted }}>
                No photos in the gallery yet.
              </p>
            )
          }
          experience={
            <div className="space-y-10">
              {experience.length > 0 ? (
                <div>
                  <p className="font-serif italic text-sm mb-4" style={{ color: accent.accent }}>Credits</p>
                  <div className="space-y-4">
                    {experience.map((e, i) => (
                      <div key={i} className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 pb-4 border-b last:border-0" style={{ borderColor: accent.border }}>
                        <p className="font-serif" style={{ color: accent.textMuted }}>{e.year}</p>
                        <div>
                          <p className="font-serif font-medium" style={{ color: accent.text }}>
                            {e.title}
                            {e.role && <span style={{ color: accent.textMuted }}> — {e.role}</span>}
                          </p>
                          {e.project && <p className="font-serif italic text-sm" style={{ color: accent.textMuted }}>{e.project}</p>}
                          {e.link && (
                            <a href={e.link} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline mt-1 inline-block" style={{ color: accent.accent }}>
                              View ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="font-serif italic" style={{ color: accent.textMuted }}>No credits listed yet.</p>
              )}

              {recommendations.length > 0 && (
                <div>
                  <p className="font-serif italic text-sm mb-4" style={{ color: accent.accent }}>Recommendations</p>
                  <div className="space-y-6">
                    {recommendations.map((r, i) => (
                      <blockquote key={i} className="border-l-4 pl-6" style={{ borderColor: accent.accent }}>
                        <p className="font-serif italic text-base md:text-lg leading-relaxed" style={{ color: accent.text }}>
                          &ldquo;{r.quote}&rdquo;
                        </p>
                        <footer className="font-serif text-sm mt-2" style={{ color: accent.textMuted }}>
                          — {r.from_name}
                          {r.from_role && <span className="italic">, {r.from_role}</span>}
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}
            </div>
          }
          contact={
            <div className="space-y-8">
              {profile.contact_email && (
                <div>
                  <p className="font-serif italic text-sm mb-2" style={{ color: accent.accent }}>Email</p>
                  <a href={`mailto:${profile.contact_email}`} className="font-serif text-base md:text-lg hover:underline break-all" style={{ color: accent.accent }}>
                    {profile.contact_email}
                  </a>
                </div>
              )}

              {profile.phone && (
                <div>
                  <p className="font-serif italic text-sm mb-2" style={{ color: accent.accent }}>Phone</p>
                  <a href={`tel:${profile.phone.replace(/[^+\d]/g, '')}`} className="font-serif text-base md:text-lg hover:underline" style={{ color: accent.accent }}>
                    {profile.phone}
                  </a>
                </div>
              )}

              {profile.website_url && (
                <div>
                  <p className="font-serif italic text-sm mb-2" style={{ color: accent.accent }}>Website</p>
                  <a href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`} target="_blank" rel="noopener noreferrer" className="font-serif text-base md:text-lg hover:underline break-all" style={{ color: accent.accent }}>
                    {profile.website_url} ↗
                  </a>
                </div>
              )}

              {Object.entries(social).filter(([, v]) => v && (v as string).trim()).length > 0 && (
                <div>
                  <p className="font-serif italic text-sm mb-3" style={{ color: accent.accent }}>Social</p>
                  <SocialLinksList social={social} accent={accent} />
                </div>
              )}

              {(rep.agency || rep.manager || rep.agent || rep.email || rep.phone || rep.website) && (
                <div>
                  <p className="font-serif italic text-sm mb-3" style={{ color: accent.accent }}>Representation</p>
                  <dl className="space-y-2 font-serif text-sm">
                    {rep.agency && <Detail accent={accent} label="Agency" value={rep.agency} />}
                    {rep.manager && <Detail accent={accent} label="Manager" value={rep.manager} />}
                    {rep.agent && <Detail accent={accent} label="Agent" value={rep.agent} />}
                  </dl>
                  {(rep.email || rep.phone || rep.website) && (
                    <ul className="space-y-1 font-serif text-sm mt-3">
                      {rep.email && (
                        <li>
                          <span className="italic" style={{ color: accent.textMuted }}>Email: </span>
                          <a href={`mailto:${rep.email}`} className="hover:underline" style={{ color: accent.accent }}>
                            {rep.email}
                          </a>
                        </li>
                      )}
                      {rep.phone && (
                        <li>
                          <span className="italic" style={{ color: accent.textMuted }}>Phone: </span>
                          <a href={`tel:${rep.phone.replace(/[^+\d]/g, '')}`} className="hover:underline" style={{ color: accent.accent }}>
                            {rep.phone}
                          </a>
                        </li>
                      )}
                      {rep.website && (
                        <li>
                          <span className="italic" style={{ color: accent.textMuted }}>Web: </span>
                          <a href={rep.website.startsWith('http') ? rep.website : `https://${rep.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline break-all" style={{ color: accent.accent }}>
                            {rep.website} ↗
                          </a>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              {!profile.contact_email && !profile.phone && !profile.website_url &&
                Object.values(social).filter((v) => v && (v as string).trim()).length === 0 &&
                !rep.agency && !rep.email && (
                  <p className="font-serif italic text-center py-12" style={{ color: accent.textMuted }}>
                    No contact info added yet.
                  </p>
                )}
            </div>
          }
        />

        {relatedProfiles.length > 0 && (
          <section
            className="mt-12 pt-8 border-t"
            style={{ borderColor: accent.border }}
          >
            <p className="font-serif italic text-sm mb-2" style={{ color: accent.accent }}>
              Keep exploring
            </p>
            <h2 className="k-section-title mb-6">
              Related Professionals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProfiles.map((related) => {
                const relatedRole =
                  related.role_titles?.[0] ??
                  (related.role_category === 'crew_other'
                    ? related.custom_role_label
                    : related.role_category?.replace('_', ' '));

                return (
                  <Link
                    key={related.id}
                    href={`/m/${related.slug}`}
                    className="group block rounded-md border overflow-hidden"
                    style={{ backgroundColor: accent.card, borderColor: accent.border }}
                  >
                    <div
                      className="aspect-[4/5] overflow-hidden"
                      style={{ backgroundColor: accent.accentSoft }}
                    >
                      {related.headshot_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={related.headshot_url}
                          alt={related.display_name}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                          style={{ objectPosition: '50% 25%' }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-serif italic text-3xl"
                          style={{ color: accent.accent }}
                        >
                          {(related.display_name?.[0] ?? '?').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p
                        className="font-serif italic text-xs capitalize mb-1"
                        style={{ color: accent.accent }}
                      >
                        {relatedRole}
                      </p>
                      <p className="font-serif font-medium flex items-center gap-1.5">
                        <span className="group-hover:opacity-80 transition-opacity">
                          {related.display_name}
                        </span>
                        {related.verified && <VerifiedBadge size="sm" />}
                      </p>
                      {related.location_city && (
                        <p
                          className="font-serif italic text-xs mt-1"
                          style={{ color: accent.textMuted }}
                        >
                          {related.location_city}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t py-8 mt-12" style={{ borderColor: accent.border }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <Link href="/" className="font-serif text-sm italic hover:opacity-80" style={{ color: accent.textMuted }}>
            Profile hosted on Magiora
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Detail({ accent, label, value }: { accent: Accent; label: string; value: string }) {
  return (
    <>
      <dt className="italic" style={{ color: accent.textMuted }}>{label}</dt>
      <dd style={{ color: accent.text }}>{value}</dd>
    </>
  );
}

function ProfileStat({
  accent,
  label,
  value,
}: {
  accent: ReturnType<typeof getAccent>;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-md border px-4 py-3"
      style={{ backgroundColor: accent.card, borderColor: accent.border }}
    >
      <p className="font-serif italic text-xs mb-1" style={{ color: accent.textMuted }}>
        {label}
      </p>
      <p className="font-serif text-lg font-medium" style={{ color: accent.text }}>
        {value}
      </p>
    </div>
  );
}
