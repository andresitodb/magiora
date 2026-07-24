import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DiscoveryFilters from '@/components/DiscoveryFilters';

const PAGE_SIZE = 24;

type CastingCall = {
  id: string;
  project_title: string;
  project_type: string | null;
  role_name: string;
  role_size: string | null;
  role_description: string | null;
  location_city: string | null;
  location_state: string | null;
  application_deadline: string | null;
  compensation: string | null;
};

export default async function CastingCatalogue({
  params,
  pathname,
  detailContext,
}: {
  params: { q?: string; page?: string };
  pathname: '/casting-calls' | '/dashboard/casting/browse';
  detailContext: 'public' | 'workspace';
}) {
  const supabase = await createClient();
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  let query = supabase
    .from('casting_calls')
    .select(
      'id, project_title, project_type, role_name, role_size, role_description, location_city, location_state, application_deadline, target_role_category, compensation, published_at',
      { count: 'exact' }
    )
    .eq('status', 'open')
    .or(`application_deadline.is.null,application_deadline.gte.${new Date().toISOString().slice(0, 10)}`);

  if (params.q?.trim()) {
    const pattern = `%${params.q.trim()}%`;
    query = query.or(
      `project_title.ilike.${pattern},role_name.ilike.${pattern},role_description.ilike.${pattern}`
    );
  }

  const { data, count, error } = await query
    .order('published_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) {
    console.error('[casting-calls] Listing query failed', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }

  const calls = (data ?? []) as CastingCall[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (params.q) next.set('q', params.q);
    if (nextPage > 1) next.set('page', String(nextPage));
    return next.size ? `${pathname}?${next.toString()}` : pathname;
  };
  if ((count ?? 0) > 0 && page > totalPages) redirect(pageHref(totalPages));

  const detailHref = (id: string) =>
    detailContext === 'workspace'
      ? `/casting-calls/${id}?workspace=1`
      : `/casting-calls/${id}`;

  return (
    <>
      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <div>
          <p className="k-eyebrow mb-2">Now casting</p>
          <h1 className="k-page-title">Casting Calls</h1>
        </div>
        {!error && (
          <p className="k-body-muted text-sm">
            {count ?? 0} {(count ?? 0) === 1 ? 'role open' : 'roles open'}
          </p>
        )}
      </div>
      <p className="k-body-muted mb-8 max-w-2xl text-base md:text-lg">
        Open roles in indie cinema. Browse and apply directly.
      </p>

      <DiscoveryFilters
        pathname={pathname}
        currentQuery={params.q ?? ''}
        searchLabel="Search casting calls"
        searchPlaceholder="Project, production, role or description..."
      />

      {error ? (
        <div className="k-empty"><p className="k-body-muted">Casting calls are temporarily unavailable.</p></div>
      ) : calls.length === 0 ? (
        <div className="k-empty">
          <p className="k-body-muted">
            {params.q
              ? 'No open casting calls match that search.'
              : 'No open casting calls right now. Check back soon.'}
          </p>
          {params.q && <Link href={pathname} className="k-link mt-3 inline-block">Clear search →</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => {
            const deadline = call.application_deadline
              ? new Date(call.application_deadline).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : null;
            return (
              <Link
                key={call.id}
                href={detailHref(call.id)}
                className="k-card k-card-interactive group block p-5"
              >
                <p className="mb-1 font-serif text-xs italic capitalize text-stone-500">
                  {call.project_type?.replace('_', ' ')} · {call.role_size?.replace('_', ' ')}
                </p>
                <h2 className="font-serif text-xl font-medium group-hover:text-[#712B13]">
                  {call.role_name}
                  <span className="font-normal italic text-stone-500"> in </span>
                  {call.project_title}
                </h2>
                {call.role_description && (
                  <p className="mt-2 line-clamp-2 font-serif text-sm italic text-stone-600">
                    {call.role_description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-serif text-xs italic text-stone-500">
                  {(call.location_city || call.location_state) && (
                    <span>{call.location_city}{call.location_city && call.location_state && ', '}{call.location_state}</span>
                  )}
                  {call.compensation && <span>{call.compensation}</span>}
                  {deadline && <span>Applies by {deadline}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex justify-between border-t border-stone-200 pt-6" aria-label="Casting call pages">
          {page > 1 ? <Link href={pageHref(page - 1)} className="k-link">← Previous</Link> : <span />}
          <span className="k-body-muted text-xs">Page {page} of {totalPages}</span>
          {page < totalPages ? <Link href={pageHref(page + 1)} className="k-link">Next →</Link> : <span />}
        </nav>
      )}
    </>
  );
}
