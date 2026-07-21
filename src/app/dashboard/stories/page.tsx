import { createClient } from '@/lib/supabase/server';
import BackLink from '@/components/BackLink';
import Link from 'next/link';
import { hasPaidMembership } from '@/lib/billingServer';

export default async function MyStoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isMember = await hasPaidMembership(user!.id);

  const { data: myInterviews } = await supabase
    .from('interviews')
    .select('id, slug, title, status, created_at, published_at')
    .eq('subject_profile_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <BackLink href="/dashboard" label="Dashboard" />

      <p className="k-eyebrow mb-2">Your features</p>
      <h1 className="k-section-title mb-2">My Spotlight</h1>
      <p className="text-sm text-stone-600 italic font-serif mb-8">
        Interview requests, in-progress drafts, and published features about you.
      </p>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <p className="text-sm text-stone-600">
          {myInterviews?.length ?? 0} total
        </p>
        {isMember && (
          <Link
            href="/dashboard/stories/request"
            className="k-button k-button-primary"
          >
            + Request a feature
          </Link>
        )}
      </div>

      {!myInterviews || myInterviews.length === 0 ? (
        <div className="k-empty">
          <p className="font-serif italic text-stone-500 mb-4">
            No Spotlight interviews yet.
          </p>
          {isMember ? (
            <Link
              href="/dashboard/stories/request"
              className="text-[#712B13] font-serif italic hover:underline"
            >
              Request your first feature →
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="text-[#712B13] font-serif italic hover:underline"
            >
              Become a member to be eligible for features →
            </Link>
          )}
        </div>
      ) : (
        <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
          {myInterviews.map((i) => (
            <div key={i.id} className="py-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-serif font-medium">
                  {i.title ?? <span className="text-stone-400 italic">— interview pending —</span>}
                </p>
                <p className="text-xs text-stone-500 italic font-serif">
                  Requested {new Date(i.created_at).toLocaleDateString()}
                  {i.published_at && ` · Published ${new Date(i.published_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`k-badge capitalize ${
                  i.status === 'published' ? 'bg-[#FAECE7] text-[#712B13]' :
                  i.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                  'bg-stone-100 text-stone-700'
                }`}>
                  {i.status.replace('_', ' ')}
                </span>
                {i.status === 'published' && i.slug && (
                  <Link
                    href={`/stories/${i.slug}`}
                    className="text-[#712B13] text-sm hover:underline italic font-serif"
                  >
                    Read →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
