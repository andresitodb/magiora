'use client';

import { useState } from 'react';

type QA = { question: string; answer: string };

export default function InterviewQAEditor({ initialQA }: { initialQA: QA[] }) {
  const [items, setItems] = useState<QA[]>(initialQA.length > 0 ? initialQA : [{ question: '', answer: '' }]);

  function add() {
    setItems([...items, { question: '', answer: '' }]);
  }
  function update(i: number, field: keyof QA, value: string) {
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }
  function remove(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }
  function move(i: number, direction: -1 | 1) {
    const j = i + direction;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="qa" value={JSON.stringify(items.filter((i) => i.question || i.answer))} />

      {items.map((item, i) => (
        <div key={i} className="bg-white border border-stone-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-serif italic text-xs text-[#993C1D]">Question {i + 1}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-stone-500 hover:text-[#712B13] disabled:opacity-30 cursor-pointer text-xs"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="text-stone-500 hover:text-[#712B13] disabled:opacity-30 cursor-pointer text-xs"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-stone-500 hover:text-red-700 cursor-pointer text-xs"
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>

          <input
            type="text"
            value={item.question}
            onChange={(e) => update(i, 'question', e.target.value)}
            placeholder="The question"
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif font-medium mb-2"
          />
          <textarea
            value={item.answer}
            onChange={(e) => update(i, 'answer', e.target.value)}
            placeholder="The answer (transcribed and edited for clarity)"
            rows={4}
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="text-sm text-[#712B13] italic font-serif hover:underline cursor-pointer"
      >
        + Add another question
      </button>
    </div>
  );
}
