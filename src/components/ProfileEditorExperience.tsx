'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  shouldTrackProfileChange,
  shouldWarnForUnsavedChanges,
  validationSummary,
  getRequestedMemberFeatures,
} from '@/lib/profileExperience';

type ChapterProgress = {
  id: string;
  label: string;
  completed: number;
  total: number;
  percent: number | null;
};

export function ProfileChapterNavigation({
  chapters,
}: {
  chapters: ChapterProgress[];
}) {
  function navigateToChapter(id: string) {
    if (!id) return;
    const section = document.getElementById(id);
    if (!section) return;
    window.history.replaceState(null, '', `#${id}`);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section.focus({ preventScroll: true });
  }

  return (
    <>
      <nav aria-label="Profile chapters" className="mb-6 lg:hidden">
        <label htmlFor="profile-chapter-select" className="k-eyebrow mb-2 block">
          Profile chapters
        </label>
        <select
          id="profile-chapter-select"
          defaultValue=""
          onChange={(event) => navigateToChapter(event.target.value)}
          className="k-control"
        >
          <option value="" disabled>Jump to a chapter</option>
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.label}{chapter.total > 0 ? ` · ${chapter.completed}/${chapter.total}` : ''}
            </option>
          ))}
        </select>
      </nav>

      <nav
        aria-label="Profile chapters"
        className="sticky top-24 hidden self-start rounded-md border border-stone-200 bg-white p-3 lg:block"
      >
        <p className="k-eyebrow px-2 pb-2">Profile chapters</p>
        <ol className="space-y-0.5">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Link
                href={`#${chapter.id}`}
                className="group flex items-center justify-between gap-3 rounded px-2 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-[#712B13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13]"
              >
                <span>{chapter.label}</span>
                <span className="text-xs tabular-nums text-stone-400 group-hover:text-[#712B13]">
                  {chapter.total > 0 ? `${chapter.completed}/${chapter.total}` : '—'}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

function StickySaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div
      className="fixed inset-x-4 bottom-3 z-40 flex items-center justify-between gap-4 rounded-md border border-stone-200 bg-white/95 px-4 py-3 shadow-[0_8px_28px_rgba(28,25,23,0.12)] backdrop-blur sm:left-auto sm:right-6 sm:w-[min(32rem,calc(100vw-3rem))]"
      data-sticky-save
    >
      <p className="text-sm text-stone-600" aria-live="polite">
        {pending ? 'Saving profile…' : dirty ? 'You have unsaved changes.' : 'All profile changes are saved.'}
      </p>
      <button
        type="submit"
        className="k-button k-button-primary shrink-0"
        disabled={pending}
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

