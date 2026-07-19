import { createAnonClient } from '@/lib/supabase/anon';
import Link from 'next/link';

export default async function FeaturedThisWeek() {
  const supabase = createAnonClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select(
      'display_name, slug, role_category, role_titles, custom_role_label, location_city, location_state, headshot_url, bio, verified, featured_at'
    )
    .eq('approved', true)
    .eq('visible', true)
    .not('featured_at', 'is', null)
    .order('featured_at', { ascending: false })
    .limit(3);

  if (!profiles || profiles.length === 0) return null;

  return (
    <section className="py-12 md:py-16 border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-8 md:mb-10 text-center md:text-left">
          <p className="font-serif italic text-sm text-[#993C1D] mb-2">Featured this week</p>
          <h2 className="font-serif text-3xl md:text-4xl font-medium">Voices to know</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
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
                className="block group"
              >
                <div className="aspect-[4/5] bg-[#FAECE7] overflow-hidden rounded-md mb-4">
                  {p.headshot_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.headshot_url}
                      alt={p.display_name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      style={{ objectPosition: '50% 25%' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#712B13] font-serif italic text-5xl">
                      {(p.display_name?.[0] ?? '?').toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="font-serif italic text-xs text-[#993C1D] capitalize mb-1">
                  {roleTitle}
                </p>
                <p className="font-serif text-xl font-medium group-hover:text-[#712B13] transition-colors flex items-center gap-2">
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
                {p.bio && (
                  <p className="text-sm text-stone-600 italic font-serif mt-3 line-clamp-3">
                    {p.bio}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
