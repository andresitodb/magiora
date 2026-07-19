import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { toggleVerified, inviteForInterview, toggleFeatured } from './actions';
import { getLanguageName } from '@/lib/languages';

export const dynamic = 'force-dynamic';

export default async function AdminMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; invited?: string; featured?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!me?.is_admin) redirect('/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!profile) notFound();

  // Existing interviews for this member
  const { data: interviews } = await supabase
    .from('interviews')
    .select('id, title, status, invited_by_admin, created_at, published_at, slug')
    .eq('subject_profile_id', profile.id)
    .order('created_at', { ascending: false });

  const hasActiveInvite = interviews?.some(
    (i) => i.invited_by_admin && ['in_progress', 'pending_review'].includes(i.status)
  );

  const isFeatured = !!profile.featured_at;

  return (
    <div className="max-w-3xl text-stone-200">
      <Link
        href="/admin/members"
        className="text-sm text-stone-400 italic font-serif hover:text-white mb-6 inline-block"
      >
        ← All members
      </Link>

      {sp.saved && (
        <div className="bg-green-900/40 border border-green-700 text-green-100 text-sm rounded-md p-3 mb-6 font-serif">
          Saved.
        </div>
      )}
      {sp.invited && (
        <div className="bg-blue-900/40 border border-blue-700 text-blue-100 text-sm rounded-md p-3 mb-6 font-serif">
          {profile.display_name} has been invited for an interview. They&apos;ll see it in their dashboard.
        </div>
      )}
      {sp.featured && (
        <div className="bg-amber-900/40 border border-amber-700 text-amber-100 text-sm rounded-md p-3 mb-6 font-serif">
          {sp.featured === 'on'
            ? `${profile.display_name} is now featured on the home page.`
            : `${profile.display_name} is no longer featured.`}
        </div>
      )}
      {sp.error && (
        <div className="bg-red-900/40 border border-red-700 text-red-100 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="grid grid-cols-[120px_1fr] gap-6 mb-8">
        <div className="aspect-[4/5] bg-stone-800 rounded-md overflow-hidden">
          {profile.headshot_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={profile.headshot_url} alt={profile.display_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-600 italic font-serif">
              No photo
            </div>
          )}
        </div>
        <div>
          <p className="font-serif italic text-xs text-amber-400 mb-1 capitalize">
            {(profile.role_titles ?? []).join(' · ') ||
              profile.role_category?.replace('_', ' ')}
          </p>
          <h1 className="font-serif text-3xl font-medium mb-2 flex items-center gap-2">
            {profile.display_name}
            {profile.verified && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-400 text-stone-900 rounded-full text-xs font-bold">
                ✓
              </span>
            )}
            {isFeatured && (
              <span
                title={`Featured since ${new Date(profile.featured_at).toLocaleDateString()}`}
                className="inline-flex items-center justify-center w-5 h-5 bg-[#FAC775] text-stone-900 rounded-full text-xs"
              >
                ★
              </span>
            )}
          </h1>
          <p className="text-sm text-stone-400 italic font-serif">
            {profile.location_city}
            {profile.location_state && `, ${profile.location_state}`}
            {' · '}
            <span className="capitalize">{profile.plan}</span>
            {' · '}
            {profile.approved ? 'Approved' : 'Pending'}
            {' · '}
            {profile.visible ? 'Public' : 'Hidden'}
          </p>
          <p className="text-xs text-stone-500 mt-1 font-mono">{profile.id}</p>
          <Link
            href={`/m/${profile.slug}`}
            target="_blank"
            className="text-xs text-amber-400 italic font-serif hover:underline mt-2 inline-block"
          >
            View public profile ↗
          </Link>
        </div>
      </div>

      {profile.bio && (
        <div className="mb-8">
          <p className="font-serif italic text-xs text-amber-400 mb-2">Bio</p>
          <p className="font-serif text-stone-300 leading-relaxed whitespace-pre-line text-sm">
            {profile.bio}
          </p>
        </div>
      )}

      {profile.languages?.length > 0 && (
        <div className="mb-8 text-sm">
          <p className="font-serif italic text-xs text-amber-400 mb-2">Languages</p>
          <p className="font-serif text-stone-300">
            {profile.languages.map(getLanguageName).join(' · ')}
          </p>
        </div>
      )}

      {/* Admin actions */}
      <div className="border-t border-stone-700 pt-6 mb-8 space-y-4">
        <p className="font-serif italic text-xs text-amber-400">Admin actions</p>

        <form action={toggleVerified} className="flex items-center justify-between bg-stone-800/40 border border-stone-700 rounded-md p-4">
          <input type="hidden" name="member_id" value={profile.id} />
          <input type="hidden" name="new_value" value={profile.verified ? 'false' : 'true'} />
          <div>
            <p className="font-serif">Verified badge</p>
            <p className="text-xs italic text-stone-400 font-serif">
              Shows a ✓ next to their name across the site.
            </p>
          </div>
          <button
            type="submit"
            className={`py-2 px-4 rounded-md text-sm font-medium cursor-pointer ${
              profile.verified
                ? 'bg-stone-700 text-stone-200 hover:bg-stone-600'
                : 'bg-amber-400 text-stone-900 hover:bg-amber-300'
            }`}
          >
            {profile.verified ? 'Remove verified' : 'Mark as verified'}
          </button>
        </form>

        <form action={toggleFeatured} className="flex items-center justify-between bg-stone-800/40 border border-stone-700 rounded-md p-4">
          <input type="hidden" name="profile_id" value={profile.id} />
          <input type="hidden" name="action" value={isFeatured ? 'unfeature' : 'feature'} />
          <div>
            <p className="font-serif">Featured on home</p>
            <p className="text-xs italic text-stone-400 font-serif">
              Show this profile in the &ldquo;Featured this week&rdquo; section.
              {isFeatured && profile.featured_at && (
                <> Featured since {new Date(profile.featured_at).toLocaleDateString()}.</>
              )}
            </p>
          </div>
          <button
            type="submit"
            className={`py-2 px-4 rounded-md text-sm font-medium cursor-pointer ${
              isFeatured
                ? 'bg-stone-700 text-stone-200 hover:bg-stone-600'
                : 'bg-[#FAC775] text-stone-900 hover:bg-[#f0b85e]'
            }`}
          >
            {isFeatured ? '★ Featured — remove' : '☆ Feature on home'}
          </button>
        </form>

        <form
          action={inviteForInterview}
          className="bg-stone-800/40 border border-stone-700 rounded-md p-4 space-y-3"
        >
          <input type="hidden" name="member_id" value={profile.id} />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif">Invite for an interview</p>
              <p className="text-xs italic text-stone-400 font-serif">
                Creates a draft. They&apos;ll fill out the Q&amp;A from their dashboard.
              </p>
            </div>
            {hasActiveInvite && (
              <span className="text-xs italic text-amber-400 font-serif">
                Active invite exists
              </span>
            )}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              name="working_title"
              required
              placeholder="Working title (e.g. 'On the slow road to first features')"
              className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-md text-sm text-stone-200"
            />
            <button
              type="submit"
              className="bg-amber-400 text-stone-900 py-2 px-4 rounded-md text-sm font-medium hover:bg-amber-300 cursor-pointer whitespace-nowrap"
            >
              Send invite →
            </button>
          </div>
        </form>
      </div>

      {/* Existing interviews */}
      {interviews && interviews.length > 0 && (
        <div className="border-t border-stone-700 pt-6">
          <p className="font-serif italic text-xs text-amber-400 mb-3">
            Interview history
          </p>
          <div className="space-y-2">
            {interviews.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between bg-stone-800/40 border border-stone-700 rounded-md p-3"
              >
                <div>
                  <p className="font-serif text-sm">{i.title ?? 'Untitled'}</p>
                  <p className="text-xs italic text-stone-400 font-serif">
                    {i.invited_by_admin && 'Admin-invited · '}
                    Status: <span className="capitalize">{i.status.replace('_', ' ')}</span>
                    {i.published_at &&
                      ` · Published ${new Date(i.published_at).toLocaleDateString()}`}
                  </p>
                </div>
                {i.status === 'published' && i.slug ? (
                  <Link
                    href={`/stories/${i.slug}`}
                    target="_blank"
                    className="text-xs text-amber-400 italic font-serif hover:underline whitespace-nowrap"
                  >
                    View ↗
                  </Link>
                ) : (
                  <Link
                    href={`/admin/stories/${i.id}`}
                    className="text-xs text-amber-400 italic font-serif hover:underline whitespace-nowrap"
                  >
                    Edit →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
