import { createClient } from '@/lib/supabase/server';
import BackLink from '@/components/BackLink';
import Link from 'next/link';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user!.id)
    .single();
  const isMember = profile?.plan === 'member';

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

      <p className="font-serif italic text-sm text-[#993C1D] mb-2">Your events</p>
      <h1 className="font-serif text-3xl font-medium mb-8">My events &amp; RSVPs</h1>

      {params.submitted && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3 mb-6">
          Submitted for review.
        </div>
      )}

      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-medium">Posted by you</h2>
          {isMember && (
            <Link
              href="/dashboard/events/new"
              className="text-sm bg-[#712B13] text-white py-2 px-4 rounded-md hover:bg-[#4A1B0C]"
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
            You haven't posted any events yet.
          </p>
        ) : (
          <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
            {myEvents.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="py-4 flex items-center justify-between hover:bg-stone-50 -mx-3 px-3"
              >
                <div>
                  <p className="font-serif font-medium">{e.title}</p>
                  <p className="text-sm text-stone-500">
                    {new Date(e.event_date).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-stone-100 font-serif italic capitalize">
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
            You haven't RSVP'd to anything yet.{' '}
            <Link href="/events" className="text-[#712B13]">
              Browse events →
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
            {myRsvps.map((r: any) => (
              <Link
                key={r.event.id}
                href={`/events/${r.event.id}`}
                className="py-4 flex items-center justify-between hover:bg-stone-50 -mx-3 px-3"
              >
                <div>
                  <p className="font-serif font-medium">{r.event.title}</p>
                  <p className="text-sm text-stone-500">
                    {new Date(r.event.event_date).toLocaleString()}
                    {r.event.location_name && ` · ${r.event.location_name}`}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-[#FAECE7] text-[#712B13] font-serif italic">
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
