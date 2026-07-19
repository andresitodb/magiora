import { createAnonClient } from '@/lib/supabase/anon';
import { getLocale } from '@/lib/i18n';
import Nav from '@/components/Nav';
import NewsletterSignup from '@/components/NewsletterSignup';
import VerifiedBadge from '@/components/VerifiedBadge';
import Link from 'next/link';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createAnonClient();
  const locale = await getLocale();
  const isES = locale === 'es';
  const nowIso = new Date().toISOString();

  const [
    { data: stories },
    { data: craftArticles },
    { data: featuredProfiles },
    { data: upcomingEvents },
  ] = await Promise.all([
    supabase
      .from('interviews')
      .select(
        `id, slug, title, intro, hero_image_url, published_at,
         subject:profiles!interviews_subject_profile_id_fkey ( display_name, slug, role_titles, role_category, custom_role_label, headshot_url, verified )`
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(4),
    supabase
      .from('craft_articles')
      .select('id, slug, title_en, title_es, intro_en, intro_es, category, reading_minutes, cover_image_url, publish_at')
      .eq('status', 'published')
      .lte('publish_at', nowIso)
      .order('publish_at', { ascending: false })
      .limit(3),
    supabase
      .from('profiles')
      .select('display_name, slug, role_titles, role_category, custom_role_label, location_city, location_state, headshot_url, bio, verified')
      .eq('visible', true)
      .eq('approved', true)
      .not('featured_at', 'is', null)
      .order('featured_at', { ascending: false })
      .limit(2),
    supabase
      .from('events')
      .select('id, title, event_date, location_name, cover_image_url')
      .eq('status', 'published')
      .gte('event_date', nowIso)
      .order('event_date', { ascending: true })
      .limit(4),
  ]);

  const [topStory] = stories ?? [];

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />

      {/* Masthead */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-8 text-center border-b border-stone-300">
        <p className="font-serif italic text-xs text-[#993C1D] tracking-widest uppercase mb-2">
          Vol. 1 · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <h1 className="font-serif text-7xl font-medium tracking-tight">Kinora</h1>
        <p className="font-serif italic text-base text-stone-500 mt-3">
          The community of indie cinema — the people, projects, and conversations
        </p>
      </section>

      {/* TOP STORY */}
      {topStory && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <Link href={`/stories/${topStory.slug}`} className="group block">
            <div className="grid grid-cols-2 gap-12 items-center">
              <div className="aspect-[4/5] rounded-lg overflow-hidden bg-stone-100">
                {topStory.hero_image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={topStory.hero_image_url}
                    alt={topStory.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FAECE7] to-[#FBEAF0]" />
                )}
              </div>
              <div>
                <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-3">
                  The cover · On {(topStory as any).subject?.display_name}
                </p>
                <h2 className="font-serif text-5xl font-medium mb-5 group-hover:text-[#712B13] transition-colors leading-[1.05]">
                  {topStory.title}
                </h2>
                {topStory.intro && (
                  <p className="font-serif text-lg leading-relaxed text-stone-700 line-clamp-5">
                    {topStory.intro}
                  </p>
                )}
                <p className="font-serif italic text-sm text-[#712B13] mt-5 group-hover:underline">
                  Read the interview →
                </p>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* THE CRAFT */}
      {craftArticles && craftArticles.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-stone-300">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-1">
                {isES ? 'Notas del oficio' : 'Notes from the craft'}
              </p>
              <h2 className="font-serif text-3xl font-medium">The Craft</h2>
            </div>
            <Link href="/craft" className="font-serif italic text-sm text-[#712B13] hover:underline">
              {isES ? 'Todas las notas →' : 'All articles →'}
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {craftArticles.map((article: any) => {
              const title = isES ? article.title_es : article.title_en;
              const intro = isES ? article.intro_es : article.intro_en;
              return (
                <Link key={article.id} href={`/craft/${article.slug}`} className="group block">
                  <div className="aspect-[5/3] bg-stone-200 mb-4 overflow-hidden rounded-md">
                    {article.cover_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={article.cover_image_url}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FAECE7] to-[#FBEAF0]" />
                    )}
                  </div>
                  <p className="font-serif italic text-xs text-[#993C1D] mb-2 capitalize">
                    {article.category}
                    <span className="text-stone-400"> · {article.reading_minutes} {isES ? 'min de lectura' : 'min read'}</span>
                  </p>
                  <h3 className="font-serif text-xl font-medium leading-tight mb-2 group-hover:text-[#712B13] transition-colors">
                    {title}
                  </h3>
                  {intro && (
                    <p className="font-serif text-sm text-stone-600 line-clamp-2">
                      {intro}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* FEATURED ARTISTS — 2 columns, larger cards */}
      {featuredProfiles && featuredProfiles.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-stone-300">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-1">
                On our radar
              </p>
              <h2 className="font-serif text-3xl font-medium">Artists this week</h2>
            </div>
            <Link href="/directory" className="font-serif italic text-sm text-[#712B13] hover:underline">
              Browse all →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {featuredProfiles.map((p: any) => {
              const roleTitle =
                (p.role_titles ?? [])[0] ??
                (p.role_category === 'crew_other' ? p.custom_role_label : p.role_category?.replace('_', ' '));
              return (
                <Link key={p.slug} href={`/m/${p.slug}`} className="block group">
                  <div className="aspect-[4/5] bg-[#FAECE7] rounded-md overflow-hidden mb-4">
                    {p.headshot_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.headshot_url}
                        alt={p.display_name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#712B13] font-serif italic">
                        ?
                      </div>
                    )}
                  </div>
                  <p className="font-serif italic text-sm text-[#993C1D] capitalize mb-2">{roleTitle}</p>
                  <p className="font-serif text-3xl font-medium group-hover:text-[#712B13] transition-colors flex items-center gap-2 mb-1">
                    {p.display_name}
                    {p.verified && <VerifiedBadge size="sm" />}
                  </p>
                  {p.location_city && (
                    <p className="text-sm text-stone-500 italic font-serif mb-3">{p.location_city}</p>
                  )}
                  {p.bio && (
                    <p className="font-serif text-base text-stone-700 line-clamp-3">{p.bio}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* UPCOMING EVENTS */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-stone-300">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-1">
                The calendar
              </p>
              <h2 className="font-serif text-3xl font-medium">Coming up</h2>
            </div>
            <Link href="/events" className="font-serif italic text-sm text-[#712B13] hover:underline">
              All events →
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {upcomingEvents.map((event) => {
              const start = new Date(event.event_date);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block hover:bg-white border border-stone-200 rounded-md p-5 transition-colors"
                >
                  <p className="font-serif italic text-xs text-[#993C1D] mb-2">
                    {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <h3 className="font-serif text-base font-medium mb-1 leading-tight">
                    {event.title}
                  </h3>
                  {event.location_name && (
                    <p className="text-xs text-stone-500 italic font-serif mt-2">
                      {event.location_name}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* NEWSLETTER */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-stone-300">
        <NewsletterSignup />
      </section>

      <footer className="border-t border-stone-300 py-12 text-center">
        <p className="font-serif text-3xl font-medium text-stone-900">Kinora</p>
        <p className="font-serif italic text-sm text-stone-500 mt-2">
          {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
