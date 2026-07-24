import { createAnonClient } from '@/lib/supabase/anon';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import DirectoryFilters from '@/components/DirectoryFilters';
import { getLanguageName, LANGUAGES } from '@/lib/languages';
import {
  DIRECTORY_PAGE_SIZE,
  DIRECTORY_RANDOM_POOL_SIZE,
  projectCountLabel,
  seededSubset,
  shouldRandomizeDirectory,
  stringSeed,
} from '@/lib/designPolish';

const PAGE_SIZE = DIRECTORY_PAGE_SIZE;

type DirectoryProfile = {
  id: string;
  display_name: string;
  slug: string;
  role_category: string | null;
  role_titles: string[] | null;
  custom_role_label: string | null;
  location_city: string | null;
  location_state: string | null;
  headshot_url: string | null;
  languages: string[] | null;
  verified: boolean;
};

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: 'actor', label: 'Actors' },
  { value: 'director', label: 'Directors' },
  { value: 'cinematographer', label: 'Cinematographers' },
  { value: 'producer', label: 'Producers' },
  { value: 'editor', label: 'Editors' },
  { value: 'writer', label: 'Writers' },
  { value: 'sound', label: 'Sound' },
  { value: 'production_designer', label: 'Production Designers' },
  { value: 'makeup_hair', label: 'Makeup & Hair' },
  { value: 'costume', label: 'Costume' },
  { value: 'crew_other', label: 'Other crew' },
];

