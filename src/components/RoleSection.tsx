'use client';

import { useState } from 'react';
import RoleSelector from '@/components/RoleSelector';
import { getCategoryForTitle } from '@/lib/role_titles_list';
import { SectionIcons } from '@/components/SectionIcons';

const HAIR_COLORS = ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Other'];
const EYE_COLORS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Other'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];

interface PhysicalDetails {
  height_ft?: number | null;
  height_in?: number | null;
  weight_lb?: number | null;
  hair_color?: string | null;
  eye_color?: string | null;
}

export default function RoleSection({
  defaultRoleTitles,
  defaultPhysicalDetails,
  defaultGender,
  defaultAgeMin,
  defaultAgeMax,
}: {
  defaultRoleTitles: string[];
  defaultPhysicalDetails: PhysicalDetails;
  defaultGender?: string | null;
  defaultAgeMin?: number | null;
  defaultAgeMax?: number | null;
}) {
  const [titles, setTitles] = useState<string[]>(defaultRoleTitles);
  const [physical, setPhysical] = useState<PhysicalDetails>(defaultPhysicalDetails ?? {});

  // Derived state — no setState in render, no loops
  const isActor =
    titles.length > 0 && getCategoryForTitle(titles[0]) === 'actor';

  function setPhysicalField(
    field: keyof PhysicalDetails,
    value: string | number | null
  ) {
    setPhysical((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6">
      <input type="hidden" name="physical_details" value={JSON.stringify(physical)} />

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#993C1D]">{SectionIcons.role}</span>
          <p className="font-serif italic text-sm text-[#993C1D]">Roles</p>
        </div>
        <p className="text-xs text-stone-500 italic font-serif mb-2">
          Pick all that apply. The first one is your primary role.
        </p>
        <RoleSelector value={titles} onChange={setTitles} />
      </div>

      {isActor && (
        <div className="pt-6 border-t border-stone-200 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#993C1D]">{SectionIcons.physical}</span>
            <p className="font-serif italic text-sm text-[#993C1D]">Physical &amp; demographics</p>
          </div>
          <p className="text-xs italic text-stone-500 font-serif">
            Visible to casting directors. All fields optional.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Gender</label>
              <select
                name="gender"
                defaultValue={defaultGender ?? ''}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm cursor-pointer"
              >
                <option value="">—</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g.toLowerCase()}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Plays age — min</label>
              <input
                type="number"
                name="age_range_min"
                defaultValue={defaultAgeMin ?? ''}
                min={1}
                max={100}
                placeholder="18"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Plays age — max</label>
              <input
                type="number"
                name="age_range_max"
                defaultValue={defaultAgeMax ?? ''}
                min={1}
                max={100}
                placeholder="35"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Height (ft)</label>
              <input
                type="number"
                value={physical.height_ft ?? ''}
                onChange={(e) => setPhysicalField('height_ft', e.target.value ? parseInt(e.target.value) : null)}
                min={3}
                max={8}
                placeholder="5"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Height (in)</label>
              <input
                type="number"
                value={physical.height_in ?? ''}
                onChange={(e) => setPhysicalField('height_in', e.target.value ? parseInt(e.target.value) : null)}
                min={0}
                max={11}
                placeholder="10"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Weight (lb)</label>
              <input
                type="number"
                value={physical.weight_lb ?? ''}
                onChange={(e) => setPhysicalField('weight_lb', e.target.value ? parseInt(e.target.value) : null)}
                min={50}
                max={500}
                placeholder="160"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
              />
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Hair color</label>
              <select
                value={physical.hair_color ?? ''}
                onChange={(e) => setPhysicalField('hair_color', e.target.value || null)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm cursor-pointer"
              >
                <option value="">—</option>
                {HAIR_COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Eye color</label>
              <select
                value={physical.eye_color ?? ''}
                onChange={(e) => setPhysicalField('eye_color', e.target.value || null)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm cursor-pointer"
              >
                <option value="">—</option>
                {EYE_COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
