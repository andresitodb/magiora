'use client';

import { useState } from 'react';

type Equipment = { category: string; items: string };

const COMMON_CATEGORIES = ['Camera bodies', 'Lenses', 'Lighting', 'Audio', 'Grip', 'Computing', 'Vehicle', 'Other'];

export default function EquipmentEditor({
  defaultValue = [],
}: {
  defaultValue?: Equipment[];
}) {
  const [items, setItems] = useState<Equipment[]>(defaultValue);

  function add() {
    setItems([...items, { category: 'Camera bodies', items: '' }]);
  }
  function update(i: number, field: keyof Equipment, value: string) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }
  function remove(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name="equipment"
        value={JSON.stringify(items.filter((it) => it.items.trim()))}
      />

      {items.length === 0 && (
        <p className="text-xs italic text-stone-500 font-serif">
          Gear you own and can bring to a production. Producers love seeing this.
        </p>
      )}

      {items.map((it, i) => (
        <div key={i} className="bg-white border border-stone-200 rounded-md p-3 space-y-2">
          <div className="grid grid-cols-[200px_1fr_auto] gap-2 items-start">
            <select
              value={it.category}
              onChange={(e) => update(i, 'category', e.target.value)}
              className="px-2 py-1.5 border border-stone-300 rounded text-sm bg-white cursor-pointer"
            >
              {COMMON_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <textarea
              value={it.items}
              onChange={(e) => update(i, 'items', e.target.value)}
              placeholder="e.g. RED Komodo X, Sony FX3 (with cage)"
              rows={2}
              className="px-2 py-1.5 border border-stone-300 rounded text-sm font-serif"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-stone-500 hover:text-red-700 cursor-pointer px-2 py-1.5"
              title="Remove"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="text-sm text-[#712B13] italic font-serif hover:underline cursor-pointer"
      >
        + Add equipment
      </button>
    </div>
  );
}
