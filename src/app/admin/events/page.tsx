import { createClient } from '@/lib/supabase/server';
import { approveEvent, rejectEvent } from './actions';
import Link from 'next/link';

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from('events')
    .select(
      `*, posted_by_profile:profiles!events_posted_by_fkey ( display_name, slug )`
    )
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });

  const { data: all } = await supabase
    .from('events')
    .select(
      `id, title, event_date, status, posted_by_profile:profiles!events_posted_by_fkey ( display_name )`
    )
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <div>
      <p className="font-serif italic text-sm text-[#993C1D] mb-2">Events</p>
      <h1 className="font-serif text-3xl font-medium mb-2">Event moderation</h1>
      <p className="text-sm text-stone-600 mb-8">
        {pending?.length ?? 0} pending review
      </p>

      <section className="mb-12">
        <h2 className="font-serif text-xl font-medium mb-4">Pending review</h2>
        {!pending || pending.length === 0 ? (
          <p className="text-stone-500 italic font-serif">Inbox zero.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((event: any) => (
              <div key={event.id} className="bg-white border border-stone-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#FAECE7] text-[#712B13] font-serif italic mb-2 inline-block">
                      Event
                    </span>
                    <h3 className="font-serif text-lg font-medium mt-2">{event.title}</h3>
                    <p className="text-sm text-stone-600">
                      {new Date(event.event_date).toLocaleString()}
                      {event.location_name && ` · ${event.location_name}`}
                    </p>
                  </div>
                  <div className="text-xs text-stone-500 text-right whitespace-nowrap">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>

                {event.description && (
                  <p className="text-sm text-stone-700 mb-3 font-serif whitespace-pre-line">
                    {event.description}
                  </p>
                )}

                <p className="text-xs text-stone-500 mb-4">
                  Posted by:{' '}
                  <span className="font-serif italic text-[#712B13]">
                    {event.posted_by_profile?.display_name}
                  </span>
                </p>

                <div className="flex gap-2 pt-3 border-t border-stone-100">
                  <form action={approveEvent} className="flex-1">
                    <input type="hidden" name="id" value={event.id} />
                    <button
                      type="submit"
                      className="w-full bg-[#712B13] text-white py-2 rounded-md text-sm font-medium hover:bg-[#4A1B0C] cursor-pointer"
                    >
                      Approve &amp; publish
                    </button>
                  </form>
                  <form action={rejectEvent} className="flex-1">
                    <input type="hidden" name="id" value={event.id} />
                    <button
                      type="submit"
                      className="w-full bg-stone-200 text-stone-700 py-2 rounded-md text-sm font-medium hover:bg-stone-300 cursor-pointer"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl font-medium mb-4">All events</h2>
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Host</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(all ?? []).map((e: any) => (
                <tr key={e.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/events/${e.id}`} className="font-serif font-medium hover:text-[#712B13]">
                      {e.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {new Date(e.event_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-serif italic text-[#712B13]">
                    {e.posted_by_profile?.display_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-stone-100 font-serif italic capitalize">
                      {e.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
