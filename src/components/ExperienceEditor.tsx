'use client';

import { useState } from 'react';

type Experience = {
  year: string;
  title: string;
  project: string;
  project_type: string;
  role: string;
  link: string;
};

export default function ExperienceEditor({
  defaultValue = [],
}: {
  defaultValue?: Experience[];
}) {
  const [items, setItems] = useState<Experience[]>(defaultValue);

  function add() {
    setItems([
      ...items,
      { year: '', title: '', project: '', project_type: 'feature_film', role: '', link: '' },
    ]);
  }
  function update(i: number, field: keyof Experience, value: string) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }
  function remove(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name="experience"
        value={JSON.stringify(items.filter((it) => it.title || it.project))}
      />

      {items.length === 0 && (
        <p className="text-xs italic text-stone-500 font-serif">
          No credits yet. Add a film, show, play, music video, or commercial.
        </p>
      )}

      {items.map((it, i) => (
        <div key={i} className="bg-white border border-stone-200 rounded-md p-3 space-y-2">
          <div className="grid grid-cols-[80px_1fr_auto] gap-2">
            <input
              type="text"
              value={it.year}
              onChange={(e) => update(i, 'year', e.target.value)}
              placeholder="Year"
              className="px-2 py-1.5 border border-stone-300 rounded text-sm font-serif"
            />
            <input
              type="text"
              value={it.title}
              onChange={(e) => update(i, 'title', e.target.value)}
              placeholder="Project title"
              className="px-2 py-1.5 border border-stone-300 rounded text-sm font-serif"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-stone-500 hover:text-red-700 cursor-pointer px-2"
              title="Remove"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={it.project_type}
              onChange={(e) => update(i, 'project_type', e.target.value)}
              className="px-2 py-1.5 border border-stone-300 rounded text-sm bg-white cursor-pointer"
            >
              <option value="feature_film">Feature film</option>
              <option value="short_film">Short film</option>
              <option value="series">Series / TV</option>
              <option value="theater">Theater</option>
              <option value="music_video">Music video</option>
              <option value="commercial">Commercial</option>
              <option value="documentary">Documentary</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              value={it.role}
              onChange={(e) => update(i, 'role', e.target.value)}
              placeholder="Your role (e.g. Lead, Director, DP)"
              className="px-2 py-1.5 border border-stone-300 rounded text-sm font-serif"
            />
          </div>
          <input
            type="text"
            value={it.project}
            onChange={(e) => update(i, 'project', e.target.value)}
            placeholder="Production / director / studio"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm font-serif"
          />
          <input
            type="url"
            value={it.link}
            onChange={(e) => update(i, 'link', e.target.value)}
            placeholder="Link (IMDb, Vimeo, etc.) — optional"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm font-serif"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="text-sm text-[#712B13] italic font-serif hover:underline cursor-pointer"
      >
        + Add a credit
      </button>
    </div>
  );
}
