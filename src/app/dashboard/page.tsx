import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasPaidMembership } from '@/lib/billingServer';
import {
  computeDashboardCompleteness,
  getPublicProfileState,
  mergeDashboardProjects,
  selectAuthorizedCastingActivity,
  type DashboardApplication,
  type DashboardProfile,
  type DashboardProject,
} from '@/lib/dashboardFoundation';
import { normalizeNotification } from '@/lib/notifications';
import CompletenessBar from '@/components/CompletenessBar';
import DashboardCard, { DashboardIcons } from '@/components/DashboardCard';
import Toast from '@/components/Toast';

export const dynamic = 'force-dynamic';

type CreditRow = {
  role_title: string | null;
  project: DashboardProject | DashboardProject[] | null;
};

type EventCommitmentRow = {
  status: string;
  event: {
    id: string;
    title: string;
    event_date: string;
    location_name: string | null;
  } | Array<{
    id: string;
    title: string;
    event_date: string;
    location_name: string | null;
  }> | null;
};

type NotificationRow = Parameters<typeof normalizeNotification>[0];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now = new Date().toISOString();
  const [
    { data: profile },
    { data: ownedProjects },
    { data: creditRows },
    { data: applicationRows },
    { data: rsvpRows },
    { data: postedEvents },
    { data: notificationRows },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('projects')
      .select('id, slug, title, status, visible, updated_at')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(8),
    supabase
      .from('project_credits')
      .select('role_title, project:projects!inner(id, slug, title, status, visible, updated_at)')
      .eq('profile_id', user.id)
      .limit(20),
    supabase
      .from('applications')
      .select(`id, applicant_id, status, created_at,
        casting_call:casting_calls(id, project_title, role_name, status, application_deadline)`)
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('event_rsvps')
      .select('status, event:events!inner(id, title, event_date, location_name)')
      .eq('member_id', user.id)
      .gte('event.event_date', now)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('events')
      .select('id, title, event_date, location_name')
      .eq('posted_by', user.id)
      .gte('event_date', now)
      .order('event_date', { ascending: true })
      .limit(8),
    supabase
      .from('notifications')
      .select('id, type, payload, read_at, created_at')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (!profile) redirect('/login');
  const dashboardProfile = profile as DashboardProfile;
  const normalizedCredits = ((creditRows ?? []) as unknown as CreditRow[]).flatMap((row) => {
    const project = Array.isArray(row.project) ? row.project[0] : row.project;
    return project ? [{ project, role_title: row.role_title }] : [];
  });
  const projects = mergeDashboardProjects(
    (ownedProjects ?? []) as DashboardProject[],
    normalizedCredits,
  ).slice(0, 4);
  const completeness = computeDashboardCompleteness(dashboardProfile, normalizedCredits.length);
  const applications = selectAuthorizedCastingActivity(
    (applicationRows ?? []) as unknown as DashboardApplication[],
    user.id,
  ).slice(0, 4);
  const publicState = getPublicProfileState(dashboardProfile);
  const recentActivity = ((notificationRows ?? []) as NotificationRow[]).map(normalizeNotification);
  const recentUnreadMatches = recentActivity.filter(
    (activity) => activity.type === 'casting_call_match' && !activity.read_at,
  ).length;
  const recentSpotlightInvites = recentActivity.filter(
    (activity) => activity.type === 'interview_invited' && !activity.read_at,
  ).length;
  const checkoutMembership = params.checkout === 'pending' ? await hasPaidMembership(user.id) : null;

  const commitments = new Map<string, { key: string; title: string; detail: string; date: string; href: string }>();
  for (const row of (rsvpRows ?? []) as unknown as EventCommitmentRow[]) {
    if (row.status === 'declined') continue;
    const event = Array.isArray(row.event) ? row.event[0] : row.event;
    if (!event || new Date(event.event_date) < new Date()) continue;
    commitments.set(`event-${event.id}`, {
      key: `event-${event.id}`,
      title: event.title,
      detail: event.location_name ? `${row.status} · ${event.location_name}` : row.status,
      date: event.event_date,
      href: `/events/${event.id}`,
    });
  }
  for (const event of postedEvents ?? []) {
    commitments.set(`event-${event.id}`, {
      key: `event-${event.id}`,
      title: event.title,
      detail: event.location_name ? `Hosted by you · ${event.location_name}` : 'Hosted by you',
      date: event.event_date,
      href: `/events/${event.id}`,
    });
  }
  for (const application of applications) {
    const call = application.casting_call;
    const deadline = call?.application_deadline;
    if (!call || !deadline || new Date(deadline) < new Date() || call.status === 'closed') continue;
    commitments.set(`casting-${call.id}`, {
      key: `casting-${call.id}`,
      title: `${call.role_name} · ${call.project_title}`,
      detail: 'Casting application deadline',
      date: deadline,
      href: `/casting-calls/${call.id}`,
    });
  }
  const upcomingCommitments = [...commitments.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  void upcomingCommitments;

  const firstName = dashboardProfile.display_name?.trim().split(/\s+/)[0] || 'there';

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <Suspense fallback={null}><Toast /></Suspense>

      {checkoutMembership !== null && (
        <div className={`mb-6 rounded-md border p-4 text-sm ${checkoutMembership ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`} role="status">
          {checkoutMembership ? 'Your Magiora membership is active.' : 'Your payment is being confirmed. Membership access will activate after Stripe confirms it.'}
        </div>
      )}

      <header className="mb-8">
        <p className="k-eyebrow mb-2">Professional dashboard</p>
        <h1 className="k-page-title">Welcome back, {firstName}</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 sm:text-base">
          See how your professional presence is progressing and what deserves your attention next.
        </p>
      </header>

      <section className="mt-8" aria-labelledby="workspace-title">
        <div className="mb-5 max-w-2xl">
          <h2 id="workspace-title" className="k-eyebrow">YOUR WORKSPACE</h2>
          <p className="mt-2 font-serif text-xl leading-snug text-stone-700 sm:text-2xl">
            Pick up where your creative work needs you.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            href="/dashboard/profile"
            title="My Profile"
            description={
              completeness.percent === 100
                ? 'Your professional presence is ready to be discovered.'
                : `${completeness.missing.length} ${completeness.missing.length === 1 ? 'detail remains' : 'details remain'} before your profile feels complete.`
            }
            icon={DashboardIcons.profile}
            badge={completeness.percent < 100 ? `${completeness.percent}%` : undefined}
            actionLabel="Edit profile"
            secondaryAction={
              publicState.canView && dashboardProfile.slug
                ? {
                    href: `/m/${dashboardProfile.slug}`,
                    label: 'View Public Profile',
                  }
                : undefined
            }
          />
          <DashboardCard
            href="/dashboard/projects"
            title="My Projects"
            description={
              projects.length === 0
                ? 'Start your first production.'
                : projects.length === 1
                  ? '1 active production.'
                  : 'Your productions and credited work are ready to manage.'
            }
            icon={DashboardIcons.projects}
            badge={projects.length === 1 ? '1 project' : undefined}
            actionLabel="Manage"
          />
          <DashboardCard
            href="/dashboard/matches"
            title="Matches"
            description={
              recentUnreadMatches > 0
                ? `${recentUnreadMatches} recent ${recentUnreadMatches === 1 ? 'opportunity matches' : 'opportunities match'} your profile.`
                : "We'll notify you when opportunities match your profile."
            }
            icon={DashboardIcons.matches}
            badge={recentUnreadMatches || undefined}
            actionLabel="View matches"
          />
          <DashboardCard
            href="/dashboard/applications"
            title="My Applications"
            description={
              applications.length === 0
                ? 'Roles you apply for will be gathered here.'
                : applications.length === 1
                  ? '1 application is moving through casting.'
                  : 'Your recent applications are ready to review.'
            }
            icon={DashboardIcons.applications}
            badge={applications.length === 1 ? '1 active' : applications.length > 1 ? 'Active' : undefined}
            actionLabel="Track applications"
          />
          <DashboardCard
            href="/casting-calls"
            title="Casting Calls"
            description="Discover productions looking for your particular craft."
            icon={DashboardIcons.castingCalls}
            actionLabel="Browse casting calls"
          />
          <DashboardCard
            href="/dashboard/stories"
            title="Spotlight"
            description={
              recentSpotlightInvites > 0
                ? 'A new invitation is waiting for your story.'
                : 'Share the story and perspective behind your work.'
            }
            icon={DashboardIcons.story}
            badge={recentSpotlightInvites > 0 ? 'Invitation' : undefined}
            actionLabel="View Spotlight"
          />
        </div>
      </section>

      <div className="mt-8">
        <CompletenessBar completeness={completeness} />
      </div>
    </div>
  );
}
