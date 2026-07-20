import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import BackLink from '@/components/BackLink';
import ProjectPosterUploader from '@/components/ProjectPosterUploader';
import ProjectGalleryUploader from '@/components/ProjectGalleryUploader';
import CreditsReorderManager from '@/components/CreditsReorderManager';
import Toast from '@/components/Toast';
import { Suspense } from 'react';
import { updateProject, deleteProject, addCredit, removeCredit, reorderCredits } from '../../actions';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/projects';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';

export const dynamic = 'force-dynamic';

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!project) notFound();
  if (project.owner_id !== user.id) {
    redirect('/dashboard/projects?error=' + encodeURIComponent('Not allowed'));
  }

  const { data: credits } = await supabase
    .from('project_credits')
    .select(
      `id, role_title, role_category, character_name, external_name, position, confirmed,
       profile:profiles(id, slug, display_name, headshot_url)`
    )
    .eq('project_id', id)
    .order('position', { ascending: true });

  const links = project.links ?? {};

  return (
    <div className="max-w-3xl pb-12">
      <Suspense fallback={null}>
        <Toast />
      </Suspense>

      <BackLink href="/dashboard/projects" label="Projects" />

      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-3">
        <div>
          <p className="font-serif italic text-sm text-[#993C1D] mb-2">Edit project</p>
          <h1 className="font-serif text-2xl md:text-3xl font-medium">{project.title}</h1>
        </div>
        <Link
          href={`/projects/${project.slug}`}
          className="text-sm text-[#712B13] italic font-serif hover:underline md:mt-2 whitespace-nowrap"
          target="_blank"
        >
          View public page →
        </Link>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      {/* ============= MAIN UPDATE FORM ============= */}
      <form action={updateProject} className="space-y-6">
        <input type="hidden" name="project_id" value={project.id} />

        <section className="space-y-4">
          <p className="font-serif italic text-sm text-[#993C1D]">Details</p>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              required
              defaultValue={project.title}
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tagline</label>
            <input
              type="text"
              name="tagline"
              defaultValue={project.tagline ?? ''}
              placeholder="One sentence — optional"
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                name="project_type"
                defaultValue={project.project_type ?? 'feature_film'}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white cursor-pointer"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                defaultValue={project.status ?? 'in_development'}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white cursor-pointer"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <input
                type="number"
                name="year"
                defaultValue={project.year ?? ''}
                min={1900}
                max={new Date().getFullYear() + 5}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                name="location_city"
                defaultValue={project.location_city ?? ''}
                placeholder="Where it was shot"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State / Country</label>
              <input
                type="text"
                name="location_state"
                defaultValue={project.location_state ?? ''}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 pt-6 border-t border-stone-200">
          <p className="font-serif italic text-sm text-[#993C1D]">Poster</p>
          <ProjectPosterUploader userId={user.id} initialUrl={project.poster_url} />
        </section>

        {/* GALLERY — new */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <p className="font-serif italic text-sm text-[#993C1D]">Gallery</p>
          <p className="text-xs italic text-stone-500 font-serif">
            Behind-the-scenes, stills, premieres — up to 5MB each. The first one is the featured image.
          </p>
          <ProjectGalleryUploader userId={user.id} initialGallery={project.gallery ?? []} />
        </section>

        <section className="space-y-4 pt-6 border-t border-stone-200">
          <p className="font-serif italic text-sm text-[#993C1D]">Description</p>
          <textarea
            name="description"
            rows={6}
            defaultValue={project.description ?? ''}
            placeholder="What is it about?"
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif"
          />
        </section>

        <section className="space-y-4 pt-6 border-t border-stone-200">
          <p className="font-serif italic text-sm text-[#993C1D]">Trailer</p>
          <input
            type="url"
            name="trailer_url"
            defaultValue={project.trailer_url ?? ''}
            placeholder="https://vimeo.com/... or https://youtube.com/watch?v=..."
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
          />
          <p className="text-xs italic text-stone-500 font-serif">
            YouTube and Vimeo URLs will be embedded on the public page.
          </p>
        </section>

        <section className="space-y-4 pt-6 border-t border-stone-200">
          <p className="font-serif italic text-sm text-[#993C1D]">External links</p>
          <input
            type="hidden"
            name="links"
            value={JSON.stringify(links)}
          />
          <ul className="space-y-1">
            {Object.entries(links).filter(([, v]) => v && (v as string).trim()).length === 0 ? (
              <p className="text-xs italic text-stone-400 font-serif">No external links yet.</p>
            ) : (
              Object.entries(links).map(([key, val]) => (
                <li key={key} className="text-sm font-serif">
                  <span className="text-stone-500 italic capitalize">{key}: </span>
                  <a href={val as string} target="_blank" rel="noopener" className="text-[#712B13] hover:underline">
                    {val as string} ↗
                  </a>
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="flex items-center justify-between pt-6 border-t border-stone-200">
          <p className="text-xs text-stone-500 italic font-serif max-w-xs">
            Public projects appear on Kinora and on contributors&apos; profiles.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="visible"
              defaultChecked={project.visible}
              value="true"
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm font-medium">Public</span>
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="bg-[#712B13] text-white py-2.5 px-8 rounded-md font-medium hover:bg-[#4A1B0C] cursor-pointer w-full md:w-auto"
          >
            Save project
          </button>
        </div>
      </form>

      {/* ============= CREDITS SECTION ============= */}
      <section className="mt-16 pt-12 border-t border-stone-200">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <p className="font-serif italic text-sm text-[#993C1D] mb-1">Who worked on it</p>
            <h2 className="font-serif text-xl md:text-2xl font-medium">Cast &amp; crew</h2>
          </div>
          <p className="text-sm text-stone-500 italic font-serif">
            {credits?.length ?? 0} credit{credits?.length === 1 ? '' : 's'}
          </p>
        </div>
        <p className="text-sm text-stone-600 italic font-serif mb-6 max-w-xl">
          Drag-and-drop or use ▲▼ to reorder. Linked profiles ↗ go to the person&apos;s Kinora page.
        </p>

        <CreditsReorderManager
          projectId={project.id}
          initialCredits={(credits ?? []) as any[]}
          onReorder={reorderCredits}
          onRemove={removeCredit}
        />

        {/* Add credit form */}
        <form action={addCredit} className="mt-8 p-4 bg-stone-50 rounded-md border border-stone-200 space-y-3">
          <input type="hidden" name="project_id" value={project.id} />
          <p className="font-serif italic text-sm text-[#993C1D]">+ Add a credit</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Their full name"
                className="w-full px-3 py-1.5 border border-stone-300 rounded text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Role</label>
              <input
                type="text"
                name="role_title"
                required
                placeholder="Director, Lead Actor, DP, etc."
                className="w-full px-3 py-1.5 border border-stone-300 rounded text-sm bg-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Kinora slug <span className="text-stone-500 italic font-normal">— optional</span>
              </label>
              <input
                type="text"
                name="kinora_slug"
                placeholder="andresdb (links to their profile)"
                pattern="[a-z0-9-]*"
                className="w-full px-3 py-1.5 border border-stone-300 rounded text-sm bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Character <span className="text-stone-500 italic font-normal">— for actors</span>
              </label>
              <input
                type="text"
                name="character_name"
                placeholder="Who they played"
                className="w-full px-3 py-1.5 border border-stone-300 rounded text-sm bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-stone-800 text-white text-sm py-1.5 px-4 rounded-md hover:bg-stone-900 cursor-pointer"
            >
              Add credit
            </button>
          </div>
        </form>
      </section>

      {/* ============= DANGER ZONE ============= */}
      <section className="mt-16 pt-12 border-t border-red-200">
        <p className="font-serif italic text-sm text-red-700 mb-2">Danger zone</p>
        <form action={deleteProject}>
          <input type="hidden" name="project_id" value={project.id} />
          <ConfirmSubmitButton
            message="Delete this project permanently? This cannot be undone."
            className="text-red-700 text-sm hover:underline cursor-pointer italic font-serif"
          >
            Delete this project permanently →
          </ConfirmSubmitButton>
        </form>
      </section>
    </div>
  );
}
