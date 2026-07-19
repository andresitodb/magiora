import { createAnonClient } from '@/lib/supabase/anon';
import { getLocale } from '@/lib/i18n';
import Link from 'next/link';
import { getCategoryLabel, getArticleTitle, getArticleIntro, type CraftArticle } from '@/lib/craft';

export default async function HomeCraftSection() {
  const locale = await getLocale();
  const supabase = createAnonClient();

  const { data: articles } = await supabase
    .from('craft_articles')
    .select('id, slug, title_en, title_es, intro_en, intro_es, category, reading_minutes, cover_image_url, publish_at')
    .eq('status', 'published')
    .lte('publish_at', new Date().toISOString())
    .order('publish_at', { ascending: false })
    .limit(3);

  if (!articles || articles.length === 0) return null;

  const t = {
    en: {
      kicker: 'The Craft',
      title: 'Notes from the craft',
      seeAll: 'All articles →',
      readingTime: 'min read',
    },
    es: {
      kicker: 'The Craft',
      title: 'Notas del oficio',
      seeAll: 'Todas las notas →',
      readingTime: 'min de lectura',
    },
  }[locale === 'es' ? 'es' : 'en'];

  const [featured, ...rest] = articles;

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16 border-t border-stone-200">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="font-serif italic text-sm text-[#993C1D] mb-1">{t.kicker}</p>
          <h2 className="font-serif text-2xl md:text-3xl font-medium">{t.title}</h2>
        </div>
        <Link href="/craft" className="text-sm italic text-[#712B13] font-serif hover:underline whitespace-nowrap">
          {t.seeAll}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Featured (larger, spans on mobile, single on desktop) */}
        <Link href={`/craft/${featured.slug}`} className="block group md:col-span-1">
          <div className="aspect-[4/3] bg-[#FAECE7] rounded-md overflow-hidden mb-3">
            {featured.cover_image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={featured.cover_image_url}
                alt={getArticleTitle(featured as CraftArticle, locale)}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#FAECE7] to-[#FBEAF0]" />
            )}
          </div>
          <p className="font-serif italic text-xs text-[#993C1D] mb-1 capitalize">
            {getCategoryLabel(featured.category, locale)}
            <span className="text-stone-400"> · {featured.reading_minutes} {t.readingTime}</span>
          </p>
          <h3 className="font-serif text-lg md:text-xl font-medium leading-tight mb-2 group-hover:text-[#712B13] transition-colors">
            {getArticleTitle(featured as CraftArticle, locale)}
          </h3>
          {getArticleIntro(featured as CraftArticle, locale) && (
            <p className="font-serif text-sm text-stone-600 line-clamp-2">
              {getArticleIntro(featured as CraftArticle, locale)}
            </p>
          )}
        </Link>

        {/* Secondary articles */}
        {rest.map((article: any) => (
          <Link key={article.id} href={`/craft/${article.slug}`} className="block group">
            <div className="aspect-[4/3] bg-[#FAECE7] rounded-md overflow-hidden mb-3">
              {article.cover_image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={article.cover_image_url}
                  alt={getArticleTitle(article as CraftArticle, locale)}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FAECE7] to-[#FBEAF0]" />
              )}
            </div>
            <p className="font-serif italic text-xs text-[#993C1D] mb-1 capitalize">
              {getCategoryLabel(article.category, locale)}
              <span className="text-stone-400"> · {article.reading_minutes} {t.readingTime}</span>
            </p>
            <h3 className="font-serif text-base md:text-lg font-medium leading-tight group-hover:text-[#712B13] transition-colors">
              {getArticleTitle(article as CraftArticle, locale)}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
