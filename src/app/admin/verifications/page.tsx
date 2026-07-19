import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { approveVerified, rejectVerified } from './actions';
import VerificationDocViewer from '@/components/admin/VerificationDocViewer';

export const dynamic = 'force-dynamic';

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
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

  const { data: pending } = await supabase
    .from('profiles')
    .select('id, display_name, slug, headshot_url, role_titles, role_category, verification_data, verification_status')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true });

  return (
    <div className="text-stone-200 max-w-5xl">
      <p className="font-serif italic text-xs text-amber-400 mb-2">Queue</p>
      <h1 className="font-serif text-3xl font-medium mb-1">Verification requests</h1>
      <p className="text-sm text-stone-400 italic font-serif mb-8">
        {pending?.length ?? 0} pending
      </p>

      {sp.saved && (
        <div className="bg-green-900/40 border border-green-700 text-green-100 text-sm rounded-md p-3 mb-6 font-serif">
          {sp.saved === 'approved' ? 'User verified.' : 'Request rejected.'}
        </div>
      )}
      {sp.error && (
        <div className="bg-red-900/40 border border-red-700 text-red-100 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      {(!pending || pending.length === 0) ? (
        <p className="font-serif italic text-stone-500 text-center py-12">
          Nothing in the queue.
        </p>
      ) : (
        <div className="space-y-6">
          {pending.map((p: any) => {
            const data = p.verification_data ?? {};
            const submitted = data.submitted_at
              ? new Date(data.submitted_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : '—';

            return (
              <div key={p.id} className="bg-stone-900/40 border border-stone-700 rounded-md p-5">
                <div className="flex items-start gap-4 mb-4">
                  <Link href={`/admin/members/${p.id}`}>
                    {p.headshot_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.headshot_url}
                        alt={p.display_name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 italic font-serif text-xl flex-shrink-0">
                        {(p.display_name?.[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1">
                    <Link
                      href={`/admin/members/${p.id}`}
                      className="font-serif text-xl font-medium hover:text-amber-400 transition-colors"
                    >
                      {p.display_name}
                    </Link>
                    <p className="text-xs italic font-serif text-stone-400 capitalize">
                      {(p.role_titles ?? []).join(' · ') ||
                        p.role_category?.replace('_', ' ')}
                    </p>
                    <p className="text-xs italic font-serif text-stone-500 mt-1">
                      Submitted {submitted}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6">
                  {/* Evidence */}
                  <div className="space-y-3 text-sm">
                    {data.imdb_url && (
                      <div>
                        <p className="font-serif italic text-xs text-amber-400 mb-1">IMDb</p>
                        <a
                          href={data.imdb_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-200 hover:text-amber-400 hover:underline break-all"
                        >
                          {data.imdb_url} ↗
                        </a>
                      </div>
                    )}
                    {data.credit_urls && data.credit_urls.length > 0 && (
                      <div>
                        <p className="font-serif italic text-xs text-amber-400 mb-1">Credits</p>
                        <ul className="space-y-1">
                          {data.credit_urls.map((url: string, i: number) => (
                            <li key={i}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-stone-200 hover:text-amber-400 hover:underline break-all"
                              >
                                {url} ↗
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.note && (
                      <div>
                        <p className="font-serif italic text-xs text-amber-400 mb-1">Note from applicant</p>
                        <p className="font-serif text-stone-300 italic">
                          &ldquo;{data.note}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ID photo */}
                  <div>
                    <p className="font-serif italic text-xs text-amber-400 mb-1">ID photo</p>
                    {data.id_photo_url ? (
                      <VerificationDocViewer storagePath={data.id_photo_url} />
                    ) : (
                      <p className="text-xs italic text-stone-500 font-serif">No photo uploaded</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-stone-700 flex flex-col md:flex-row md:items-center gap-3 md:justify-end">
                  <form action={rejectVerified} className="flex-1 md:flex-initial flex gap-2">
                    <input type="hidden" name="profile_id" value={p.id} />
                    <input
                      type="text"
                      name="rejection_reason"
                      placeholder="Reason (optional, visible to user)"
                      className="flex-1 md:w-72 px-3 py-1.5 bg-stone-900 border border-stone-700 rounded text-xs text-stone-200"
                    />
                    <button
                      type="submit"
                      className="bg-stone-700 text-stone-200 text-xs py-1.5 px-3 rounded hover:bg-stone-600 cursor-pointer whitespace-nowrap"
                    >
                      Reject
                    </button>
                  </form>

                  <form action={approveVerified}>
                    <input type="hidden" name="profile_id" value={p.id} />
                    <button
                      type="submit"
                      className="bg-amber-400 text-stone-900 text-xs py-1.5 px-4 rounded font-medium hover:bg-amber-300 cursor-pointer"
                    >
                      Approve verified ✓
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
