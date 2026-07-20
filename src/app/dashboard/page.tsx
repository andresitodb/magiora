import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CompletenessBar from '@/components/CompletenessBar';
import DashboardCard, { DashboardIcons } from '@/components/DashboardCard';
import Toast from '@/components/Toast';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  // Counts for badges on cards
  const [
    { count: matchesCount },
    { count: applicationsCount },
    { data: hasStory },
    { count: projectsCount },
  ] = await Promise.all([
    supabase
      .from('casting_call_matches')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('dismissed', false),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', user.id),
    supabase
      .from('interviews')
      .select('id, status')
      .eq('subject_profile_id', user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id),
  ]);

  const userHasStory = !!hasStory;
  const hasNoActivity =
    (matchesCount ?? 0) === 0 &&
    (applicationsCount ?? 0) === 0 &&
    (projectsCount ?? 0) === 0 &&
    !userHasStory;

  return (
    <div className="max-w-5xl">
      <Suspense fallback={null}>
        <Toast />
      </Suspense>

      {/* Welcome header */}
      <div className="mb-8">
        <p className="k-eyebrow mb-2">Welcome back</p>
        <h1 className="k-page-title">
          {profile.display_name?.split(' ')[0] ?? 'Hi'}
        </h1>
        {profile.slug && (
          <Link
            href={`/m/${profile.slug}`}
            className="k-link inline-block mt-2"
          >
            View your public profile →
          </Link>
        )}
      </div>

      {/* Completeness bar */}
      <div className="mb-10">
        <CompletenessBar profile={profile} />
      </div>

      {hasNoActivity && (
        <section className="k-card p-5 mb-10">
          <p className="font-serif italic text-sm text-[#993C1D] mb-1">
            Start building your Magiora presence
          </p>
          <p className="text-sm text-stone-600 font-serif mb-4">
            Complete your profile, add a project, or browse open work.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/profile"
              className="k-button k-button-primary"
            >
              Complete profile
            </Link>
            <Link
              href="/dashboard/projects/new"
              className="k-button k-button-secondary"
            >
              Add a project
            </Link>
            <Link
              href="/casting-calls"
              className="k-button k-button-secondary"
            >
              Browse casting calls
            </Link>
          </div>
        </section>
      )}

      {/* Cards grid */}
      <p className="k-eyebrow mb-4">Your tools</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        <DashboardCard
          href="/dashboard/profile"
          title="Edit profile"
          description="Update your bio, photos, skills, and contact info."
          icon={DashboardIcons.profile}
          accent="coral"
        />

        <DashboardCard
          href="/dashboard/projects"
          title="My projects"
          description="Films, shows, and other work. Add cast and crew."
          icon={DashboardIcons.projects}
          badge={projectsCount ?? 0}
          accent="amber"
        />

        <DashboardCard
          href="/dashboard/matches"
          title="Matches"
          description="Casting calls that fit your profile."
          icon={DashboardIcons.matches}
          badge={matchesCount ?? 0}
          accent="coral"
        />

        <DashboardCard
          href="/dashboard/applications"
          title="My applications"
          description="Track the casting calls you've applied to."
          icon={DashboardIcons.applications}
          badge={applicationsCount ?? 0}
          accent="green"
        />

        <DashboardCard
          href="/casting-calls"
          title="Casting calls"
          description="Browse all open roles in indie cinema."
          icon={DashboardIcons.castingCalls}
          accent="blue"
        />

        {userHasStory ? (
          <DashboardCard
            href="/dashboard/stories"
            title="My Spotlight"
            description={
              hasStory?.status === 'published'
                ? 'Your published feature on Magiora.'
                : "Continue the interview you've been invited to."
            }
            icon={DashboardIcons.story}
            accent="stone"
          />
        ) : (
          <div className="block bg-stone-50 border border-stone-200 border-dashed rounded-md p-5 h-full">
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-stone-100 text-stone-400 mb-3">
              {DashboardIcons.story}
            </div>
            <h3 className="font-serif text-lg font-medium text-stone-500 mb-1">My Spotlight</h3>
            <p className="text-sm text-stone-400 italic font-serif leading-snug">
              Stories are by invitation only. Keep building your work — editors are watching.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
