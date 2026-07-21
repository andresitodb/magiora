import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { hasPaidMembership } from '@/lib/billingServer';

type CastingApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  casting_call: {
    id: string;
    project_title: string;
    role_name: string;
  };
};

export default async function MyCastingCallsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; draft?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isMember = await hasPaidMembership(user!.id);

  const { data: myCalls } = await supabase
    .from('casting_calls')
    .select('id, project_title, role_name, status, created_at, application_deadline')
    .eq('posted_by', user!.id)
    .order('created_at', { ascending: false });

  const { data: myApplications } = await supabase
    .from('applications')
    .select(
      `id, status, created_at,
       casting_call:casting_calls (id, project_title, role_name, application_deadline)`
    )
    .eq('applicant_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <p className="k-eyebrow mb-2">Your activity</p>
      <h1 className="k-section-title mb-8">Casting calls</h1>

      {(params.submitted || params.draft) && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3 mb-6">
          {params.submitted
            ? 'Submitted for review. You\'ll see it on the public site once approved.'
            : 'Saved as draft.'}
        </div>
      )}

      <section className="mb-12">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="font-serif text-xl font-medium">Posted by you</h2>
          {isMember && (
            <Link
              href="/dashboard/casting-calls/new"
              className="k-button k-button-primary"
            >
              + Post new
            </Link>
          )}
        </div>

        {!isMember ? (
          <p className="text-sm text-stone-500 italic font-serif">
            Become a member to post casting calls.
          </p>
        ) : !myCalls || myCalls.length === 0 ? (
          <p className="text-sm text-stone-500 italic font-serif">
            You haven&apos;t posted any casting calls yet.
          </p>
        ) : (
          <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
            {myCalls.map((call) => (
              <Link
                key={call.id}
                href={`/dashboard/casting-calls/${call.id}`}
                className="py-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-stone-50 -mx-3 px-3"
              >
                <div>
                  <p className="font-serif font-medium">{call.role_name}</p>
                  <p className="text-sm text-stone-600">{call.project_title}</p>
                </div>
                <div className="sm:text-right">
                  <StatusBadge status={call.status} />
                  <p className="text-xs text-stone-500 mt-1">
                    {new Date(call.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl font-medium mb-4">Your applications</h2>
        {!myApplications || myApplications.length === 0 ? (
          <p className="text-sm text-stone-500 italic font-serif">
            You haven&apos;t applied to any casting calls yet.{' '}
            <Link href="/casting-calls" className="text-[#712B13]">
              Browse open calls →
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
            {(myApplications as unknown as CastingApplicationRow[]).map((app) => (
              <Link
                key={app.id}
                href={`/casting-calls/${app.casting_call.id}`}
                className="py-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-stone-50 -mx-3 px-3"
              >
                <div>
                  <p className="font-serif font-medium">
                    {app.casting_call.role_name}
                  </p>
                  <p className="text-sm text-stone-600">
                    {app.casting_call.project_title}
                  </p>
                </div>
                <div className="sm:text-right">
                  <StatusBadge status={app.status} />
                  <p className="text-xs text-stone-500 mt-1">
                    Applied {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-stone-100 text-stone-700',
    pending_review: 'bg-amber-100 text-amber-800',
    open: 'bg-[#FAECE7] text-[#712B13]',
    closed: 'bg-stone-100 text-stone-500',
    rejected: 'bg-red-100 text-red-700',
    submitted: 'bg-stone-100 text-stone-700',
    viewed: 'bg-blue-100 text-blue-800',
    shortlisted: 'bg-green-100 text-green-800',
    cast: 'bg-emerald-100 text-emerald-800',
  };
  return (
    <span
      className={`k-badge capitalize ${
        colors[status] ?? 'bg-stone-100 text-stone-700'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
