'use client';

import { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '@/lib/languages';

const PINNED_CODES = ['en', 'es'];

type Lang = { code: string; name: string };

export default function LanguageSelector({
  defaultValue,
}: {
  defaultValue: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Build a sorted list with pinned ones first
  const allLangs: Lang[] = [...LANGUAGES];
  const sortedLangs = [
    ...(PINNED_CODES.map((c) => allLangs.find((l) => l.code === c)).filter(Boolean) as Lang[]),
    ...allLangs
      .filter((l) => !PINNED_CODES.includes(l.code))
      .sort((a, b) => a.name.localeCompare(b.name)),
  ];

  // Find by code
  const langByCode = (code: string): Lang | undefined =>
    allLangs.find((l) => l.code === code);

  const suggestions = sortedLangs.filter((l) => {
    if (selected.includes(l.code)) return false;
    if (!input.trim()) return true;
    return l.name.toLowerCase().includes(input.trim().toLowerCase());
  }).slice(0, 10);

  function add(code: string) {
    if (selected.includes(code)) return;
    setSelected([...selected, code]);
    setInput('');
  }

  function remove(code: string) {
    setSelected(selected.filter((c) => c !== code));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) add(suggestions[0].code);
    } else if (e.key === 'Backspace' && !input && selected.length > 0) {
      setSelected(selected.slice(0, -1));
    }
  }

  return (
    <div ref={wrapperRef}>
      {selected.map((code) => (
        <input key={code} type="hidden" name="languages" value={code} />
      ))}

      <div
        className="flex flex-wrap items-center gap-2 px-3 py-2 border border-stone-300 rounded-md bg-white min-h-[44px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((code) => {
          const lang = langByCode(code);
          return (
            <span
              key={code}
              className="bg-[#FAECE7] text-[#712B13] text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
            >
              {lang?.name ?? code}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(code);
                }}
                className="text-[#712B13] hover:text-red-700 cursor-pointer"
                aria-label={`Remove ${lang?.name ?? code}`}
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? 'Add languages — e.g. English, Spanish…' : ''}
          autoCapitalize="none"
          className="flex-1 min-w-[160px] outline-none text-sm bg-transparent"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="relative">
          <div className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-y-auto border border-stone-200 rounded-md bg-white shadow-lg">
            {suggestions.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => add(l.code)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif"
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
