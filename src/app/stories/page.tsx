import { createAnonClient } from '@/lib/supabase/anon';
import Nav from '@/components/Nav';
import Link from 'next/link';

export default async function StoriesListPage() {
  const supabase = createAnonClient();

  const { data: interviews } = await supabase
    .from('interviews')
    .select(
      `id, slug, title, intro, hero_image_url, published_at,
       subject:profiles!interviews_subject_profile_id_fkey ( display_name, slug, role_category, custom_role_label )`
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <p className="font-serif italic text-sm text-[#993C1D] mb-2">The magazine</p>
        <h1 className="font-serif text-5xl font-medium mb-2">Stories &amp; interviews</h1>
        <p className="font-serif italic text-lg text-stone-600 mb-12 max-w-2xl">
          Long-form conversations with the directors, actors, and crew shaping indie cinema today.
        </p>

        {!interviews || interviews.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif italic text-stone-500">
              First issue coming soon. Become a member to be considered for a feature.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-8">
            {interviews.map((interview: any) => (
              <StoryCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StoryCard({ interview }: { interview: any }) {
  const subject = interview.subject;
  const roleLabel =
    subject.role_category === 'crew_other'
      ? subject.custom_role_label
      : subject.role_category;

  return (
    <Link href={`/stories/${interview.slug}`} className="block group">
      <div className="aspect-[3/4] bg-stone-200 mb-4 overflow-hidden rounded-md">
        {interview.hero_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={interview.hero_image_url}
            alt={interview.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FAECE7] to-[#FBEAF0]" />
        )}
      </div>
      <p className="font-serif italic text-xs text-[#993C1D] mb-2 capitalize">
        {roleLabel?.replace('_', ' ')} ·{' '}
        {interview.published_at &&
          new Date(interview.published_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
      </p>
      <h2 className="font-serif text-2xl font-medium mb-2 group-hover:text-[#712B13] transition-colors">
        {interview.title}
      </h2>
      {interview.intro && (
        <p className="font-serif text-sm text-stone-700 line-clamp-3 mb-3">
          {interview.intro}
        </p>
      )}
      <p className="font-serif italic text-sm text-stone-500">
        On {subject.display_name}
      </p>
    </Link>
  );
}
