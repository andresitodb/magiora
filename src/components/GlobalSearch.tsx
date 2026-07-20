'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  kind: 'profile' | 'project' | 'casting_call' | 'event' | 'story';
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  thumbnail: string | null;
}

const KIND_LABEL: Record<string, string> = {
  profile: 'Person',
  project: 'Project',
  casting_call: 'Casting',
  event: 'Event',
  story: 'Spotlight',
};

const KIND_COLOR: Record<string, string> = {
  profile: 'text-stone-700',
  project: 'text-blue-700',
  casting_call: 'text-[#712B13]',
  event: 'text-amber-700',
  story: 'text-rose-700',
};

export default function GlobalSearch() {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Focus input when expanded
  useEffect(() => {
    if (expanded) {
      // Slight delay so the transition completes
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [expanded]);

  // Cmd/Ctrl+K still works silently
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setExpanded(true);
      }
      if (e.key === 'Escape') {
        setExpanded(false);
        setQuery('');
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Click outside collapses
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setExpanded(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setActive(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      router.push(results[active].href);
      setExpanded(false);
      setQuery('');
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Search"
          className="min-w-11 min-h-11 p-2 rounded-md hover:bg-stone-100 text-stone-700 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.75" />
            <line x1="12.5" y1="12.5" x2="16" y2="16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              if (value.trim().length < 2) {
                setResults([]);
                setLoading(false);
              }
            }}
            onKeyDown={onKeyDown}
            placeholder="Search people, projects, castings..."
            className="k-control w-[min(18rem,calc(100vw-2rem))] pl-9 pr-3"
            role="combobox"
            aria-expanded={query.trim().length >= 2}
            aria-controls="global-search-results"
            aria-autocomplete="list"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>

          {query.trim().length >= 2 && (
            <div
              id="global-search-results"
              role="listbox"
              className="k-card absolute z-20 left-0 right-0 mt-1 max-h-96 overflow-y-auto shadow-lg"
            >
              {loading && (
                <p className="px-3 py-3 text-sm text-stone-400 italic font-serif">Searching...</p>
              )}
              {!loading && results.length === 0 && (
                <p className="px-3 py-3 text-sm text-stone-400 italic font-serif">No results.</p>
              )}
              {!loading &&
                results.map((r, i) => (
                  <a
                    key={`${r.kind}-${r.id}`}
                    href={r.href}
                    role="option"
                    aria-selected={i === active}
                    onClick={() => {
                      setExpanded(false);
                      setQuery('');
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 hover:bg-[#FAECE7] cursor-pointer border-t border-stone-100 first:border-t-0 ${
                      i === active ? 'bg-[#FAECE7]' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-md bg-stone-100 overflow-hidden flex-shrink-0">
                      {r.thumbnail ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={r.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-serif italic">
                          {r.kind === 'profile' && (r.title[0] ?? '?').toUpperCase()}
                          {r.kind === 'project' && 'P'}
                          {r.kind === 'casting_call' && '🎬'}
                          {r.kind === 'event' && '📅'}
                          {r.kind === 'story' && '📖'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-medium truncate">{r.title}</p>
                      {r.subtitle && (
                        <p className="text-xs text-stone-500 truncate italic font-serif">
                          {r.subtitle}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs italic font-serif uppercase tracking-wider flex-shrink-0 ${KIND_COLOR[r.kind]}`}
                    >
                      {KIND_LABEL[r.kind]}
                    </span>
                  </a>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
