import { createClient } from '@/lib/supabase/server';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DiscoveryFilters from '@/components/DiscoveryFilters';
import CastingAccessGate from '@/components/CastingAccessGate';
import { canBrowseCasting } from '@/lib/designPolish';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 24;

type PublicCastingCall = {
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

export default async function CastingCallsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!canBrowseCasting(user?.id)) return <CastingAccessGate />;
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
    console.error('[casting-calls] Public listing query failed', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }

  const calls = (data ?? []) as PublicCastingCall[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (params.q) next.set('q', params.q);
    if (nextPage > 1) next.set('page', String(nextPage));
    return next.size ? `/casting-calls?${next.toString()}` : '/casting-calls';
  };
  if ((count ?? 0) > 0 && page > totalPages) redirect(pageHref(totalPages));

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="k-container k-section max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2 gap-2">
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
        <p className="k-body-muted text-base md:text-lg mb-8 max-w-2xl">
          Open roles in indie cinema. Browse and apply directly.
        </p>

        <DiscoveryFilters
          pathname="/casting-calls"
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
            {params.q && <Link href="/casting-calls" className="k-link inline-block mt-3">Clear search →</Link>}
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
                  href={`/casting-calls/${call.id}`}
                  className="k-card k-card-interactive block p-5 group"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif italic text-xs text-stone-500 mb-1 capitalize">
                        {call.project_type?.replace('_', ' ')} · {call.role_size?.replace('_', ' ')}
                      </p>
                      <h2 className="font-serif text-xl font-medium group-hover:text-[#712B13]">
                        {call.role_name}
                        <span className="text-stone-500 font-normal italic"> in </span>
                        {call.project_title}
                      </h2>
                      {call.role_description && (
                        <p className="text-sm text-stone-600 mt-2 line-clamp-2 italic font-serif">
                          {call.role_description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 italic font-serif mt-3">
                        {(call.location_city || call.location_state) && (
                          <span>{call.location_city}{call.location_city && call.location_state && ', '}{call.location_state}</span>
                        )}
                        {call.compensation && <span>{call.compensation}</span>}
                        {deadline && <span>Applies by {deadline}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 pt-6 border-t border-stone-200 flex justify-between" aria-label="Casting call pages">
            {page > 1 ? <Link href={pageHref(page - 1)} className="k-link">← Previous</Link> : <span />}
            <span className="k-body-muted text-xs">Page {page} of {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(page + 1)} className="k-link">Next →</Link> : <span />}
          </nav>
        )}
      </main>
    </div>
  );
}
