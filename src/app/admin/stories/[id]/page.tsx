import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateInterview } from '@/app/dashboard/stories/actions';
import BackLink from '@/components/BackLink';
import InterviewQAEditor from './InterviewQAEditor';

export default async function AdminStoryEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: interview } = await supabase
    .from('interviews')
    .select(
      `*, subject:profiles!interviews_subject_profile_id_fkey ( id, display_name, slug, headshot_url, bio, role_category, custom_role_label, demo_reel_url, location_city )`
    )
    .eq('id', id)
    .single();

  if (!interview) notFound();

  const subject = interview.subject;
  const roleLabel =
    subject.role_category === 'crew_other'
      ? subject.custom_role_label
      : subject.role_category?.replace('_', ' ');

  return (
    <div>
      <BackLink href="/admin/stories" label="All stories" />

      {sp.saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3 mb-6">
          Saved.
        </div>
      )}
      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        {/* Sidebar: subject info */}
        <div className="col-span-1">
          <div className="bg-white border border-stone-200 rounded-lg p-4 sticky top-4">
            <p className="font-serif italic text-xs text-[#993C1D] mb-2">Subject</p>
            {subject.headshot_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={subject.headshot_url}
                alt={subject.display_name}
                className="w-full aspect-[4/5] object-cover rounded-md mb-3"
              />
            ) : (
              <div className="w-full aspect-[4/5] bg-[#FAECE7] rounded-md mb-3" />
            )}
            <p className="font-serif text-lg font-medium">{subject.display_name}</p>
            <p className="text-xs text-stone-500 capitalize mb-2">{roleLabel}</p>
            {subject.location_city && (
              <p className="text-xs text-stone-500 italic font-serif mb-3">{subject.location_city}</p>
            )}

            {subject.bio && (
              <div className="mt-4">
                <p className="font-serif italic text-xs text-[#993C1D] mb-1">Bio</p>
                <p className="text-xs text-stone-700 font-serif leading-relaxed line-clamp-6">
                  {subject.bio}
                </p>
              </div>
            )}

            {subject.demo_reel_url && (
              <div className="mt-4">
                <p className="font-serif italic text-xs text-[#993C1D] mb-1">Demo reel</p>
                <a
                  href={subject.demo_reel_url}
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-[#712B13] hover:underline break-all"
                >
                  {subject.demo_reel_url} ↗
                </a>
              </div>
            )}

            {interview.request_note && (
              <div className="mt-4 pt-4 border-t border-stone-200">
                <p className="font-serif italic text-xs text-[#993C1D] mb-1">Request note</p>
                <p className="text-xs text-stone-700 font-serif leading-relaxed italic">
                  "{interview.request_note}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="col-span-2">
          <p className="font-serif italic text-sm text-[#993C1D] mb-2">Edit interview</p>
          <h1 className="font-serif text-3xl font-medium mb-8">
            {interview.title ?? 'Untitled interview'}
          </h1>

          <form action={updateInterview} className="space-y-6">
            <input type="hidden" name="id" value={interview.id} />

            <div>
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                name="title"
                defaultValue={interview.title ?? ''}
                placeholder="On directing in Miami"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Intro <span className="text-xs text-stone-500 italic font-serif font-normal">— the editor's note above the Q&amp;A</span>
              </label>
              <textarea
                name="intro"
                rows={5}
                defaultValue={interview.intro ?? ''}
                placeholder="A short editor's intro placing the subject and the conversation in context."
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hero image URL</label>
              <input
                type="url"
                name="hero_image_url"
                defaultValue={interview.hero_image_url ?? ''}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Questions &amp; answers</label>
              <InterviewQAEditor initialQA={interview.qa ?? []} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                defaultValue={interview.status}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white cursor-pointer"
              >
                <option value="requested">Requested</option>
                <option value="in_progress">In progress</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <p className="text-xs text-stone-500 italic font-serif mt-1">
                Status "published" makes the interview public at /stories/{interview.slug ?? '...'}
              </p>
            </div>

            <button
              type="submit"
              className="bg-[#712B13] text-white py-2 px-6 rounded-md font-medium hover:bg-[#4A1B0C] cursor-pointer"
            >
              Save interview
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
