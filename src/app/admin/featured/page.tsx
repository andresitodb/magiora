import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  featureProfile,
  featureProject,
  unfeatureProfile,
  unfeatureProject,
} from './actions';
import AdminFeaturedSearch from '@/components/admin/AdminFeaturedSearch';

export const dynamic = 'force-dynamic';

type FeaturedProfile = {
  id: string;
  display_name: string | null;
  slug: string;
  role_titles: string[] | null;
  role_category: string | null;
  custom_role_label: string | null;
  location_city: string | null;
  headshot_url: string | null;
  verified: boolean | null;
  featured_at: string | null;
  visible: boolean | null;
  approved: boolean | null;
};

export default async function AdminFeaturedPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; name?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!me?.is_admin) redirect('/dashboard');

  // Currently featured (where featured_at is not null)
  const { data: featured } = await supabase
    .from('profiles')
    .select('id, display_name, slug, role_titles, role_category, custom_role_label, location_city, headshot_url, verified, featured_at, visible, approved')
    .not('featured_at', 'is', null)
    .order('featured_at', { ascending: false })
    .order('id', { ascending: true });

  const { data: featuredProjects } = await supabase
    .from('projects')
    .select('id, title, slug, project_type, status, year, poster_url, featured_at')
    .not('featured_at', 'is', null)
    .order('featured_at', { ascending: false })
    .order('id', { ascending: true });

  const eligibleFeatured = (featured ?? []).filter(
    (profile) => profile.visible && profile.approved
  );
  const homeProfileIds = new Set(eligibleFeatured.slice(0, 2).map((profile) => profile.id));

  return (
    <div className="max-w-4xl">
      <p className="k-eyebrow mb-2">Home page</p>
      <h1 className="k-section-title mb-2">Featured Professionals</h1>
      <p className="text-sm text-stone-600 italic font-serif mb-8 max-w-2xl">
        The two most recently featured approved, public profiles appear on Home.
      </p>

      {sp.saved && (
        <div className="bg-[#FAECE7] border border-[#712B13] text-[#712B13] text-sm rounded-md p-3 mb-6 font-serif italic">
          {sp.saved === 'featured' &&
            `${sp.name || 'Professional'} is now Featured on Home.`}
          {sp.saved === 'unfeatured' && 'Artist removed from the home page.'}
          {sp.saved === 'project_featured' && 'Project added to the home page.'}
          {sp.saved === 'project_unfeatured' && 'Project removed from the home page.'}
        </div>
      )}

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {sp.error}
        </div>
      )}

      {/* Currently featured */}
      <section className="mb-12">
        <p className="font-serif italic text-sm text-[#993C1D] mb-3">
          Currently featured · {featured?.length ?? 0}
          {(featured?.length ?? 0) >= 2 && (
            <span className="text-stone-500 not-italic"> · (only top 2 most recent show on home)</span>
          )}
        </p>

        {!featured || featured.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-md p-8 text-center">
            <p className="font-serif italic text-stone-500">
              No artists featured yet. Search below to add the first.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {featured.map((p: FeaturedProfile) => {
              const roleTitle =
                (p.role_titles ?? [])[0] ??
                (p.role_category === 'crew_other' ? p.custom_role_label : p.role_category?.replace('_', ' '));
              const showsOnHome = homeProfileIds.has(p.id);
              const isEligible = p.visible && p.approved;
              return (
                <div
                  key={p.id}
                  className="k-card p-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
                >
                  {p.headshot_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.headshot_url}
                      alt={p.display_name ?? ''}
                      className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#FAECE7] flex items-center justify-center text-[#712B13] font-serif italic flex-shrink-0">
                      {(p.display_name?.[0] ?? '?').toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/m/${p.slug}`}
                      target="_blank"
                      className="font-serif font-medium hover:text-[#712B13] flex items-center gap-1.5"
                    >
                      {p.display_name}
                      {p.verified && (
                        <span className="inline-flex w-4 h-4 bg-[#712B13] text-white rounded-full items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </Link>
                    <p className="text-xs italic font-serif text-stone-500 capitalize">
                      {roleTitle}
                      {p.location_city && <span> · {p.location_city}</span>}
                    </p>
                    {!isEligible ? (
                      <p className="text-xs italic font-serif text-amber-700 mt-1">
                        Not eligible: profile must be approved and public
                      </p>
                    ) : showsOnHome ? (
                      <p className="text-xs italic font-serif text-[#712B13] mt-1">
                        ★ Showing on home
                      </p>
                    ) : (
                      <p className="text-xs italic font-serif text-stone-400 mt-1">
                        Not showing (only top 2 appear)
                      </p>
                    )}
                  </div>

                  <form action={unfeatureProfile}>
                    <input type="hidden" name="profile_id" value={p.id} />
                    <button
                      type="submit"
                      className="text-xs italic font-serif text-stone-500 hover:text-red-700 cursor-pointer whitespace-nowrap"
                    >
                      Remove from featured
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Search & add */}
      <section className="pt-8 border-t border-stone-200">
        <p className="font-serif italic text-sm text-[#993C1D] mb-3">Add an artist</p>

        <div className="mb-6">
          <AdminFeaturedSearch type="profile" action={featureProfile} />
        </div>

        <p className="font-serif italic text-sm text-stone-500">
          Suggestions begin after two characters.
        </p>
      </section>

      <section className="pt-8 mt-12 border-t border-stone-200">
        <p className="k-eyebrow mb-2">Home page</p>
        <h2 className="font-serif text-2xl font-medium mb-2">Featured Spotlight</h2>
        <div className="k-card p-5">
          <p className="font-serif text-sm text-stone-700">
            Spotlight is currently selected automatically.
          </p>
          <p className="mt-1 text-sm italic font-serif text-stone-500">
            Home displays the two most recently published interviews. The current interview
            schema has no featured field, so individual Spotlight curation cannot be changed
            safely from Admin without a database migration.
          </p>
        </div>
      </section>

      <section className="pt-8 mt-12 border-t border-stone-200">
        <p className="k-eyebrow mb-2">Home page</p>
        <h2 className="font-serif text-2xl font-medium mb-2">Featured Project</h2>
        <p className="text-sm text-stone-600 italic font-serif mb-6 max-w-2xl">
          The most recently featured public project appears on the home page.
        </p>

        <div className="space-y-3 mb-8">
          {(featuredProjects ?? []).length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-md p-6 text-center">
              <p className="font-serif italic text-stone-500">
                No project is featured. The home page section is hidden.
              </p>
            </div>
          ) : (
            (featuredProjects ?? []).map((project, index) => (
              <div
                key={project.id}
                className="k-card p-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
              >
                {project.poster_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={project.poster_url}
                    alt=""
                    className="w-12 h-16 rounded object-cover bg-stone-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 rounded bg-stone-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/projects/${project.slug}`}
                    target="_blank"
                    className="font-serif font-medium hover:text-[#712B13]"
                  >
                    {project.title}
                  </Link>
                  <p className="text-xs italic font-serif text-stone-500 capitalize">
                    {project.project_type?.replaceAll('_', ' ')}
                    {project.year && <span> · {project.year}</span>}
                    {project.status && <span> · {project.status.replaceAll('_', ' ')}</span>}
                  </p>
                  <p className={`text-xs italic font-serif mt-1 ${index === 0 ? 'text-[#712B13]' : 'text-stone-400'}`}>
                    {index === 0 ? '★ Showing on home' : 'Not showing (newest featured project appears)'}
                  </p>
                </div>
                <form action={unfeatureProject}>
                  <input type="hidden" name="project_id" value={project.id} />
                  <button
                    type="submit"
                    className="text-xs italic font-serif text-stone-500 hover:text-red-700 cursor-pointer whitespace-nowrap"
                  >
                    Remove from featured
                  </button>
                </form>
              </div>
            ))
          )}
        </div>

        <p className="font-serif italic text-sm text-[#993C1D] mb-3">
          Add a public project
        </p>
        <AdminFeaturedSearch type="project" action={featureProject} />
      </section>
    </div>
  );
}
