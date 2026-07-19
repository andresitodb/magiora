import { createAnonClient } from '@/lib/supabase/anon';
import Nav from '@/components/Nav';
import Link from 'next/link';

export default async function EventsListPage() {
  const supabase = createAnonClient();

  const now = new Date().toISOString();
  const { data: upcoming } = await supabase
    .from('events')
    .select(
      `id, title, description, event_date, end_date, location_name, location_address, cover_image_url, price_member, price_public,
       posted_by_profile:profiles!events_posted_by_fkey ( display_name, slug )`
    )
    .eq('status', 'published')
    .gte('event_date', now)
    .order('event_date', { ascending: true })
    .limit(40);

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <p className="font-serif italic text-sm text-[#993C1D] mb-2">This week and beyond</p>
        <h1 className="font-serif text-5xl font-medium mb-2">Events &amp; screenings</h1>
        <p className="font-serif italic text-lg text-stone-600 mb-12 max-w-2xl">
          Premieres, screenings, panels, workshops, and networking nights from the community.
        </p>

        {!upcoming || upcoming.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif italic text-stone-500">
              Nothing on the calendar yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const start = new Date(event.event_date);
  const dayNum = start.toLocaleDateString('en-US', { day: 'numeric' });
  const month = start.toLocaleDateString('en-US', { month: 'short' });
  const weekday = start.toLocaleDateString('en-US', { weekday: 'long' });
  const time = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <Link
      href={`/events/${event.id}`}
      className="grid grid-cols-[100px_1fr_auto] gap-6 items-start bg-white border border-stone-200 rounded-lg p-6 hover:border-[#712B13] transition-colors"
    >
      <div className="text-center">
        <p className="font-serif italic text-xs text-[#993C1D]">{month.toUpperCase()}</p>
        <p className="font-serif text-5xl font-medium leading-none text-[#4A1B0C]">{dayNum}</p>
        <p className="font-serif italic text-xs text-stone-500 mt-1">{weekday}</p>
      </div>

      <div>
        <h2 className="font-serif text-xl font-medium mb-2">{event.title}</h2>
        {event.description && (
          <p className="text-sm text-stone-700 line-clamp-2 mb-3 font-serif">
            {event.description}
          </p>
        )}
        <p className="text-xs text-stone-500 font-serif italic">
          {time}
          {event.location_name && ` · ${event.location_name}`}
          {event.posted_by_profile && (
            <>
              {' · Hosted by '}
              <span className="text-[#712B13]">{event.posted_by_profile.display_name}</span>
            </>
          )}
        </p>
      </div>

      <div className="text-right">
        {event.price_public != null && event.price_public > 0 ? (
          <p className="font-serif font-medium">${event.price_public}</p>
        ) : (
          <p className="font-serif italic text-sm text-[#712B13]">Free</p>
        )}
      </div>
    </Link>
  );
}
