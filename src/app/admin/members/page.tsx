import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminMembersListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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

  const { data: members } = await supabase
    .from('profiles')
    .select(
      'id, display_name, slug, role_titles, role_category, custom_role_label, location_city, location_state, headshot_url, plan, approved, visible, verified, featured_at, created_at'
    )
    .order('created_at', { ascending: false });

  const total = members?.length ?? 0;

  return (
    <div>
      <p className="k-eyebrow mb-2">Directory</p>
      <h1 className="k-section-title mb-1">Members</h1>
      <p className="text-sm text-stone-600 italic font-serif mb-8">
        {total} total
      </p>

      {sp.error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {sp.error}
        </div>
      )}

      {(!members || members.length === 0) ? (
        <p className="font-serif italic text-stone-500 text-center py-12">
          No members yet.
        </p>
      ) : (
        <div className="k-card overflow-x-auto">
          <table className="w-full min-w-[58rem]">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr className="text-left">
                <th className="px-4 py-3 w-16"></th>
                <th className="px-4 py-3 font-serif italic text-xs text-stone-600 font-normal">Name</th>
                <th className="px-4 py-3 font-serif italic text-xs text-stone-600 font-normal">Role</th>
                <th className="px-4 py-3 font-serif italic text-xs text-stone-600 font-normal">Eligibility</th>
                <th className="px-4 py-3 font-serif italic text-xs text-stone-600 font-normal">Plan</th>
                <th className="px-4 py-3 font-serif italic text-xs text-stone-600 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const role =
                  (m.role_titles ?? [])[0] ??
                  (m.role_category === 'crew_other'
                    ? m.custom_role_label
                    : m.role_category?.replace('_', ' '));
                return (
                  <tr key={m.id} className="border-b border-stone-100 last:border-b-0 hover:bg-[#FAECE7]/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/members/${m.id}`}>
                        <div className="w-10 h-12 bg-[#FAECE7] rounded overflow-hidden">
                          {m.headshot_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={m.headshot_url}
                              alt={m.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/members/${m.id}`} className="hover:text-[#712B13] transition-colors">
                        <span className="font-serif text-stone-900 flex items-center gap-1.5">
                          {m.display_name}
                          {m.verified && (
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-[#712B13] text-white rounded-full text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                          {m.featured_at && (
                            <span title="Featured" className="text-[#FAC775] text-sm">★</span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-serif text-stone-700 text-sm capitalize">
                        {role ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`k-badge ${m.approved ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
                          {m.approved ? 'Approved' : 'Pending'}
                        </span>
                        <span className={`k-badge ${m.visible ? 'bg-blue-50 text-blue-800' : 'bg-stone-100 text-stone-600'}`}>
                          {m.visible ? 'Public' : 'Hidden'}
                        </span>
                        {m.featured_at && (
                          <span className="k-badge bg-[#FAECE7] text-[#712B13]">
                            {m.approved && m.visible ? 'Featured' : 'Ineligible'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs italic px-2 py-0.5 rounded-full font-serif ${
                          m.plan === 'member'
                            ? 'bg-[#FAECE7] text-[#712B13] border border-[#FAC775]'
                            : 'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}
                      >
                        {m.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-serif text-stone-500 text-xs">
                        {new Date(m.created_at).toLocaleDateString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
