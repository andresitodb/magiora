import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BackLink from '@/components/BackLink';
import ProjectPosterUploader from '@/components/ProjectPosterUploader';
import { createProject } from '../actions';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/projects';

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const currentYear = new Date().getFullYear();

  return (
    <div className="max-w-2xl">
      <BackLink href="/dashboard/projects" label="Projects" />

      <div className="mb-8">
        <p className="font-serif italic text-sm text-[#993C1D] mb-2">Add a project</p>
        <h1 className="font-serif text-2xl md:text-3xl font-medium">New project</h1>
        <p className="text-sm text-stone-500 italic font-serif mt-2">
          Start with the basics — you can add cast, crew, and gallery photos after.
        </p>
      </div>

      {params.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createProject} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            name="title"
            required
            placeholder="The name of your film, show, or piece"
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tagline</label>
          <input
            type="text"
            name="tagline"
            placeholder="One sentence that captures it — optional"
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              name="project_type"
              defaultValue="feature_film"
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
              defaultValue="in_development"
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
              defaultValue={currentYear}
              min={1900}
              max={currentYear + 5}
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Poster</label>
          <ProjectPosterUploader userId={user.id} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            rows={5}
            placeholder="What is it about? Optional but helps."
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="bg-[#712B13] text-white py-2 px-6 rounded-md font-medium hover:bg-[#4A1B0C] cursor-pointer"
          >
            Create project
          </button>
        </div>
      </form>
    </div>
  );
}
