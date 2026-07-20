'use client';

import { useEffect, useRef, useState } from 'react';

type Result = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
};

export default function AdminFeaturedSearch({
  type,
  action,
}: {
  type: 'profile' | 'project' | 'spotlight';
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState<Result | null>(null);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2 || selected) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/featured-search?type=${type}&q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Search failed.');
        setResults(payload.results ?? []);
        setActive(-1);
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === 'AbortError') return;
        setResults([]);
        setError(searchError instanceof Error ? searchError.message : 'Search failed.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected, type]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setResults([]);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (result: Result) => {
    setSelected(result);
    setQuery(result.title);
    setResults([]);
    setLoading(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-medium text-stone-600 italic font-serif">
        Search {type === 'profile'
          ? 'approved, public professionals'
          : type === 'spotlight'
            ? 'published Spotlight interviews'
            : 'public projects'}
        <input
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setSelected(null);
            setResults([]);
            setActive(-1);
            setError('');
            setLoading(nextQuery.trim().length >= 2);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setResults([]);
              setActive(-1);
            } else if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, results.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter' && active >= 0 && results[active]) {
              event.preventDefault();
              choose(results[active]);
            }
          }}
          placeholder={
            type === 'profile'
              ? 'Type a name or slug…'
              : type === 'spotlight'
                ? 'Type an interview title…'
                : 'Type a project title…'
          }
          className="k-control mt-1"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={`${type}-featured-results`}
          aria-autocomplete="list"
        />
      </label>

      {(loading || error || (query.trim().length >= 2 && !selected && results.length === 0)) && (
        <p className={`mt-2 text-xs italic font-serif ${error ? 'text-red-700' : 'text-stone-500'}`}>
          {loading ? 'Searching…' : error || 'No eligible results.'}
        </p>
      )}

      {results.length > 0 && (
        <div id={`${type}-featured-results`} role="listbox" className="k-card absolute z-20 left-0 right-0 mt-1 max-h-80 overflow-y-auto shadow-lg">
          {results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(result)}
              className={`w-full min-h-14 px-3 py-2 flex items-center gap-3 text-left border-b border-stone-100 last:border-0 ${
                index === active ? 'bg-[#FAECE7]' : 'hover:bg-stone-50'
              }`}
            >
              <ResultImage result={result} type={type} />
              <span className="min-w-0">
                <span className="block truncate font-serif text-sm font-medium">{result.title}</span>
                {result.subtitle && <span className="block truncate text-xs italic text-stone-500 capitalize">{result.subtitle}</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <form action={action} className="k-card mt-3 p-3 flex items-center gap-3">
          <input
            type="hidden"
            name={
              type === 'profile'
                ? 'profile_id'
                : type === 'spotlight'
                  ? 'interview_id'
                  : 'project_id'
            }
            value={selected.id}
          />
          <ResultImage result={selected} type={type} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-sm font-medium">{selected.title}</p>
            {selected.subtitle && <p className="truncate text-xs italic text-stone-500 capitalize">{selected.subtitle}</p>}
          </div>
          <button type="submit" className="k-button k-button-primary min-h-0 py-1.5 text-xs">
            {type === 'spotlight' ? 'Add to Featured' : 'Feature'}
          </button>
        </form>
      )}
    </div>
  );
}

function ResultImage({
  result,
  type,
}: {
  result: Result;
  type: 'profile' | 'project' | 'spotlight';
}) {
  return (
    <span className={`${
      type === 'profile'
        ? 'h-10 w-10 rounded-full'
        : type === 'spotlight'
          ? 'h-12 w-16 rounded'
          : 'h-12 w-9 rounded'
    } flex-shrink-0 overflow-hidden bg-[#FAECE7]`}>
      {result.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={result.image} alt="" className="h-full w-full object-cover object-top" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-serif text-xs text-[#712B13]">
          {result.title[0]?.toUpperCase()}
        </span>
      )}
    </span>
  );
}
