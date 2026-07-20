import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { saveInterviewAnswers, submitInterviewForReview } from './actions';
import BackLink from '@/components/BackLink';
import InterviewAnswerForm from './InterviewAnswerForm';

export const dynamic = 'force-dynamic';

export default async function AnswerInterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; submitted?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, title, intro, status, invited_by_admin, qa, subject_profile_id')
    .eq('id', id)
    .maybeSingle();

  if (!interview) notFound();

  // Only the subject can answer
  if (interview.subject_profile_id !== user.id) redirect('/dashboard');

  // Only editable while in_progress or pending_review
  const isEditable = ['in_progress', 'pending_review'].includes(interview.status);

  return (
    <div className="max-w-3xl">
      <BackLink href="/dashboard/stories" label="My Spotlight" />

      <div className="mb-8">
        <p className="k-eyebrow mb-2">
          {interview.invited_by_admin
            ? 'You\u2019ve been invited for an interview'
            : 'Draft interview'}
        </p>
        <h1 className="k-section-title break-words">{interview.title}</h1>
        {interview.invited_by_admin && (
          <p className="font-serif italic text-sm text-stone-600 mt-3 max-w-2xl">
            The editor selected you for this issue. Answer in your own voice. Take your time, save as
            you go, and submit when you\u2019re happy. We\u2019ll edit lightly for clarity before publishing.
          </p>
        )}
      </div>

      {sp.saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3 mb-6 font-serif">
          Saved. Come back anytime to keep working.
        </div>
      )}
      {sp.submitted && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-md p-3 mb-6 font-serif">
          Submitted for review. The editor will get back to you.
        </div>
      )}
      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      {!isEditable ? (
        <div className="k-card p-6">
          <p className="font-serif italic text-stone-600">
            This interview is{' '}
            <span className="capitalize">{interview.status.replace('_', ' ')}</span> and can\u2019t be
            edited right now.
          </p>
        </div>
      ) : (
        <InterviewAnswerForm
          interviewId={interview.id}
          initialIntro={interview.intro ?? ''}
          initialQa={(interview.qa as { question: string; answer: string }[]) ?? []}
          saveAction={saveInterviewAnswers}
          submitAction={submitInterviewForReview}
          isPendingReview={interview.status === 'pending_review'}
        />
      )}
    </div>
  );
}
