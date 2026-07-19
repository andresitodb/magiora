import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import CraftArticleForm from '@/components/admin/CraftArticleForm';
import { updateArticle, deleteArticle } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditCraftArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
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

  const { data: article } = await supabase
    .from('craft_articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!article) notFound();

  const isLive = article.status === 'published' && new Date(article.publish_at) <= new Date();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 gap-3">
        <Link
          href="/admin/craft"
          className="text-sm italic font-serif text-[#712B13] hover:underline"
        >
          ← All articles
        </Link>
        {isLive && (
          <Link
            href={`/craft/${article.slug}`}
            target="_blank"
            className="text-sm italic font-serif text-stone-500 hover:text-[#712B13]"
          >
            View on site ↗
          </Link>
        )}
      </div>

      <p className="font-serif italic text-sm text-[#993C1D] mb-2">The Craft · Edit</p>
      <h1 className="font-serif text-3xl md:text-4xl font-medium mb-8 leading-tight">{article.title_en}</h1>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <CraftArticleForm action={updateArticle} mode="edit" article={article} />

      <section className="mt-16 pt-8 border-t border-red-200">
        <p className="font-serif italic text-xs text-red-700 mb-2">Danger zone</p>
        <form action={deleteArticle}>
          <input type="hidden" name="article_id" value={article.id} />
          <button
            type="submit"
            className="text-red-700 text-sm hover:underline italic font-serif cursor-pointer"
          >
            Delete this article permanently →
          </button>
        </form>
      </section>
    </div>
  );
}
