'use client';

import { useState, useRef, useEffect } from 'react';

export default function CityAutocomplete({
  defaultValue,
  knownCities,
  onChange,
}: {
  defaultValue: string;
  knownCities: string[];
  onChange: (city: string, history?: 'push' | 'replace') => void;
}) {
  const [input, setInput] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastRequestedCity = useRef(defaultValue);

  useEffect(() => {
    if (defaultValue !== lastRequestedCity.current) {
      setInput(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Debounce: update URL when input changes
  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== defaultValue) {
        lastRequestedCity.current = input;
        onChange(input, 'replace');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [input]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = input.trim()
    ? knownCities
        .filter((c) => c.toLowerCase().includes(input.trim().toLowerCase()) && c.toLowerCase() !== input.trim().toLowerCase())
        .slice(0, 6)
    : [];

  function pick(city: string) {
    setInput(city);
    lastRequestedCity.current = city;
    onChange(city);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Any city..."
        className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
        autoComplete="off"
      />
      {input && (
        <button
          type="button"
          onClick={() => {
            setInput('');
            lastRequestedCity.current = '';
            onChange('');
          }}
          aria-label="Clear"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#712B13] cursor-pointer text-sm"
        >
          ×
        </button>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-y-auto border border-stone-200 rounded-md bg-white shadow-lg">
          {suggestions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pick(c)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif border-b border-stone-100 last:border-b-0"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
