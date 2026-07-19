'use client';

import { useState, useRef, useEffect } from 'react';
import { ALL_TITLES } from '@/lib/role_titles_list';

/**
 * Multi-select tag input for role titles. CONTROLLED — parent owns the titles state.
 * Renders hidden <input name="role_titles" /> for each selected title so the form submits them.
 */
export default function RoleSelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (titles: string[]) => void;
}) {
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

  const suggestions = input.trim()
    ? ALL_TITLES.filter(
        (t) =>
          t.toLowerCase().includes(input.trim().toLowerCase()) &&
          !value.some((existing) => existing.toLowerCase() === t.toLowerCase())
      ).slice(0, 8)
    : ALL_TITLES.filter(
        (t) => !value.some((existing) => existing.toLowerCase() === t.toLowerCase())
      ).slice(0, 8);

  function add(title: string) {
    const clean = title.trim();
    if (!clean) return;
    if (value.some((t) => t.toLowerCase() === clean.toLowerCase())) return;
    onChange([...value, clean]);
    setInput('');
  }

  function remove(title: string) {
    onChange(value.filter((t) => t !== title));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) add(suggestions[0]);
      else if (input.trim()) add(input.trim());
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div ref={wrapperRef}>
      {value.map((t) => (
        <input key={t} type="hidden" name="role_titles" value={t} />
      ))}

      <div
        className="flex flex-wrap items-center gap-2 px-3 py-2 border border-stone-300 rounded-md bg-white min-h-[44px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((t, i) => (
          <span
            key={t}
            className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              i === 0
                ? 'bg-[#712B13] text-white'
                : 'bg-[#FAECE7] text-[#712B13]'
            }`}
          >
            {i === 0 && <span className="opacity-70">Primary:</span>}
            {t}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(t);
              }}
              className={`${i === 0 ? 'text-white hover:text-stone-200' : 'text-[#712B13] hover:text-red-700'} cursor-pointer`}
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? 'Add roles — e.g. Director, Actor…' : ''}
          className="flex-1 min-w-[160px] outline-none text-sm bg-transparent"
        />
      </div>

      {value.length > 0 && (
        <p className="text-xs italic text-stone-500 font-serif mt-1.5">
          The first role is your <strong className="not-italic">primary</strong> — it&apos;s what shows first on your profile and what we use for matching.
        </p>
      )}

      {open && suggestions.length > 0 && (
        <div className="relative">
          <div className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-y-auto border border-stone-200 rounded-md bg-white shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif"
              >
                {s}
              </button>
            ))}
            {input.trim() && !ALL_TITLES.some((t) => t.toLowerCase() === input.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => add(input.trim())}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif border-t border-stone-100 italic text-stone-600"
              >
                + Add &ldquo;{input.trim()}&rdquo; as custom role
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
