import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { toggleApproved, toggleVerified, inviteForInterview, toggleFeatured } from './actions';
import { getLanguageName } from '@/lib/languages';

export const dynamic = 'force-dynamic';

export default async function AdminMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    error?: string;
    invited?: string;
    featured?: string;
    name?: string;
  }>;
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
    <div className="max-w-3xl text-stone-900">
      <Link
        href="/admin/members"
        className="text-sm text-stone-600 italic font-serif hover:text-[#712B13] mb-6 inline-block"
      >
        ← All members
      </Link>

      {sp.saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3 mb-6 font-serif">
          Saved.
        </div>
      )}
      {sp.invited && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-md p-3 mb-6 font-serif">
          {profile.display_name} has been invited for an interview. They&apos;ll see it in their dashboard.
        </div>
      )}
      {sp.featured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-md p-3 mb-6 font-serif">
          {sp.featured === 'on'
            ? `${sp.name || profile.display_name} is now Featured on Home.`
            : `${profile.display_name} is no longer featured.`}
        </div>
      )}
      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="grid grid-cols-[120px_1fr] gap-6 mb-8">
        <div className="aspect-[4/5] bg-stone-100 rounded-md overflow-hidden">
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
          <p className="k-eyebrow mb-1 capitalize">
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
          <p className="text-sm text-stone-600 italic font-serif">
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
            className="text-xs text-[#712B13] italic font-serif hover:underline mt-2 inline-block"
          >
            View public profile ↗
          </Link>
        </div>
      </div>

      {profile.bio && (
        <div className="mb-8">
          <p className="k-eyebrow mb-2">Bio</p>
          <p className="font-serif text-stone-700 leading-relaxed whitespace-pre-line text-sm">
            {profile.bio}
          </p>
        </div>
      )}

      {profile.languages?.length > 0 && (
        <div className="mb-8 text-sm">
          <p className="k-eyebrow mb-2">Languages</p>
          <p className="font-serif text-stone-700">
            {profile.languages.map(getLanguageName).join(' · ')}
          </p>
        </div>
      )}

      {/* Admin actions */}
      <div className="border-t border-stone-300 pt-6 mb-8 space-y-4">
        <p className="k-eyebrow">Admin actions</p>

        <form action={toggleApproved} className="k-card flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <input type="hidden" name="member_id" value={profile.id} />
          <input type="hidden" name="new_value" value={profile.approved ? 'false' : 'true'} />
          <div>
            <p className="font-serif">Directory approval</p>
            <p className="text-xs italic text-stone-500 font-serif">
              Approved profiles can appear in Directory and become eligible for Home.
            </p>
          </div>
          <button
            type="submit"
            className={`py-2 px-4 rounded-md text-sm font-medium cursor-pointer ${
              profile.approved
                ? 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                : 'bg-[#712B13] text-white hover:bg-[#5d230f]'
            }`}
          >
            {profile.approved ? 'Move to pending' : 'Approve profile'}
          </button>
        </form>

        <form action={toggleVerified} className="k-card flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <input type="hidden" name="member_id" value={profile.id} />
          <input type="hidden" name="new_value" value={profile.verified ? 'false' : 'true'} />
          <div>
            <p className="font-serif">Verified badge</p>
            <p className="text-xs italic text-stone-500 font-serif">
              Shows a ✓ next to their name across the site.
            </p>
          </div>
          <button
            type="submit"
            className={`py-2 px-4 rounded-md text-sm font-medium cursor-pointer ${
              profile.verified
                ? 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                : 'bg-[#712B13] text-white hover:bg-[#5d230f]'
            }`}
          >
            {profile.verified ? 'Remove verified' : 'Mark as verified'}
          </button>
        </form>

        <form action={toggleFeatured} className="k-card flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <input type="hidden" name="profile_id" value={profile.id} />
          <input type="hidden" name="action" value={isFeatured ? 'unfeature' : 'feature'} />
          <div>
            <p className="font-serif">Featured on home</p>
            <p className="text-xs italic text-stone-500 font-serif">
              Show this profile in Featured Professionals.
              {!isFeatured && (!profile.visible || !profile.approved) && (
                <> The profile must be approved and public first.</>
              )}
              {isFeatured && profile.featured_at && (
                <> Featured since {new Date(profile.featured_at).toLocaleDateString()}.</>
              )}
            </p>
          </div>
          <button
            type="submit"
            disabled={!isFeatured && (!profile.visible || !profile.approved)}
            className={`py-2 px-4 rounded-md text-sm font-medium cursor-pointer ${
              isFeatured
                ? 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                : 'bg-[#FAC775] text-stone-900 hover:bg-[#f0b85e] disabled:cursor-not-allowed disabled:opacity-50'
            }`}
          >
            {isFeatured ? '★ Featured — remove' : '☆ Feature on home'}
          </button>
        </form>

        <form
          action={inviteForInterview}
          className="k-card p-4 space-y-3"
        >
          <input type="hidden" name="member_id" value={profile.id} />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif">Invite for an interview</p>
              <p className="text-xs italic text-stone-500 font-serif">
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
              className="k-control"
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
        <div className="border-t border-stone-300 pt-6">
          <p className="k-eyebrow mb-3">
            Interview history
          </p>
          <div className="space-y-2">
            {interviews.map((i) => (
              <div
                key={i.id}
                className="k-card flex items-center justify-between p-3"
              >
                <div>
                  <p className="font-serif text-sm">{i.title ?? 'Untitled'}</p>
                  <p className="text-xs italic text-stone-500 font-serif">
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
                    className="text-xs text-[#712B13] italic font-serif hover:underline whitespace-nowrap"
                  >
                    View ↗
                  </Link>
                ) : (
                  <Link
                    href={`/admin/stories/${i.id}`}
                    className="text-xs text-[#712B13] italic font-serif hover:underline whitespace-nowrap"
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
