import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminStoriesPage() {
  const supabase = await createClient();

  const { data: interviews } = await supabase
    .from('interviews')
    .select(
      `id, title, slug, status, created_at, published_at, request_note,
       subject:profiles!interviews_subject_profile_id_fkey ( display_name, slug, role_category )`
    )
    .order('created_at', { ascending: false });

  return (
    <div>
      <p className="font-serif italic text-sm text-[#993C1D] mb-2">Editorial</p>
      <h1 className="font-serif text-3xl font-medium mb-2">Stories</h1>
      <p className="text-sm text-stone-600 mb-8">
        {interviews?.length ?? 0} total · requests, drafts, and published features
      </p>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Subject</th>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(interviews ?? []).map((i: any) => (
              <tr key={i.id} className="border-b border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-3">
                  <p className="font-serif italic text-[#712B13]">{i.subject.display_name}</p>
                  <p className="text-xs text-stone-500 capitalize">
                    {i.subject.role_category.replace('_', ' ')}
                  </p>
                </td>
                <td className="px-4 py-3 font-serif">
                  {i.title ?? <span className="text-stone-400 italic">— untitled —</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-serif italic capitalize ${
                    i.status === 'published' ? 'bg-[#FAECE7] text-[#712B13]' :
                    i.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                    i.status === 'requested' ? 'bg-stone-100 text-stone-700' :
                    'bg-stone-100 text-stone-500'
                  }`}>
                    {i.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">
                  {new Date(i.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/stories/${i.id}`} className="text-[#712B13] text-sm hover:underline">
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
