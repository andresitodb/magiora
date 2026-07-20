'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useEffect, useMemo, useRef } from 'react';
import { LANGUAGES } from '@/lib/languages';
import RoleAutocomplete from '@/components/RoleAutocomplete';
import CityAutocomplete from '@/components/CityAutocomplete';

const PINNED_LANGS = ['en', 'es'];

export default function DirectoryFilters({
  roleFilters,
  knownCities,
  currentRole,
  currentCity,
  currentLang,
  currentQuery,
  currentVerified,
  currentSort,
}: {
  roleFilters: { value: string; label: string }[];
  knownCities: string[];
  currentRole: string;
  currentCity: string;
  currentLang: string;
  currentQuery: string;
  currentVerified: boolean;
  currentSort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(currentQuery);
  const lastRequestedQuery = useRef(currentQuery);

  function pushFilter(
    updates: Record<string, string | null>,
    history: 'push' | 'replace' = 'push'
  ) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('page');
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => {
      const href = next.size > 0 ? `/directory?${next.toString()}` : '/directory';
      if (history === 'replace') router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== currentQuery) {
        lastRequestedQuery.current = q;
        pushFilter({ q: q || null }, 'replace');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentQuery !== lastRequestedQuery.current) {
      setQ(currentQuery);
    }
  }, [currentQuery]);

  // Sort roles alphabetically by label
  const sortedRoles = useMemo(
    () => [...roleFilters].sort((a, b) => a.label.localeCompare(b.label)),
    [roleFilters]
  );

  const sortedLangs = useMemo(
    () => [
      ...PINNED_LANGS.map((c) => LANGUAGES.find((l) => l.code === c)).filter(
        (language): language is (typeof LANGUAGES)[number] => language !== undefined
      ),
      ...[...LANGUAGES]
        .filter((l) => !PINNED_LANGS.includes(l.code))
        .sort((a, b) => a.name.localeCompare(b.name)),
    ],
    []
  );

  const activeFilters = [
    currentQuery && { key: 'q', label: `Search: ${currentQuery}` },
    currentRole && {
      key: 'role',
      label: roleFilters.find((role) => role.value === currentRole)?.label ?? currentRole,
    },
    currentCity && { key: 'city', label: currentCity },
    currentLang && {
      key: 'lang',
      label: LANGUAGES.find((language) => language.code === currentLang)?.name ?? currentLang,
    },
    currentVerified && { key: 'verified', label: 'Verified' },
  ].filter(
    (filter): filter is { key: string; label: string } => Boolean(filter)
  );
  const hasAnyFilter = activeFilters.length > 0;

  return (
    <div className="bg-white border border-stone-200 rounded-md p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 italic font-serif">
            Search by name
          </label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a name..."
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 italic font-serif">
            Role
          </label>
          <RoleAutocomplete
            key={currentRole}
            options={sortedRoles}
            currentValue={currentRole}
            onChange={(value) => pushFilter({ role: value || null })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 italic font-serif">
            City
          </label>
          <CityAutocomplete
            defaultValue={currentCity}
            knownCities={knownCities}
            onChange={(value, history = 'push') =>
              pushFilter({ city: value || null }, history)
            }
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 italic font-serif">
            Language
          </label>
          <select
            value={currentLang}
            onChange={(e) => pushFilter({ lang: e.target.value || null })}
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm cursor-pointer"
          >
            <option value="">Any language</option>
            {sortedLangs.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-end justify-between flex-wrap gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentVerified}
            onChange={(e) => pushFilter({ verified: e.target.checked ? '1' : null })}
            className="w-4 h-4 cursor-pointer accent-[#712B13]"
          />
          <span className="text-sm font-serif text-stone-700 flex items-center gap-1.5">
            Only show verified
            <span className="inline-flex w-4 h-4 bg-[#712B13] text-white rounded-full text-[10px] items-center justify-center font-bold">
              ✓
            </span>
          </span>
        </label>

        <label className="text-xs font-medium text-stone-600 italic font-serif">
          Sort
          <select
            value={currentSort}
            onChange={(event) => pushFilter({ sort: event.target.value })}
            className="block mt-1 px-3 py-2 border border-stone-300 rounded-md bg-white text-sm not-italic cursor-pointer"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="verified">Verified first</option>
            <option value="name">Name</option>
          </select>
        </label>

        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => router.push('/directory')}
            className="text-xs text-stone-500 italic font-serif hover:text-[#712B13] cursor-pointer"
          >
            Clear all filters →
          </button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
          <span className="text-xs italic font-serif text-stone-500">Active:</span>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => {
                if (filter.key === 'q') setQ('');
                pushFilter({ [filter.key]: null });
              }}
              className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-serif text-stone-700 hover:border-[#712B13] cursor-pointer"
              aria-label={`Remove ${filter.label} filter`}
            >
              {filter.label} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
