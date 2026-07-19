import { createAnonClient } from '@/lib/supabase/anon';
import Nav from '@/components/Nav';
import Link from 'next/link';
import {
  getProjectTypeLabel,
  getProjectStatusLabel,
  getProjectStatusColor,
} from '@/lib/projects';

export const dynamic = 'force-dynamic';

export default async function ProjectsListPage() {
  const supabase = createAnonClient();

  const { data: projects } = await supabase
    .from('projects')
    .select(
      `id, slug, title, tagline, project_type, status, year, poster_url, featured_at,
       owner:profiles!projects_owner_id_fkey(display_name, slug)`
    )
    .eq('visible', true)
    .order('featured_at', { ascending: false, nullsFirst: false })
    .order('year', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(60);

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-2">
          <p className="font-serif italic text-sm text-[#993C1D] mb-2">Browse projects</p>
          <h1 className="font-serif text-4xl md:text-5xl font-medium">Projects</h1>
        </div>
        <p className="font-serif italic text-base md:text-lg text-stone-600 mb-10 max-w-2xl">
          Films, shows, and other work from the community.
        </p>

        {!projects || projects.length === 0 ? (
          <div className="text-center py-16 border-t border-stone-200">
            <p className="font-serif italic text-stone-500">
              No projects published yet. Be the first to add yours.
            </p>
            <Link
              href="/dashboard/projects/new"
              className="inline-block mt-3 text-sm text-[#712B13] italic font-serif hover:underline"
            >
              Add a project →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {projects.map((p: any) => (
              <Link
                key={p.id}
                href={`/projects/${p.slug}`}
                className="block group bg-white border border-stone-200 rounded-md overflow-hidden hover:border-[#712B13] transition-colors"
              >
                <div className="aspect-[3/4] bg-[#FAECE7]">
                  {p.poster_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.poster_url}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#712B13] font-serif italic text-xl text-center px-3">
                      {p.title}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-serif italic text-xs text-[#993C1D] mb-1">
                    {getProjectTypeLabel(p.project_type)}
                    {p.year && <span className="text-stone-500"> · {p.year}</span>}
                  </p>
                  <p className="font-serif text-base font-medium group-hover:text-[#712B13] transition-colors line-clamp-2">
                    {p.title}
                  </p>
                  {p.owner && (
                    <p className="text-xs text-stone-500 italic font-serif mt-1">
                      by {p.owner.display_name}
                    </p>
                  )}
                  {p.status && (
                    <span
                      className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-serif ${getProjectStatusColor(p.status)}`}
                    >
                      {getProjectStatusLabel(p.status)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
