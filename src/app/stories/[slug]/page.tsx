import { notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import BackLink from '@/components/BackLink';
import Link from 'next/link';
import { applyPublicBrand } from '@/lib/publicBrand';
import type { Metadata } from 'next';
import { entityMetadata, metadataText, unavailableMetadata } from '@/lib/metadata';
import { getSpotlightEntity } from '@/lib/publicEntityLoaders';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: interview, error } = await getSpotlightEntity(slug);
  const pathname = `/stories/${encodeURIComponent(slug)}`;

  if (error || !interview) return unavailableMetadata(pathname);

  const subject = Array.isArray(interview.subject)
    ? interview.subject[0]
    : interview.subject;
  const title = applyPublicBrand(
    interview.title || subject?.display_name || 'Magiora'
  );
  const description = metadataText(
    applyPublicBrand(interview.intro),
    subject?.display_name
      ? `A Spotlight interview with ${subject.display_name}.`
      : 'A Spotlight interview from Magiora.'
  );

  return entityMetadata({
    title,
    description,
    pathname,
    image: interview.hero_image_url || subject?.headshot_url,
    type: 'article',
  });
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: interview } = await getSpotlightEntity(slug);

  if (!interview) notFound();

  const subject = interview.subject;
  const qa: { question: string; answer: string }[] = interview.qa ?? [];
  const roleLabel =
    subject.role_category === 'crew_other'
      ? subject.custom_role_label
      : subject.role_category?.replace('_', ' ');

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="k-container k-section max-w-3xl">
        <BackLink href="/stories" label="Back to Spotlight" />

        <p className="k-eyebrow mb-2 capitalize">
          {roleLabel} ·{' '}
          {interview.published_at &&
            new Date(interview.published_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
        </p>
        <h1 className="k-page-title mb-4">
          {applyPublicBrand(interview.title)}
        </h1>
        <p className="font-serif italic text-xl text-stone-600 mb-8">
          On {subject.display_name}
        </p>

        {interview.hero_image_url && (
          <div className="k-card mb-10 aspect-[16/10] bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={interview.hero_image_url}
              alt={applyPublicBrand(interview.title)}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {interview.intro && (
          <div className="font-serif text-lg md:text-xl leading-[1.7] text-stone-800 mb-12 italic border-l-4 border-[#712B13] pl-4 md:pl-6">
            {applyPublicBrand(interview.intro)}
          </div>
        )}

        <div className="space-y-8">
          {qa.map((item, i) => (
            <div key={i}>
              <p className="font-serif font-medium text-[#4A1B0C] mb-3 text-lg">
                {applyPublicBrand(item.question)}
              </p>
              <p className="k-body text-base md:text-lg whitespace-pre-line">
                {applyPublicBrand(item.answer)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-12 border-t border-stone-200">
          <Link
            href={`/m/${subject.slug}`}
            className="flex items-center gap-4 group"
          >
            {subject.headshot_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={subject.headshot_url}
                alt={subject.display_name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#FAECE7]" />
            )}
            <div>
              <p className="font-serif italic text-xs text-[#993C1D] mb-1">More from</p>
              <p className="font-serif text-2xl font-medium text-[#712B13] group-hover:underline">
                {subject.display_name}
              </p>
              <p className="text-sm text-stone-600 capitalize">
                {roleLabel}
                {subject.location_city && ` · ${subject.location_city}`}
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
