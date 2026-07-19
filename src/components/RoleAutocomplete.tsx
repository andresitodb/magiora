'use client';

import { useState, useRef, useEffect } from 'react';

interface RoleOption {
  value: string;
  label: string;
}

export default function RoleAutocomplete({
  options,
  currentValue,
  onChange,
}: {
  options: RoleOption[];
  currentValue: string;
  onChange: (value: string) => void;
}) {
  const [input, setInput] = useState(
    currentValue ? options.find((o) => o.value === currentValue)?.label ?? '' : ''
  );
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInput(currentValue ? options.find((o) => o.value === currentValue)?.label ?? '' : '');
  }, [currentValue, options]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Restore label if user typed something but didn't select
        if (currentValue) {
          setInput(options.find((o) => o.value === currentValue)?.label ?? '');
        } else {
          setInput('');
        }
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [currentValue, options]);

  const filtered = input.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(input.trim().toLowerCase()))
    : options;

  function pick(value: string, label: string) {
    onChange(value);
    setInput(label);
    setOpen(false);
  }

  function clear() {
    onChange('');
    setInput('');
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
        placeholder="Everyone (type to filter)"
        className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm cursor-text"
      />
      {currentValue && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#712B13] cursor-pointer text-sm"
        >
          ×
        </button>
      )}

      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-y-auto border border-stone-200 rounded-md bg-white shadow-lg">
          <button
            type="button"
            onClick={() => pick('', '')}
            className={`w-full text-left px-3 py-2 text-sm font-serif cursor-pointer hover:bg-[#FAECE7] ${
              !currentValue ? 'bg-[#FAECE7]/50' : ''
            }`}
          >
            <span className="italic">Everyone</span>
          </button>
          {filtered.length > 0 ? (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => pick(o.value, o.label)}
                className={`w-full text-left px-3 py-2 text-sm font-serif cursor-pointer hover:bg-[#FAECE7] border-t border-stone-100 ${
                  o.value === currentValue ? 'bg-[#FAECE7]/50' : ''
                }`}
              >
                {o.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-stone-400 italic font-serif border-t border-stone-100">
              No matches.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
