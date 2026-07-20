import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { postEvent } from '../actions';
import BackLink from '@/components/BackLink';
import AutoGrowTextarea from '@/components/AutoGrowTextarea';

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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

  if (profile?.plan !== 'member') redirect('/dashboard?error=members_only');

  return (
    <div className="max-w-2xl">
      <BackLink href="/dashboard/events" label="My events" />

      <p className="k-eyebrow mb-2">For members</p>
      <h1 className="k-section-title mb-2">Post an event</h1>
      <p className="text-sm text-stone-600 italic font-serif mb-8">
        Screenings, premieres, panels, workshops, networking nights. Reviewed by our editorial team within 24 hours.
      </p>

      {params.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={postEvent} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Event title</label>
          <input
            type="text"
            name="title"
            required
            placeholder="The Performance — premiere screening"
            className="k-control"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <AutoGrowTextarea
            name="description"
            placeholder="What is this event about? Who's it for?"
            minRows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="event_date"
              required
              className="k-control"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start time</label>
            <input
              type="time"
              name="event_time"
              required
              defaultValue="19:00"
              className="k-control"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              End date <span className="text-xs text-stone-500 italic font-serif font-normal">optional</span>
            </label>
            <input
              type="date"
              name="end_date"
              className="k-control"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              End time <span className="text-xs text-stone-500 italic font-serif font-normal">optional</span>
            </label>
            <input
              type="time"
              name="end_time"
              className="k-control"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Venue name</label>
          <input
            type="text"
            name="location_name"
            placeholder="Coral Gables Art Cinema"
            className="k-control"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            type="text"
            name="location_address"
            placeholder="260 Aragon Ave, Coral Gables, FL"
            className="k-control"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Online link <span className="text-xs text-stone-500 italic font-serif font-normal">for virtual events</span>
          </label>
          <input
            type="url"
            name="online_link"
            placeholder="https://zoom.us/..."
            className="k-control"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Cover image URL <span className="text-xs text-stone-500 italic font-serif font-normal">paste a link for now</span>
          </label>
          <input
            type="url"
            name="cover_image_url"
            placeholder="https://..."
            className="k-control"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Price <span className="text-xs text-stone-500 italic font-serif font-normal">$ — leave 0 for free</span>
            </label>
            <input
              type="number"
              name="price_public"
              step="0.01"
              defaultValue="0"
              className="k-control"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Member price <span className="text-xs text-stone-500 italic font-serif font-normal">optional</span>
            </label>
            <input
              type="number"
              name="price_member"
              step="0.01"
              className="k-control"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Capacity <span className="text-xs text-stone-500 italic font-serif font-normal">optional</span>
            </label>
            <input
              type="number"
              name="max_capacity"
              className="k-control"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="rsvp_required" className="w-4 h-4 cursor-pointer" />
          <span className="text-sm">RSVP required for attendance</span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            name="submit_action"
            value="draft"
            className="k-button k-button-secondary"
          >
            Save draft
          </button>
          <button
            type="submit"
            name="submit_action"
            value="submit"
            className="k-button k-button-primary"
          >
            Submit for review
          </button>
        </div>
      </form>
    </div>
  );
}
