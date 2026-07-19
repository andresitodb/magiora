import { createAnonClient } from '@/lib/supabase/anon';
import { getLocale } from '@/lib/i18n';
import Nav from '@/components/Nav';
import Link from 'next/link';
import {
  CRAFT_CATEGORIES,
  getCategoryLabel,
  getArticleTitle,
  getArticleIntro,
  type CraftArticle,
  type CraftCategory,
} from '@/lib/craft';

export const dynamic = 'force-dynamic';

export default async function CraftListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const supabase = createAnonClient();

  const selectedCategory = sp.category as CraftCategory | undefined;

  let query = supabase
    .from('craft_articles')
    .select('id, slug, title_en, title_es, intro_en, intro_es, category, reading_minutes, cover_image_url, publish_at')
    .eq('status', 'published')
    .lte('publish_at', new Date().toISOString())
    .order('publish_at', { ascending: false })
    .limit(60);

  if (selectedCategory) {
    query = query.eq('category', selectedCategory);
  }

  const { data: articles } = await query;

  const t = {
    en: {
      kicker: 'The Craft',
      title: 'Notes from the craft',
      intro: 'Tips, techniques, and working knowledge from across cinema, television, and theater. New piece every day.',
      empty: 'No pieces yet in this category.',
      all: 'All',
      readingTime: 'min read',
    },
    es: {
      kicker: 'The Craft',
      title: 'Notas del oficio',
      intro: 'Tips, técnicas, y conocimiento práctico desde el cine, la televisión y el teatro. Una nota nueva cada día.',
      empty: 'Todavía no hay notas en esta categoría.',
      all: 'Todas',
      readingTime: 'min de lectura',
    },
  }[locale === 'es' ? 'es' : 'en'];

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <p className="font-serif italic text-sm text-[#993C1D] mb-2">{t.kicker}</p>
        <h1 className="font-serif text-4xl md:text-5xl font-medium mb-3">{t.title}</h1>
        <p className="font-serif italic text-base md:text-lg text-stone-600 mb-10 max-w-2xl">
          {t.intro}
        </p>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/craft"
            className={`text-xs px-3 py-1.5 rounded-full font-serif transition-colors ${
              !selectedCategory
                ? 'bg-[#712B13] text-white'
                : 'bg-white border border-stone-300 text-stone-600 hover:border-[#712B13]'
            }`}
          >
            {t.all}
          </Link>
          {CRAFT_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/craft?category=${cat.id}`}
              className={`text-xs px-3 py-1.5 rounded-full font-serif transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#712B13] text-white'
                  : 'bg-white border border-stone-300 text-stone-600 hover:border-[#712B13]'
              }`}
            >
              {getCategoryLabel(cat.id, locale)}
            </Link>
          ))}
        </div>

        {(!articles || articles.length === 0) ? (
          <div className="text-center py-16">
            <p className="font-serif italic text-stone-500">{t.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article: any) => (
              <CraftCard key={article.id} article={article} locale={locale} readingLabel={t.readingTime} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CraftCard({
  article,
  locale,
  readingLabel,
}: {
  article: CraftArticle;
  locale: string;
  readingLabel: string;
}) {
  return (
    <Link href={`/craft/${article.slug}`} className="block group">
      <div className="aspect-[5/3] bg-[#FAECE7] rounded-md overflow-hidden mb-4">
        {article.cover_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={article.cover_image_url}
            alt={getArticleTitle(article, locale)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FAECE7] to-[#FBEAF0]" />
        )}
      </div>
      <p className="font-serif italic text-xs text-[#993C1D] mb-1 capitalize">
        {getCategoryLabel(article.category, locale)}
        <span className="text-stone-400"> · {article.reading_minutes} {readingLabel}</span>
      </p>
      <h2 className="font-serif text-xl md:text-2xl font-medium mb-2 leading-tight group-hover:text-[#712B13] transition-colors">
        {getArticleTitle(article, locale)}
      </h2>
      {getArticleIntro(article, locale) && (
        <p className="font-serif text-sm text-stone-600 line-clamp-3">
          {getArticleIntro(article, locale)}
        </p>
      )}
    </Link>
  );
}
