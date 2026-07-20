import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminStoriesPage() {
  const supabase = await createClient();

  const { data: interviews } = await supabase
    .from('interviews')
    .select(
      `id, title, slug, status, created_at, published_at, request_note, hero_image_url, featured_at,
       subject:profiles!interviews_subject_profile_id_fkey ( display_name, slug, role_category, headshot_url )`
    )
    .order('created_at', { ascending: false });

  return (
    <div>
      <p className="font-serif italic text-sm text-[#993C1D] mb-2">Editorial</p>
      <h1 className="font-serif text-3xl font-medium mb-2">Spotlight</h1>
      <p className="text-sm text-stone-600 mb-8">
        {interviews?.length ?? 0} total · requests, drafts, and published features
      </p>

      <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
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
            {(interviews ?? []).map((i) => {
              const subject = i.subject[0];
              const thumbnail = i.hero_image_url ?? subject?.headshot_url;
              return (
              <tr key={i.id} className="border-b border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumbnail}
                        alt=""
                        className="h-12 w-16 rounded-md bg-stone-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded-md bg-stone-100 text-sm font-medium text-stone-500">
                        {(subject?.display_name?.[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-serif italic text-[#712B13]">{subject?.display_name ?? 'No subject'}</p>
                      <p className="text-xs text-stone-500 capitalize">
                        {subject?.role_category?.replace('_', ' ') ?? 'Profile unavailable'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-serif">
                  {i.title ?? <span className="text-stone-400 italic">— untitled —</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-serif italic capitalize ${
                      i.status === 'published' ? 'bg-[#FAECE7] text-[#712B13]' :
                      i.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                      i.status === 'requested' ? 'bg-stone-100 text-stone-700' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {i.status.replace('_', ' ')}
                    </span>
                    {i.featured_at && (
                      <span className={`text-xs px-2 py-1 rounded-full font-serif italic ${
                        i.status === 'published'
                          ? 'bg-green-50 text-green-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {i.status === 'published' ? 'Featured' : 'Featured · not eligible'}
                      </span>
                    )}
                  </div>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
