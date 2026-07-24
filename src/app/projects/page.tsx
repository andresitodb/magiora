import { createAnonClient } from '@/lib/supabase/anon';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DiscoveryFilters from '@/components/DiscoveryFilters';
import {
  getProjectTypeLabel,
  getProjectStatusLabel,
  getProjectStatusColor,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from '@/lib/projects';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 24;

type PublicProjectCard = {
  id: string;
  slug: string;
  title: string;
  project_type: string | null;
  status: string | null;
  year: number | null;
  poster_url: string | null;
  owner:
    | { display_name: string; slug: string }
    | { display_name: string; slug: string }[]
    | null;
};

export default async function ProjectsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = createAnonClient();
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const sort = ['featured', 'newest', 'year', 'name'].includes(params.sort ?? '')
    ? params.sort!
    : 'featured';

  let query = supabase
    .from('projects')
    .select(
      `id, slug, title, project_type, status, year, poster_url, featured_at,
       owner:profiles!projects_owner_id_fkey(display_name, slug)`,
      { count: 'exact' }
    )
    .eq('visible', true);

  if (params.q?.trim()) {
    const pattern = `%${params.q.trim()}%`;
    query = query.or(
      `title.ilike.${pattern},tagline.ilike.${pattern},description.ilike.${pattern}`
    );
  }
  if (PROJECT_TYPES.some((type) => type.value === params.type)) {
    query = query.eq('project_type', params.type);
  }
  if (PROJECT_STATUSES.some((status) => status.value === params.status)) {
    query = query.eq('status', params.status);
  }
  if (sort === 'name') {
    query = query.order('title', { ascending: true });
  } else if (sort === 'year') {
    query = query
      .order('year', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
  } else if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query
      .order('featured_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
  }

  const { data: projects, count, error } = await query.range(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE - 1
  );
  if (error) {
    console.error('[projects] Public discovery query failed', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (params.q) next.set('q', params.q);
    if (params.type) next.set('type', params.type);
    if (params.status) next.set('status', params.status);
    if (sort !== 'featured') next.set('sort', sort);
    if (nextPage > 1) next.set('page', String(nextPage));
    return next.size ? `/projects?${next.toString()}` : '/projects';
  };
  if (total > 0 && page > totalPages) redirect(pageHref(totalPages));

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="k-container k-section">
        <div className="mb-2">
          <p className="k-eyebrow mb-2">Browse projects</p>
          <h1 className="k-page-title">Projects</h1>
        </div>
        <p className="k-body-muted text-base md:text-lg mb-10 max-w-2xl">
          Films, shows, and other work from the community.
        </p>

        <DiscoveryFilters
          pathname="/projects"
          currentQuery={params.q ?? ''}
          searchLabel="Search projects"
          searchPlaceholder="Title, tagline or description..."
          selects={[
            {
              key: 'type',
              label: 'Type',
              value: params.type ?? '',
              options: [{ value: '', label: 'All types' }, ...PROJECT_TYPES],
            },
            {
              key: 'status',
              label: 'Status',
              value: params.status ?? '',
              options: [
                { value: '', label: 'All statuses' },
                ...PROJECT_STATUSES.map(({ value, label }) => ({ value, label })),
              ],
            },
            {
              key: 'sort',
              label: 'Sort',
              value: sort,
              options: [
                { value: 'featured', label: 'Featured' },
                { value: 'newest', label: 'Newest' },
                { value: 'year', label: 'Year' },
                { value: 'name', label: 'Name' },
              ],
            },
          ]}
        />

        {error ? (
          <div className="k-empty">
            <p className="font-serif italic text-stone-500">
              Projects are temporarily unavailable. Please try again.
            </p>
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="k-empty">
            <p className="font-serif italic text-stone-500">
              No projects match those filters.
            </p>
            <Link href="/projects" className="k-link inline-block mt-3">
              Clear filters →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {(projects as PublicProjectCard[]).map((project) => {
              const owner = Array.isArray(project.owner)
                ? project.owner[0]
                : project.owner;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="k-card k-card-interactive block group"
                >
                  <div className="aspect-[3/4] bg-[#FAECE7]">
                    {project.poster_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={project.poster_url}
                        alt={project.title}
                        className="k-card-media"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#712B13] font-serif italic text-xl text-center px-3">
                        {project.title}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-serif italic text-xs text-[#993C1D] mb-1">
                      {getProjectTypeLabel(project.project_type)}
                      {project.year && <span className="text-stone-500"> · {project.year}</span>}
                    </p>
                    <p className="font-serif text-base font-medium group-hover:text-[#712B13] line-clamp-2">
                      {project.title}
                    </p>
                    {owner && (
                      <p className="text-xs text-stone-500 italic font-serif mt-1">
                        by {owner.display_name}
                      </p>
                    )}
                    {project.status && (
                      <span className={`k-badge mt-2 ${getProjectStatusColor(project.status)}`}>
                        {getProjectStatusLabel(project.status)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 pt-6 border-t border-stone-200 flex justify-between" aria-label="Project pages">
            {page > 1 ? <Link href={pageHref(page - 1)} className="k-link">← Previous</Link> : <span />}
            <span className="k-body-muted text-xs">Page {page} of {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(page + 1)} className="k-link">Next →</Link> : <span />}
          </nav>
        )}
      </main>
    </div>
  );
}
