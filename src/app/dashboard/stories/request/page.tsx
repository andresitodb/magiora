import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requestFeature } from '../actions';
import BackLink from '@/components/BackLink';
import AutoGrowTextarea from '@/components/AutoGrowTextarea';
import { hasMemberEntitlement as hasPaidMembership } from '@/lib/memberEntitlementServer';

export default async function RequestFeaturePage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await hasPaidMembership(user!.id))) {
    redirect('/pricing?reason=feature_request');
  }

  const { data: existing } = await supabase
    .from('interviews')
    .select('id, status, created_at')
    .eq('subject_profile_id', user!.id)
    .in('status', ['requested', 'in_progress'])
    .maybeSingle();

  return (
    <div className="max-w-xl">
      <BackLink href="/dashboard" label="Dashboard" />

      <p className="k-eyebrow mb-2">Spotlight</p>
      <h1 className="k-section-title mb-4">Request to be featured</h1>

      {params.submitted && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3 mb-6">
          Request received. Our editorial team will be in touch within 2-3 weeks.
        </div>
      )}
      {params.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(params.error)}
        </div>
      )}

      {existing ? (
        <div className="k-card p-6">
          <p className="font-serif italic text-sm text-[#993C1D] mb-2">Your request</p>
          <h2 className="font-serif text-xl font-medium mb-2">
            Your interview is {existing.status.replace('_', ' ')}
          </h2>
          <p className="text-sm text-stone-600 mb-2">
            Requested {new Date(existing.created_at).toLocaleDateString()}
          </p>
          <p className="text-sm text-stone-500 italic font-serif">
            We&apos;ll reach out by email when we&apos;re ready to start the conversation. One feature at a time per member, so the next time you can request is after this one publishes.
          </p>
        </div>
      ) : (
        <>
          <p className="font-serif text-base text-stone-700 leading-relaxed mb-8">
            Magiora features long-form interviews with members shaping indie cinema today. If you have a story to tell — a recent project, a creative breakthrough, a perspective on the industry — we&apos;d love to hear it.
          </p>

          <form action={requestFeature} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                What&apos;s on your mind?
              </label>
              <AutoGrowTextarea
                name="request_note"
                placeholder="What would you want to talk about? Any recent or upcoming work we should know about? Why now?"
                minRows={6}
              />
              <p className="text-xs text-stone-500 italic font-serif mt-2">
                Be specific. The more context, the better the conversation will be.
              </p>
            </div>

            <button
              type="submit"
              className="k-button k-button-primary"
            >
              Submit request
            </button>
          </form>
        </>
      )}
    </div>
  );
}
