import { createAnonClient } from '@/lib/supabase/anon';
import Nav from '@/components/Nav';
import Link from 'next/link';
import DirectoryFilters from '@/components/DirectoryFilters';
import { getLanguageName, LANGUAGES } from '@/lib/languages';

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
  }>;
}) {
  const params = await searchParams;
  const supabase = createAnonClient();

  let query = supabase
    .from('profiles')
    .select(
      'display_name, slug, role_category, role_titles, custom_role_label, location_city, location_state, headshot_url, bio, languages, verified, plan, featured_at'
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

  const { data: profiles } = await query
    .order('verified', { ascending: false })
    .order('featured_at', { ascending: false, nullsFirst: false })
    .order('display_name', { ascending: true })
    .limit(200);

  // Fetch distinct cities for autocomplete
  const { data: cityRows } = await supabase
    .from('profiles')
    .select('location_city')
    .eq('visible', true)
    .eq('approved', true)
    .not('location_city', 'is', null);

  const knownCities = Array.from(
    new Set((cityRows ?? []).map((r: any) => r.location_city as string).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const totalCount = profiles?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2 gap-2">
          <div>
            <p className="font-serif italic text-sm text-[#993C1D] mb-2">Browse the community</p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium">Directory</h1>
          </div>
          <p className="text-sm text-stone-500 italic font-serif">
            {totalCount} {totalCount === 1 ? 'artist' : 'artists'}
          </p>
        </div>
        <p className="font-serif italic text-base md:text-lg text-stone-600 mb-10 max-w-2xl">
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
        />

        {!profiles || profiles.length === 0 ? (
          <div className="text-center py-16 border-t border-stone-200 mt-10">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-10">
            {profiles.map((p: any) => {
              const roleTitle =
                (p.role_titles ?? [])[0] ??
                (p.role_category === 'crew_other'
                  ? p.custom_role_label
                  : p.role_category?.replace('_', ' '));

              return (
                <Link
                  key={p.slug}
                  href={`/m/${p.slug}`}
                  className="block group bg-white border border-stone-200 rounded-md overflow-hidden hover:border-[#712B13] transition-colors"
                >
                  <div className="aspect-[4/5] bg-[#FAECE7]">
                    {p.headshot_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.headshot_url}
                        alt={p.display_name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
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
                    {p.languages?.length > 0 && (
                      <p className="text-xs text-stone-400 italic font-serif mt-2">
                        {p.languages.slice(0, 3).map(getLanguageName).join(' · ')}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
