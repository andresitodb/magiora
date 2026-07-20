import { createAnonClient } from '@/lib/supabase/anon';
import Nav from '@/components/Nav';
import NewsletterSignup from '@/components/NewsletterSignup';
import VerifiedBadge from '@/components/VerifiedBadge';
import Link from 'next/link';
import {
  getProjectStatusColor,
  getProjectStatusLabel,
  getProjectTypeLabel,
} from '@/lib/projects';
import { applyPublicBrand } from '@/lib/publicBrand';

export const revalidate = 60;

type SpotlightStory = {
  id: string;
  slug: string;
  title: string;
  intro: string | null;
  hero_image_url: string | null;
  subject:
    | {
        display_name: string;
      }
    | {
        display_name: string;
      }[]
    | null;
};

type FeaturedProfile = {
  display_name: string;
  slug: string;
  role_titles: string[] | null;
  role_category: string | null;
  custom_role_label: string | null;
  location_city: string | null;
  headshot_url: string | null;
  bio: string | null;
  verified: boolean;
};

type FeaturedProject = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  project_type: string | null;
  status: string | null;
  year: number | null;
  poster_url: string | null;
};

export default async function HomePage() {
  const supabase = createAnonClient();
  const nowIso = new Date().toISOString();

  const [
    { data: stories },
    { data: featuredProfiles },
    { data: featuredProjects },
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
      .limit(2),
    supabase
      .from('profiles')
      .select('display_name, slug, role_titles, role_category, custom_role_label, location_city, location_state, headshot_url, bio, verified')
      .eq('visible', true)
      .eq('approved', true)
      .not('featured_at', 'is', null)
      .order('featured_at', { ascending: false })
      .limit(2),
    supabase
      .from('projects')
      .select('id, slug, title, tagline, project_type, status, year, poster_url, featured_at')
      .eq('visible', true)
      .not('featured_at', 'is', null)
      .order('featured_at', { ascending: false })
      .limit(1),
    supabase
      .from('events')
      .select('id, title, event_date, location_name, cover_image_url')
      .eq('status', 'published')
      .gte('event_date', nowIso)
      .order('event_date', { ascending: true })
      .limit(4),
  ]);

  const spotlightStories = (stories ?? []) as SpotlightStory[];
  const featuredProject = (featuredProjects?.[0] ?? null) as FeaturedProject | null;

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />

      {/* Masthead */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-8 text-center border-b border-stone-300">
        <h1 className="k-page-title text-5xl md:text-7xl">Magiora</h1>
        <p className="font-serif italic text-base text-stone-500 mt-3">
          Where ideas become productions.
        </p>
      </section>

      {/* SPOTLIGHT */}
      {spotlightStories.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-1">
                In conversation
              </p>
              <h2 className="k-section-title">Spotlight</h2>
            </div>
            <Link href="/stories" className="font-serif italic text-sm text-[#712B13] hover:underline">
              Explore Spotlight →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {spotlightStories.map((story) => {
              const subject = Array.isArray(story.subject)
                ? story.subject[0]
                : story.subject;

              return (
                <Link key={story.id} href={`/stories/${story.slug}`} className="k-card k-card-interactive group flex flex-col">
                    <div className="aspect-[16/10] overflow-hidden bg-stone-100">
                      {story.hero_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={story.hero_image_url}
                          alt={applyPublicBrand(story.title)}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FAECE7] to-[#FBEAF0]" />
                      )}
                    </div>
                    <div className="p-5 flex flex-1 flex-col">
                      <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-2">
                        Spotlight
                        {subject?.display_name && ` · On ${subject.display_name}`}
                      </p>
                      <h3 className="font-serif text-xl md:text-2xl font-medium mb-3 group-hover:text-[#712B13] transition-colors leading-tight line-clamp-2 min-h-[3.5rem]">
                        {applyPublicBrand(story.title)}
                      </h3>
                      {story.intro && (
                        <p className="font-serif text-sm leading-relaxed text-stone-700 line-clamp-3">
                          {applyPublicBrand(story.intro)}
                        </p>
                      )}
                      <p className="font-serif italic text-sm text-[#712B13] mt-auto pt-4 group-hover:underline">
                        Read the interview →
                      </p>
                    </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* FEATURED PROFESSIONALS — 2 columns, larger cards */}
      {featuredProfiles && featuredProfiles.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-stone-300">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-1">
                On our radar
              </p>
              <h2 className="k-section-title">Featured Professionals</h2>
            </div>
            <Link href="/directory" className="font-serif italic text-sm text-[#712B13] hover:underline">
              Browse all →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {(featuredProfiles as FeaturedProfile[]).map((p) => {
              const roleTitle =
                (p.role_titles ?? [])[0] ??
                (p.role_category === 'crew_other' ? p.custom_role_label : p.role_category?.replace('_', ' '));
              return (
                <Link key={p.slug} href={`/m/${p.slug}`} className="flex h-full flex-col group">
                  <div className="h-64 md:h-72 bg-transparent overflow-hidden mb-4">
                    {p.headshot_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.headshot_url}
                        alt={p.display_name}
                        className="w-full h-full object-contain object-top group-hover:scale-[1.01] transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full rounded-md bg-[#FAECE7] flex items-center justify-center text-[#712B13] font-serif italic text-3xl">
                        {(p.display_name?.[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="font-serif italic text-sm text-[#993C1D] capitalize mb-2">{roleTitle}</p>
                  <p className="font-serif text-2xl font-medium group-hover:text-[#712B13] transition-colors flex items-center gap-2 mb-1">
                    {p.display_name}
                    {p.verified && <VerifiedBadge size="sm" />}
                  </p>
                  {p.location_city && (
                    <p className="text-sm text-stone-500 italic font-serif mb-3">{p.location_city}</p>
                  )}
                  {p.bio && (
                    <p className="font-serif text-base text-stone-700 line-clamp-3">{p.bio}</p>
                  )}
                  <p className="k-link mt-auto pt-4 group-hover:underline">
                    View profile →
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* FEATURED PROJECT */}
      {featuredProject && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-stone-300">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-1">
                From the community
              </p>
              <h2 className="k-section-title">Featured Project</h2>
            </div>
            <Link href="/projects" className="font-serif italic text-sm text-[#712B13] hover:underline">
              Browse projects →
            </Link>
          </div>

          <Link
            href={`/projects/${featuredProject.slug}`}
            className="k-card k-card-interactive grid grid-cols-1 md:grid-cols-[240px_1fr] group"
          >
            <div className="h-64 md:h-72 overflow-hidden bg-[#FAECE7] w-full">
              {featuredProject.poster_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={featuredProject.poster_url}
                  alt={featuredProject.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#712B13] font-serif italic text-2xl text-center px-4">
                  {featuredProject.title}
                </div>
              )}
            </div>
            <div className="p-5 md:p-8 self-center">
              <p className="font-serif italic text-sm text-[#993C1D] mb-2">
                {getProjectTypeLabel(featuredProject.project_type)}
                {featuredProject.year && (
                  <span className="text-stone-500"> · {featuredProject.year}</span>
                )}
              </p>
              <h3 className="font-serif text-2xl md:text-3xl font-medium leading-tight group-hover:text-[#712B13] transition-colors">
                {featuredProject.title}
              </h3>
              {featuredProject.tagline && (
                <p className="font-serif italic text-lg text-stone-600 mt-3">
                  {featuredProject.tagline}
                </p>
              )}
              {featuredProject.status && (
                <span
                  className={`inline-block mt-4 text-xs px-2.5 py-1 rounded-full font-serif ${getProjectStatusColor(featuredProject.status)}`}
                >
                  {getProjectStatusLabel(featuredProject.status)}
                </span>
              )}
              <p className="font-serif italic text-sm text-[#712B13] mt-5 group-hover:underline">
                View project →
              </p>
            </div>
          </Link>
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
              <h2 className="k-section-title">Coming up</h2>
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
                  className="k-card k-card-interactive block p-5"
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
        <p className="font-serif text-sm text-stone-700">
          © {new Date().getFullYear()} Magiora
        </p>
        <p className="font-serif italic text-sm text-stone-500 mt-1">
          Where ideas become productions.
        </p>
      </footer>
    </div>
  );
}
