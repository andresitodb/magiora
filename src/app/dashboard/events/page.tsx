import { createClient } from '@/lib/supabase/server';
import BackLink from '@/components/BackLink';
import Link from 'next/link';
import { hasPaidMembership } from '@/lib/billingServer';

type EventRsvpRow = {
  status: string;
  event: {
    id: string;
    title: string;
    event_date: string;
    location_name: string | null;
  };
};

export default async function MyEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isMember = await hasPaidMembership(user!.id);

  const { data: myEvents } = await supabase
    .from('events')
    .select('id, title, event_date, status')
    .eq('posted_by', user!.id)
    .order('event_date', { ascending: false });

  const { data: myRsvps } = await supabase
    .from('event_rsvps')
    .select(`status, event:events ( id, title, event_date, location_name )`)
    .eq('member_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <BackLink href="/dashboard" label="Dashboard" />

      <p className="k-eyebrow mb-2">Your events</p>
      <h1 className="k-section-title mb-8">My events &amp; RSVPs</h1>

      {params.submitted && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3 mb-6">
          Submitted for review.
        </div>
      )}

      <section className="mb-12">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="font-serif text-xl font-medium">Posted by you</h2>
          {isMember && (
            <Link
              href="/dashboard/events/new"
              className="k-button k-button-primary"
            >
              + Post new
            </Link>
          )}
        </div>

        {!isMember ? (
          <p className="text-sm text-stone-500 italic font-serif">
            Become a member to post events.
          </p>
        ) : !myEvents || myEvents.length === 0 ? (
          <p className="text-sm text-stone-500 italic font-serif">
            You haven&apos;t posted any events yet.
          </p>
        ) : (
          <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
            {myEvents.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="py-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-stone-50 -mx-3 px-3"
              >
                <div>
                  <p className="font-serif font-medium">{e.title}</p>
                  <p className="text-sm text-stone-500">
                    {new Date(e.event_date).toLocaleString()}
                  </p>
                </div>
                <span className="k-badge bg-stone-100 capitalize">
                  {e.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl font-medium mb-4">Your RSVPs</h2>
        {!myRsvps || myRsvps.length === 0 ? (
          <p className="text-sm text-stone-500 italic font-serif">
            You haven&apos;t RSVP&apos;d to anything yet.{' '}
            <Link href="/events" className="text-[#712B13]">
              Browse events →
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
            {(myRsvps as unknown as EventRsvpRow[]).map((r) => (
              <Link
                key={r.event.id}
                href={`/events/${r.event.id}`}
                className="py-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-stone-50 -mx-3 px-3"
              >
                <div>
                  <p className="font-serif font-medium">{r.event.title}</p>
                  <p className="text-sm text-stone-500">
                    {new Date(r.event.event_date).toLocaleString()}
                    {r.event.location_name && ` · ${r.event.location_name}`}
                  </p>
                </div>
                <span className="k-badge bg-[#FAECE7] text-[#712B13] capitalize">
                  {r.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
