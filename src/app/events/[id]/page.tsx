import { notFound } from 'next/navigation';
import { createAnonClient } from '@/lib/supabase/anon';
import { createClient } from '@/lib/supabase/server';
import { rsvpToEvent } from '@/app/dashboard/events/actions';
import Nav from '@/components/Nav';
import BackLink from '@/components/BackLink';
import Link from 'next/link';

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rsvped?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const anon = createAnonClient();

  const { data: event } = await anon
    .from('events')
    .select(
      `*, posted_by_profile:profiles!events_posted_by_fkey ( id, display_name, slug, headshot_url )`
    )
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (!event) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rsvp: any = null;
  let isMember = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();
    isMember = profile?.plan === 'member';

    const { data: r } = await supabase
      .from('event_rsvps')
      .select('id, status')
      .eq('event_id', id)
      .eq('member_id', user.id)
      .maybeSingle();
    rsvp = r;
  }

  const start = new Date(event.event_date);
  const end = event.end_date ? new Date(event.end_date) : null;

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <BackLink href="/events" label="All events" />

        {sp.rsvped && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-4 mb-6">
            You're going. See you there.
          </div>
        )}

        {event.cover_image_url && (
          <div className="rounded-lg overflow-hidden mb-8 aspect-[16/9] bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <p className="font-serif italic text-sm text-[#993C1D] mb-2">
          {start.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <h1 className="font-serif text-4xl font-medium mb-2">{event.title}</h1>
        <p className="font-serif italic text-lg text-stone-600 mb-8">
          {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          {end && ` – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
          {event.location_name && ` · ${event.location_name}`}
        </p>

        {event.description && (
          <div className="font-serif text-lg leading-relaxed whitespace-pre-line mb-8">
            {event.description}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 p-4 bg-[#FAECE7] rounded-md mb-8">
          {event.location_address && (
            <div className="col-span-2">
              <p className="font-serif italic text-xs text-[#993C1D] mb-1">Where</p>
              <p className="font-serif font-medium text-[#4A1B0C]">
                {event.location_name}
                {event.location_address && <span className="block text-sm font-normal">{event.location_address}</span>}
              </p>
            </div>
          )}
          {event.online_link && (
            <div className="col-span-2">
              <p className="font-serif italic text-xs text-[#993C1D] mb-1">Online link</p>
              <a href={event.online_link} target="_blank" rel="noopener" className="text-[#712B13] text-sm hover:underline">
                {event.online_link}
              </a>
            </div>
          )}
          <div>
            <p className="font-serif italic text-xs text-[#993C1D] mb-1">Price</p>
            <p className="font-serif font-medium text-[#4A1B0C]">
              {event.price_public != null && event.price_public > 0
                ? `$${event.price_public}`
                : 'Free'}
              {isMember && event.price_member != null && event.price_member !== event.price_public && (
                <span className="block text-xs italic font-normal">
                  ${event.price_member} for members
                </span>
              )}
            </p>
          </div>
          {event.max_capacity && (
            <div>
              <p className="font-serif italic text-xs text-[#993C1D] mb-1">Capacity</p>
              <p className="font-serif font-medium text-[#4A1B0C]">{event.max_capacity} seats</p>
            </div>
          )}
        </div>

        {event.posted_by_profile && (
          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-stone-200">
            <Link href={`/m/${event.posted_by_profile.slug}`} className="flex items-center gap-3 group">
              {event.posted_by_profile.headshot_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={event.posted_by_profile.headshot_url}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#FAECE7]" />
              )}
              <div>
                <p className="font-serif italic text-xs text-[#993C1D]">Hosted by</p>
                <p className="font-serif font-medium text-[#712B13] group-hover:underline">
                  {event.posted_by_profile.display_name}
                </p>
              </div>
            </Link>
          </div>
        )}

        {event.rsvp_required && (
          <div className="bg-white border border-stone-200 rounded-lg p-6">
            <h2 className="font-serif text-xl font-medium mb-4">RSVP</h2>
            {!user ? (
              <Link
                href="/login"
                className="inline-block bg-[#712B13] text-white py-2 px-6 rounded-md font-medium"
              >
                Sign in to RSVP
              </Link>
            ) : rsvp ? (
              <p className="text-sm text-stone-600 italic font-serif">
                You're {rsvp.status}.
              </p>
            ) : (
              <form action={rsvpToEvent}>
                <input type="hidden" name="event_id" value={event.id} />
                <button
                  type="submit"
                  className="bg-[#712B13] text-white py-2 px-6 rounded-md font-medium hover:bg-[#4A1B0C] cursor-pointer"
                >
                  I'm going
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
