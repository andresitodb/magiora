'use client';

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type SelectFilter = {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};

export default function DiscoveryFilters({
  pathname,
  currentQuery,
  searchLabel,
  searchPlaceholder,
  selects = [],
}: {
  pathname: string;
  currentQuery: string;
  searchLabel: string;
  searchPlaceholder: string;
  selects?: SelectFilter[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(currentQuery);
  const lastRequestedQuery = useRef(currentQuery);

  function update(
    values: Record<string, string | null>,
    history: 'push' | 'replace' = 'push'
  ) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('page');
    for (const [key, value] of Object.entries(values)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const href = next.size ? `${pathname}?${next.toString()}` : pathname;
    startTransition(() => {
      if (history === 'replace') router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }

  const updateQuery = useEffectEvent((nextQuery: string) => {
    if (nextQuery !== currentQuery) {
      lastRequestedQuery.current = nextQuery;
      update({ q: nextQuery || null }, 'replace');
    }
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      updateQuery(query);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (currentQuery !== lastRequestedQuery.current) setQuery(currentQuery);
  }, [currentQuery]);

  const active = [
    currentQuery && { key: 'q', label: `Search: ${currentQuery}` },
    ...selects
      .filter((filter) => filter.value)
      .map((filter) => ({
        key: filter.key,
        label:
          filter.options.find((option) => option.value === filter.value)?.label ??
          filter.value,
      })),
  ].filter((item): item is { key: string; label: string } => Boolean(item));

  return (
    <div className="k-card p-4 md:p-5 mb-8 space-y-4">
      <div className={`grid grid-cols-1 gap-3 ${selects.length ? 'md:grid-cols-2 lg:grid-cols-4' : ''}`}>
        <label className="block text-xs font-medium text-stone-600 italic font-serif">
          {searchLabel}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="k-control block mt-1"
          />
        </label>
        {selects.map((filter) => (
          <label
            key={filter.key}
            className="block text-xs font-medium text-stone-600 italic font-serif"
          >
            {filter.label}
            <select
              value={filter.value}
              onChange={(event) => update({ [filter.key]: event.target.value || null })}
              className="k-control block mt-1 not-italic cursor-pointer"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {active.length > 0 && (
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
          <span className="text-xs italic font-serif text-stone-500">Active:</span>
          {active.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => {
                if (filter.key === 'q') setQuery('');
                update({ [filter.key]: null });
              }}
              className="k-badge border border-stone-300 bg-stone-50 hover:border-[#712B13] cursor-pointer"
            >
              {filter.label} ×
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.push(pathname, { scroll: false })}
            className="k-button k-button-ghost min-h-0 px-2 py-1 ml-auto text-xs font-serif italic"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
