import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BackLink from '@/components/BackLink';
import EmptyState from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Submitted', color: 'bg-stone-100 text-stone-700 border-stone-200' },
  viewed: { label: 'Viewed', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  shortlisted: { label: 'Shortlisted', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  rejected: { label: 'Not selected', color: 'bg-stone-50 text-stone-500 border-stone-200' },
  cast: { label: 'Cast', color: 'bg-green-50 text-green-800 border-green-200' },
};

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  casting_call: {
    id: string;
    project_title: string;
    role_name: string;
    role_size: string | null;
    location_city: string | null;
    location_state: string | null;
    status: string;
  } | null;
};

export default async function MyApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: applications } = await supabase
    .from('applications')
    .select(
      `id, status, cover_note, self_tape_url, created_at, viewed_at,
       casting_call:casting_calls(id, project_title, role_name, role_size,
         location_city, location_state, application_deadline, status)`
    )
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false });

  const grouped: { active: ApplicationRow[]; closed: ApplicationRow[] } = {
    active: [],
    closed: [],
  };

  for (const app of (applications ?? []) as unknown as ApplicationRow[]) {
    if (app.status === 'rejected' || app.casting_call?.status === 'closed') {
      grouped.closed.push(app);
    } else {
      grouped.active.push(app);
    }
  }

  return (
    <div className="max-w-4xl">
      <BackLink href="/dashboard" label="Dashboard" />

      <div className="mb-8">
        <p className="k-eyebrow mb-2">Track your submissions</p>
        <h1 className="k-section-title">My applications</h1>
      </div>

      {(!applications || applications.length === 0) ? (
        <EmptyState
          icon="application"
          title="No applications yet"
          body="You haven't applied to any casting calls yet. Browse open roles and apply — your applications and their status will appear here."
          ctaHref="/casting-calls"
          ctaLabel="Browse casting calls"
        />
      ) : (
        <>
          {grouped.active.length > 0 && (
            <section className="mb-12">
              <h2 className="font-serif italic text-sm text-stone-600 mb-4">Active applications</h2>
              <div className="space-y-3">
                {grouped.active.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </section>
          )}

          {grouped.closed.length > 0 && (
            <section>
              <h2 className="font-serif italic text-sm text-stone-600 mb-4">Closed</h2>
              <div className="space-y-3 opacity-75">
                {grouped.closed.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ApplicationCard({ app }: { app: ApplicationRow }) {
  const call = app.casting_call;
  if (!call) return null;

  const statusInfo = STATUS_LABELS[app.status] ?? STATUS_LABELS.submitted;
  const submittedDate = new Date(app.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/casting-calls/${call.id}`}
      className="k-card k-card-interactive block p-4"
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-serif italic text-xs text-stone-500 mb-1 capitalize">
            {call.role_size?.replace('_', ' ')} role
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
          <span className={`k-badge border ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <p className="text-xs text-stone-400 italic font-serif">Applied {submittedDate}</p>
        </div>
      </div>
    </Link>
  );
}
