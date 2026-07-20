import { createAnonClient } from '@/lib/supabase/anon';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DiscoveryFilters from '@/components/DiscoveryFilters';

const PAGE_SIZE = 20;

type PublicEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location_name: string | null;
  price_public: number | null;
  posted_by_profile:
    | { display_name: string; slug: string }
    | { display_name: string; slug: string }[]
    | null;
};

export default async function EventsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAnonClient();
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);

  let query = supabase
    .from('events')
    .select(
      `id, title, description, event_date, end_date, location_name, location_address, cover_image_url, price_member, price_public,
       posted_by_profile:profiles!events_posted_by_fkey ( display_name, slug )`,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .gte('event_date', new Date().toISOString());
  if (params.q?.trim()) {
    const pattern = `%${params.q.trim()}%`;
    query = query.or(
      `title.ilike.${pattern},description.ilike.${pattern},location_name.ilike.${pattern},location_address.ilike.${pattern}`
    );
  }
  const { data, count, error } = await query
    .order('event_date', { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) {
    console.error('[events] Public listing query failed', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }

  const upcoming = (data ?? []) as PublicEvent[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (params.q) next.set('q', params.q);
    if (nextPage > 1) next.set('page', String(nextPage));
    return next.size ? `/events?${next.toString()}` : '/events';
  };
  if ((count ?? 0) > 0 && page > totalPages) redirect(pageHref(totalPages));

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="k-container k-section max-w-5xl">
        <p className="k-eyebrow mb-2">This week and beyond</p>
        <h1 className="k-page-title mb-2">Events &amp; screenings</h1>
        <p className="k-body-muted text-lg mb-10 max-w-2xl">
          Premieres, screenings, panels, workshops, and networking nights from the community.
        </p>

        <DiscoveryFilters
          pathname="/events"
          currentQuery={params.q ?? ''}
          searchLabel="Search events"
          searchPlaceholder="Title, location or description..."
        />

        {error ? (
          <div className="k-empty"><p className="k-body-muted">Events are temporarily unavailable.</p></div>
        ) : upcoming.length === 0 ? (
          <div className="k-empty">
            <p className="k-body-muted">
              {params.q
                ? 'No upcoming events match that search.'
                : 'Nothing on the calendar yet. Check back soon.'}
            </p>
            {params.q && <Link href="/events" className="k-link inline-block mt-3">Clear search →</Link>}
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 pt-6 border-t border-stone-200 flex justify-between" aria-label="Event pages">
            {page > 1 ? <Link href={pageHref(page - 1)} className="k-link">← Previous</Link> : <span />}
            <span className="k-body-muted text-xs">Page {page} of {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(page + 1)} className="k-link">Next →</Link> : <span />}
          </nav>
        )}
      </main>
    </div>
  );
}

function EventCard({ event }: { event: PublicEvent }) {
  const start = new Date(event.event_date);
  const host = Array.isArray(event.posted_by_profile)
    ? event.posted_by_profile[0]
    : event.posted_by_profile;

  return (
    <Link
      href={`/events/${event.id}`}
      className="k-card k-card-interactive grid grid-cols-[72px_1fr] sm:grid-cols-[100px_1fr_auto] gap-4 md:gap-6 items-start p-4 md:p-6"
    >
      <div className="text-center">
        <p className="font-serif italic text-xs text-[#993C1D]">
          {start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </p>
        <p className="font-serif text-4xl md:text-5xl font-medium leading-none text-[#4A1B0C]">
          {start.toLocaleDateString('en-US', { day: 'numeric' })}
        </p>
        <p className="font-serif italic text-xs text-stone-500 mt-1">
          {start.toLocaleDateString('en-US', { weekday: 'long' })}
        </p>
      </div>
      <div>
        <h2 className="font-serif text-xl font-medium mb-2">{event.title}</h2>
        {event.description && (
          <p className="text-sm text-stone-700 line-clamp-2 mb-3 font-serif">
            {event.description}
          </p>
        )}
        <p className="text-xs text-stone-500 font-serif italic">
          {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          {event.location_name && ` · ${event.location_name}`}
          {host && <> · Hosted by <span className="text-[#712B13]">{host.display_name}</span></>}
        </p>
      </div>
      <div className="text-left sm:text-right col-start-2 sm:col-start-auto">
        {event.price_public != null && event.price_public > 0 ? (
          <p className="font-serif font-medium">${event.price_public}</p>
        ) : (
          <p className="font-serif italic text-sm text-[#712B13]">Free</p>
        )}
      </div>
    </Link>
  );
}
