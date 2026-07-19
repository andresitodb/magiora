import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BackLink from '@/components/BackLink';
import EmptyState from '@/components/EmptyState';
import Toast from '@/components/Toast';
import { Suspense } from 'react';
import {
  getProjectTypeLabel,
  getProjectStatusLabel,
  getProjectStatusColor,
} from '@/lib/projects';

export const dynamic = 'force-dynamic';

export default async function ProjectsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projects } = await supabase
    .from('projects')
    .select(
      'id, slug, title, tagline, project_type, status, year, poster_url, visible, created_at'
    )
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="max-w-5xl">
      <Suspense fallback={null}>
        <Toast />
      </Suspense>

      <BackLink href="/dashboard" label="Dashboard" />

      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-3">
        <div>
          <p className="font-serif italic text-sm text-[#993C1D] mb-2">Your projects</p>
          <h1 className="font-serif text-2xl md:text-3xl font-medium">Projects</h1>
          <p className="text-sm text-stone-500 italic font-serif mt-2 max-w-xl">
            Your films, shows, and other work. Add cast and crew so the people you worked with show up on each other&apos;s pages.
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="bg-[#712B13] text-white py-2 px-5 rounded-md font-medium text-sm hover:bg-[#4A1B0C] whitespace-nowrap text-center"
        >
          + New project
        </Link>
      </div>

      {(!projects || projects.length === 0) ? (
        <EmptyState
          icon="folder"
          title="No projects yet"
          body="Add your first project — a film, short, music video, commercial, or anything else. List the cast and crew, share the link, and let your collaborators show up on your page."
          ctaHref="/dashboard/projects/new"
          ctaLabel="Create a project"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {projects.map((p: any) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}/edit`}
              className="block group bg-white border border-stone-200 rounded-md overflow-hidden hover:border-[#712B13] transition-colors"
            >
              <div className="aspect-[3/4] bg-[#FAECE7] relative">
                {p.poster_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.poster_url}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#712B13] font-serif italic text-2xl text-center px-4">
                    {p.title}
                  </div>
                )}
                {!p.visible && (
                  <span className="absolute top-2 right-2 bg-stone-900/80 text-white text-xs px-2 py-0.5 rounded font-serif italic">
                    Hidden
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-serif italic text-xs text-[#993C1D] mb-1">
                  {getProjectTypeLabel(p.project_type)}
                  {p.year && <span className="text-stone-500"> · {p.year}</span>}
                </p>
                <p className="font-serif text-lg font-medium group-hover:text-[#712B13] transition-colors line-clamp-2">
                  {p.title}
                </p>
                {p.tagline && (
                  <p className="text-xs text-stone-500 italic font-serif mt-1 line-clamp-1">
                    {p.tagline}
                  </p>
                )}
                <span
                  className={`inline-block mt-3 text-xs px-2 py-0.5 rounded-full font-serif ${getProjectStatusColor(p.status)}`}
                >
                  {getProjectStatusLabel(p.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