export const dynamic = 'force-dynamic';

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    city?: string;
    lang?: string;
    q?: string;
    verified?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = createAnonClient();
  const requestedPage = Number.parseInt(params.page ?? '1', 10);
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const hasFilters = Boolean(
    params.role || params.city || params.lang || params.q || params.verified === '1'
  );
  const randomizeDefault = shouldRandomizeDirectory({
    hasFilters,
    hasExplicitSort: params.sort !== undefined,
    page: currentPage,
  });

  let query = supabase
    .from('profiles')
    .select(
      'id, display_name, slug, role_category, role_titles, custom_role_label, location_city, location_state, headshot_url, bio, languages, verified, plan, featured_at',
      { count: 'exact' }
    )
    .eq('visible', true)
    .eq('approved', true);

  if (params.role && ROLE_FILTERS.find((r) => r.value === params.role)) {
    query = query.or(`role_category.eq.${params.role},role_categories.cs.{${params.role}}`);
  }
  if (params.city) {
    query = query.ilike('location_city', `%${params.city}%`);
  }
  if (params.lang) {
    // Tolerant matching: search by code AND name to handle either storage format
    const lang = LANGUAGES.find(
      (l) => l.code === params.lang || l.name.toLowerCase() === params.lang!.toLowerCase()
    );
    const aliases = lang ? [lang.code, lang.name] : [params.lang];
    // Use OR with array-contains for each alias
    const ors = aliases.map((a) => `languages.cs.{${a}}`).join(',');
    query = query.or(ors);
  }
  if (params.q) {
    query = query.ilike('display_name', `%${params.q}%`);
  }
  if (params.verified === '1') {
    query = query.eq('verified', true);
  }

  const sort = ['relevance', 'newest', 'verified', 'name'].includes(params.sort ?? '')
    ? params.sort!
    : 'relevance';
  if (randomizeDefault) {
    // PostgREST has no safe random order. Fetch a bounded RLS-protected pool,
    // then choose a per-request server-side subset; never shuffle in the client.
    query = query.order('id', { ascending: true });
  } else if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'name') {
    query = query.order('display_name', { ascending: true, nullsFirst: false });
  } else {
    query = query
      .order('verified', { ascending: false })
      .order('featured_at', { ascending: false, nullsFirst: false });
    if (sort === 'verified') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('display_name', { ascending: true, nullsFirst: false });
    }
  }
  const profilesPromise = randomizeDefault
    ? query.limit(DIRECTORY_RANDOM_POOL_SIZE)
    : query.range(from, to);

  // Fetch distinct cities for autocomplete
  const cityRowsPromise = supabase
    .from('profiles')
    .select('location_city')
    .eq('visible', true)
    .eq('approved', true)
    .not('location_city', 'is', null)
    .limit(1000);

  const [profilesResult, cityRowsResult] = await Promise.all([
    profilesPromise,
    cityRowsPromise,
  ]);
  const {
    data: profileRows,
    count: totalCount,
    error: profilesError,
    status: profilesStatus,
  } = profilesResult;
  const requestHeaders = randomizeDefault ? await headers() : null;
  const requestSeed = stringSeed(
    requestHeaders?.get('x-vercel-id') ??
      requestHeaders?.get('x-request-id') ??
      requestHeaders?.get('user-agent') ??
      'magiora-directory'
  );
  const profiles = randomizeDefault
    ? seededSubset(profileRows ?? [], PAGE_SIZE, requestSeed)
    : profileRows;
  const {
    data: cityRows,
    error: cityRowsError,
    status: cityRowsStatus,
  } = cityRowsResult;

  if (profilesError || cityRowsError) {
    console.error('[directory] Supabase query failed', {
      profiles: profilesError
        ? {
            message: profilesError.message,
            code: profilesError.code,
            details: profilesError.details,
            status: profilesStatus,
          }
        : null,
      cities: cityRowsError
        ? {
            message: cityRowsError.message,
            code: cityRowsError.code,
            details: cityRowsError.details,
            status: cityRowsStatus,
          }
        : null,
    });
  }

  const projectCountByProfile = new Map<string, number>();
  let projectCountsAvailable = false;
  const profileIds = (profiles ?? []).map((profile) => profile.id);
  if (!profilesError && profileIds.length > 0) {
    const { data: creditProjects, error: creditProjectsError } = await supabase
      .from('project_credits')
      .select('profile_id, project_id, project:projects!inner(id, visible)')
      .in('profile_id', profileIds)
      .eq('project.visible', true);

    if (creditProjectsError) {
      console.error('[directory] Project counts unavailable', {
        message: creditProjectsError.message,
        code: creditProjectsError.code,
        details: creditProjectsError.details,
      });
    } else {
      projectCountsAvailable = true;
      const seenProjects = new Map<string, Set<string>>();
      for (const row of creditProjects ?? []) {
        const projects = seenProjects.get(row.profile_id) ?? new Set<string>();
        projects.add(row.project_id);
        seenProjects.set(row.profile_id, projects);
      }
      for (const [profileId, projects] of seenProjects) {
        projectCountByProfile.set(profileId, projects.size);
      }
    }
  }

  const knownCities = Array.from(
    new Set(
      (cityRows ?? [])
        .map((row) => row.location_city)
        .filter((city): city is string => Boolean(city))
    )
  ).sort((a, b) => a.localeCompare(b));

  const resultCount = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(resultCount / PAGE_SIZE));
  const pageHref = (page: number) => {
    const next = new URLSearchParams();
    if (params.role) next.set('role', params.role);
    if (params.city) next.set('city', params.city);
    if (params.lang) next.set('lang', params.lang);
    if (params.q) next.set('q', params.q);
    if (params.verified === '1') next.set('verified', '1');
    if (sort !== 'relevance') next.set('sort', sort);
    if (page > 1) next.set('page', String(page));
    const suffix = next.toString();
    return suffix ? `/directory?${suffix}` : '/directory';
  };
  if (resultCount > 0 && currentPage > totalPages) {
    redirect(pageHref(totalPages));
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="k-container k-section">
        <div className="mb-2">
          <p className="k-eyebrow mb-2">Browse the community</p>
          <h1 className="k-page-title">Directory</h1>
        </div>
        <p className="k-body-muted text-base md:text-lg mb-10 max-w-2xl">
          Directors, actors, cinematographers, and crew making indie cinema.
        </p>

        <DirectoryFilters
          roleFilters={ROLE_FILTERS}
          knownCities={knownCities}
          currentRole={params.role ?? ''}
          currentCity={params.city ?? ''}
          currentLang={params.lang ?? ''}
          currentQuery={params.q ?? ''}
          currentVerified={params.verified === '1'}
          currentSort={sort}
        />

        {cityRowsError && !profilesError && (
          <div
            role="status"
            className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            City suggestions are temporarily unavailable. You can still type a city to filter the directory.
          </div>
        )}

        {profilesError ? (
          <div
            role="alert"
            className="text-center py-16 border-t border-stone-200 mt-10"
          >
            <p className="font-serif text-lg text-stone-800">
              We couldn&apos;t load the directory.
            </p>
            <p className="font-serif italic text-stone-500 mt-2">
              Please try again in a moment.
            </p>
            <Link
              href={pageHref(currentPage)}
              className="inline-block mt-4 text-sm text-[#712B13] italic font-serif hover:underline"
            >
              Try again →
            </Link>
          </div>
        ) : !profiles || profiles.length === 0 ? (
          <div className="k-empty mt-10">
            <p className="font-serif italic text-stone-500">
              No artists match those filters yet.
            </p>
            <Link
              href="/directory"
              className="inline-block mt-3 text-sm text-[#712B13] italic font-serif hover:underline"
            >
              Clear filters →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
            {(profiles as DirectoryProfile[]).map((p) => {
              const roleTitle =
                (p.role_titles ?? [])[0] ??
                (p.role_category === 'crew_other'
                  ? p.custom_role_label
                  : p.role_category?.replace('_', ' '));

              return (
                <Link
                  key={p.slug}
                  href={`/m/${p.slug}`}
                  className="k-card k-card-interactive block group"
                >
                  <div className="aspect-[4/5] bg-[#FAECE7]">
                    {p.headshot_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.headshot_url}
                        alt={p.display_name}
                        className="k-card-media"
                        style={{ objectPosition: '50% 25%' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#712B13] font-serif italic text-4xl">
                        {(p.display_name?.[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-serif italic text-xs text-[#993C1D] capitalize mb-1">
                      {roleTitle}
                    </p>
                    <p className="font-serif text-lg font-medium group-hover:text-[#712B13] transition-colors flex items-center gap-1.5">
                      {p.display_name}
                      {p.verified && (
                        <span
                          title="Verified"
                          className="inline-flex w-4 h-4 bg-[#712B13] text-white rounded-full text-[10px] items-center justify-center font-bold flex-shrink-0"
                        >
                          ✓
                        </span>
                      )}
                    </p>
                    {(p.location_city || p.location_state) && (
                      <p className="text-xs text-stone-500 italic font-serif mt-1">
                        {p.location_city}
                        {p.location_city && p.location_state && ', '}
                        {p.location_state}
                      </p>
                    )}
                    {p.languages && p.languages.length > 0 && (
                      <p className="text-xs text-stone-400 italic font-serif mt-2">
                        {p.languages.slice(0, 3).map(getLanguageName).join(' · ')}
                      </p>
                    )}
                    {projectCountLabel(
                      projectCountByProfile.get(p.id) ?? 0,
                      projectCountsAvailable
                    ) && (
                      <p className="text-xs text-stone-400 italic font-serif mt-2">
                        {projectCountLabel(
                          projectCountByProfile.get(p.id) ?? 0,
                          projectCountsAvailable
                        )}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {resultCount > 0 && totalPages > 1 && (
          <nav
            aria-label="Directory pages"
            className="mt-10 pt-6 border-t border-stone-200 flex items-center justify-between gap-4"
          >
            {currentPage > 1 ? (
              <Link
                href={pageHref(currentPage - 1)}
                className="text-sm text-[#712B13] italic font-serif hover:underline"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <p className="text-xs text-stone-500 italic font-serif">
              Page {Math.min(currentPage, totalPages)} of {totalPages}
            </p>
            {currentPage < totalPages ? (
              <Link
                href={pageHref(currentPage + 1)}
                className="text-sm text-[#712B13] italic font-serif hover:underline"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
