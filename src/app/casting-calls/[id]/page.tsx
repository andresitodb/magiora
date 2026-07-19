import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import BackLink from '@/components/BackLink';
import Link from 'next/link';
import { applyCastingCall } from '@/app/dashboard/casting-calls/actions';

export const dynamic = 'force-dynamic';

export default async function CastingCallDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; applied?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // REQUIRE LOGIN — non-logged users get redirected to login with next=
  const { data: call } = await supabase
    .from('casting_calls')
    .select('*, poster:profiles!casting_calls_posted_by_fkey(display_name, slug, headshot_url)')
    .eq('id', id)
    .maybeSingle();

  if (!call) notFound();

  // Check user's plan + existing application
  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('plan, role_titles, role_category, is_admin')
        .eq('id', user.id)
        .single()
    : { data: null };
  const isOwner = user?.id === call.posted_by;
  const isAdmin = profile?.is_admin === true;
  if (call.status !== 'open' && !isOwner && !isAdmin) notFound();

  const isMember = profile?.plan === 'member';

  const { data: existingApplication } = user
    ? await supabase
        .from('applications')
        .select('id, status, created_at')
        .eq('casting_call_id', call.id)
        .eq('applicant_id', user.id)
        .maybeSingle()
    : { data: null };

  const deadline = call.application_deadline
    ? new Date(call.application_deadline).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <BackLink href="/casting-calls" label="Casting Calls" />

        {call.status !== 'open' && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-md p-3">
            Preview: this casting call is currently {call.status.replace('_', ' ')}.
          </div>
        )}
        {query.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3">
            {query.error}
          </div>
        )}
        {query.applied && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3">
            Your application was submitted.
          </div>
        )}

        <div className="mb-8">
          <p className="font-serif italic text-sm text-[#993C1D] mb-2 capitalize">
            {call.project_type?.replace('_', ' ')} · {call.role_size?.replace('_', ' ')}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium leading-tight mb-2">
            {call.role_name}
          </h1>
          <p className="font-serif italic text-lg text-stone-600">
            in <span className="text-stone-900">{call.project_title}</span>
          </p>
        </div>

        {/* Logistics row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-serif italic text-stone-600 mb-8 pb-8 border-b border-stone-200">
          {(call.location_city || call.location_state) && (
            <span>
              📍 {call.location_city}
              {call.location_city && call.location_state && ', '}
              {call.location_state}
            </span>
          )}
          {call.compensation && <span>💰 {call.compensation}</span>}
          {deadline && <span>⏰ Apply by {deadline}</span>}
        </div>

        {call.role_description && (
          <section className="mb-8">
            <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-3">
              About the role
            </p>
            <div className="font-serif text-base md:text-lg leading-relaxed whitespace-pre-line text-stone-800">
              {call.role_description}
            </div>
          </section>
        )}

        {call.project_description && (
          <section className="mb-8">
            <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-3">
              About the project
            </p>
            <div className="font-serif text-base leading-relaxed whitespace-pre-line text-stone-700">
              {call.project_description}
            </div>
          </section>
        )}

        {call.poster && (
          <section className="mb-8 pt-6 border-t border-stone-200">
            <p className="font-serif italic text-xs text-stone-500 mb-3">Posted by</p>
            <Link
              href={`/m/${call.poster.slug}`}
              className="flex items-center gap-3 group"
            >
              {call.poster.headshot_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={call.poster.headshot_url}
                  alt={call.poster.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="w-10 h-10 rounded-full bg-[#FAECE7] flex items-center justify-center text-[#712B13] text-sm">
                  {(call.poster.display_name?.[0] ?? '?').toUpperCase()}
                </span>
              )}
              <span className="font-serif font-medium group-hover:text-[#712B13]">
                {call.poster.display_name}
              </span>
            </Link>
          </section>
        )}

        {/* APPLY SECTION */}
        <section className="pt-8 border-t border-stone-200">
          {isOwner ? (
            <div className="bg-stone-100 border border-stone-200 rounded-md p-5 text-center">
              <p className="font-serif text-lg font-medium mb-3">This is your casting call.</p>
              <Link
                href={`/dashboard/casting-calls/${call.id}`}
                className="text-sm text-[#712B13] italic font-serif hover:underline"
              >
                View applications →
              </Link>
            </div>
          ) : existingApplication ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-5 text-center">
              <p className="font-serif text-lg font-medium text-green-900 mb-1">
                You applied to this role
              </p>
              <p className="font-serif italic text-sm text-green-700 mb-4">
                Status: <span className="capitalize">{existingApplication.status.replace('_', ' ')}</span>
                {' · '}
                Submitted{' '}
                {new Date(existingApplication.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <Link
                href="/dashboard/applications"
                className="text-sm text-green-800 italic font-serif hover:underline"
              >
                Track in My Applications →
              </Link>
            </div>
          ) : call.status !== 'open' ? (
            <div className="bg-stone-100 border border-stone-200 rounded-md p-5 text-center">
              <p className="font-serif text-lg font-medium text-stone-700">
                Applications are closed
              </p>
            </div>
          ) : !user ? (
            <div className="bg-[#FAECE7] border border-[#FAC775] rounded-md p-5 text-center">
              <p className="font-serif text-lg font-medium text-[#712B13] mb-3">
                Sign in to apply
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/casting-calls/${call.id}`)}`}
                className="inline-block bg-[#712B13] text-white py-2 px-6 rounded-md font-medium hover:bg-[#4A1B0C]"
              >
                Sign in
              </Link>
            </div>
          ) : !isMember ? (
            <div className="bg-[#FAECE7] border border-[#FAC775] rounded-md p-5 text-center">
              <p className="font-serif text-lg font-medium text-[#712B13] mb-1">
                Become a Member to apply
              </p>
              <p className="font-serif italic text-sm text-stone-700 mb-4">
                Listed accounts can browse all calls. Members can apply, get matched automatically,
                and unlock the full profile.
              </p>
              <Link
                href="/pricing"
                className="inline-block bg-[#712B13] text-white py-2 px-6 rounded-md font-medium hover:bg-[#4A1B0C]"
              >
                See Member benefits →
              </Link>
            </div>
          ) : (
            <form action={applyCastingCall} className="bg-white border border-stone-200 rounded-md p-5 space-y-4">
              <input type="hidden" name="casting_call_id" value={call.id} />
              <div>
                <label className="block text-sm font-medium mb-1">Cover note (optional)</label>
                <textarea
                  name="cover_note"
                  rows={4}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Self-tape URL (optional)</label>
                <input
                  type="url"
                  name="self_tape_url"
                  className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-serif">
                <input type="checkbox" name="availability_confirmed" />
                I confirm my availability for the listed shoot dates.
              </label>
              <button
                type="submit"
                className="w-full bg-[#712B13] text-white text-center py-3 px-6 rounded-md font-medium hover:bg-[#4A1B0C] font-serif text-lg cursor-pointer"
              >
                Apply for this role →
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
