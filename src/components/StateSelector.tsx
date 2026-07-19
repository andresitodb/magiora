'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { US_STATES } from '@/lib/states';

export default function StateSelector({
  name = 'location_state',
  defaultValue = '',
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [selectedCode, setSelectedCode] = useState(defaultValue);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = US_STATES.find((s) => s.code === selectedCode);

  // Show display name in the input box when nothing is being typed
  const displayText = open ? query : selected?.name ?? '';

  const filtered = useMemo(() => {
    if (!query.trim()) return US_STATES;
    const q = query.toLowerCase();
    return US_STATES.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase() === q
    );
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function pick(code: string) {
    setSelectedCode(code);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* The actual value submitted with the form */}
      <input type="hidden" name={name} value={selectedCode} />

      <input
        type="text"
        value={displayText}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Start typing..."
        className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white cursor-pointer"
      />

      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-y-auto border border-stone-200 rounded-md bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="text-sm text-stone-400 italic font-serif p-3">No matches</p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => pick(s.code)}
                className={`w-full text-left px-3 py-2 text-sm flex justify-between hover:bg-[#FAECE7] cursor-pointer ${
                  s.code === selectedCode ? 'bg-[#FAECE7] text-[#712B13]' : 'text-stone-700'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-xs text-stone-400 italic font-serif">{s.code}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
