'use client';

import { useId, useState } from 'react';
import {
  type ExperienceRecord,
  type ExperienceReferenceType,
  getLegacyExperienceReference,
  normalizeExperienceForEditor,
  validateExperienceReference,
} from '@/lib/experienceReferences';

export default function ExperienceEditor({
  defaultValue = [],
}: {
  defaultValue?: ExperienceRecord[];
}) {
  const editorId = useId().replace(/:/g, '');
  const [items, setItems] = useState<ExperienceRecord[]>(
    defaultValue.map(normalizeExperienceForEditor)
  );
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [replacingLegacy, setReplacingLegacy] = useState<Set<number>>(new Set());

  function add() {
    setItems([
      ...items,
      {
        year: '',
        production: '',
        role: '',
        description: '',
        reference_type: 'official',
        reference_url: '',
      },
    ]);
  }

  function update(index: number, field: keyof ExperienceRecord, value: string) {
    const nextItem = { ...items[index], [field]: value };
    setItems(items.map((item, itemIndex) => itemIndex === index ? nextItem : item));
    if (field === 'reference_type' || field === 'reference_url') {
      const type = (
        nextItem.reference_type
      ) as ExperienceReferenceType;
      const url = String(nextItem.reference_url ?? '');
      validateReference(index, type, url);
    }
  }

  function validateReference(
    index: number,
    type: ExperienceReferenceType,
    value: string,
  ) {
    const trimmed = value.trim();
    if (!trimmed) {
      setErrors((current) => {
        const next = { ...current };
        delete next[index];
        return next;
      });
      return;
    }
    const result = validateExperienceReference(type, trimmed);
    setErrors((current) => {
      const next = { ...current };
      if (result.valid) delete next[index];
      else next[index] = result.error;
      return next;
    });
  }

  function remove(index: number) {
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
    setErrors({});
  }

  function replaceLegacyReference(index: number) {
    setItems(items.map((item, itemIndex) =>
      itemIndex === index
        ? { ...item, reference_type: 'official', reference_url: '' }
        : item
    ));
    setReplacingLegacy((current) => new Set(current).add(index));
  }

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name="experience"
        value={JSON.stringify(items.filter((item) =>
          item.production || item.title || item.project
        ))}
      />

      {items.length === 0 && (
        <p className="font-serif text-xs italic text-stone-500">
          No credits yet. Add a professional production credit.
        </p>
      )}

      {items.map((item, index) => {
        const prefix = `${editorId}-experience-${index}`;
        const legacyReference = getLegacyExperienceReference(item);
        const isLegacyReference = Boolean(legacyReference);
        const isReplacingLegacy = replacingLegacy.has(index);
        const referenceType = (
          item.reference_type === 'imdb' ? 'imdb' : 'official'
        ) as ExperienceReferenceType;
        const error = errors[index];

        return (
          <fieldset
            key={index}
            className="space-y-4 rounded-md border border-stone-200 bg-white p-4"
          >
            <legend className="px-1 font-serif text-sm font-medium text-stone-700">
              Experience {index + 1}
            </legend>

            <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
              <div>
                <label htmlFor={`${prefix}-production`} className="mb-1 block text-sm font-medium">
                  Production
                </label>
                <input
                  id={`${prefix}-production`}
                  type="text"
                  value={String(item.production ?? '')}
                  onChange={(event) => update(index, 'production', event.target.value)}
                  className="k-control"
                />
              </div>
              <div>
                <label htmlFor={`${prefix}-year`} className="mb-1 block text-sm font-medium">
                  Year
                </label>
                <input
                  id={`${prefix}-year`}
                  type="text"
                  inputMode="numeric"
                  value={String(item.year ?? '')}
                  onChange={(event) => update(index, 'year', event.target.value)}
                  className="k-control"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="self-end px-3 py-2 text-sm text-stone-500 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13]"
                aria-label={`Remove experience ${index + 1}`}
              >
                Remove
              </button>
            </div>

            <div>
              <label htmlFor={`${prefix}-role`} className="mb-1 block text-sm font-medium">
                Role
              </label>
              <input
                id={`${prefix}-role`}
                type="text"
                value={String(item.role ?? '')}
                onChange={(event) => update(index, 'role', event.target.value)}
                className="k-control"
              />
            </div>

            <div>
              <label htmlFor={`${prefix}-description`} className="mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                id={`${prefix}-description`}
                value={String(item.description ?? '')}
                onChange={(event) => update(index, 'description', event.target.value)}
                rows={3}
                className="k-control"
              />
            </div>

            {isLegacyReference ? (
              <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                <p className="text-sm font-medium text-stone-800">Legacy reference — review needed</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  This historical URL is preserved, but it is not an approved IMDb or official website reference.
                </p>
                <input
                  id={`${prefix}-legacy-reference`}
                  value={legacyReference ?? ''}
                  readOnly
                  aria-label={`Legacy reference URL for experience ${index + 1}`}
                  className="mt-3 w-full rounded border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600"
                />
                {isReplacingLegacy ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-[12rem_1fr]">
                    <div>
                      <label htmlFor={`${prefix}-reference-type`} className="mb-1 block text-sm font-medium">
                        Replacement type
                      </label>
                      <select
                        id={`${prefix}-reference-type`}
                        value={referenceType}
                        onChange={(event) => update(index, 'reference_type', event.target.value)}
                        className="k-control"
                      >
                        <option value="imdb">IMDb</option>
                        <option value="official">Official website</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`${prefix}-reference-url`} className="mb-1 block text-sm font-medium">
                        Replacement URL
                      </label>
                      <input
                        id={`${prefix}-reference-url`}
                        type="url"
                        value={String(item.reference_url ?? '')}
                        onChange={(event) => update(index, 'reference_url', event.target.value)}
                        onBlur={(event) => validateReference(index, referenceType, event.target.value)}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${prefix}-reference-error` : undefined}
                        placeholder={referenceType === 'imdb'
                          ? 'https://www.imdb.com/title/...'
                          : 'https://official-production-site.com'}
                        className="k-control"
                      />
                      {error && (
                        <p id={`${prefix}-reference-error`} role="alert" className="mt-1.5 text-sm text-red-700">
                          {error}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => replaceLegacyReference(index)}
                    className="mt-3 text-sm font-medium text-[#712B13] underline underline-offset-4"
                  >
                    Replace with an approved reference
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                <div>
                  <label htmlFor={`${prefix}-reference-type`} className="mb-1 block text-sm font-medium">
                    Reference type
                  </label>
                  <select
                    id={`${prefix}-reference-type`}
                    value={referenceType}
                    onChange={(event) =>
                      update(index, 'reference_type', event.target.value)
                    }
                    className="k-control"
                  >
                    <option value="imdb">IMDb</option>
                    <option value="official">Official website</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`${prefix}-reference-url`} className="mb-1 block text-sm font-medium">
                    Reference URL
                  </label>
                  <input
                    id={`${prefix}-reference-url`}
                    type="url"
                    value={String(item.reference_url ?? '')}
                    onChange={(event) =>
                      update(index, 'reference_url', event.target.value)
                    }
                    onBlur={(event) =>
                      validateReference(index, referenceType, event.target.value)
                    }
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${prefix}-reference-error` : undefined}
                    placeholder={
                      referenceType === 'imdb'
                        ? 'https://www.imdb.com/title/...'
                        : 'https://official-production-site.com'
                    }
                    className="k-control"
                  />
                  {error && (
                    <p
                      id={`${prefix}-reference-error`}
                      role="alert"
                      className="mt-1.5 text-sm text-red-700"
                    >
                      {error}
                    </p>
                  )}
                </div>
              </div>
            )}
          </fieldset>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="font-serif text-sm italic text-[#712B13] hover:underline"
      >
        + Add a credit
      </button>
    </div>
  );
}
