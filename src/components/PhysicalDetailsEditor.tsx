'use client';

import { useState } from 'react';

type Details = {
  height_ft?: string;
  height_in?: string;
  weight_lb?: string;
  hair_color?: string;
  eye_color?: string;
  body_type?: string;
  dress_size?: string;
  shoe_size?: string;
  chest?: string;
  waist?: string;
  hips?: string;
  inseam?: string;
};

export default function PhysicalDetailsEditor({
  defaultValue = {},
}: {
  defaultValue?: Details;
}) {
  const [d, setD] = useState<Details>(defaultValue);

  function update(field: keyof Details, value: string) {
    setD({ ...d, [field]: value });
  }

  return (
    <div className="bg-stone-50 rounded-md p-4 border border-stone-200">
      <p className="font-serif italic text-xs text-[#993C1D] mb-3">
        For casting — only shown to producers viewing your full profile
      </p>

      <input type="hidden" name="physical_details" value={JSON.stringify(d)} />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-stone-600 mb-1 font-medium">Height</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={d.height_ft ?? ''}
              onChange={(e) => update('height_ft', e.target.value)}
              placeholder="ft"
              className="w-1/2 px-2 py-1.5 border border-stone-300 rounded text-sm"
            />
            <input
              type="number"
              value={d.height_in ?? ''}
              onChange={(e) => update('height_in', e.target.value)}
              placeholder="in"
              className="w-1/2 px-2 py-1.5 border border-stone-300 rounded text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-stone-600 mb-1 font-medium">Weight (lb)</label>
          <input
            type="number"
            value={d.weight_lb ?? ''}
            onChange={(e) => update('weight_lb', e.target.value)}
            placeholder="—"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs text-stone-600 mb-1 font-medium">Hair color</label>
          <input
            type="text"
            value={d.hair_color ?? ''}
            onChange={(e) => update('hair_color', e.target.value)}
            placeholder="Dark brown"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-600 mb-1 font-medium">Eye color</label>
          <input
            type="text"
            value={d.eye_color ?? ''}
            onChange={(e) => update('eye_color', e.target.value)}
            placeholder="Brown"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-600 mb-1 font-medium">Body type</label>
          <input
            type="text"
            value={d.body_type ?? ''}
            onChange={(e) => update('body_type', e.target.value)}
            placeholder="Athletic"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
          />
        </div>
      </div>

      <p className="font-serif italic text-xs text-stone-500 mb-2">
        Wardrobe sizes <span className="font-normal">— optional</span>
      </p>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-stone-600 mb-1 font-medium">Dress / Suit</label>
          <input
            type="text"
            value={d.dress_size ?? ''}
            onChange={(e) => update('dress_size', e.target.value)}
            placeholder="—"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-600 mb-1 font-medium">Shoe</label>
          <input
            type="text"
            value={d.shoe_size ?? ''}
            onChange={(e) => update('shoe_size', e.target.value)}
            placeholder="—"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-600 mb-1 font-medium">Chest</label>
          <input
            type="text"
            value={d.chest ?? ''}
            onChange={(e) => update('chest', e.target.value)}
            placeholder="—"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-600 mb-1 font-medium">Waist</label>
          <input
            type="text"
            value={d.waist ?? ''}
            onChange={(e) => update('waist', e.target.value)}
            placeholder="—"
            className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
          />
        </div>
      </div>
    </div>
  );
}
