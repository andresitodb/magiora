import { notFound } from 'next/navigation';
import { createAnonClient } from '@/lib/supabase/anon';
import { getLocale } from '@/lib/i18n';
import Nav from '@/components/Nav';
import Link from 'next/link';
import {
  getCategoryLabel,
  getArticleTitle,
  getArticleIntro,
  getArticleBody,
  type CraftArticle,
} from '@/lib/craft';

export const dynamic = 'force-dynamic';

export default async function CraftDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const supabase = createAnonClient();

  const { data: article } = await supabase
    .from('craft_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('publish_at', new Date().toISOString())
    .maybeSingle();

  if (!article) notFound();

  // Fetch a few related articles in the same category
  const { data: related } = await supabase
    .from('craft_articles')
    .select('id, slug, title_en, title_es, category, cover_image_url, reading_minutes')
    .eq('status', 'published')
    .eq('category', article.category)
    .neq('id', article.id)
    .lte('publish_at', new Date().toISOString())
    .order('publish_at', { ascending: false })
    .limit(3);

  const t = {
    en: {
      kicker: 'The Craft',
      published: 'Published',
      readingTime: 'min read',
      related: 'More on',
      back: '← All articles',
    },
    es: {
      kicker: 'The Craft',
      published: 'Publicado',
      readingTime: 'min de lectura',
      related: 'Más sobre',
      back: '← Todas las notas',
    },
  }[locale === 'es' ? 'es' : 'en'];

  const publishedDate = new Date(article.publish_at).toLocaleDateString(
    locale === 'es' ? 'es-ES' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  const body = getArticleBody(article as CraftArticle, locale);
  const paragraphs = body.split('\n\n').filter((p) => p.trim());

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />

      {/* Hero */}
      {article.cover_image_url && (
        <div className="w-full max-h-[420px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.cover_image_url}
            alt={getArticleTitle(article as CraftArticle, locale)}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link
          href="/craft"
          className="text-sm italic text-[#712B13] font-serif hover:underline mb-6 inline-block"
        >
          {t.back}
        </Link>

        <p className="font-serif italic text-sm text-[#993C1D] mb-3 capitalize">
          {t.kicker} · {getCategoryLabel(article.category, locale)}
          <span className="text-stone-400"> · {article.reading_minutes} {t.readingTime}</span>
        </p>
        <h1 className="font-serif text-3xl md:text-5xl font-medium mb-4 leading-tight">
          {getArticleTitle(article as CraftArticle, locale)}
        </h1>
        {getArticleIntro(article as CraftArticle, locale) && (
          <p className="font-serif italic text-lg md:text-xl text-stone-600 mb-8 leading-snug">
            {getArticleIntro(article as CraftArticle, locale)}
          </p>
        )}

        <div className="font-serif text-base md:text-lg leading-relaxed text-stone-800 space-y-5">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <p className="font-serif italic text-xs text-stone-400 mt-12 pt-6 border-t border-stone-200">
          {t.published} {publishedDate}
        </p>
      </main>

      {related && related.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 md:px-6 pb-12">
          <div className="pt-8 border-t border-stone-200">
            <p className="font-serif italic text-sm text-[#993C1D] mb-6">
              {t.related} {getCategoryLabel(article.category, locale).toLowerCase()}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link key={r.id} href={`/craft/${r.slug}`} className="block group">
                  <div className="aspect-[5/3] bg-[#FAECE7] rounded-md overflow-hidden mb-3">
                    {r.cover_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={r.cover_image_url}
                        alt={locale === 'es' ? r.title_es : r.title_en}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FAECE7] to-[#FBEAF0]" />
                    )}
                  </div>
                  <h3 className="font-serif text-base font-medium leading-tight group-hover:text-[#712B13] transition-colors">
                    {locale === 'es' ? r.title_es : r.title_en}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
