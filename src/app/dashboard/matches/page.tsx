import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BackLink from '@/components/BackLink';
import EmptyState from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: matches } = await supabase
    .from('casting_call_matches')
    .select(
      `id, score, dismissed, created_at,
       casting_call:casting_calls(id, project_title, role_name, role_size,
         location_city, location_state, application_deadline, status, project_type)`
    )
    .eq('profile_id', user.id)
    .eq('dismissed', false)
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  const active = (matches ?? []).filter((m: any) => m.casting_call?.status === 'open');

  return (
    <div className="max-w-4xl">
      <BackLink href="/dashboard" label="Dashboard" />

      <div className="mb-8">
        <p className="font-serif italic text-sm text-[#993C1D] mb-2">Roles that match your profile</p>
        <h1 className="font-serif text-2xl md:text-3xl font-medium">Matches</h1>
        <p className="font-serif italic text-sm text-stone-500 mt-2">
          We've found these casting calls based on your role, location, languages, and skills.
        </p>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon="match"
          title="No matches right now"
          body="When new casting calls come in that fit your profile, you'll see them here. Make sure your profile is complete — the more details, the better the matches."
          ctaHref="/dashboard/profile"
          ctaLabel="Complete your profile"
        />
      ) : (
        <div className="space-y-3">
          {active.map((m: any) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: any }) {
  const call = match.casting_call;
  if (!call) return null;

  const score = Math.min(100, Math.round(match.score));
  const deadline = call.application_deadline
    ? new Date(call.application_deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/casting-calls/${call.id}`}
      className="block p-4 bg-white border border-stone-200 rounded-md hover:border-[#712B13] transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-serif italic text-xs text-stone-500 mb-1 capitalize">
            {call.project_type?.replace('_', ' ')} · {call.role_size?.replace('_', ' ')}
          </p>
          <h3 className="font-serif text-lg font-medium">
            {call.role_name}
            <span className="text-stone-500 font-normal italic"> in </span>
            {call.project_title}
          </h3>
          {(call.location_city || call.location_state) && (
            <p className="text-sm text-stone-500 italic font-serif mt-1">
              {call.location_city}
              {call.location_city && call.location_state && ', '}
              {call.location_state}
            </p>
          )}
        </div>
        <div className="flex flex-col items-start md:items-end gap-1.5 flex-shrink-0">
          <span
            className="text-xs px-2.5 py-1 rounded-full border font-serif"
            style={{
              backgroundColor: score >= 75 ? '#FAECE7' : '#f5f3ee',
              borderColor: score >= 75 ? '#712B13' : '#d6d3d1',
              color: score >= 75 ? '#712B13' : '#57534e',
            }}
          >
            {score}% match
          </span>
          {deadline && (
            <p className="text-xs text-stone-400 italic font-serif">Applies by {deadline}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
