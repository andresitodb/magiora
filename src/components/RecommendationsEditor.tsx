'use client';

import { useState } from 'react';

type Recommendation = {
  from_name: string;
  from_role: string;
  quote: string;
  project: string;
};

export default function RecommendationsEditor({
  defaultValue = [],
}: {
  defaultValue?: Recommendation[];
}) {
  const [items, setItems] = useState<Recommendation[]>(defaultValue);

  function add() {
    setItems([...items, { from_name: '', from_role: '', quote: '', project: '' }]);
  }
  function update(i: number, field: keyof Recommendation, value: string) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }
  function remove(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name="recommendations"
        value={JSON.stringify(items.filter((it) => it.from_name || it.quote))}
      />

      {items.length === 0 && (
        <p className="text-xs italic text-stone-500 font-serif">
          Quotes from directors, producers, or co-stars who&apos;ve worked with you.
        </p>
      )}

      {items.map((it, i) => (
        <div key={i} className="bg-white border border-stone-200 rounded-md p-3 space-y-2">
          <div className="flex justify-end -mb-1">
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-stone-500 hover:text-red-700 cursor-pointer text-xs italic font-serif"
            >
              remove
            </button>
          </div>
          <textarea
            value={it.quote}
            onChange={(e) => update(i, 'quote', e.target.value)}
            placeholder='"Working with [you] was one of the most..."'
            rows={3}
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm font-serif italic"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={it.from_name}
              onChange={(e) => update(i, 'from_name', e.target.value)}
              placeholder="Their name"
              className="px-2 py-1.5 border border-stone-300 rounded text-sm font-serif"
            />
            <input
              type="text"
              value={it.from_role}
              onChange={(e) => update(i, 'from_role', e.target.value)}
              placeholder="Their role (Director, Producer...)"
              className="px-2 py-1.5 border border-stone-300 rounded text-sm font-serif"
            />
          </div>
          <input
            type="text"
            value={it.project}
            onChange={(e) => update(i, 'project', e.target.value)}
            placeholder="Project — optional"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm font-serif"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="text-sm text-[#712B13] italic font-serif hover:underline cursor-pointer"
      >
        + Add a recommendation
      </button>
    </div>
  );
}
