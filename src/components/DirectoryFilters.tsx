'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  useState,
  useTransition,
  useEffect,
  useEffectEvent,
  useRef,
} from 'react';
import DirectoryCombobox from '@/components/DirectoryCombobox';
import type { DirectoryFilterOption } from '@/lib/directoryFilterOptions';

export default function DirectoryFilters({
  roleFilters,
  languageFilters,
  cityFilters,
  currentRole,
  currentCity,
  currentLang,
  currentQuery,
  currentVerified,
  currentSort,
}: {
  roleFilters: DirectoryFilterOption[];
  languageFilters: DirectoryFilterOption[];
  cityFilters: DirectoryFilterOption[];
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
  const [openCombobox, setOpenCombobox] = useState<'role' | 'city' | 'language' | null>(null);
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

  const updateQuery = useEffectEvent((query: string) => {
    if (query !== currentQuery) {
      lastRequestedQuery.current = query;
      pushFilter({ q: query || null }, 'replace');
    }
  });

  useEffect(() => {
    const t = setTimeout(() => {
      updateQuery(q);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (currentQuery !== lastRequestedQuery.current) {
      setQ(currentQuery);
    }
  }, [currentQuery]);

  const hasAnyFilter = Boolean(
    currentQuery || currentRole || currentCity || currentLang || currentVerified
  );

  return (
    <div
      data-directory-filter-panel
      className="k-card p-3 md:p-4 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 italic font-serif">
            Search by name
          </label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a name..."
            className="k-control"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 italic font-serif">
            Role
          </label>
          <DirectoryCombobox
            options={roleFilters}
            currentValue={currentRole}
            onChange={(value) => pushFilter({ role: value || null })}
            placeholder="Everyone"
            emptyLabel="No matching roles"
            ariaLabel="Filter by role"
            clearLabel="Clear role filter"
            isOpen={openCombobox === 'role'}
            onOpenChange={(open) => setOpenCombobox((current) => open ? 'role' : current === 'role' ? null : current)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 italic font-serif">
            City
          </label>
          <DirectoryCombobox
            options={cityFilters}
            currentValue={currentCity}
            onChange={(value) => pushFilter({ city: value || null })}
            placeholder="Any city"
            emptyLabel="No matching cities"
            ariaLabel="Filter by city"
            clearLabel="Clear city filter"
            isOpen={openCombobox === 'city'}
            onOpenChange={(open) => setOpenCombobox((current) => open ? 'city' : current === 'city' ? null : current)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 italic font-serif">
            Language
          </label>
          <DirectoryCombobox
            options={languageFilters}
            currentValue={currentLang}
            onChange={(value) => pushFilter({ lang: value || null })}
            placeholder="Any language"
            emptyLabel="No matching languages"
            ariaLabel="Filter by language"
            clearLabel="Clear language filter"
            isOpen={openCombobox === 'language'}
            onOpenChange={(open) => setOpenCombobox((current) => open ? 'language' : current === 'language' ? null : current)}
          />
        </div>

        <label className="block text-xs font-medium text-stone-600 italic font-serif">
          Sort
          <select
            value={currentSort}
            onChange={(event) => pushFilter({ sort: event.target.value })}
            className="k-control block mt-1 not-italic cursor-pointer"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="verified">Verified first</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
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

        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => router.push('/directory')}
            className="k-button k-button-ghost min-h-0 px-2 py-1 text-xs font-serif italic"
          >
            Clear all filters →
          </button>
        )}
      </div>

    </div>
  );
}