export default function ProfileMainForm({
  action,
  error,
  isMember,
  currentSlug,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  error?: string | null;
  isMember: boolean;
  currentSlug: string;
  children: React.ReactNode;
}) {
  const [dirty, setDirty] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [retainedServerError, setRetainedServerError] = useState(error ?? null);
  const [memberFeatures, setMemberFeatures] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const memberDialogTitleRef = useRef<HTMLHeadingElement>(null);
  const submittingRef = useRef(false);
  const bypassMemberGateRef = useRef(false);
  const summary = validationSummary(error ?? retainedServerError ?? clientError);

  useEffect(() => {
    if (memberFeatures.length === 0) return;
    memberDialogTitleRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMemberFeatures([]);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [memberFeatures]);

  useEffect(() => {
    if (!error) return;
    const retainTimer = window.setTimeout(() => setRetainedServerError(error), 0);
    const target = validationSummary(error)?.target;
    const focusTimer = window.setTimeout(() => {
      const targetElement =
        (target && document.querySelector<HTMLElement>(`[name="${target}"]`)) ||
        (target && document.getElementById(target)) ||
        document.getElementById('profile-error-summary');
      targetElement?.focus();
      targetElement?.scrollIntoView({ block: 'center' });
    }, 0);
    return () => {
      window.clearTimeout(retainTimer);
      window.clearTimeout(focusTimer);
    };
  }, [error]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!shouldWarnForUnsavedChanges({
        dirty,
        submitting: submittingRef.current,
      })) return;
      event.preventDefault();
      event.returnValue = '';
    }

    function beforeLinkNavigation(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      const link = (event.target as HTMLElement | null)?.closest('a');
      if (!link) return;
      if (link.target === '_blank') return;
      const destination = link.getAttribute('href');
      if (!shouldWarnForUnsavedChanges({
        dirty,
        submitting: submittingRef.current,
        destination,
      })) return;
      if (!window.confirm('You have unsaved profile changes. Leave without saving?')) {
        event.preventDefault();
      }
    }

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', beforeLinkNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', beforeLinkNavigation, true);
    };
  }, [dirty]);

  function trackChange(event: React.SyntheticEvent<HTMLFormElement>) {
    const element = event.target as HTMLElement;
    const autoSaved = Boolean(element.closest('[data-auto-saved="true"]'));
    if (shouldTrackProfileChange({
      formId: event.currentTarget.id,
      autoSaved,
    })) {
      setDirty(true);
      setClientError(null);
      setRetainedServerError(null);
    }
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-10 pb-20"
      id="profile-form"
      noValidate={false}
      onChangeCapture={trackChange}
      onInputCapture={trackChange}
      onInvalidCapture={(event) => {
        const input = event.target as HTMLInputElement;
        setClientError(input.validationMessage || 'Review the highlighted field.');
      }}
      onSubmitCapture={(event) => {
        if (!bypassMemberGateRef.current) {
          const formData = new FormData(event.currentTarget);
          const requestedFeatures = getRequestedMemberFeatures({
            isMember,
            currentSlug,
            requestedSlug: String(formData.get('slug') ?? currentSlug),
            requestedTheme: String(formData.get('profile_theme') ?? 'editorial'),
            requestedAccent: String(formData.get('profile_accent') ?? 'coral'),
            skillCount: formData.getAll('skills').length,
          });
          if (requestedFeatures.length > 0) {
            event.preventDefault();
            submittingRef.current = false;
            setMemberFeatures(requestedFeatures);
            return;
          }
        }
        bypassMemberGateRef.current = false;
        submittingRef.current = true;
      }}
    >
      {summary && (
        <div
          id="profile-error-summary"
          role="alert"
          tabIndex={-1}
          className="rounded-md border border-red-200 bg-red-50 p-4 text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          <p className="font-serif font-medium">{summary.title}</p>
          <p className="mt-1 text-sm">{summary.message}</p>
          {summary.target && (
            <Link href={`#${summary.target}`} className="mt-2 inline-block text-sm font-medium underline underline-offset-4">
              Review this section
            </Link>
          )}
        </div>
      )}

      {children}
      <StickySaveButton dirty={dirty} />

      {memberFeatures.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-save-title"
          aria-describedby="member-save-description"
        >
          <div className="w-full max-w-md rounded-md border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
            <p className="k-eyebrow mb-2">MEMBER</p>
            <h2
              ref={memberDialogTitleRef}
              id="member-save-title"
              tabIndex={-1}
              className="font-serif text-2xl font-medium focus:outline-none"
            >
              Your preview includes Member choices
            </h2>
            <p id="member-save-description" className="mt-2 text-sm leading-relaxed text-stone-600">
              These choices are available with Member. Your current public profile has not been changed.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              {memberFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#712B13]" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setMemberFeatures([])}
                className="k-button k-button-secondary"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  bypassMemberGateRef.current = true;
                  setMemberFeatures([]);
                  formRef.current?.requestSubmit();
                }}
                className="k-button k-button-secondary"
              >
                Save included changes
              </button>
              <Link
                href="/pricing"
                target="_blank"
                rel="noreferrer"
                className="k-button k-button-primary"
              >
                Unlock Member
              </Link>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
