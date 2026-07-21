import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  getProjectStatusColor,
  getProjectStatusLabel,
  getProjectTypeLabel,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from '@/lib/projects';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; featured?: string; visibility?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from('projects')
    .select(`id, slug, title, project_type, status, year, visible, featured_at, updated_at,
      owner:profiles!projects_owner_id_fkey(display_name, slug)`)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (params.q?.trim()) query = query.ilike('title', `%${params.q.trim()}%`);
  if (PROJECT_STATUSES.some((status) => status.value === params.status)) query = query.eq('status', params.status!);
  if (PROJECT_TYPES.some((type) => type.value === params.type)) query = query.eq('project_type', params.type!);
  if (params.featured === 'yes') query = query.not('featured_at', 'is', null);
  if (params.featured === 'no') query = query.is('featured_at', null);
  if (params.visibility === 'public') query = query.eq('visible', true);
  if (params.visibility === 'hidden') query = query.eq('visible', false);

  const { data: projects, error } = await query;

  return (
    <div>
      <p className="k-eyebrow mb-2">Editorial inventory</p>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="k-section-title">Projects</h1>
          <p className="mt-2 text-sm text-stone-600">Review, edit, publish, and curate existing community projects.</p>
        </div>
        <p className="font-serif text-sm italic text-stone-500">{projects?.length ?? 0} shown</p>
      </div>

      {(error || params.error) && <div role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error ?? error?.message}</div>}

      <form className="k-card mb-8 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" action="/admin/projects">
        <input name="q" defaultValue={params.q ?? ''} placeholder="Search title…" className="k-control lg:col-span-1" />
        <select name="status" defaultValue={params.status ?? ''} className="k-control"><option value="">All statuses</option>{PROJECT_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
        <select name="type" defaultValue={params.type ?? ''} className="k-control"><option value="">All types</option>{PROJECT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select>
        <select name="featured" defaultValue={params.featured ?? ''} className="k-control"><option value="">Any curation</option><option value="yes">Featured</option><option value="no">Not featured</option></select>
        <div className="flex gap-2"><select name="visibility" defaultValue={params.visibility ?? ''} className="k-control min-w-0"><option value="">Any visibility</option><option value="public">Public</option><option value="hidden">Hidden</option></select><button className="k-button k-button-primary" type="submit">Filter</button></div>
      </form>

      {!error && (!projects || projects.length === 0) ? (
        <div className="k-empty"><p className="k-body-muted">No projects match these filters.</p><Link href="/admin/projects" className="k-link mt-3 inline-block">Clear filters →</Link></div>
      ) : projects && projects.length > 0 ? (
        <div className="k-card overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-stone-200 bg-stone-50"><tr><th className="px-4 py-3 text-left font-medium">Project</th><th className="px-4 py-3 text-left font-medium">Owner</th><th className="px-4 py-3 text-left font-medium">Status</th><th className="px-4 py-3 text-left font-medium">Visibility</th><th className="px-4 py-3 text-right font-medium">Action</th></tr></thead>
            <tbody>{projects.map((project) => {
              const owner = Array.isArray(project.owner) ? project.owner[0] : project.owner;
              return <tr key={project.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50"><td className="px-4 py-4"><p className="font-serif text-base font-medium">{project.title}</p><p className="text-xs italic text-stone-500">{getProjectTypeLabel(project.project_type)}{project.year ? ` · ${project.year}` : ''}{project.featured_at ? ' · Featured' : ''}</p></td><td className="px-4 py-4">{owner ? <Link href={`/m/${owner.slug}`} className="font-serif italic text-[var(--magiora-brand)] hover:underline">{owner.display_name}</Link> : <span className="text-stone-400">Unknown</span>}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-serif ${getProjectStatusColor(project.status)}`}>{getProjectStatusLabel(project.status)}</span></td><td className="px-4 py-4 font-serif italic text-stone-600">{project.visible ? 'Public' : 'Hidden'}</td><td className="px-4 py-4 text-right"><Link href={`/admin/projects/${project.id}`} className="k-link">View &amp; edit →</Link></td></tr>;
            })}</tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
