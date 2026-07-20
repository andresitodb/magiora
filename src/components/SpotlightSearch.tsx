'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type PersonSuggestion = {
  id: string;
  slug: string;
  display_name: string;
  role: string | null;
  headshot_url: string | null;
};

export default function SpotlightSearch({
  currentQuery,
  currentPerson,
  currentPersonName,
}: {
  currentQuery: string;
  currentPerson: string;
  currentPersonName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [input, setInput] = useState(currentPersonName || currentQuery);
  const [suggestions, setSuggestions] = useState<PersonSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const lastRequested = useRef(currentQuery);
  const suppressNextSearch = useRef(false);

  function navigate(
    values: Record<string, string | null>,
    history: 'push' | 'replace' = 'push'
  ) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('page');
    for (const [key, value] of Object.entries(values)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const href = next.size ? `/stories?${next.toString()}` : '/stories';
    startTransition(() => {
      if (history === 'replace') router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (suppressNextSearch.current) {
        suppressNextSearch.current = false;
        return;
      }
      if (input !== currentQuery && !currentPerson) {
        lastRequested.current = input;
        navigate({ q: input || null }, 'replace');
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [input]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentPerson && currentQuery !== lastRequested.current) {
      setInput(currentQuery);
    }
  }, [currentPerson, currentQuery]);

  useEffect(() => {
    if (input.trim().length < 2 || currentPerson) {
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/spotlight-people?q=${encodeURIComponent(input.trim())}`,
          { signal: controller.signal }
        );
        const payload = await response.json();
        setSuggestions(payload.people ?? []);
        setActive(-1);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [currentPerson, input]);

  function selectPerson(person: PersonSuggestion) {
    suppressNextSearch.current = true;
    setInput(person.display_name);
    setOpen(false);
    setSuggestions([]);
    navigate({ person: person.slug, q: null });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'ArrowDown' && open && suggestions.length) {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp' && open && suggestions.length) {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && open && suggestions[active]) {
      event.preventDefault();
      selectPerson(suggestions[active]);
    }
  }

  return (
    <div
      className="k-card relative z-10 p-4 md:p-5 mb-8"
      style={{ overflow: 'visible' }}
    >
      <label className="block text-xs font-medium text-stone-600 italic font-serif">
        Search Spotlight
        <span className="relative block mt-1">
          <input
            type="search"
            value={input}
            onChange={(event) => {
              const value = event.target.value;
              setInput(value);
              setOpen(true);
              if (value.trim().length < 2) setSuggestions([]);
              if (currentPerson) {
                lastRequested.current = value;
                navigate({ person: null, q: value || null }, 'replace');
              }
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Title, introduction or interviewed person..."
            className="k-control pr-10"
            aria-autocomplete="list"
          />
          {(input || currentPerson) && (
            <button
              type="button"
              onClick={() => {
                setInput('');
                setOpen(false);
                navigate({ q: null, person: null });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-8 min-h-8 text-stone-500"
              aria-label="Clear Spotlight search"
            >
              ×
            </button>
          )}
          {open && suggestions.length > 0 && (
            <div role="listbox" className="k-card absolute z-20 left-0 right-0 mt-1 shadow-lg overflow-hidden">
              {suggestions.map((person, index) => (
                <button
                  key={person.id}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectPerson(person)}
                  className={`w-full min-h-12 px-3 py-2 flex items-center gap-3 text-left border-b border-stone-100 last:border-0 ${
                    index === active ? 'bg-[#FAECE7]' : 'hover:bg-stone-50'
                  }`}
                >
                  <span className="w-8 h-8 rounded-full bg-[#FAECE7] overflow-hidden flex-shrink-0">
                    {person.headshot_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={person.headshot_url} alt="" className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center font-serif text-xs">
                        {person.display_name[0]}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-serif text-sm font-medium truncate">{person.display_name}</span>
                    {person.role && <span className="block text-xs italic text-stone-500 capitalize">{person.role}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </span>
      </label>
      {currentPerson && (
        <p className="mt-3 text-xs italic font-serif text-stone-500">
          Showing interviews with {currentPersonName}.
        </p>
      )}
    </div>
  );
}
