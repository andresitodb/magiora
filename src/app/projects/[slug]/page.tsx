import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Nav from '@/components/Nav';
import VideoEmbed from '@/components/VideoEmbed';
import ProjectGalleryCarousel from '@/components/ProjectGalleryCarousel';
import Link from 'next/link';
import {
  getProjectTypeLabel,
  getProjectStatusLabel,
  getProjectStatusColor,
} from '@/lib/projects';
import { getAccent } from '@/lib/profile_themes';

type CreditProfile = {
  id: string;
  slug: string;
  display_name: string;
  headshot_url: string | null;
  verified: boolean;
};

type ProjectCredit = {
  id: string;
  role_title: string;
  role_category: string | null;
  character_name: string | null;
  external_name: string | null;
  position: number | null;
  profile: CreditProfile | CreditProfile[] | null;
};

type RelatedProject = {
  id: string;
  slug: string;
  title: string;
  project_type: string | null;
  status: string | null;
  year: number | null;
  poster_url: string | null;
  location_city: string | null;
  location_state: string | null;
  created_at: string;
};

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select(
      `*, owner:profiles!projects_owner_id_fkey(id, slug, display_name, headshot_url, role_titles, verified)`
    )
    .eq('slug', slug)
    .maybeSingle();

  if (!project) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === project.owner_id;

  if (!project.visible && !isOwner) notFound();

  const { data: credits, error: creditsError } = await supabase
    .from('project_credits')
    .select(
      `id, role_title, role_category, character_name, external_name, position,
       profile:profiles(id, slug, display_name, headshot_url, verified)`
    )
    .eq('project_id', project.id)
    .order('position', { ascending: true });

  if (creditsError) {
    console.error('[project] Credits unavailable', {
      projectId: project.id,
      message: creditsError.message,
      code: creditsError.code,
      details: creditsError.details,
    });
  }

  const creditsByRole = new Map<string, ProjectCredit[]>();
  for (const credit of (credits ?? []) as ProjectCredit[]) {
    const role = credit.role_title?.trim() || 'Other';
    const group = creditsByRole.get(role) ?? [];
    group.push(credit);
    creditsByRole.set(role, group);
  }
  const accent = getAccent('coral');
  const links: Record<string, string> = project.links ?? {};
  const linkEntries = Object.entries(links).filter(
    ([key, value]) => key.trim() && value?.trim()
  );
  const gallery: string[] = project.gallery ?? [];
  const linkedProfileIds = ((credits ?? []) as ProjectCredit[])
    .map((credit) => {
      const linked = Array.isArray(credit.profile)
        ? credit.profile[0]
        : credit.profile;
      return linked?.id;
    })
    .filter((id): id is string => Boolean(id));

  const relatedFromCreditsQuery = linkedProfileIds.length
    ? supabase
        .from('project_credits')
        .select(
          `profile_id, project:projects!inner(id, slug, title, project_type, status, year, poster_url, location_city, location_state, created_at, visible)`
        )
        .in('profile_id', linkedProfileIds)
        .neq('project_id', project.id)
        .eq('project.visible', true)
        .limit(100)
    : Promise.resolve({ data: [], error: null });

  const [{ data: relatedCreditRows, error: relatedCreditsError }, { data: fallbackProjects, error: fallbackError }] =
    await Promise.all([
      relatedFromCreditsQuery,
      supabase
        .from('projects')
        .select('id, slug, title, project_type, status, year, poster_url, location_city, location_state, created_at')
        .eq('visible', true)
        .neq('id', project.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

  if (relatedCreditsError || fallbackError) {
    console.error('[project] Related projects partially unavailable', {
      projectId: project.id,
      credits: relatedCreditsError?.message ?? null,
      fallback: fallbackError?.message ?? null,
    });
  }

  const relatedScores = new Map<string, { project: RelatedProject; sharedPeople: number }>();
  for (const row of relatedCreditRows ?? []) {
    const relation = row.project;
    const candidate = (Array.isArray(relation) ? relation[0] : relation) as
      | (RelatedProject & { visible?: boolean })
      | undefined;
    if (!candidate) continue;
    const current = relatedScores.get(candidate.id);
    relatedScores.set(candidate.id, {
      project: candidate,
      sharedPeople: (current?.sharedPeople ?? 0) + 1,
    });
  }
  for (const candidate of (fallbackProjects ?? []) as RelatedProject[]) {
    if (!relatedScores.has(candidate.id)) {
      relatedScores.set(candidate.id, { project: candidate, sharedPeople: 0 });
    }
  }
  const relatedProjects = Array.from(relatedScores.values())
    .sort((a, b) => {
      if (a.sharedPeople !== b.sharedPeople) return b.sharedPeople - a.sharedPeople;
      const aType = a.project.project_type === project.project_type;
      const bType = b.project.project_type === project.project_type;
      if (aType !== bType) return aType ? -1 : 1;
      const city = project.location_city?.trim().toLowerCase();
      const aCity = Boolean(city) && a.project.location_city?.trim().toLowerCase() === city;
      const bCity = Boolean(city) && b.project.location_city?.trim().toLowerCase() === city;
      if (aCity !== bCity) return aCity ? -1 : 1;
      const aStatus = a.project.status === project.status;
      const bStatus = b.project.status === project.status;
      if (aStatus !== bStatus) return aStatus ? -1 : 1;
      return new Date(b.project.created_at).getTime() - new Date(a.project.created_at).getTime();
    })
    .slice(0, 4)
    .map(({ project: candidate }) => candidate);

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="k-container k-section max-w-5xl">
        {isOwner && !project.visible && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-4 mb-6 flex items-start justify-between gap-3">
            <p className="font-serif italic text-sm">
              Preview — this project is hidden. Only you can see it.
            </p>
            <Link
              href={`/dashboard/projects/${project.id}/edit`}
              className="text-sm italic font-serif hover:underline whitespace-nowrap"
            >
              Edit →
            </Link>
          </div>
        )}

        {/* HERO */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 md:gap-10 mb-10">
          <div className="aspect-[3/4] rounded-md overflow-hidden bg-[#FAECE7] max-w-[280px] w-full mx-auto md:mx-0">
            {project.poster_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={project.poster_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#712B13] font-serif italic text-2xl text-center px-4">
                {project.title}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="font-serif italic text-sm text-[#993C1D] capitalize">
              {getProjectTypeLabel(project.project_type)}
              {project.year && <span className="text-stone-500"> · {project.year}</span>}
            </p>
            <h1 className="k-page-title">
              {project.title}
            </h1>
            {project.tagline && (
              <p className="font-serif italic text-lg md:text-xl text-stone-600 mt-1">
                {project.tagline}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {project.status && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-serif ${getProjectStatusColor(project.status)}`}>
                  {getProjectStatusLabel(project.status)}
                </span>
              )}
              {(project.location_city || project.location_state) && (
                <span className="text-xs italic font-serif text-stone-500">
                  📍 {project.location_city}
                  {project.location_city && project.location_state && ', '}
                  {project.location_state}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TRAILER */}
        {project.trailer_url && (
          <section className="mb-10 max-w-3xl mx-auto">
            <p className="font-serif italic text-sm text-[#993C1D] mb-3">Trailer</p>
            <VideoEmbed url={project.trailer_url} accent={accent} />
          </section>
        )}

        {/* GALLERY CAROUSEL */}
        {gallery.length > 0 && (
          <section className="mb-12">
            <p className="font-serif italic text-sm text-[#993C1D] mb-3">Gallery</p>
            <ProjectGalleryCarousel images={gallery} title={project.title} />
          </section>
        )}

        {/* DESCRIPTION */}
        {project.description && (
          <section className="mb-12 max-w-2xl">
            <p className="font-serif italic text-sm text-[#993C1D] mb-3">About</p>
            <div className="font-serif text-base md:text-lg leading-relaxed whitespace-pre-line text-stone-800">
              {project.description}
            </div>
          </section>
        )}

        {linkEntries.length > 0 && (
          <section className="mb-10">
            <a
              href={linkEntries[0][1]}
              target="_blank"
              rel="noopener noreferrer"
              className="k-button k-button-primary font-serif"
            >
              Visit {linkEntries[0][0]} ↗
            </a>
            {linkEntries.length > 1 && (
              <ul className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                {linkEntries.slice(1).map(([key, value]) => (
                  <li key={key}>
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm italic font-serif text-[#712B13] hover:underline capitalize"
                    >
                      {key} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {project.owner && (
          <section className="mb-12 pt-6 border-t border-stone-200">
            <p className="font-serif italic text-xs text-stone-500 mb-3">
              Project owner
            </p>
            <Link href={`/m/${project.owner.slug}`} className="inline-flex items-center gap-3 group">
              {project.owner.headshot_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={project.owner.headshot_url}
                  alt={project.owner.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="w-10 h-10 rounded-full bg-[#FAECE7] flex items-center justify-center text-[#712B13] font-serif">
                  {(project.owner.display_name?.[0] ?? '?').toUpperCase()}
                </span>
              )}
              <span className="font-serif font-medium group-hover:text-[#712B13]">
                {project.owner.display_name}
              </span>
            </Link>
          </section>
        )}

        {/* CREDITS */}
        {credits && credits.length > 0 && (
          <section className="mb-12">
            <p className="font-serif italic text-sm text-[#993C1D] mb-3">The team</p>
            <h2 className="k-section-title mb-6">Cast &amp; Crew</h2>

            <div className="space-y-10">
              {Array.from(creditsByRole.entries()).map(([role, items]) => (
                <div key={role}>
                  <h3 className="font-serif text-lg font-medium mb-4">
                    {role}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {items.map((credit) => (
                      <CreditCard key={credit.id} credit={credit} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedProjects.length > 0 && (
          <section className="mb-12 pt-8 border-t border-stone-200">
            <p className="font-serif italic text-sm text-[#993C1D] mb-2">
              Keep exploring
            </p>
            <h2 className="k-section-title mb-6">
              Related Projects
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProjects.map((candidate) => (
                <Link
                  key={candidate.id}
                  href={`/projects/${candidate.slug}`}
                  className="group block"
                >
                  <div className="aspect-[3/4] rounded-md overflow-hidden bg-[#FAECE7] mb-3">
                    {candidate.poster_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={candidate.poster_url}
                        alt={candidate.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center px-3 text-center font-serif italic text-[#712B13]">
                        {candidate.title}
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif font-medium group-hover:text-[#712B13] line-clamp-2">
                    {candidate.title}
                  </h3>
                  <p className="text-xs italic font-serif text-stone-500 mt-1">
                    {getProjectTypeLabel(candidate.project_type)}
                    {candidate.year && ` · ${candidate.year}`}
                  </p>
                  {candidate.status && (
                    <p className="text-xs italic font-serif text-stone-400 mt-1">
                      {getProjectStatusLabel(candidate.status)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-stone-200 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <Link href="/" className="font-serif text-sm italic text-stone-500 hover:opacity-80">
            Project hosted on Magiora
          </Link>
        </div>
      </footer>
    </div>
  );
}

function CreditCard({ credit }: { credit: ProjectCredit }) {
  const linked = Array.isArray(credit.profile)
    ? credit.profile[0]
    : credit.profile;
  const displayName =
    linked?.display_name ?? credit.external_name ?? 'Unnamed professional';
  const content = (
    <div className="flex items-center gap-3 group">
      {linked?.headshot_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={linked.headshot_url}
          alt={displayName}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          style={{ objectPosition: '50% 25%' }}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-[#FAECE7] flex items-center justify-center text-[#712B13] font-serif italic text-base flex-shrink-0">
          {(displayName?.[0] ?? '?').toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-serif font-medium leading-tight flex items-center gap-1.5">
          <span className={linked ? 'group-hover:text-[#712B13] transition-colors' : ''}>
            {displayName}
          </span>
          {linked?.verified && (
            <span className="inline-flex w-4 h-4 bg-[#712B13] text-white rounded-full text-[10px] items-center justify-center font-bold flex-shrink-0">
              ✓
            </span>
          )}
        </p>
        <p className="text-xs text-stone-500 italic font-serif">
          {credit.role_title}
          {credit.character_name && (
            <span className="text-stone-400"> as &ldquo;{credit.character_name}&rdquo;</span>
          )}
        </p>
      </div>
    </div>
  );

  if (linked) {
    return (
      <Link href={`/m/${linked.slug}`} className="block hover:opacity-90">
        {content}
      </Link>
    );
  }
  return <div>{content}</div>;
}
