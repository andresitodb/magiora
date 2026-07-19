import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CraftArticleForm from '@/components/admin/CraftArticleForm';
import { createArticle } from '../actions';

export default async function NewCraftArticlePage({
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

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/craft"
        className="text-sm italic font-serif text-[#712B13] hover:underline mb-6 inline-block"
      >
        ← All articles
      </Link>

      <p className="font-serif italic text-sm text-[#993C1D] mb-2">The Craft</p>
      <h1 className="font-serif text-3xl md:text-4xl font-medium mb-8">New article</h1>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <CraftArticleForm action={createArticle} mode="create" />
    </div>
  );
}
