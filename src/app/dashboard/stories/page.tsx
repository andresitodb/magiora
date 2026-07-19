import { createClient } from '@/lib/supabase/server';
import BackLink from '@/components/BackLink';
import Link from 'next/link';

export default async function MyStoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user!.id)
    .single();
  const isMember = profile?.plan === 'member';

  const { data: myInterviews } = await supabase
    .from('interviews')
    .select('id, slug, title, status, created_at, published_at')
    .eq('subject_profile_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <BackLink href="/dashboard" label="Dashboard" />

      <p className="font-serif italic text-sm text-[#993C1D] mb-2">Your features</p>
      <h1 className="font-serif text-3xl font-medium mb-2">My stories</h1>
      <p className="text-sm text-stone-600 italic font-serif mb-8">
        Interview requests, in-progress drafts, and published features about you.
      </p>

      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-stone-600">
          {myInterviews?.length ?? 0} total
        </p>
        {isMember && (
          <Link
            href="/dashboard/stories/request"
            className="text-sm bg-[#712B13] text-white py-2 px-4 rounded-md hover:bg-[#4A1B0C]"
          >
            + Request a feature
          </Link>
        )}
      </div>

      {!myInterviews || myInterviews.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-lg p-8 text-center">
          <p className="font-serif italic text-stone-500 mb-4">
            No stories yet.
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
            <div key={i.id} className="py-4 flex items-center justify-between">
              <div>
                <p className="font-serif font-medium">
                  {i.title ?? <span className="text-stone-400 italic">— interview pending —</span>}
                </p>
                <p className="text-xs text-stone-500 italic font-serif">
                  Requested {new Date(i.created_at).toLocaleDateString()}
                  {i.published_at && ` · Published ${new Date(i.published_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-serif italic capitalize ${
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
