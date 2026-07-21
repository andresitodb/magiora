import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PROJECT_STATUSES, PROJECT_TYPES } from '@/lib/projects';
import { toggleAdminProjectFeatured, updateAdminProject } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  const messages = await searchParams;
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select(`*, owner:profiles!projects_owner_id_fkey(display_name, slug), project_credits(id, role_title, external_name, profile:profiles(display_name, slug))`)
    .eq('id', id)
    .maybeSingle();
  if (error || !project) notFound();
  const owner = Array.isArray(project.owner) ? project.owner[0] : project.owner;

  return <div className="max-w-4xl">
    <Link href="/admin/projects" className="k-link">← Projects</Link>
    <div className="my-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="k-eyebrow mb-2">Project record</p><h1 className="k-section-title">{project.title}</h1>{owner && <p className="mt-2 font-serif text-sm italic text-stone-500">Owned by <Link href={`/m/${owner.slug}`} className="text-[var(--magiora-brand)] hover:underline">{owner.display_name}</Link></p>}</div><Link href={`/projects/${project.slug}`} target="_blank" className="k-button k-button-secondary">View public page ↗</Link></div>
    {messages.error && <div role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{messages.error}</div>}
    {messages.saved && <div role="status" className="mb-6 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{messages.saved}</div>}

    <section className="k-card mb-8 p-5 md:p-7">
      <div className="mb-6 flex flex-col gap-3 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-serif text-xl font-medium">Home curation</h2><p className="mt-1 text-sm text-stone-500">{project.featured_at ? `Featured since ${new Date(project.featured_at).toLocaleDateString()}.` : 'Not currently featured.'}</p></div><form action={toggleAdminProjectFeatured}><input type="hidden" name="project_id" value={project.id} /><button type="submit" className="k-button k-button-secondary">{project.featured_at ? 'Remove from Home' : 'Feature on Home'}</button></form></div>
      <form action={updateAdminProject} className="space-y-5"><input type="hidden" name="project_id" value={project.id} />
        <div><label className="mb-1 block text-sm font-medium">Title</label><input name="title" required defaultValue={project.title} className="k-control" /></div>
        <div><label className="mb-1 block text-sm font-medium">Tagline</label><input name="tagline" defaultValue={project.tagline ?? ''} className="k-control" /></div>
        <div className="grid gap-4 sm:grid-cols-3"><div><label className="mb-1 block text-sm font-medium">Type</label><select name="project_type" defaultValue={project.project_type} className="k-control">{PROJECT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div><div><label className="mb-1 block text-sm font-medium">Status</label><select name="status" defaultValue={project.status} className="k-control">{PROJECT_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div><div><label className="mb-1 block text-sm font-medium">Year</label><input type="number" name="year" min="1900" max={new Date().getFullYear() + 5} defaultValue={project.year ?? ''} className="k-control" /></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">City</label><input name="location_city" defaultValue={project.location_city ?? ''} className="k-control" /></div><div><label className="mb-1 block text-sm font-medium">State / country</label><input name="location_state" defaultValue={project.location_state ?? ''} className="k-control" /></div></div>
        <div><label className="mb-1 block text-sm font-medium">Poster URL</label><input type="url" name="poster_url" defaultValue={project.poster_url ?? ''} className="k-control" /></div>
        <div><label className="mb-1 block text-sm font-medium">Trailer URL</label><input type="url" name="trailer_url" defaultValue={project.trailer_url ?? ''} className="k-control" /></div>
        <div><label className="mb-1 block text-sm font-medium">Description</label><textarea name="description" rows={7} defaultValue={project.description ?? ''} className="k-control font-serif" /></div>
        <div className="flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-2"><input type="checkbox" name="visible" value="true" defaultChecked={project.visible} /> <span className="text-sm font-medium">Public</span></label><button type="submit" className="k-button k-button-primary">Save project</button></div>
      </form>
    </section>

    <section className="k-card p-5 md:p-7"><h2 className="font-serif text-xl font-medium">Credits</h2><p className="mb-5 mt-1 text-sm text-stone-500">Read-only in Admin; owners retain credit management.</p>{project.project_credits?.length ? <ul className="divide-y divide-stone-100">{project.project_credits.map((credit: { id: string; role_title: string; external_name: string | null; profile: { display_name: string; slug: string } | { display_name: string; slug: string }[] | null }) => { const profile = Array.isArray(credit.profile) ? credit.profile[0] : credit.profile; return <li key={credit.id} className="flex justify-between gap-4 py-3"><span className="font-serif">{profile?.display_name ?? credit.external_name ?? 'Uncredited'}</span><span className="text-sm italic text-stone-500">{credit.role_title}</span></li>; })}</ul> : <p className="font-serif italic text-stone-500">No credits have been added.</p>}</section>
  </div>;
}
