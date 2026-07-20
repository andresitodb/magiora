import { createClient } from '@/lib/supabase/server';
import { approveCastingCall, rejectCastingCall } from './actions';

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: pendingCalls } = await supabase
    .from('casting_calls')
    .select(
      `*, poster:profiles!casting_calls_posted_by_fkey ( display_name, slug, role_category )`
    )
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });

  const { count: memberCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('plan', 'member');

  const { count: openCallsCount } = await supabase
    .from('casting_calls')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <div>
      <p className="font-serif italic text-sm text-[#993C1D] mb-2">Editor&apos;s desk</p>
      <h1 className="font-serif text-4xl font-medium mb-2">Good morning</h1>
      <p className="text-stone-600 mb-12">
        {pendingCalls?.length ?? 0} items waiting for review · {memberCount} active
        members · {openCallsCount} open calls
      </p>

      {sp.error && (
        <div role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <h2 className="font-serif text-2xl font-medium mb-6">Pending review</h2>

      {!pendingCalls || pendingCalls.length === 0 ? (
        <p className="text-stone-500 italic font-serif">
          Inbox zero. Nothing waiting for your approval.
        </p>
      ) : (
        <div className="space-y-4">
          {pendingCalls.map((call) => (
            <div
              key={call.id}
              className="k-card p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#FAECE7] text-[#712B13] font-serif italic mb-2 inline-block">
                    Casting call
                  </span>
                  <h3 className="font-serif text-lg font-medium mt-2">
                    {call.role_size === 'lead' ? 'Lead role' : call.role_size} ·{' '}
                    {call.role_name}
                  </h3>
                  <p className="text-sm text-stone-600">{call.project_title}</p>
                </div>
                <div className="text-xs text-stone-500 text-right whitespace-nowrap">
                  {new Date(call.created_at).toLocaleString()}
                </div>
              </div>

              <p className="text-sm text-stone-700 mb-3 font-serif">
                {call.project_description}
              </p>
              <p className="text-sm text-stone-700 mb-3 font-serif italic">
                Role: {call.role_description}
              </p>

              <div className="text-xs text-stone-500 space-y-1 mb-4">
                <p>
                  Posted by:{' '}
                  <span className="font-serif italic text-[#712B13]">
                    {call.poster.display_name}
                  </span>{' '}
                  ({call.poster.role_category})
                </p>
                <p>
                  Targeting: {call.target_role_category} · {call.target_gender}
                  {call.target_age_min &&
                    ` · ${call.target_age_min}-${call.target_age_max}`}
                  {call.target_languages?.length > 0 &&
                    ` · ${call.target_languages.join(', ')}`}
                </p>
                <p>
                  Shoot:{' '}
                  {call.shoot_start_date
                    ? new Date(call.shoot_start_date).toLocaleDateString()
                    : 'TBD'}
                  {call.shoot_end_date &&
                    ` – ${new Date(call.shoot_end_date).toLocaleDateString()}`}
                  {call.location_city && ` · ${call.location_city}`}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-stone-100 sm:flex-row">
                <form action={approveCastingCall} className="flex-1">
                  <input type="hidden" name="id" value={call.id} />
                  <button
                    type="submit"
                    className="w-full bg-[#712B13] text-white py-2 rounded-md text-sm font-medium hover:bg-[#4A1B0C]"
                  >
                    Approve &amp; publish
                  </button>
                </form>
                <form action={rejectCastingCall} className="flex-1">
                  <input type="hidden" name="id" value={call.id} />
                  <button
                    type="submit"
                    className="w-full bg-stone-200 text-stone-700 py-2 rounded-md text-sm font-medium hover:bg-stone-300"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
