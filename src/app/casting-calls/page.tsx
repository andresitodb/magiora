import { createClient } from '@/lib/supabase/server';
import Nav from '@/components/Nav';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CastingCallsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: calls } = await supabase
    .from('casting_calls')
    .select(
      'id, project_title, project_type, role_name, role_size, role_description, location_city, location_state, application_deadline, target_role_category, compensation, published_at'
    )
    .eq('status', 'open')
    .or(`application_deadline.is.null,application_deadline.gte.${new Date().toISOString().slice(0, 10)}`)
    .order('published_at', { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2 gap-2">
          <div>
            <p className="font-serif italic text-sm text-[#993C1D] mb-2">Now casting</p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium">Casting Calls</h1>
          </div>
          <p className="text-sm text-stone-500 italic font-serif">
            {calls?.length ?? 0} {(calls?.length ?? 0) === 1 ? 'role open' : 'roles open'}
          </p>
        </div>
        <p className="font-serif italic text-base md:text-lg text-stone-600 mb-8 max-w-2xl">
          Open roles in indie cinema. Browse and apply directly.
        </p>

        {!user && (
          <div className="bg-white border border-[#FAC775] rounded-md p-4 mb-6 flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-serif text-sm">
                <span className="italic text-[#993C1D]">Browse mode.</span>{' '}
                Sign up free to open call details and apply.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/login?next=/casting-calls"
                className="text-sm text-[#712B13] hover:underline font-medium whitespace-nowrap py-1.5"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-[#712B13] text-white text-sm py-1.5 px-4 rounded-md hover:bg-[#4A1B0C] whitespace-nowrap font-medium"
              >
                Join free
              </Link>
            </div>
          </div>
        )}

        {!calls || calls.length === 0 ? (
          <div className="text-center py-16 border-t border-stone-200">
            <p className="font-serif italic text-stone-500">
              No open casting calls right now. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call: any) => {
              const deadline = call.application_deadline
                ? new Date(call.application_deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : null;

              const href = `/casting-calls/${call.id}`;

              return (
                <Link
                  key={call.id}
                  href={href}
                  className="block p-5 bg-white border border-stone-200 rounded-md hover:border-[#712B13] transition-colors group"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif italic text-xs text-stone-500 mb-1 capitalize">
                        {call.project_type?.replace('_', ' ')} · {call.role_size?.replace('_', ' ')}
                      </p>
                      <h3 className="font-serif text-xl font-medium group-hover:text-[#712B13] transition-colors">
                        {call.role_name}
                        <span className="text-stone-500 font-normal italic"> in </span>
                        {call.project_title}
                      </h3>
                      {user && call.role_description && (
                        <p className="text-sm text-stone-600 mt-2 line-clamp-2 italic font-serif">
                          {call.role_description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 italic font-serif mt-3">
                        {(call.location_city || call.location_state) && (
                          <span>
                            📍 {call.location_city}
                            {call.location_city && call.location_state && ', '}
                            {call.location_state}
                          </span>
                        )}
                        {user && call.compensation && <span>💰 {call.compensation}</span>}
                        {deadline && <span>⏰ Applies by {deadline}</span>}
                      </div>
                    </div>
                    {!user && (
                      <span className="text-xs italic font-serif text-[#993C1D] flex-shrink-0">
                        Sign in to apply
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
