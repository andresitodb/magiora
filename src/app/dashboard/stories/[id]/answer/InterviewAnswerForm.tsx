'use client';

import { useState } from 'react';
import AutoGrowTextarea from '@/components/AutoGrowTextarea';

type QA = { question: string; answer: string };

export default function InterviewAnswerForm({
  interviewId,
  initialIntro,
  initialQa,
  saveAction,
  submitAction,
  isPendingReview,
}: {
  interviewId: string;
  initialIntro: string;
  initialQa: QA[];
  saveAction: (formData: FormData) => void;
  submitAction: (formData: FormData) => void;
  isPendingReview: boolean;
}) {
  const [qa, setQa] = useState<QA[]>(
    initialQa.length > 0 ? initialQa : [{ question: '', answer: '' }]
  );

  function updateAnswer(i: number, value: string) {
    setQa(qa.map((q, idx) => (idx === i ? { ...q, answer: value } : q)));
  }
  function addQuestion() {
    setQa([...qa, { question: '', answer: '' }]);
  }
  function updateQuestion(i: number, value: string) {
    setQa(qa.map((q, idx) => (idx === i ? { ...q, question: value } : q)));
  }
  function removeQuestion(i: number) {
    setQa(qa.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-6">
        <input type="hidden" name="interview_id" value={interviewId} />
        <input type="hidden" name="qa" value={JSON.stringify(qa)} />

        <div className="k-card p-5">
          <label className="block text-sm font-medium mb-2">
            Intro <span className="text-xs text-stone-500 italic font-serif font-normal">— optional, sets the scene</span>
          </label>
          <AutoGrowTextarea
            name="intro"
            defaultValue={initialIntro}
            placeholder="A short paragraph framing the interview..."
            minRows={3}
          />
        </div>

        <div className="space-y-4">
          {qa.map((item, i) => (
            <div
              key={i}
              className="k-card p-5 space-y-3"
            >
              <div className="flex items-baseline justify-between">
                <label className="block text-sm font-medium">Question {i + 1}</label>
                {qa.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    className="text-xs text-stone-500 italic font-serif hover:text-red-700 cursor-pointer"
                  >
                    remove
                  </button>
                )}
              </div>
              <input
                type="text"
                value={item.question}
                onChange={(e) => updateQuestion(i, e.target.value)}
                placeholder="What\u2019s the question?"
                className="k-control font-serif italic"
              />
              <AutoGrowTextarea
                name={`answer_${i}`}
                value={item.answer}
                onChange={(v) => updateAnswer(i, v)}
                placeholder="Your answer in your own voice..."
                minRows={3}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="text-sm text-[#712B13] italic font-serif hover:underline cursor-pointer"
          >
            + Add another question
          </button>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="submit"
            className="k-button k-button-secondary"
          >
            Save draft
          </button>
        </div>
      </form>

      {/* Separate form for submit-for-review */}
      <form action={submitAction} className="border-t border-stone-200 pt-6">
        <input type="hidden" name="interview_id" value={interviewId} />
        <input type="hidden" name="qa" value={JSON.stringify(qa)} />
        <input type="hidden" name="intro" value={initialIntro} />

        <div className="bg-[#FAEEDA] border border-[#FAC775] rounded-md p-5">
          <p className="font-serif italic text-sm text-[#712B13] mb-2">Ready to submit?</p>
          <p className="font-serif text-sm text-stone-700 mb-4">
            {isPendingReview
              ? 'This interview is already with the editor. You can keep editing and re-submit any time.'
              : 'Once you submit, the editor will review and may publish or send notes back. You can keep editing after submitting.'}
          </p>
          <button
            type="submit"
            className="k-button k-button-primary"
          >
            {isPendingReview ? 'Re-submit for review' : 'Submit for review →'}
          </button>
        </div>
      </form>
    </div>
  );
}
