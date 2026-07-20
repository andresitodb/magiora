import { createAnonClient } from '@/lib/supabase/anon';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import SpotlightSearch from '@/components/SpotlightSearch';

const PAGE_SIZE = 20;

type Story = {
  id: string;
  slug: string;
  title: string;
  intro: string | null;
  hero_image_url: string | null;
  published_at: string | null;
  subject:
    | {
        display_name: string;
        slug: string;
        role_category: string | null;
        custom_role_label: string | null;
      }
    | {
        display_name: string;
        slug: string;
        role_category: string | null;
        custom_role_label: string | null;
      }[]
    | null;
};

export default async function StoriesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; person?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAnonClient();
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);

  let query = supabase
    .from('interviews')
    .select(
      `id, slug, title, intro, hero_image_url, published_at,
       subject:profiles!inner ( display_name, role_category, custom_role_label, slug )`,
      { count: 'exact' }
    )
    .eq('status', 'published');
  if (params.q?.trim()) {
    const pattern = `%${params.q.trim()}%`;
    query = query.or(`title.ilike.${pattern},intro.ilike.${pattern}`);
  }
  if (params.person) {
    query = query.eq('subject.slug', params.person);
  }
  const { data, count, error } = await query
    .order('published_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (error) {
    console.error('[spotlight] Public listing query failed', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (params.q) next.set('q', params.q);
    if (params.person) next.set('person', params.person);
    if (nextPage > 1) next.set('page', String(nextPage));
    return next.size ? `/stories?${next.toString()}` : '/stories';
  };
  if ((count ?? 0) > 0 && page > totalPages) redirect(pageHref(totalPages));

  const interviews = (data ?? []) as Story[];
  const firstSubject = interviews[0]?.subject;
  const selectedSubject = Array.isArray(firstSubject)
    ? firstSubject[0]
    : firstSubject;

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="k-container k-section max-w-5xl">
        <p className="k-eyebrow mb-2">Spotlight</p>
        <h1 className="k-page-title mb-2">Featured interviews</h1>
        <p className="k-body-muted text-lg mb-10 max-w-2xl">
          Long-form conversations with the directors, actors, and crew shaping indie cinema today.
        </p>

        <SpotlightSearch
          key={params.person ?? 'no-person'}
          currentQuery={params.q ?? ''}
          currentPerson={params.person ?? ''}
          currentPersonName={
            params.person
              ? selectedSubject?.display_name ?? params.person
              : ''
          }
        />

        {error ? (
          <div className="k-empty">
            <p className="k-body-muted">Spotlight is temporarily unavailable.</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="k-empty">
            <p className="k-body-muted">
              {params.q || params.person
                ? 'No Spotlight interviews match that search.'
                : 'The first Spotlight interview is coming soon.'}
            </p>
            {(params.q || params.person) && <Link href="/stories" className="k-link inline-block mt-3">Clear search →</Link>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {interviews.map((interview) => (
              <StoryCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 pt-6 border-t border-stone-200 flex justify-between" aria-label="Spotlight pages">
            {page > 1 ? <Link href={pageHref(page - 1)} className="k-link">← Previous</Link> : <span />}
            <span className="k-body-muted text-xs">Page {page} of {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(page + 1)} className="k-link">Next →</Link> : <span />}
          </nav>
        )}
      </main>
    </div>
  );
}

function StoryCard({ interview }: { interview: Story }) {
  const subject = Array.isArray(interview.subject)
    ? interview.subject[0]
    : interview.subject;
  const roleLabel =
    subject?.role_category === 'crew_other'
      ? subject.custom_role_label
      : subject?.role_category;

  return (
    <Link href={`/stories/${interview.slug}`} className="k-card k-card-interactive block group">
      <div className="aspect-[16/10] bg-stone-200 overflow-hidden">
        {interview.hero_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={interview.hero_image_url}
            alt={interview.title}
            className="w-full h-full object-cover group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FAECE7] to-[#FBEAF0]" />
        )}
      </div>
      <div className="p-5">
        <p className="k-eyebrow mb-2 normal-case tracking-normal">
          {roleLabel?.replace('_', ' ')}
          {roleLabel && interview.published_at && ' · '}
          {interview.published_at &&
            new Date(interview.published_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
        </p>
        <h2 className="font-serif text-2xl font-medium mb-2 group-hover:text-[#712B13] line-clamp-2">
          {interview.title}
        </h2>
        {interview.intro && (
          <p className="font-serif text-sm text-stone-700 line-clamp-3 mb-3">
            {interview.intro}
          </p>
        )}
        {subject?.display_name && (
          <p className="font-serif italic text-sm text-stone-500">
            On {subject.display_name}
          </p>
        )}
      </div>
    </Link>
  );
}
