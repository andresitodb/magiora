import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminMembersListPage() {
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
    <div className="text-stone-200">
      <p className="font-serif italic text-xs text-amber-400 mb-2">Directory</p>
      <h1 className="font-serif text-3xl font-medium mb-1">Members</h1>
      <p className="text-sm text-stone-400 italic font-serif mb-8">
        {total} total
      </p>

      {(!members || members.length === 0) ? (
        <p className="font-serif italic text-stone-500 text-center py-12">
          No members yet.
        </p>
      ) : (
        <div className="bg-stone-900/40 border border-stone-700 rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-800/40 border-b border-stone-700">
              <tr className="text-left">
                <th className="px-4 py-3 w-16"></th>
                <th className="px-4 py-3 font-serif italic text-xs text-stone-400 font-normal">Name</th>
                <th className="px-4 py-3 font-serif italic text-xs text-stone-400 font-normal hidden md:table-cell">Role</th>
                <th className="px-4 py-3 font-serif italic text-xs text-stone-400 font-normal hidden lg:table-cell">Location</th>
                <th className="px-4 py-3 font-serif italic text-xs text-stone-400 font-normal">Plan</th>
                <th className="px-4 py-3 font-serif italic text-xs text-stone-400 font-normal hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => {
                const role =
                  (m.role_titles ?? [])[0] ??
                  (m.role_category === 'crew_other'
                    ? m.custom_role_label
                    : m.role_category?.replace('_', ' '));
                return (
                  <tr key={m.id} className="border-b border-stone-800 last:border-b-0 hover:bg-stone-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/members/${m.id}`}>
                        <div className="w-10 h-12 bg-[#FAECE7]/20 rounded overflow-hidden">
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
                      <Link href={`/admin/members/${m.id}`} className="hover:text-amber-400 transition-colors">
                        <span className="font-serif text-stone-200 flex items-center gap-1.5">
                          {m.display_name}
                          {m.verified && (
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-amber-400 text-stone-900 rounded-full text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                          {m.featured_at && (
                            <span title="Featured" className="text-[#FAC775] text-sm">★</span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-serif text-stone-300 text-sm capitalize">
                        {role ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-serif text-stone-400 text-sm">
                        {m.location_city ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs italic px-2 py-0.5 rounded-full font-serif ${
                          m.plan === 'member'
                            ? 'bg-[#FAECE7]/20 text-[#FAC775] border border-[#FAC775]/30'
                            : 'bg-stone-800 text-stone-400 border border-stone-700'
                        }`}
                      >
                        {m.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
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
