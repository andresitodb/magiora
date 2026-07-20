import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { closeCastingCall } from '../actions';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';

export default async function CastingCallApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; closed?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: call } = await supabase
    .from('casting_calls')
    .select('*')
    .eq('id', id)
    .single();

  if (!call) notFound();
  if (call.posted_by !== user!.id) redirect('/dashboard');

  const { data: applications } = await supabase
    .from('applications')
    .select(
      `*, applicant:profiles!applications_applicant_id_fkey (
        id, slug, display_name, role_category, headshot_url, location_city,
        location_state, languages, gender, age_range_min, age_range_max,
        demo_reel_url, bio
      )`
    )
    .eq('casting_call_id', id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <Link
        href="/dashboard/casting-calls"
        className="text-sm text-[#712B13] italic font-serif mb-4 inline-block"
      >
        ← Back to your casting calls
      </Link>

      <p className="font-serif italic text-sm text-[#993C1D] mb-2">Casting call</p>
      <h1 className="font-serif text-3xl font-medium mb-1">{call.role_name}</h1>
      <p className="font-serif italic text-stone-600 mb-2">{call.project_title}</p>
      <p className="text-xs text-stone-500 mb-8">
        Status: <span className="font-serif italic capitalize">{call.status}</span>
      </p>

      {query.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {query.error}
        </div>
      )}
      {query.closed && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3 mb-6">
          Casting call closed. New applications are no longer accepted.
        </div>
      )}

      {call.status === 'open' && (
        <form action={closeCastingCall} className="mb-8">
          <input type="hidden" name="casting_call_id" value={call.id} />
          <ConfirmSubmitButton
            message="Close this casting call? New applications will no longer be accepted."
            className="text-sm text-red-700 border border-red-200 bg-white py-2 px-4 rounded-md hover:bg-red-50 cursor-pointer"
          >
            Close casting call
          </ConfirmSubmitButton>
        </form>
      )}

      <h2 className="font-serif text-2xl font-medium mb-6">
        Applications
        <span className="text-sm text-stone-500 ml-3 font-normal">
          {applications?.length ?? 0} received
        </span>
      </h2>

      {!applications || applications.length === 0 ? (
        <p className="text-sm text-stone-500 italic font-serif">
          No applications yet. Members matching your targeting were notified
          when this call went live.
        </p>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <div
              key={app.id}
              className="bg-white border border-stone-200 rounded-lg p-5 flex gap-4"
            >
              <div className="w-24 aspect-[4/5] bg-[#FAECE7] rounded-md overflow-hidden flex-shrink-0">
                {app.applicant.headshot_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={app.applicant.headshot_url}
                    alt={app.applicant.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#712B13] italic font-serif">
                    No photo
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <Link
                      href={`/m/${app.applicant.slug}`}
                      className="font-serif text-xl font-medium hover:text-[#712B13]"
                    >
                      {app.applicant.display_name}
                    </Link>
                    <p className="text-sm text-stone-600 capitalize">
                      {app.applicant.role_category.replace('_', ' ')}
                      {app.applicant.location_city &&
                        ` · ${app.applicant.location_city}`}
                      {app.applicant.age_range_min &&
                        ` · ${app.applicant.age_range_min}-${app.applicant.age_range_max}`}
                    </p>
                    {app.applicant.languages?.length > 0 && (
                      <p className="font-serif italic text-xs text-[#712B13] mt-1">
                        {app.applicant.languages.join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-stone-100 font-serif italic capitalize whitespace-nowrap">
                    {app.status}
                  </span>
                </div>

                {app.cover_note && (
                  <p className="font-serif text-sm leading-relaxed mt-2 mb-2">
                    "{app.cover_note}"
                  </p>
                )}

                <div className="flex gap-3 mt-3 text-sm">
                  <Link
                    href={`/m/${app.applicant.slug}`}
                    className="text-[#712B13] font-serif italic hover:underline"
                  >
                    View full profile
                  </Link>
                  {app.applicant.demo_reel_url && (
                    <a
                      href={app.applicant.demo_reel_url}
                      target="_blank"
                      rel="noopener"
                      className="text-[#712B13] font-serif italic hover:underline"
                    >
                      Demo reel ↗
                    </a>
                  )}
                  {app.self_tape_url && (
                    <a
                      href={app.self_tape_url}
                      target="_blank"
                      rel="noopener"
                      className="text-[#712B13] font-serif italic hover:underline"
                    >
                      Self-tape ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
