import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateInterview } from '@/app/dashboard/stories/actions';
import BackLink from '@/components/BackLink';
import InterviewQAEditor from './InterviewQAEditor';
import {
  featureInterview,
  unfeatureInterview,
} from '@/app/admin/featured/actions';

export default async function AdminStoryEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; featured?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: interview } = await supabase
    .from('interviews')
    .select(
      `id, title, slug, status, intro, hero_image_url, qa, request_note, featured_at,
       subject:profiles!interviews_subject_profile_id_fkey (
         id, display_name, slug, headshot_url, bio, role_category,
         custom_role_label, demo_reel_url, location_city
       )`
    )
    .eq('id', id)
    .single();

  if (!interview) notFound();

  const subject = Array.isArray(interview.subject)
    ? interview.subject[0]
    : interview.subject;
  if (!subject) notFound();
  const roleLabel =
    subject.role_category === 'crew_other'
      ? subject.custom_role_label
      : subject.role_category?.replace('_', ' ');

  return (
    <div>
      <BackLink href="/admin/stories" label="All Spotlight interviews" />

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
      {sp.featured && (
        <div className="bg-[#FAECE7] border border-[#712B13] text-[#712B13] text-sm rounded-md p-3 mb-6">
          {sp.featured === 'on'
            ? 'Interview is now Featured on Home.'
            : 'Interview was removed from Featured on Home.'}
        </div>
      )}

      <section className="k-card p-5 mb-8 border-l-4 border-l-[#712B13]">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="k-eyebrow mb-1">Home featuring</p>
            <h2 className="font-serif text-xl font-medium">Featured on Home</h2>
            <p className="text-sm italic font-serif text-stone-600 mt-1">
              {interview.featured_at && interview.status !== 'published'
                ? 'This interview retains its featured history but is not publicly eligible.'
                : interview.featured_at
                  ? `Featured since ${new Date(interview.featured_at).toLocaleDateString()}.`
                  : interview.status === 'published'
                    ? 'This interview is published but is not currently featured.'
                    : 'Publish this interview before featuring it on Home.'}
            </p>
          </div>
          <form action={interview.featured_at ? unfeatureInterview : featureInterview}>
            <input type="hidden" name="interview_id" value={interview.id} />
            <input type="hidden" name="return_to" value="editor" />
            <button
              type="submit"
              disabled={interview.status !== 'published' && !interview.featured_at}
              className="k-button k-button-secondary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
            >
              {interview.featured_at
                ? interview.status === 'published'
                  ? 'Remove from Home'
                  : 'Remove Featured state'
                : interview.status === 'published'
                  ? 'Feature on Home'
                  : 'Feature on Home — disabled'}
            </button>
          </form>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Sidebar: subject info */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-stone-200 rounded-lg p-4 sticky top-4">
            <p className="font-serif italic text-xs text-[#993C1D] mb-2">Subject</p>
            {interview.hero_image_url || subject.headshot_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={interview.hero_image_url ?? subject.headshot_url}
                alt={subject.display_name}
                className="w-full aspect-[4/5] object-cover rounded-md mb-3"
              />
            ) : (
              <div className="w-full aspect-[4/5] bg-[#FAECE7] rounded-md mb-3 flex items-center justify-center font-serif italic text-4xl text-[#712B13]">
                {(subject.display_name?.[0] ?? interview.title?.[0] ?? '?').toUpperCase()}
              </div>
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
                  &ldquo;{interview.request_note}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
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
                className="k-control font-serif text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Intro <span className="text-xs text-stone-500 italic font-serif font-normal">— the editor&apos;s note above the Q&amp;A</span>
              </label>
              <textarea
                name="intro"
                rows={5}
                defaultValue={interview.intro ?? ''}
                placeholder="A short editor's intro placing the subject and the conversation in context."
                className="k-control font-serif"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hero image URL</label>
              <input
                type="url"
                name="hero_image_url"
                defaultValue={interview.hero_image_url ?? ''}
                placeholder="https://..."
                className="k-control"
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
                className="k-control cursor-pointer"
              >
                <option value="requested">Requested</option>
                <option value="in_progress">In progress</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <p className="text-xs text-stone-500 italic font-serif mt-1">
                Status &ldquo;published&rdquo; makes the interview public at /stories/{interview.slug ?? '...'}
              </p>
            </div>

            <button
              type="submit"
              className="k-button k-button-primary"
            >
              Save interview
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
