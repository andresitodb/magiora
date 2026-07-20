import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletterPage() {
  const supabase = await createClient();

  const { data: signups } = await supabase
    .from('newsletter_signups')
    .select('id, email, created_at, source, unsubscribed_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  const active = (signups ?? []).filter((s) => !s.unsubscribed_at);
  const unsubscribed = (signups ?? []).filter((s) => s.unsubscribed_at);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="font-serif italic text-sm text-[#993C1D] mb-2">The mailing list</p>
          <h1 className="font-serif text-3xl font-medium">Newsletter signups</h1>
        </div>
        <a
          href="/admin/newsletter/export.csv"
          className="bg-stone-800 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-stone-900"
        >
          Export CSV
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-stone-50 border border-stone-200 rounded-md p-4">
          <p className="text-xs italic font-serif text-stone-500">Total active</p>
          <p className="font-serif text-3xl font-medium">{active.length}</p>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-md p-4">
          <p className="text-xs italic font-serif text-stone-500">This month</p>
          <p className="font-serif text-3xl font-medium">
            {
              active.filter((s) => {
                const d = new Date(s.created_at);
                const now = new Date();
                return (
                  d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                );
              }).length
            }
          </p>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-md p-4">
          <p className="text-xs italic font-serif text-stone-500">Unsubscribed</p>
          <p className="font-serif text-3xl font-medium">{unsubscribed.length}</p>
        </div>
      </div>

      {active.length === 0 ? (
        <p className="font-serif italic text-stone-500 text-center py-12">
          No signups yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-stone-700">
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Source</th>
              <th className="py-2 font-medium">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {active.map((s) => (
              <tr key={s.id} className="border-b border-stone-700/40 hover:bg-stone-800/40">
                <td className="py-2 font-mono text-xs">{s.email}</td>
                <td className="py-2 text-stone-400 italic font-serif text-xs">{s.source}</td>
                <td className="py-2 text-stone-400 italic font-serif text-xs">
                  {new Date(s.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
