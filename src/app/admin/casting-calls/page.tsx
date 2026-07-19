import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminCastingCallsPage() {
  const supabase = await createClient();
  const { data: calls } = await supabase
    .from('casting_calls')
    .select(
      `id, project_title, role_name, role_size, status, created_at, published_at,
       poster:profiles!casting_calls_posted_by_fkey ( display_name, slug )`
    )
    .order('created_at', { ascending: false });

  return (
    <div>
      <p className="font-serif italic text-sm text-[#993C1D] mb-2">Editorial</p>
      <h1 className="font-serif text-3xl font-medium mb-2">All casting calls</h1>
      <p className="text-sm text-stone-600 mb-8">
        {calls?.length ?? 0} total
      </p>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Poster</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {calls?.map((c: any) => (
              <tr key={c.id} className="border-b border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-3">
                  <p className="font-serif font-medium">{c.role_name}</p>
                  <p className="text-xs text-stone-500">{c.project_title}</p>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/m/${c.poster?.slug}`}
                    className="font-serif italic text-[#712B13] hover:underline"
                  >
                    {c.poster?.display_name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-serif italic capitalize ${getStatusColor(c.status)}`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    draft: 'bg-stone-100 text-stone-600',
    pending_review: 'bg-amber-100 text-amber-800',
    open: 'bg-[#FAECE7] text-[#712B13]',
    closed: 'bg-stone-100 text-stone-500',
    rejected: 'bg-red-100 text-red-700',
  };
  return colors[status] ?? 'bg-stone-100 text-stone-700';
}
