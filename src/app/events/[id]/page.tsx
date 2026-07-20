import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { rsvpToEvent } from '@/app/dashboard/events/actions';
import Nav from '@/components/Nav';
import BackLink from '@/components/BackLink';
import Link from 'next/link';
import type { Metadata } from 'next';
import { entityMetadata, metadataText, unavailableMetadata } from '@/lib/metadata';
import { getEventEntity } from '@/lib/publicEntityLoaders';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: event, error } = await getEventEntity(id);
  const pathname = `/events/${encodeURIComponent(id)}`;

  if (error || !event) return unavailableMetadata(pathname);

  const eventDate = new Date(event.event_date);
  const dateLabel = Number.isNaN(eventDate.getTime())
    ? ''
    : eventDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
  const dateLocation = [dateLabel, event.location_name]
    .filter(Boolean)
    .join(' · ');

  return entityMetadata({
    title: event.title || 'Magiora',
    description: metadataText(
      event.description || dateLocation,
      'A public event on Magiora.'
    ),
    pathname,
    image: event.cover_image_url,
  });
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rsvped?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { data: event } = await getEventEntity(id);

  if (!event) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rsvp: { id: string; status: string } | null = null;
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
      <main className="k-container k-section max-w-3xl">
        <BackLink href="/events" label="All events" />

        {sp.rsvped && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-4 mb-6">
            You&apos;re going. See you there.
          </div>
        )}

        {event.cover_image_url && (
          <div className="k-card mb-8 aspect-[16/9] bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <p className="k-eyebrow mb-2">
          {start.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <h1 className="k-page-title mb-2">{event.title}</h1>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAECE7] rounded-md mb-8">
          {event.location_address && (
            <div className="sm:col-span-2">
              <p className="font-serif italic text-xs text-[#993C1D] mb-1">Where</p>
              <p className="font-serif font-medium text-[#4A1B0C]">
                {event.location_name}
                {event.location_address && <span className="block text-sm font-normal">{event.location_address}</span>}
              </p>
            </div>
          )}
          {event.online_link && (
            <div className="sm:col-span-2 min-w-0">
              <p className="font-serif italic text-xs text-[#993C1D] mb-1">Online link</p>
              <a href={event.online_link} target="_blank" rel="noopener" className="k-link block break-all">
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
          <div className="k-card p-6">
            <h2 className="font-serif text-xl font-medium mb-4">RSVP</h2>
            {!user ? (
              <Link
                href="/login"
                className="k-button k-button-primary"
              >
                Sign in to RSVP
              </Link>
            ) : rsvp ? (
              <p className="text-sm text-stone-600 italic font-serif">
                You&apos;re {rsvp.status}.
              </p>
            ) : (
              <form action={rsvpToEvent}>
                <input type="hidden" name="event_id" value={event.id} />
                <button
                  type="submit"
                  className="k-button k-button-primary"
                >
                  I&apos;m going
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
