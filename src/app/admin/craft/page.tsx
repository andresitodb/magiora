import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CRAFT_CATEGORIES } from '@/lib/craft';

export const dynamic = 'force-dynamic';

export default async function AdminCraftPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; saved?: string }>;
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

  let query = supabase
    .from('craft_articles')
    .select('id, slug, title_en, title_es, category, status, publish_at, reading_minutes, cover_image_url, created_at')
    .order('publish_at', { ascending: false });

  if (sp.category) query = query.eq('category', sp.category);
  if (sp.status) query = query.eq('status', sp.status);

  const { data: articles } = await query;

  const { data: allArticles } = await supabase.from('craft_articles').select('status, publish_at');
  const counts = {
    total: allArticles?.length ?? 0,
    published: allArticles?.filter((a: any) => a.status === 'published' && new Date(a.publish_at) <= new Date()).length ?? 0,
    scheduled: allArticles?.filter((a: any) => a.status === 'published' && new Date(a.publish_at) > new Date()).length ?? 0,
    draft: allArticles?.filter((a: any) => a.status === 'draft').length ?? 0,
  };

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-3">
        <div>
          <p className="font-serif italic text-sm text-[#993C1D] mb-2">The Craft</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium">Articles</h1>
          <p className="text-sm text-stone-500 italic font-serif mt-2">
            {counts.total} total · {counts.published} live · {counts.scheduled} scheduled · {counts.draft} draft
          </p>
        </div>
        <Link
          href="/admin/craft/new"
          className="bg-[#712B13] text-white text-sm py-2 px-5 rounded-md font-medium hover:bg-[#4A1B0C] cursor-pointer self-start whitespace-nowrap"
        >
          + New article
        </Link>
      </div>

      {sp.saved && (
        <div className="bg-[#FAECE7] border border-[#712B13] text-[#712B13] text-sm rounded-md p-3 mb-6 font-serif italic">
          {sp.saved === 'created' && 'Article created.'}
          {sp.saved === 'updated' && 'Article updated.'}
          {sp.saved === 'deleted' && 'Article deleted.'}
        </div>
      )}

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href="/admin/craft"
          className={`px-3 py-1.5 rounded-full font-serif transition-colors ${
            !sp.category && !sp.status
              ? 'bg-[#712B13] text-white'
              : 'bg-white border border-stone-300 text-stone-700 hover:border-[#712B13]'
          }`}
        >
          All
        </Link>
        {CRAFT_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/admin/craft?category=${cat.id}`}
            className={`px-3 py-1.5 rounded-full font-serif transition-colors ${
              sp.category === cat.id
                ? 'bg-[#712B13] text-white'
                : 'bg-white border border-stone-300 text-stone-700 hover:border-[#712B13]'
            }`}
          >
            {cat.label_en}
          </Link>
        ))}
      </div>

      {!articles || articles.length === 0 ? (
        <p className="font-serif italic text-stone-500 text-center py-12">
          No articles match those filters.
        </p>
      ) : (
        <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 font-serif italic">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Publishes</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {articles.map((a: any) => {
                const publishDate = new Date(a.publish_at);
                const isFuture = publishDate > new Date();
                const isLive = a.status === 'published' && !isFuture;
                const statusLabel =
                  a.status === 'published' && isFuture
                    ? 'Scheduled'
                    : a.status === 'published'
                    ? 'Live'
                    : a.status.charAt(0).toUpperCase() + a.status.slice(1);
                const statusColor =
                  a.status === 'published' && isFuture
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : a.status === 'published'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : a.status === 'draft'
                    ? 'bg-stone-100 text-stone-700 border border-stone-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200';

                return (
                  <tr key={a.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/craft/${a.id}/edit`} className="hover:text-[#712B13] font-serif font-medium text-stone-900">
                        {a.title_en}
                      </Link>
                      <p className="text-xs text-stone-500 italic font-serif mt-0.5">{a.title_es}</p>
                    </td>
                    <td className="px-4 py-3 text-xs italic text-stone-600 hidden md:table-cell capitalize">
                      {a.category}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600 hidden md:table-cell font-serif italic">
                      {publishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-serif ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isLive && (
                        <Link
                          href={`/craft/${a.slug}`}
                          target="_blank"
                          className="text-xs italic font-serif text-stone-500 hover:text-[#712B13] mr-3"
                        >
                          view ↗
                        </Link>
                      )}
                      <Link
                        href={`/admin/craft/${a.id}/edit`}
                        className="text-xs italic font-serif text-[#712B13] hover:underline"
                      >
                        edit
                      </Link>
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
